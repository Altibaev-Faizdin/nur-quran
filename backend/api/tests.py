"""
Noor Al-Quran — Comprehensive Automated Test Suite
Covers Authentication, Account Management, JWT, Bookmarks, Notifications,
Quran, Prayer Times, Hijri, 99 Names, Security Headers, and 6236 Quran Integrity.
"""

from unittest.mock import MagicMock, patch

import httpx
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Bookmark
from .serializers import SURAH_AYAH_COUNTS


class QuranIntegrityTests(TestCase):
    """Rule 4: The integrity of the Quran is sacred (114 surahs, 6236 ayahs)."""

    def test_quran_canonical_verse_and_surah_counts(self):
        self.assertEqual(len(SURAH_AYAH_COUNTS), 114, "Must have exactly 114 surahs")
        self.assertEqual(sum(SURAH_AYAH_COUNTS), 6236, "Total ayah count must be 6236")
        self.assertEqual(SURAH_AYAH_COUNTS[0], 7, "Al-Fatiha must have 7 ayahs")
        self.assertEqual(SURAH_AYAH_COUNTS[1], 286, "Al-Baqarah must have 286 ayahs")
        self.assertEqual(SURAH_AYAH_COUNTS[113], 6, "An-Nas must have 6 ayahs")


class AuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def test_register_user_success(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "username": "testuser",
                "email": "testuser@example.com",
                "password": "SecurePassword123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["username"], "testuser")

    def test_register_user_invalid_username(self):
        # Too short (<3)
        res1 = self.client.post(
            reverse("auth-register"), {"username": "te", "password": "SecurePassword123!"}
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Special injection characters
        res2 = self.client.post(
            reverse("auth-register"), {"username": "user<script>", "password": "SecurePassword123!"}
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_invalid_email(self):
        res = self.client.post(
            reverse("auth-register"),
            {"username": "gooduser", "email": "not-an-email", "password": "SecurePassword123!"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_short_password(self):
        res = self.client.post(
            reverse("auth-register"), {"username": "shortpassuser", "password": "123"}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_duplicate_username(self):
        User.objects.create_user(username="dupuser", password="Password123!")
        res = self.client.post(
            reverse("auth-register"), {"username": "dupuser", "password": "SecurePassword123!"}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_success_and_failure(self):
        User.objects.create_user(username="testlogin", password="SecurePassword123!")
        # Success
        res_ok = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "testlogin", "password": "SecurePassword123!"},
        )
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_ok.data)
        self.assertIn("refresh", res_ok.data)

        # Wrong password
        res_fail = self.client.post(
            reverse("token_obtain_pair"), {"username": "testlogin", "password": "WrongPassword123!"}
        )
        self.assertEqual(res_fail.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountManagementTests(TestCase):
    """SEC-10: Profile, change password, and delete account (GDPR)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="gdpruser", email="gdpr@example.com", password="CurrentPassword123!"
        )
        self.client.force_authenticate(user=self.user)

    def test_get_user_profile(self):
        res = self.client.get(reverse("auth-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "gdpruser")
        self.assertEqual(res.data["email"], "gdpr@example.com")

    def test_change_password_success(self):
        res = self.client.post(
            reverse("auth-password-change"),
            {"old_password": "CurrentPassword123!", "new_password": "NewSecurePassword123!"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

        # Verify old password no longer works
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))
        self.assertFalse(self.user.check_password("CurrentPassword123!"))

    def test_change_password_wrong_old_password(self):
        res = self.client.post(
            reverse("auth-password-change"),
            {"old_password": "WrongPassword!", "new_password": "NewSecurePassword123!"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_account_requires_password_confirmation(self):
        # Missing password
        res_no_pw = self.client.delete(reverse("auth-me"), {})
        self.assertEqual(res_no_pw.status_code, status.HTTP_400_BAD_REQUEST)

        # Wrong password
        res_wrong_pw = self.client.delete(reverse("auth-me"), {"password": "WrongPassword!"})
        self.assertEqual(res_wrong_pw.status_code, status.HTTP_400_BAD_REQUEST)

        # Correct password -> account deleted
        res_ok = self.client.delete(reverse("auth-me"), {"password": "CurrentPassword123!"})
        self.assertEqual(res_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username="gdpruser").exists())

    def test_logout_user(self):
        refresh = RefreshToken.for_user(self.user)
        res = self.client.post(reverse("auth-logout"), {"refresh": str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class TokenRefreshTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="refuser", password="Password123!")

    def test_token_refresh_success(self):
        refresh = RefreshToken.for_user(self.user)
        res = self.client.post(reverse("token_refresh"), {"refresh": str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_token_refresh_alias(self):
        refresh = RefreshToken.for_user(self.user)
        res = self.client.post(reverse("token_refresh_alias"), {"refresh": str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)


class BookmarkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username="user1", password="Password123!")
        self.user2 = User.objects.create_user(username="user2", password="Password123!")
        Bookmark.objects.create(user=self.user1, surah_number=1, ayah_number=1, note="test")

    def test_get_bookmarks_unauthenticated(self):
        response = self.client.get(reverse("bookmark-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_bookmarks_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse("bookmark-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["surah_number"], 1)

    def test_idor_bookmarks(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(reverse("bookmark-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_create_bookmark_valid_verses(self):
        self.client.force_authenticate(user=self.user1)
        # Surah 2 has 286 ayahs
        res = self.client.post(
            reverse("bookmark-list"),
            {"surah_number": 2, "ayah_number": 286, "note": "Last ayah of Al-Baqarah"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_bookmark_invalid_surah_number(self):
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(reverse("bookmark-list"), {"surah_number": 115, "ayah_number": 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_bookmark_invalid_ayah_exceeding_surah_length(self):
        """Surah 1 (Al-Fatiha) has only 7 ayahs. Ayah 8 must be rejected with 400."""
        self.client.force_authenticate(user=self.user1)
        res1 = self.client.post(reverse("bookmark-list"), {"surah_number": 1, "ayah_number": 8})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ayah_number", res1.data)

        # Surah 114 (An-Nas) has only 6 ayahs. Ayah 7 must be rejected.
        res2 = self.client.post(reverse("bookmark-list"), {"surah_number": 114, "ayah_number": 7})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_bookmark_rejected(self):
        self.client.force_authenticate(user=self.user1)
        # Already created in setUp: (1, 1)
        res = self.client.post(reverse("bookmark-list"), {"surah_number": 1, "ayah_number": 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_idor_bookmark_detail_and_delete(self):
        b = Bookmark.objects.create(user=self.user1, surah_number=2, ayah_number=2)
        self.client.force_authenticate(user=self.user2)
        self.assertEqual(
            self.client.get(reverse("bookmark-detail", args=[b.id])).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.delete(reverse("bookmark-detail", args=[b.id])).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(Bookmark.objects.filter(id=b.id).count(), 1)


class NotificationTests(TestCase):
    """FUNC-01: Prayer notifications including 'isha'."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="notifuser", password="Password123!")
        self.client.force_authenticate(user=self.user)

    def test_create_isha_notification(self):
        """FUNC-01: Isha prayer must be valid in PRAYER_CHOICES."""
        res = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "isha", "adhan_reciter": "mishary", "is_enabled": True},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["prayer_name"], "isha")

    def test_create_sunrise_notification(self):
        res = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "sunrise", "adhan_reciter": "mishary", "is_enabled": False},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_validate_adhan_reciter(self):
        # Valid reciter
        res_ok = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "fajr", "adhan_reciter": "abdulbasit", "is_enabled": True},
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # Invalid reciter
        res_bad = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "dhuhr", "adhan_reciter": "unknown_fake_reciter", "is_enabled": True},
        )
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("adhan_reciter", res_bad.data)


class QuranEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("httpx.Client.get")
    def test_surah_list_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "code": 200,
            "status": "OK",
            "data": [{"number": 1, "name": "Al-Fatiha"}],
        }
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        res = self.client.get(reverse("surah-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], 200)

    @patch("httpx.Client.get")
    def test_surah_detail_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "code": 200,
            "status": "OK",
            "data": [{"number": 1, "ayahs": []}],
        }
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        res = self.client.get(reverse("surah-detail", args=[1]), {"lang": "ru"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_surah_detail_invalid_surah_number(self):
        res = self.client.get(reverse("surah-detail", args=[115]))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("httpx.Client.get")
    def test_external_api_timeout_handling(self, mock_get):
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")
        res = self.client.get(reverse("surah-list"))
        self.assertEqual(res.status_code, status.HTTP_504_GATEWAY_TIMEOUT)

    @patch("httpx.Client.get")
    def test_external_api_network_error_handling(self, mock_get):
        mock_get.side_effect = httpx.RequestError("DNS lookup failed")
        res = self.client.get(reverse("surah-list"))
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)


class PrayerTimesAndHijriTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("httpx.Client.get")
    def test_prayer_times_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"code": 200, "data": {"timings": {"Fajr": "05:00"}}}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        res = self.client.get(
            reverse("prayer-times"),
            {"lat": "21.42", "lng": "39.82", "method": "4", "school": "1", "date": "19-11-2026"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_prayer_times_invalid_coordinates(self):
        # Invalid lat > 90
        res1 = self.client.get(reverse("prayer-times"), {"lat": "95.0", "lng": "39.82"})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Non-numeric
        res2 = self.client.get(reverse("prayer-times"), {"lat": "abc", "lng": "39.82"})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid method
        res3 = self.client.get(
            reverse("prayer-times"), {"lat": "21.42", "lng": "39.82", "method": "99"}
        )
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid school
        res4 = self.client.get(
            reverse("prayer-times"), {"lat": "21.42", "lng": "39.82", "school": "5"}
        )
        self.assertEqual(res4.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid date format
        res5 = self.client.get(
            reverse("prayer-times"), {"lat": "21.42", "lng": "39.82", "date": "2026-11-19"}
        )
        self.assertEqual(res5.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("httpx.Client.get")
    def test_hijri_date_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"code": 200, "data": {"hijri": {"date": "01-09-1447"}}}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        res = self.client.get(reverse("hijri-date"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_hijri_date_invalid_format(self):
        res = self.client.get(reverse("hijri-date"), {"date": "2026/12/21"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class NamesOfAllahTests(TestCase):
    def test_names_of_allah_returns_99_names(self):
        client = APIClient()
        res = client.get(reverse("names-of-allah"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 99)
        self.assertEqual(len(res.data["names"]), 99)
        self.assertEqual(res.data["names"][0]["arabic"], "الرَّحْمَن")
        self.assertEqual(res.data["names"][98]["arabic"], "الصَّبُور")


class SecurityHeadersMiddlewareTests(TestCase):
    def test_security_headers_on_api_responses(self):
        client = APIClient()
        res = client.get(reverse("health-check"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["X-Content-Type-Options"], "nosniff")
        self.assertEqual(res["X-Frame-Options"], "DENY")
        self.assertEqual(res["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertIn("default-src 'none'", res["Content-Security-Policy"])
        self.assertIn("geolocation=(self)", res["Permissions-Policy"])
