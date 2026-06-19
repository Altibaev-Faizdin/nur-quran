"""
Noor Al-Quran — Django REST Framework Views
RESTful API endpoints with proper ViewSets and serialization
"""
import logging
from datetime import date

import requests
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import exceptions, filters, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Bookmark, PrayerNotification, Reciter
from .serializers import (
    BookmarkSerializer,
    NameOfAllahSerializer,
    PrayerNotificationSerializer,
    ReciterSerializer,
)

logger = logging.getLogger(__name__)

# ─── External API Base URLs ─────────────────────────────────────────────────
ALQURAN_BASE = "https://api.alquran.cloud/v1"
ALADHAN_BASE = "https://api.aladhan.com/v1"
API_TIMEOUT = 10

# Edition map for alquran.cloud (only officially-supported editions)
RECITER_EDITIONS = {
    'alafasy':    'ar.alafasy',
    'abdulbasit': 'ar.abdulbasitmurattal',
    'ghamdi':     'ar.saoodshuraym',
    'minshawi':   'ar.minshawimujawwad',
    'maher':      'ar.maheralmuaiqly',
    # saud_juma uses mp3quran.net directly — not on alquran.cloud
}

# Direct mp3quran.net server URLs for reciters not on alquran.cloud
MP3QURAN_SERVERS = {
    'saud_juma': 'https://server14.mp3quran.net/s_jm/',
}


# ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

def fetch_external_api(url: str, timeout: int = API_TIMEOUT) -> dict:
    """Fetch data from an external API with structured error handling."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        logger.error("API timeout: %s", url)
        raise exceptions.APIException("External API timed out. Please try again.")
    except requests.exceptions.ConnectionError:
        logger.error("Connection error: %s", url)
        raise exceptions.APIException("Cannot reach external API. Check your connection.")
    except requests.exceptions.HTTPError as exc:
        logger.error("HTTP error %s: %s", exc.response.status_code, url)
        raise exceptions.APIException(
            f"External API returned error {exc.response.status_code}."
        )
    except Exception as exc:
        logger.exception("Unexpected error fetching: %s", url)
        raise exceptions.APIException("An unexpected error occurred.")


# ─── QURAN ENDPOINTS ────────────────────────────────────────────────────────

@api_view(['GET'])
def surah_list(request):
    """
    GET /api/surahs/
    Return the list of all 114 surahs with metadata from alquran.cloud.
    """
    data = fetch_external_api(f"{ALQURAN_BASE}/surah")
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def surah_detail(request, surah_number: int):
    """
    GET /api/surahs/<surah_number>/?lang=en|ru|uz
    Return a full surah with Arabic text and translation.
    """
    if not 1 <= surah_number <= 114:
        return Response(
            {'error': 'Surah number must be between 1 and 114.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lang = request.query_params.get('lang', 'en')
    edition_map = {
        'en': 'en.asad',
        'ru': 'ru.kuliev',
        'uz': 'uz.sodik',
    }
    edition = edition_map.get(lang, 'en.asad')
    url = f"{ALQURAN_BASE}/surah/{surah_number}/editions/quran-uthmani,{edition}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def ayah_audio(request, surah_number: int, ayah_number: int):
    """
    GET /api/audio/<surah>/<ayah>/?reciter=alafasy
    Return the audio URL for a specific ayah.

    For reciters on alquran.cloud: fetches full metadata + audio URL.
    For mp3quran.net reciters (saud_juma): returns direct MP3 URL.
    """
    if not (1 <= surah_number <= 114):
        return Response(
            {'error': 'Surah number must be between 1 and 114.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not (1 <= ayah_number <= 286):
        return Response(
            {'error': 'Ayah number must be between 1 and 286.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reciter = request.query_params.get('reciter', 'alafasy')

    # Handle mp3quran.net reciters separately
    if reciter in MP3QURAN_SERVERS:
        server = MP3QURAN_SERVERS[reciter]
        # mp3quran.net provides full-surah files only
        audio_url = f"{server}{str(surah_number).zfill(3)}.mp3"
        return Response({
            'reciter': reciter,
            'surah': surah_number,
            'ayah': ayah_number,
            'audio': audio_url,
            'note': 'Full-surah MP3. Per-ayah timestamps unavailable for this reciter.',
        }, status=status.HTTP_200_OK)

    edition = RECITER_EDITIONS.get(reciter, 'ar.alafasy')
    url = f"{ALQURAN_BASE}/ayah/{surah_number}:{ayah_number}/{edition}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def ayah_audio_by_reciter_id(request, reciter_id: str, surah_number: int, ayah_number: int):
    """
    GET /api/audio/<reciter_id>/<surah>/<ayah>/
    Convenience endpoint — looks up reciter from DB and returns audio URL.
    """
    try:
        reciter_obj = Reciter.objects.get(reciter_id=reciter_id, is_active=True)
    except Reciter.DoesNotExist:
        return Response({'error': f"Reciter '{reciter_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

    if not (1 <= surah_number <= 114):
        return Response({'error': 'Surah number must be 1–114.'}, status=status.HTTP_400_BAD_REQUEST)
    if not (1 <= ayah_number <= 286):
        return Response({'error': 'Ayah number must be 1–286.'}, status=status.HTTP_400_BAD_REQUEST)

    # If reciter uses mp3quran.net
    if reciter_obj.reciter_id in MP3QURAN_SERVERS:
        audio_url = f"{reciter_obj.server_url}{str(surah_number).zfill(3)}.mp3"
        return Response({
            'reciter': reciter_obj.name_en,
            'surah': surah_number,
            'ayah': ayah_number,
            'audio': audio_url,
        }, status=status.HTTP_200_OK)

    edition = reciter_obj.edition
    url = f"{ALQURAN_BASE}/ayah/{surah_number}:{ayah_number}/{edition}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


# ─── RECITER VIEWSET ────────────────────────────────────────────────────────

class ReciterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Quran reciters.
    Supports filtering by country/style and searching by name.
    """
    queryset = Reciter.objects.filter(is_active=True).order_by('name_en')
    serializer_class = ReciterSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['country', 'style']
    search_fields = ['name_en', 'name_ar', 'country', 'transliteration']
    ordering_fields = ['name_en', 'country', 'created_at']
    ordering = ['name_en']

    def get_queryset(self):
        qs = super().get_queryset()
        # Allow fetching inactive reciters for admin
        if self.request.query_params.get('include_inactive') and self.request.user.is_staff:
            qs = Reciter.objects.all().order_by('name_en')
        return qs


# ─── PRAYER TIMES ──────────────────────────────────────────────────────────

@api_view(['GET'])
def prayer_times(request):
    """
    GET /api/prayer-times/?lat=X&lng=Y&method=2
    Get prayer times for given coordinates using aladhan.com.
    """
    lat = request.query_params.get('lat', '21.3891')
    lng = request.query_params.get('lng', '39.8579')
    method = request.query_params.get('method', '2')

    url = f"{ALADHAN_BASE}/timings?latitude={lat}&longitude={lng}&method={method}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def hijri_date(request):
    """
    GET /api/hijri-date/
    Return today's Gregorian date converted to Hijri.
    """
    today = date.today().strftime('%d-%m-%Y')
    url = f"{ALADHAN_BASE}/gToH?date={today}"
    data = fetch_external_api(url)
    return Response(data, status=status.HTTP_200_OK)


# ─── PRAYER NOTIFICATION VIEWSET ───────────────────────────────────────────

class PrayerNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for prayer notification settings"""
    queryset = PrayerNotification.objects.all().order_by('prayer_name')
    serializer_class = PrayerNotificationSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['prayer_name', 'is_enabled']


# ─── BOOKMARKS VIEWSET ─────────────────────────────────────────────────────

class BookmarkViewSet(viewsets.ModelViewSet):
    """ViewSet for user bookmarks with filtering by surah"""
    queryset = Bookmark.objects.all().order_by('-created_at')
    serializer_class = BookmarkSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['surah_number', 'ayah_number']
    ordering_fields = ['created_at', 'surah_number']
    ordering = ['-created_at']


# ─── 99 NAMES OF ALLAH ─────────────────────────────────────────────────────

NAMES_OF_ALLAH = [
    {"num": 1,  "arabic": "الرَّحْمَن",          "transliteration": "Ar-Rahman",          "meaning_en": "The Most Gracious",          "meaning_ru": "Милостивый"},
    {"num": 2,  "arabic": "الرَّحِيم",            "transliteration": "Ar-Rahim",            "meaning_en": "The Most Merciful",          "meaning_ru": "Милосердный"},
    {"num": 3,  "arabic": "الْمَلِك",             "transliteration": "Al-Malik",            "meaning_en": "The King",                   "meaning_ru": "Царь"},
    {"num": 4,  "arabic": "الْقُدُّوس",           "transliteration": "Al-Quddus",           "meaning_en": "The Most Holy",              "meaning_ru": "Пресвятой"},
    {"num": 5,  "arabic": "السَّلَام",            "transliteration": "As-Salam",            "meaning_en": "The Source of Peace",        "meaning_ru": "Мир"},
    {"num": 6,  "arabic": "الْمُؤْمِن",           "transliteration": "Al-Mu'min",           "meaning_en": "The Guardian of Faith",      "meaning_ru": "Дарующий безопасность"},
    {"num": 7,  "arabic": "الْمُهَيْمِن",          "transliteration": "Al-Muhaymin",         "meaning_en": "The Protector",              "meaning_ru": "Хранитель"},
    {"num": 8,  "arabic": "الْعَزِيز",            "transliteration": "Al-Aziz",             "meaning_en": "The Mighty",                 "meaning_ru": "Могущественный"},
    {"num": 9,  "arabic": "الْجَبَّار",           "transliteration": "Al-Jabbar",           "meaning_en": "The Compeller",              "meaning_ru": "Принуждающий"},
    {"num": 10, "arabic": "الْمُتَكَبِّر",        "transliteration": "Al-Mutakabbir",       "meaning_en": "The Majestic",               "meaning_ru": "Величественный"},
    {"num": 11, "arabic": "الْخَالِق",            "transliteration": "Al-Khaliq",           "meaning_en": "The Creator",                "meaning_ru": "Творец"},
    {"num": 12, "arabic": "الْبَارِئ",            "transliteration": "Al-Bari'",            "meaning_en": "The Evolver",                "meaning_ru": "Создатель"},
    {"num": 13, "arabic": "الْمُصَوِّر",          "transliteration": "Al-Musawwir",         "meaning_en": "The Fashioner",              "meaning_ru": "Придающий форму"},
    {"num": 14, "arabic": "الْغَفَّار",           "transliteration": "Al-Ghaffar",          "meaning_en": "The Forgiver",               "meaning_ru": "Всепрощающий"},
    {"num": 15, "arabic": "الْقَهَّار",           "transliteration": "Al-Qahhar",           "meaning_en": "The Subduer",                "meaning_ru": "Всепобеждающий"},
    {"num": 16, "arabic": "الْوَهَّاب",           "transliteration": "Al-Wahhab",           "meaning_en": "The Bestower",               "meaning_ru": "Дарующий"},
    {"num": 17, "arabic": "الرَّزَّاق",           "transliteration": "Ar-Razzaq",           "meaning_en": "The Provider",               "meaning_ru": "Кормилец"},
    {"num": 18, "arabic": "الْفَتَّاح",           "transliteration": "Al-Fattah",           "meaning_en": "The Opener",                 "meaning_ru": "Открывающий"},
    {"num": 19, "arabic": "الْعَلِيم",            "transliteration": "Al-Alim",             "meaning_en": "The All-Knowing",            "meaning_ru": "Всезнающий"},
    {"num": 20, "arabic": "الْقَابِض",            "transliteration": "Al-Qabid",            "meaning_en": "The Constrictor",            "meaning_ru": "Сжимающий"},
    {"num": 21, "arabic": "الْبَاسِط",            "transliteration": "Al-Basit",            "meaning_en": "The Expander",               "meaning_ru": "Расширяющий"},
    {"num": 22, "arabic": "الْخَافِض",            "transliteration": "Al-Khafid",           "meaning_en": "The Abaser",                 "meaning_ru": "Унижающий"},
    {"num": 23, "arabic": "الرَّافِع",            "transliteration": "Ar-Rafi'",            "meaning_en": "The Exalter",                "meaning_ru": "Возвышающий"},
    {"num": 24, "arabic": "الْمُعِز",             "transliteration": "Al-Mu'izz",           "meaning_en": "The Bestower of Honor",      "meaning_ru": "Чествующий"},
    {"num": 25, "arabic": "الْمُذِل",             "transliteration": "Al-Mudhill",          "meaning_en": "The Humiliator",             "meaning_ru": "Унижающий"},
    {"num": 26, "arabic": "السَّمِيع",            "transliteration": "As-Sami'",            "meaning_en": "The All-Hearing",            "meaning_ru": "Всеслышащий"},
    {"num": 27, "arabic": "الْبَصِير",            "transliteration": "Al-Basir",            "meaning_en": "The All-Seeing",             "meaning_ru": "Всевидящий"},
    {"num": 28, "arabic": "الْحَكَم",             "transliteration": "Al-Hakam",            "meaning_en": "The Judge",                  "meaning_ru": "Судья"},
    {"num": 29, "arabic": "الْعَدْل",             "transliteration": "Al-Adl",              "meaning_en": "The Just",                   "meaning_ru": "Справедливый"},
    {"num": 30, "arabic": "اللَّطِيف",            "transliteration": "Al-Latif",            "meaning_en": "The Subtle One",             "meaning_ru": "Тонкий"},
    {"num": 31, "arabic": "الْخَبِير",            "transliteration": "Al-Khabir",           "meaning_en": "The All-Aware",              "meaning_ru": "Осведомлённый"},
    {"num": 32, "arabic": "الْحَلِيم",            "transliteration": "Al-Halim",            "meaning_en": "The Forbearing",             "meaning_ru": "Терпеливый"},
    {"num": 33, "arabic": "الْعَظِيم",            "transliteration": "Al-Azim",             "meaning_en": "The Magnificent",            "meaning_ru": "Величайший"},
    {"num": 34, "arabic": "الْغَفُور",            "transliteration": "Al-Ghafur",           "meaning_en": "The Forgiving",              "meaning_ru": "Прощающий"},
    {"num": 35, "arabic": "الشَّكُور",            "transliteration": "Ash-Shakur",          "meaning_en": "The Appreciative",           "meaning_ru": "Благодарный"},
    {"num": 36, "arabic": "الْعَلِيّ",            "transliteration": "Al-Ali'",             "meaning_en": "The Most High",              "meaning_ru": "Высочайший"},
    {"num": 37, "arabic": "الْكَبِير",            "transliteration": "Al-Kabir",            "meaning_en": "The Most Great",             "meaning_ru": "Великий"},
    {"num": 38, "arabic": "الْحَفِيظ",            "transliteration": "Al-Hafiz",            "meaning_en": "The Preserver",              "meaning_ru": "Хранящий"},
    {"num": 39, "arabic": "الْمُقِيت",            "transliteration": "Al-Muqit",            "meaning_en": "The Nourisher",              "meaning_ru": "Питающий"},
    {"num": 40, "arabic": "الْحَسِيب",            "transliteration": "Al-Hasib",            "meaning_en": "The Reckoner",               "meaning_ru": "Считающий"},
    {"num": 41, "arabic": "الْجَلِيل",            "transliteration": "Al-Jalil",            "meaning_en": "The Majestic",               "meaning_ru": "Величественный"},
    {"num": 42, "arabic": "الْكَرِيم",            "transliteration": "Al-Karim",            "meaning_en": "The Generous",               "meaning_ru": "Щедрый"},
    {"num": 43, "arabic": "الرَّقِيب",            "transliteration": "Ar-Raqib",            "meaning_en": "The Watchful",               "meaning_ru": "Наблюдающий"},
    {"num": 44, "arabic": "الْمُجِيب",            "transliteration": "Al-Mujib",            "meaning_en": "The Responsive",             "meaning_ru": "Отвечающий"},
    {"num": 45, "arabic": "الْوَاسِع",            "transliteration": "Al-Wasi'",            "meaning_en": "The All-Encompassing",       "meaning_ru": "Необъятный"},
    {"num": 46, "arabic": "الْحَكِيم",            "transliteration": "Al-Hakim",            "meaning_en": "The Wise",                   "meaning_ru": "Мудрый"},
    {"num": 47, "arabic": "الْوَدُود",            "transliteration": "Al-Wadud",            "meaning_en": "The Loving",                 "meaning_ru": "Любящий"},
    {"num": 48, "arabic": "الْمَجِيد",            "transliteration": "Al-Majid",            "meaning_en": "The Most Glorious",          "meaning_ru": "Славный"},
    {"num": 49, "arabic": "الْبَاعِث",            "transliteration": "Al-Ba'ith",           "meaning_en": "The Resurrector",            "meaning_ru": "Воскрешающий"},
    {"num": 50, "arabic": "الشَّهِيد",            "transliteration": "Ash-Shahid",          "meaning_en": "The Witness",                "meaning_ru": "Свидетель"},
    {"num": 51, "arabic": "الْحَقّ",              "transliteration": "Al-Haqq",             "meaning_en": "The Truth",                  "meaning_ru": "Истина"},
    {"num": 52, "arabic": "الْوَكِيل",            "transliteration": "Al-Wakil",            "meaning_en": "The Trustee",                "meaning_ru": "Попечитель"},
    {"num": 53, "arabic": "الْقَوِيّ",            "transliteration": "Al-Qawi",             "meaning_en": "The Most Strong",            "meaning_ru": "Сильный"},
    {"num": 54, "arabic": "الْمَتِين",            "transliteration": "Al-Matin",            "meaning_en": "The Firm",                   "meaning_ru": "Твёрдый"},
    {"num": 55, "arabic": "الْوَلِيّ",            "transliteration": "Al-Wali",             "meaning_en": "The Protecting Friend",      "meaning_ru": "Покровитель"},
    {"num": 56, "arabic": "الْحَمِيد",            "transliteration": "Al-Hamid",            "meaning_en": "The Praiseworthy",           "meaning_ru": "Достохвальный"},
    {"num": 57, "arabic": "الْمُحْصِي",           "transliteration": "Al-Muhsi",            "meaning_en": "The Counter",                "meaning_ru": "Исчисляющий"},
    {"num": 58, "arabic": "الْمُبْدِئ",           "transliteration": "Al-Mubdi'",           "meaning_en": "The Originator",             "meaning_ru": "Начинающий"},
    {"num": 59, "arabic": "الْمُعِيد",            "transliteration": "Al-Mu'id",            "meaning_en": "The Restorer",               "meaning_ru": "Возобновляющий"},
    {"num": 60, "arabic": "الْمُحْيِي",           "transliteration": "Al-Muhyi",            "meaning_en": "The Giver of Life",          "meaning_ru": "Дающий жизнь"},
    {"num": 61, "arabic": "الْمُمِيت",            "transliteration": "Al-Mumit",            "meaning_en": "The Taker of Life",          "meaning_ru": "Умерщвляющий"},
    {"num": 62, "arabic": "الْحَيّ",              "transliteration": "Al-Hayy",             "meaning_en": "The Ever-Living",            "meaning_ru": "Вечно живой"},
    {"num": 63, "arabic": "الْقَيُّوم",           "transliteration": "Al-Qayyum",           "meaning_en": "The Self-Subsisting",        "meaning_ru": "Самодостаточный"},
    {"num": 64, "arabic": "الْوَاجِد",            "transliteration": "Al-Wajid",            "meaning_en": "The Finder",                 "meaning_ru": "Находящий"},
    {"num": 65, "arabic": "الْمَاجِد",            "transliteration": "Al-Majid",            "meaning_en": "The Noble",                  "meaning_ru": "Благородный"},
    {"num": 66, "arabic": "الْوَاحِد",            "transliteration": "Al-Wahid",            "meaning_en": "The One",                    "meaning_ru": "Единый"},
    {"num": 67, "arabic": "الأَحَد",              "transliteration": "Al-Ahad",             "meaning_en": "The Unique",                 "meaning_ru": "Единственный"},
    {"num": 68, "arabic": "الصَّمَد",             "transliteration": "As-Samad",            "meaning_en": "The Eternal",                "meaning_ru": "Вечный"},
    {"num": 69, "arabic": "الْقَادِر",            "transliteration": "Al-Qadir",            "meaning_en": "The Capable",                "meaning_ru": "Могущий"},
    {"num": 70, "arabic": "الْمُقْتَدِر",         "transliteration": "Al-Muqtadir",         "meaning_en": "The Powerful",               "meaning_ru": "Всесильный"},
    {"num": 71, "arabic": "الْمُقَدِّم",          "transliteration": "Al-Muqaddim",         "meaning_en": "The Expediter",              "meaning_ru": "Выдвигающий вперёд"},
    {"num": 72, "arabic": "الْمُؤَخِّر",          "transliteration": "Al-Mu'akhkhir",       "meaning_en": "The Delayer",                "meaning_ru": "Откладывающий"},
    {"num": 73, "arabic": "الأَوَّل",             "transliteration": "Al-Awwal",            "meaning_en": "The First",                  "meaning_ru": "Первый"},
    {"num": 74, "arabic": "الآخِر",               "transliteration": "Al-Akhir",            "meaning_en": "The Last",                   "meaning_ru": "Последний"},
    {"num": 75, "arabic": "الظَّاهِر",            "transliteration": "Az-Zahir",            "meaning_en": "The Manifest",               "meaning_ru": "Явный"},
    {"num": 76, "arabic": "الْبَاطِن",            "transliteration": "Al-Batin",            "meaning_en": "The Hidden",                 "meaning_ru": "Скрытый"},
    {"num": 77, "arabic": "الْوَالِي",            "transliteration": "Al-Wali",             "meaning_en": "The Governor",               "meaning_ru": "Правитель"},
    {"num": 78, "arabic": "الْمُتَعَالِي",        "transliteration": "Al-Muta'ali",         "meaning_en": "The Most Exalted",           "meaning_ru": "Превознесённый"},
    {"num": 79, "arabic": "الْبَرّ",              "transliteration": "Al-Barr",             "meaning_en": "The Source of Goodness",     "meaning_ru": "Благой"},
    {"num": 80, "arabic": "التَّوَّاب",           "transliteration": "At-Tawwab",           "meaning_en": "The Ever-Returning",         "meaning_ru": "Принимающий покаяние"},
    {"num": 81, "arabic": "الْمُنْتَقِم",         "transliteration": "Al-Muntaqim",         "meaning_en": "The Avenger",                "meaning_ru": "Мститель"},
    {"num": 82, "arabic": "الْعَفُوّ",            "transliteration": "Al-Afuww",            "meaning_en": "The Pardoner",               "meaning_ru": "Прощающий"},
    {"num": 83, "arabic": "الرَّؤُوف",            "transliteration": "Ar-Ra'uf",            "meaning_en": "The Compassionate",          "meaning_ru": "Сострадательный"},
    {"num": 84, "arabic": "مَالِكُ الْمُلْك",     "transliteration": "Malik-ul-Mulk",       "meaning_en": "Owner of All Sovereignty",   "meaning_ru": "Владыка царства"},
    {"num": 85, "arabic": "ذُو الْجَلَالِ وَالإِكْرَام", "transliteration": "Dhul-Jalali-wal-Ikram", "meaning_en": "Lord of Majesty and Generosity", "meaning_ru": "Обладатель величия и щедрости"},
    {"num": 86, "arabic": "الْمُقْسِط",           "transliteration": "Al-Muqsit",           "meaning_en": "The Equitable",              "meaning_ru": "Справедливый"},
    {"num": 87, "arabic": "الْجَامِع",            "transliteration": "Al-Jami'",            "meaning_en": "The Gatherer",               "meaning_ru": "Собирающий"},
    {"num": 88, "arabic": "الْغَنِيّ",            "transliteration": "Al-Ghani",            "meaning_en": "The Self-Sufficient",        "meaning_ru": "Богатый"},
    {"num": 89, "arabic": "الْمُغْنِي",           "transliteration": "Al-Mughni",           "meaning_en": "The Enricher",               "meaning_ru": "Обогащающий"},
    {"num": 90, "arabic": "الْمَانِع",            "transliteration": "Al-Mani'",            "meaning_en": "The Preventer",              "meaning_ru": "Удерживающий"},
    {"num": 91, "arabic": "الضَّارّ",             "transliteration": "Ad-Darr",             "meaning_en": "The Distresser",             "meaning_ru": "Причиняющий вред"},
    {"num": 92, "arabic": "النَّافِع",            "transliteration": "An-Nafi'",            "meaning_en": "The Benefiter",              "meaning_ru": "Приносящий пользу"},
    {"num": 93, "arabic": "النُّور",              "transliteration": "An-Nur",              "meaning_en": "The Light",                  "meaning_ru": "Свет"},
    {"num": 94, "arabic": "الْهَادِي",            "transliteration": "Al-Hadi",             "meaning_en": "The Guide",                  "meaning_ru": "Ведущий правым путём"},
    {"num": 95, "arabic": "الْبَدِيع",            "transliteration": "Al-Badi'",            "meaning_en": "The Incomparable",           "meaning_ru": "Несравненный"},
    {"num": 96, "arabic": "الْبَاقِي",            "transliteration": "Al-Baqi",             "meaning_en": "The Everlasting",            "meaning_ru": "Вечный"},
    {"num": 97, "arabic": "الْوَارِث",            "transliteration": "Al-Warith",           "meaning_en": "The Inheritor",              "meaning_ru": "Наследующий"},
    {"num": 98, "arabic": "الرَّشِيد",            "transliteration": "Ar-Rashid",           "meaning_en": "The Rightly Guided",         "meaning_ru": "Ведущий истинным путём"},
    {"num": 99, "arabic": "الصَّبُور",            "transliteration": "As-Sabur",            "meaning_en": "The Patient",                "meaning_ru": "Терпеливый"},
]


@api_view(['GET'])
def names_of_allah(request):
    """
    GET /api/names/
    Return all 99 Names of Allah (Asmaul Husna) — cached static data.
    """
    serializer = NameOfAllahSerializer(data=NAMES_OF_ALLAH, many=True)
    serializer.is_valid()
    return Response({'count': len(NAMES_OF_ALLAH), 'names': serializer.data}, status=status.HTTP_200_OK)
