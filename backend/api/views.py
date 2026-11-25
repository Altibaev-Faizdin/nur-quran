"""
Noor Al-Quran — API Views
"""

import logging
import re
from datetime import date
from typing import ClassVar

import httpx
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import exceptions, filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .authentication import password_version_hash
from .models import Bookmark, PrayerNotification
from .serializers import BookmarkSerializer, PrayerNotificationSerializer

logger = logging.getLogger("api")

ALQURAN_BASE = "https://api.alquran.cloud/v1"
ALADHAN_BASE = "https://api.aladhan.com/v1"
API_TIMEOUT = 6.0

# Canonical reciter CDN servers aligned with frontend registry
MP3QURAN_SERVERS = {
    "mishary_alafasy": "https://server8.mp3quran.net/afs/",
    "abdulbasit": "https://server7.mp3quran.net/basit/",
    "ghamdi": "https://server7.mp3quran.net/s_gmd/",
    "minshawi": "https://server10.mp3quran.net/minsh/",
    "maher": "https://server12.mp3quran.net/maher/",
    "islam_sobhi": "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/",
    "yasser_dosari": "https://server11.mp3quran.net/yasser/",
    "sherif_mostafa": "https://download.quranplayermp3.com/quran/mix/Sherif-Mostafa/",
    "abdurrahman_mossad": "https://download.quranplayermp3.com/quran/mix/Abdul-Rahman-Mosad/",
    "raad_kurdi": "https://server6.mp3quran.net/kurdi/",
}


# ─── CUSTOM EXCEPTIONS FOR EXTERNAL SERVICES ───────────────────────────────


class GatewayTimeout(exceptions.APIException):
    status_code = status.HTTP_504_GATEWAY_TIMEOUT
    default_detail = "External API timed out. Please try again."
    default_code = "gateway_timeout"


class BadGateway(exceptions.APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "Cannot reach external service. Check your connection."
    default_code = "bad_gateway"


class ServiceUnavailable(exceptions.APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "External service is currently unavailable."
    default_code = "service_unavailable"


# ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────


def fetch_external_api(url: str, timeout: float = API_TIMEOUT) -> dict:
    """Fetch data from an external API with one transient retry and fast failover."""
    last_exc = None
    for attempt in range(2):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error("External API timeout (attempt %s, >%ss): %s", attempt + 1, timeout, url)
            last_exc = GatewayTimeout()
        except httpx.RequestError as exc:
            logger.error(
                "Connection error to external API (attempt %s): %s (%s)", attempt + 1, url, exc
            )
            last_exc = BadGateway()
        except httpx.HTTPStatusError as exc:
            logger.error("External API returned HTTP %s: %s", exc.response.status_code, url)
            raise ServiceUnavailable(
                f"External API returned error {exc.response.status_code}."
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error fetching: %s (%s)", url, exc)
            raise BadGateway("An unexpected error occurred while fetching external data.") from exc
    raise last_exc from None


# ─── QURAN ENDPOINTS ────────────────────────────────────────────────────────


@api_view(["GET"])
@cache_page(60 * 60 * 24)
def surah_list(request):
    """
    GET /api/surahs/
    Return the list of all 114 surahs with metadata.
    """
    data = fetch_external_api(f"{ALQURAN_BASE}/surah")
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@cache_page(60 * 60 * 24)
def surah_detail(request, surah_number: int):
    """
    GET /api/surahs/<surah_number>/?lang=en|ru|uz
    Return a full surah with Arabic text and translation.
    """
    if not 1 <= surah_number <= 114:
        return Response(
            {"error": "Surah number must be between 1 and 114."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lang = request.query_params.get("lang", "en").strip().lower()
    edition_map = {
        "en": "en.asad",
        "ru": "ru.kuliev",
        "uz": "uz.sodik",
    }
    edition = edition_map.get(lang, "en.asad")
    url = f"{ALQURAN_BASE}/surah/{surah_number}/editions/quran-uthmani,{edition}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@cache_page(60 * 30)
def prayer_times(request):
    """
    GET /api/prayer-times/?lat=X&lng=Y&method=3&school=0&date=DD-MM-YYYY
    Get prayer times for given coordinates using aladhan.com with validation.
    """
    lat_raw = request.query_params.get("lat", "21.3891")
    lng_raw = request.query_params.get("lng", "39.8579")
    method_raw = request.query_params.get("method", "3")
    school_raw = request.query_params.get("school", "0")
    date_param = request.query_params.get("date", "").strip()

    try:
        lat = round(float(lat_raw), 2)
        lng = round(float(lng_raw), 2)
        method = int(method_raw)
        school = int(school_raw)
    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid parameters. lat, lng, method, and school must be numeric."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not -90.0 <= lat <= 90.0 or not -180.0 <= lng <= 180.0:
        return Response(
            {"error": "Latitude must be between -90 and 90, Longitude between -180 and 180."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if method not in range(0, 25):
        return Response(
            {"error": "Invalid calculation method choice."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if school not in (0, 1):
        return Response(
            {
                "error": "Invalid school choice. 0 for Standard (Shafi/Maliki/Hanbali), 1 for Hanafi."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if date_param:
        if not re.match(r"^\d{2}-\d{2}-\d{4}$", date_param):
            return Response(
                {"error": "Invalid date format. Expected DD-MM-YYYY."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_date = date_param
    else:
        target_date = date.today().strftime("%d-%m-%Y")

    url = f"{ALADHAN_BASE}/timings/{target_date}?latitude={lat}&longitude={lng}&method={method}&school={school}"

    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@cache_page(60 * 60 * 12)
def hijri_date(request):
    """
    GET /api/hijri-date/
    Return today's Gregorian date converted to Hijri.
    """
    date_param = request.query_params.get("date", "").strip()
    if date_param:
        if not re.match(r"^\d{2}-\d{2}-\d{4}$", date_param):
            return Response(
                {"error": "Invalid date format. Expected DD-MM-YYYY."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_date = date_param
    else:
        target_date = date.today().strftime("%d-%m-%Y")

    url = f"{ALADHAN_BASE}/gToH?date={target_date}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


# ─── PRAYER NOTIFICATION VIEWSET ───────────────────────────────────────────


class PrayerNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for prayer notification settings"""

    serializer_class = PrayerNotificationSerializer
    permission_classes: ClassVar[tuple] = (IsAuthenticated,)
    filter_backends: ClassVar[tuple] = (DjangoFilterBackend,)
    filterset_fields: ClassVar[tuple] = ("prayer_name", "is_enabled")

    def get_queryset(self):
        return PrayerNotification.objects.filter(user=self.request.user).order_by("prayer_name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Upsert notification preferences per user+prayer to avoid IntegrityError 500."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, _ = PrayerNotification.objects.update_or_create(
            user=request.user,
            prayer_name=serializer.validated_data["prayer_name"],
            defaults={
                "adhan_reciter": serializer.validated_data.get("adhan_reciter", "mishary_alafasy"),
                "is_enabled": serializer.validated_data.get("is_enabled", True),
            },
        )
        out = self.get_serializer(obj)
        return Response(out.data, status=status.HTTP_201_CREATED)


# ─── BOOKMARKS VIEWSET ─────────────────────────────────────────────────────


class BookmarkViewSet(viewsets.ModelViewSet):
    """ViewSet for user bookmarks with filtering by surah"""

    serializer_class = BookmarkSerializer
    permission_classes: ClassVar[tuple] = (IsAuthenticated,)
    filter_backends: ClassVar[tuple] = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields: ClassVar[tuple] = ("surah_number", "ayah_number")
    ordering_fields: ClassVar[tuple] = ("created_at", "surah_number")
    ordering: ClassVar[tuple] = ("-created_at",)

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Override create to return 400 on duplicate bookmark instead of 500 IntegrityError."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                self.perform_create(serializer)
        except IntegrityError:
            raise ValidationError(
                {"non_field_errors": ["You have already bookmarked this ayah."]}
            ) from None
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ─── 99 NAMES OF ALLAH ─────────────────────────────────────────────────────

NAMES_OF_ALLAH = [
    {
        "num": 1,
        "arabic": "الرَّحْمَن",
        "transliteration": "Ar-Rahman",
        "meaning_en": "The Most Gracious",
        "meaning_ru": "Милостивый",
    },
    {
        "num": 2,
        "arabic": "الرَّحِيم",
        "transliteration": "Ar-Rahim",
        "meaning_en": "The Most Merciful",
        "meaning_ru": "Милосердный",
    },
    {
        "num": 3,
        "arabic": "الْمَلِك",
        "transliteration": "Al-Malik",
        "meaning_en": "The King",
        "meaning_ru": "Царь",
    },
    {
        "num": 4,
        "arabic": "الْقُدُّوس",
        "transliteration": "Al-Quddus",
        "meaning_en": "The Most Holy",
        "meaning_ru": "Пресвятой",
    },
    {
        "num": 5,
        "arabic": "السَّلَام",
        "transliteration": "As-Salam",
        "meaning_en": "The Source of Peace",
        "meaning_ru": "Мир",
    },
    {
        "num": 6,
        "arabic": "الْمُؤْمِن",
        "transliteration": "Al-Mu'min",
        "meaning_en": "The Guardian of Faith",
        "meaning_ru": "Дарующий безопасность",
    },
    {
        "num": 7,
        "arabic": "الْمُهَيْمِن",
        "transliteration": "Al-Muhaymin",
        "meaning_en": "The Protector",
        "meaning_ru": "Хранитель",
    },
    {
        "num": 8,
        "arabic": "الْعَزِيز",
        "transliteration": "Al-Aziz",
        "meaning_en": "The Mighty",
        "meaning_ru": "Могущественный",
    },
    {
        "num": 9,
        "arabic": "الْجَبَّار",
        "transliteration": "Al-Jabbar",
        "meaning_en": "The Compeller",
        "meaning_ru": "Принуждающий",
    },
    {
        "num": 10,
        "arabic": "الْمُتَكَبِّر",
        "transliteration": "Al-Mutakabbir",
        "meaning_en": "The Majestic",
        "meaning_ru": "Величественный",
    },
    {
        "num": 11,
        "arabic": "الْخَالِق",
        "transliteration": "Al-Khaliq",
        "meaning_en": "The Creator",
        "meaning_ru": "Творец",
    },
    {
        "num": 12,
        "arabic": "الْبَارِئ",
        "transliteration": "Al-Bari'",
        "meaning_en": "The Evolver",
        "meaning_ru": "Создатель",
    },
    {
        "num": 13,
        "arabic": "الْمُصَوِّر",
        "transliteration": "Al-Musawwir",
        "meaning_en": "The Fashioner",
        "meaning_ru": "Придающий форму",
    },
    {
        "num": 14,
        "arabic": "الْغَفَّار",
        "transliteration": "Al-Ghaffar",
        "meaning_en": "The Forgiver",
        "meaning_ru": "Всепрощающий",
    },
    {
        "num": 15,
        "arabic": "الْقَهَّار",
        "transliteration": "Al-Qahhar",
        "meaning_en": "The Subduer",
        "meaning_ru": "Всепобеждающий",
    },
    {
        "num": 16,
        "arabic": "الْوَهَّاب",
        "transliteration": "Al-Wahhab",
        "meaning_en": "The Bestower",
        "meaning_ru": "Дарующий",
    },
    {
        "num": 17,
        "arabic": "الرَّزَّاق",
        "transliteration": "Ar-Razzaq",
        "meaning_en": "The Provider",
        "meaning_ru": "Кормилец",
    },
    {
        "num": 18,
        "arabic": "الْفَتَّاح",
        "transliteration": "Al-Fattah",
        "meaning_en": "The Opener",
        "meaning_ru": "Открывающий",
    },
    {
        "num": 19,
        "arabic": "الْعَلِيم",
        "transliteration": "Al-Alim",
        "meaning_en": "The All-Knowing",
        "meaning_ru": "Всезнающий",
    },
    {
        "num": 20,
        "arabic": "الْقَابِض",
        "transliteration": "Al-Qabid",
        "meaning_en": "The Constrictor",
        "meaning_ru": "Сжимающий",
    },
    {
        "num": 21,
        "arabic": "الْبَاسِط",
        "transliteration": "Al-Basit",
        "meaning_en": "The Expander",
        "meaning_ru": "Расширяющий",
    },
    {
        "num": 22,
        "arabic": "الْخَافِض",
        "transliteration": "Al-Khafid",
        "meaning_en": "The Abaser",
        "meaning_ru": "Принижающий",
    },
    {
        "num": 23,
        "arabic": "الرَّافِع",
        "transliteration": "Ar-Rafi'",
        "meaning_en": "The Exalter",
        "meaning_ru": "Возвышающий",
    },
    {
        "num": 24,
        "arabic": "الْمُعِزّ",
        "transliteration": "Al-Mu'izz",
        "meaning_en": "The Bestower of Honour",
        "meaning_ru": "Возвеличивающий",
    },
    {
        "num": 25,
        "arabic": "الْمُذِلّ",
        "transliteration": "Al-Mudhill",
        "meaning_en": "The Dishonourer",
        "meaning_ru": "Ослабляющий",
    },
    {
        "num": 26,
        "arabic": "السَّمِيع",
        "transliteration": "As-Sami'",
        "meaning_en": "The All-Hearing",
        "meaning_ru": "Всеслышащий",
    },
    {
        "num": 27,
        "arabic": "الْبَصِير",
        "transliteration": "Al-Basir",
        "meaning_en": "The All-Seeing",
        "meaning_ru": "Всевидящий",
    },
    {
        "num": 28,
        "arabic": "الْحَكَم",
        "transliteration": "Al-Hakam",
        "meaning_en": "The Judge",
        "meaning_ru": "Судья",
    },
    {
        "num": 29,
        "arabic": "الْعَدْل",
        "transliteration": "Al-Adl",
        "meaning_en": "The Utterly Just",
        "meaning_ru": "Справедливый",
    },
    {
        "num": 30,
        "arabic": "اللَّطِيف",
        "transliteration": "Al-Latif",
        "meaning_en": "The Subtle One",
        "meaning_ru": "Проницательный",
    },
    {
        "num": 31,
        "arabic": "الْخَبِير",
        "transliteration": "Al-Khabir",
        "meaning_en": "The All-Aware",
        "meaning_ru": "Сведущий",
    },
    {
        "num": 32,
        "arabic": "الْحَلِيم",
        "transliteration": "Al-Halim",
        "meaning_en": "The Most Forbearing",
        "meaning_ru": "Кроткий",
    },
    {
        "num": 33,
        "arabic": "الْعَظِيم",
        "transliteration": "Al-Azim",
        "meaning_en": "The Magnificent",
        "meaning_ru": "Великий",
    },
    {
        "num": 34,
        "arabic": "الْغَفُور",
        "transliteration": "Al-Ghafur",
        "meaning_en": "The Great Forgiver",
        "meaning_ru": "Многопрощающий",
    },
    {
        "num": 35,
        "arabic": "الشَّكُور",
        "transliteration": "Ash-Shakur",
        "meaning_en": "The Most Appreciative",
        "meaning_ru": "Благодарный",
    },
    {
        "num": 36,
        "arabic": "الْعَلِيّ",
        "transliteration": "Al-Ali",
        "meaning_en": "The Sublime One",
        "meaning_ru": "Высочайший",
    },
    {
        "num": 37,
        "arabic": "الْكَبِير",
        "transliteration": "Al-Kabir",
        "meaning_en": "The Greatest",
        "meaning_ru": "Большой",
    },
    {
        "num": 38,
        "arabic": "الْحَفِيظ",
        "transliteration": "Al-Hafiz",
        "meaning_en": "The Preserver",
        "meaning_ru": "Оберегающий",
    },
    {
        "num": 39,
        "arabic": "الْمُقِيت",
        "transliteration": "Al-Muqit",
        "meaning_en": "The Sustainer",
        "meaning_ru": "Поддерживающий",
    },
    {
        "num": 40,
        "arabic": "الْحَسِيب",
        "transliteration": "Al-Hasib",
        "meaning_en": "The Reckoner",
        "meaning_ru": "Считающий",
    },
    {
        "num": 41,
        "arabic": "الْجَلِيل",
        "transliteration": "Al-Jalil",
        "meaning_en": "The Majestic",
        "meaning_ru": "Величественный",
    },
    {
        "num": 42,
        "arabic": "الْكَرِيم",
        "transliteration": "Al-Karim",
        "meaning_en": "The Most Generous",
        "meaning_ru": "Щедрый",
    },
    {
        "num": 43,
        "arabic": "الرَّقِيب",
        "transliteration": "Ar-Raqib",
        "meaning_en": "The Watchful",
        "meaning_ru": "Надзирающий",
    },
    {
        "num": 44,
        "arabic": "الْمُجِيب",
        "transliteration": "Al-Mujib",
        "meaning_en": "The Responsive One",
        "meaning_ru": "Отвечающий",
    },
    {
        "num": 45,
        "arabic": "الْوَاسِع",
        "transliteration": "Al-Wasi'",
        "meaning_en": "The All-Encompassing",
        "meaning_ru": "Всеобъемлющий",
    },
    {
        "num": 46,
        "arabic": "الْحَكِيم",
        "transliteration": "Al-Hakim",
        "meaning_en": "The All-Wise",
        "meaning_ru": "Мудрый",
    },
    {
        "num": 47,
        "arabic": "الْوَدُود",
        "transliteration": "Al-Wadud",
        "meaning_en": "The Most Loving",
        "meaning_ru": "Любящий",
    },
    {
        "num": 48,
        "arabic": "الْمَجِيد",
        "transliteration": "Al-Majid",
        "meaning_en": "The Glorious",
        "meaning_ru": "Славный",
    },
    {
        "num": 49,
        "arabic": "الْبَاعِث",
        "transliteration": "Al-Ba'ith",
        "meaning_en": "The Resurrector",
        "meaning_ru": "Воскрешающий",
    },
    {
        "num": 50,
        "arabic": "الشَّهِيد",
        "transliteration": "Ash-Shahid",
        "meaning_en": "The Witness",
        "meaning_ru": "Свидетель",
    },
    {
        "num": 51,
        "arabic": "الْحَقّ",
        "transliteration": "Al-Haqq",
        "meaning_en": "The Absolute Truth",
        "meaning_ru": "Истина",
    },
    {
        "num": 52,
        "arabic": "الْوَكِيل",
        "transliteration": "Al-Wakil",
        "meaning_en": "The Trustee",
        "meaning_ru": "Попечитель",
    },
    {
        "num": 53,
        "arabic": "الْقَوِيّ",
        "transliteration": "Al-Qawi",
        "meaning_en": "The All-Strong",
        "meaning_ru": "Сильный",
    },
    {
        "num": 54,
        "arabic": "الْمَتِين",
        "transliteration": "Al-Matin",
        "meaning_en": "The Firm",
        "meaning_ru": "Непоколебимый",
    },
    {
        "num": 55,
        "arabic": "الْوَلِيّ",
        "transliteration": "Al-Wali",
        "meaning_en": "The Protecting Associate",
        "meaning_ru": "Покровитель",
    },
    {
        "num": 56,
        "arabic": "الْحَمِيد",
        "transliteration": "Al-Hamid",
        "meaning_en": "The Praiseworthy",
        "meaning_ru": "Достохвальный",
    },
    {
        "num": 57,
        "arabic": "الْمُحْصِي",
        "transliteration": "Al-Muhsi",
        "meaning_en": "The All-Enumerating",
        "meaning_ru": "Учитывающий",
    },
    {
        "num": 58,
        "arabic": "الْمُبْدِئ",
        "transliteration": "Al-Mubdi'",
        "meaning_en": "The Originator",
        "meaning_ru": "Основатель",
    },
    {
        "num": 59,
        "arabic": "الْمُعِيد",
        "transliteration": "Al-Mu'id",
        "meaning_en": "The Restorer",
        "meaning_ru": "Возвращающий",
    },
    {
        "num": 60,
        "arabic": "الْمُحْيِي",
        "transliteration": "Al-Muhyi",
        "meaning_en": "The Giver of Life",
        "meaning_ru": "Оживляющий",
    },
    {
        "num": 61,
        "arabic": "الْمُمِيت",
        "transliteration": "Al-Mumit",
        "meaning_en": "The Bringer of Death",
        "meaning_ru": "Умерщвляющий",
    },
    {
        "num": 62,
        "arabic": "الْحَيّ",
        "transliteration": "Al-Hayy",
        "meaning_en": "The Ever-Living",
        "meaning_ru": "Живой",
    },
    {
        "num": 63,
        "arabic": "الْقَيُّوم",
        "transliteration": "Al-Qayyum",
        "meaning_en": "The Sustainer of Life",
        "meaning_ru": "Самосущий",
    },
    {
        "num": 64,
        "arabic": "الْوَاجِد",
        "transliteration": "Al-Wajid",
        "meaning_en": "The Perceiver",
        "meaning_ru": "Находящий",
    },
    {
        "num": 65,
        "arabic": "الْمَاجِد",
        "transliteration": "Al-Majid",
        "meaning_en": "The Illustrious",
        "meaning_ru": "Благородный",
    },
    {
        "num": 66,
        "arabic": "الْوَاحِد",
        "transliteration": "Al-Wahid",
        "meaning_en": "The One",
        "meaning_ru": "Единый",
    },
    {
        "num": 67,
        "arabic": "الْأَحَد",
        "transliteration": "Al-Ahad",
        "meaning_en": "The Unique",
        "meaning_ru": "Единственный",
    },
    {
        "num": 68,
        "arabic": "الصَّمَد",
        "transliteration": "As-Samad",
        "meaning_en": "The Eternal Refuge",
        "meaning_ru": "Самодостаточный",
    },
    {
        "num": 69,
        "arabic": "الْقَادِر",
        "transliteration": "Al-Qadir",
        "meaning_en": "The Capable",
        "meaning_ru": "Всемогущий",
    },
    {
        "num": 70,
        "arabic": "الْمُقْتَدِر",
        "transliteration": "Al-Muqtadir",
        "meaning_en": "The Omnipotent",
        "meaning_ru": "Всесильный",
    },
    {
        "num": 71,
        "arabic": "الْمُقَدِّم",
        "transliteration": "Al-Muqaddim",
        "meaning_en": "The Expediter",
        "meaning_ru": "Выдвигающий вперед",
    },
    {
        "num": 72,
        "arabic": "الْمُؤَخِّر",
        "transliteration": "Al-Mu'akhkhir",
        "meaning_en": "The Delayer",
        "meaning_ru": "Отодвигающий",
    },
    {
        "num": 73,
        "arabic": "الْأَوَّل",
        "transliteration": "Al-Awwal",
        "meaning_en": "The First",
        "meaning_ru": "Первый",
    },
    {
        "num": 74,
        "arabic": "الْآخِر",
        "transliteration": "Al-Akhir",
        "meaning_en": "The Last",
        "meaning_ru": "Последний",
    },
    {
        "num": 75,
        "arabic": "الظَّاهِر",
        "transliteration": "Az-Zahir",
        "meaning_en": "The Manifest",
        "meaning_ru": "Явный",
    },
    {
        "num": 76,
        "arabic": "الْبَاطِن",
        "transliteration": "Al-Batin",
        "meaning_en": "The Hidden One",
        "meaning_ru": "Скрытый",
    },
    {
        "num": 77,
        "arabic": "الْوَالِي",
        "transliteration": "Al-Wali",
        "meaning_en": "The Governor",
        "meaning_ru": "Правящий",
    },
    {
        "num": 78,
        "arabic": "الْمُتَعَالِي",
        "transliteration": "Al-Muta'ali",
        "meaning_en": "The Supremely Exalted",
        "meaning_ru": "Высочайший",
    },
    {
        "num": 79,
        "arabic": "الْبَرّ",
        "transliteration": "Al-Barr",
        "meaning_en": "The Source of Goodness",
        "meaning_ru": "Благочестивый",
    },
    {
        "num": 80,
        "arabic": "التَّوَّاب",
        "transliteration": "At-Tawwab",
        "meaning_en": "The Ever-Pardoning",
        "meaning_ru": "Принимающий покаяние",
    },
    {
        "num": 81,
        "arabic": "الْمُنْتَقِم",
        "transliteration": "Al-Muntaqim",
        "meaning_en": "The Avenger",
        "meaning_ru": "Воздающий",
    },
    {
        "num": 82,
        "arabic": "الْعَفُوّ",
        "transliteration": "Al-Afuww",
        "meaning_en": "The Pardoner",
        "meaning_ru": "Снисходительный",
    },
    {
        "num": 83,
        "arabic": "الرَّؤُوف",
        "transliteration": "Ar-Ra'uf",
        "meaning_en": "The Most Kind",
        "meaning_ru": "Сострадательный",
    },
    {
        "num": 84,
        "arabic": "مَالِكُ الْمُلْك",
        "transliteration": "Malik-ul-Mulk",
        "meaning_en": "Master of Dominion",
        "meaning_ru": "Владыка царства",
    },
    {
        "num": 85,
        "arabic": "ذُو الْجَلَالِ وَالْإِكْرَام",
        "transliteration": "Dhul-Jalali wal-Ikram",
        "meaning_en": "Lord of Glory and Honour",
        "meaning_ru": "Обладатель величия и щедрости",
    },
    {
        "num": 86,
        "arabic": "الْمُقْسِط",
        "transliteration": "Al-Muqsit",
        "meaning_en": "The Just One",
        "meaning_ru": "Справедливый",
    },
    {
        "num": 87,
        "arabic": "الْجَامِع",
        "transliteration": "Al-Jami'",
        "meaning_en": "The Gatherer",
        "meaning_ru": "Собирающий",
    },
    {
        "num": 88,
        "arabic": "الْغَنِيّ",
        "transliteration": "Al-Ghani",
        "meaning_en": "The Self-Sufficient",
        "meaning_ru": "Богатый",
    },
    {
        "num": 89,
        "arabic": "الْمُغْنِي",
        "transliteration": "Al-Mughni",
        "meaning_en": "The Enricher",
        "meaning_ru": "Обогащающий",
    },
    {
        "num": 90,
        "arabic": "الْمَانِع",
        "transliteration": "Al-Mani'",
        "meaning_en": "The Preventer",
        "meaning_ru": "Удерживающий",
    },
    {
        "num": 91,
        "arabic": "الضَّارّ",
        "transliteration": "Ad-Darr",
        "meaning_en": "The Distresser",
        "meaning_ru": "Лишающий",
    },
    {
        "num": 92,
        "arabic": "النَّافِع",
        "transliteration": "An-Nafi'",
        "meaning_en": "The Benefactor",
        "meaning_ru": "Приносящий пользу",
    },
    {
        "num": 93,
        "arabic": "النُّور",
        "transliteration": "An-Nur",
        "meaning_en": "The Light",
        "meaning_ru": "Свет",
    },
    {
        "num": 94,
        "arabic": "الْهَادِي",
        "transliteration": "Al-Hadi",
        "meaning_en": "The Guide",
        "meaning_ru": "Ведущий верным путем",
    },
    {
        "num": 95,
        "arabic": "الْبَدِيع",
        "transliteration": "Al-Badi'",
        "meaning_en": "The Incomparable Originator",
        "meaning_ru": "Несравненный",
    },
    {
        "num": 96,
        "arabic": "الْبَاقِي",
        "transliteration": "Al-Baqi",
        "meaning_en": "The Everlasting",
        "meaning_ru": "Вечный",
    },
    {
        "num": 97,
        "arabic": "الْوَارِث",
        "transliteration": "Al-Warith",
        "meaning_en": "The Inheritor",
        "meaning_ru": "Наследник",
    },
    {
        "num": 98,
        "arabic": "الرَّشِيد",
        "transliteration": "Ar-Rashid",
        "meaning_en": "The Infallible Teacher",
        "meaning_ru": "Правильный",
    },
    {
        "num": 99,
        "arabic": "الصَّبُور",
        "transliteration": "As-Sabur",
        "meaning_en": "The Most Patient",
        "meaning_ru": "Терпеливый",
    },
]


@api_view(["GET"])
def names_of_allah(request):
    """
    GET /api/names/
    Return the 99 Beautiful Names of Allah with transliteration and translations.
    """
    return Response(
        {"names": NAMES_OF_ALLAH, "count": len(NAMES_OF_ALLAH)}, status=status.HTTP_200_OK
    )


# ─── HEALTH, CONFIG & AUTH RATE LIMITING ───────────────────────────────────


def _issue_session_tokens(user):
    refresh = RefreshToken.for_user(user)
    pvh = password_version_hash(user)
    refresh["pvh"] = pvh
    access = refresh.access_token
    access["pvh"] = pvh
    return str(refresh), str(access)


def _set_refresh_cookie(response, refresh_str: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_str,
        max_age=7 * 24 * 60 * 60,
        path="/api/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


def _clear_refresh_cookie(response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path="/api/",
        samesite=settings.COOKIE_SAMESITE,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/
    Health check endpoint verifying active DB connection without external API calls.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        logger.error("Health check database ping failed")
        return Response(
            {"status": "error", "app": "Noor Al-Quran", "db": "disconnected"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(
        {"status": "ok", "app": "Noor Al-Quran", "db": "connected"},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_config(request):
    """GET /api/config/ — Return non-secret public runtime config (e.g. optional audio CDN URL)."""
    return Response(
        {"audioCdnBase": settings.AUDIO_CDN_BASE or None},
        status=status.HTTP_200_OK,
    )


class AuthRateThrottle(AnonRateThrottle):
    """Strict rate limit on authentication attempts behind reverse proxy."""

    rate = "10/min"
    scope = "auth"


class RegisterRateThrottle(AnonRateThrottle):
    """Strict rate limit on user registrations per IP."""

    rate = "5/min"
    scope = "register"


class CustomTokenObtainPairView(APIView):
    """Cookie-backed JWT login issuing access token in memory JSON + refresh in httpOnly cookie."""

    permission_classes: ClassVar[tuple] = (AllowAny,)
    throttle_classes: ClassVar[tuple] = (AuthRateThrottle,)

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))
        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request=request, username=username, password=password)
        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh_str, access_str = _issue_session_tokens(user)
        resp = Response(
            {
                "access": access_str,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(resp, refresh_str)
        return resp


class CookieTokenRefreshView(APIView):
    """Rotate httpOnly refresh cookie (or body refresh token fallback) and issue fresh access JWT."""

    permission_classes: ClassVar[tuple] = (AllowAny,)
    throttle_classes: ClassVar[tuple] = (AuthRateThrottle,)

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not raw_refresh and isinstance(request.data, dict):
            raw_refresh = request.data.get("refresh")
        if not raw_refresh or not isinstance(raw_refresh, str):
            return Response(
                {"detail": "Refresh session missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            token = RefreshToken(raw_refresh)
            user_id = token.get("user_id")
            user = User.objects.filter(pk=user_id, is_active=True).first()
            if user is None or token.get("pvh") != password_version_hash(user):
                raise TokenError("Session invalidated.")
            token.blacklist()
            new_refresh, new_access = _issue_session_tokens(user)
        except TokenError:
            resp = Response(
                {"detail": "Invalid or expired refresh session."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _clear_refresh_cookie(resp)
            return resp

        resp = Response(
            {"access": new_access, "username": user.username, "email": user.email},
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(resp, new_refresh)
        return resp


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_user(request):
    username = str(request.data.get("username", "")).strip()
    password = str(request.data.get("password", ""))
    email = str(request.data.get("email", "")).strip()

    if not username or not password:
        return Response(
            {"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST
        )

    if len(username) < 3 or len(username) > 30:
        return Response(
            {"error": "Username must be between 3 and 30 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        return Response(
            {"error": "Username may only contain letters, digits, dots, underscores, and hyphens."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email:
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response(
                {"error": "Invalid email address format."}, status=status.HTTP_400_BAD_REQUEST
            )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Unable to complete registration with provided credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email and User.objects.filter(email=email).exists():
        return Response(
            {"error": "Unable to complete registration with provided credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    candidate = User(username=username, email=email)
    try:
        validate_password(password, user=candidate)
    except DjangoValidationError as e:
        return Response({"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    refresh_str, access_str = _issue_session_tokens(user)
    resp = Response(
        {
            "access": access_str,
            "username": user.username,
            "email": user.email,
        },
        status=status.HTTP_201_CREATED,
    )
    _set_refresh_cookie(resp, refresh_str)
    return resp


# ─── USER ACCOUNT MANAGEMENT (SEC-10) ───────────────────────────────────────


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def user_me(request):
    """
    GET /api/auth/me/ — Return current user profile info.
    DELETE /api/auth/me/ — Delete account (Right to Erasure / GDPR) with password confirmation.
    """
    user = request.user
    if request.method == "GET":
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "date_joined": user.date_joined,
                "bookmarks_count": user.bookmarks.count(),
            },
            status=status.HTTP_200_OK,
        )

    # DELETE: requires confirmation password
    password = request.data.get("password", "") if isinstance(request.data, dict) else ""
    if not password:
        return Response(
            {"error": "Password confirmation is required to delete your account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.check_password(password):
        return Response(
            {"error": "Incorrect password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        OutstandingToken.objects.filter(user=user).delete()
        user.delete()

    resp = Response({"message": "Account successfully deleted."}, status=status.HTTP_204_NO_CONTENT)
    _clear_refresh_cookie(resp)
    return resp


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/auth/password/change/
    Change password, invalidate all existing tokens, and rotate httpOnly cookie.
    """
    user = request.user
    old_password = request.data.get("old_password", "")
    new_password = request.data.get("new_password", "")

    if not old_password or not new_password:
        return Response(
            {"error": "Both old_password and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.check_password(old_password):
        return Response(
            {"error": "Current password does not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 8:
        return Response(
            {"error": "New password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return Response({"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        user.set_password(new_password)
        user.save()
        for ot in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=ot)
        refresh_str, access_str = _issue_session_tokens(user)

    resp = Response(
        {
            "message": "Password changed successfully.",
            "access": access_str,
        },
        status=status.HTTP_200_OK,
    )
    _set_refresh_cookie(resp, refresh_str)
    return resp


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    """
    POST /api/auth/logout/
    Blacklist refresh token from cookie or request body and clear httpOnly cookie.
    """
    raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
    if not raw_refresh and isinstance(request.data, dict):
        raw_refresh = request.data.get("refresh", "")
    if raw_refresh and isinstance(raw_refresh, str):
        try:
            token = RefreshToken(raw_refresh)
            token.blacklist()
        except Exception:
            pass
    resp = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
    _clear_refresh_cookie(resp)
    return resp
