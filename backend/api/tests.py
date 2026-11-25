"""
Noor Al-Quran — Comprehensive Automated Test Suite
Covers Authentication, Cookie Rotation, Token Versioning, Account Management,
Bookmarks, Notifications, Quran, Prayer Times, Hijri, 99 Names, Security Headers,
Frontend Serving, and 6236 Quran Integrity.
"""

from unittest.mock import MagicMock, patch

import httpx
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Bookmark, PrayerNotification
from .serializers import SURAH_AYAH_COUNTS


class QuranIntegrityTests(TestCase):
    """The integrity of the Quran metadata is sacred (114 surahs, 6236 ayahs)."""

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

    def test_register_user_sets_httponly_cookie_without_json_refresh(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "username": "testuser",
                "email": "testuser@example.com",
                "password": "SecurePassword123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertEqual(response.data["username"], "testuser")
        cookie = response.cookies.get(settings.REFRESH_COOKIE_NAME)
        self.assertIsNotNone(cookie)
        self.assertTrue(cookie["httponly"])
        self.assertTrue(cookie.value)

    def test_register_user_validation_rules(self):
        res1 = self.client.post(
            reverse("auth-register"), {"username": "te", "password": "SecurePassword123!"}
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        res2 = self.client.post(
            reverse("auth-register"),
            {"username": "user<script>", "password": "SecurePassword123!"},
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        res_email = self.client.post(
            reverse("auth-register"),
            {"username": "gooduser", "email": "not-an-email", "password": "SecurePassword123!"},
        )
        self.assertEqual(res_email.status_code, status.HTTP_400_BAD_REQUEST)

        res_short = self.client.post(
            reverse("auth-register"), {"username": "shortpassuser", "password": "123"}
        )
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)

        res_similar = self.client.post(
            reverse("auth-register"),
            {"username": "similar_user", "password": "similar_user123"},
        )
        self.assertEqual(res_similar.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_duplicate_username(self):
        User.objects.create_user(username="dupuser", password="Password123!")
        res = self.client.post(
            reverse("auth-register"), {"username": "dupuser", "password": "SecurePassword123!"}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success_and_uniform_failure_messages(self):
        User.objects.create_user(username="testlogin", password="SecurePassword123!")
        res_ok = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "testlogin", "password": "SecurePassword123!"},
            format="json",
        )
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_ok.data)
        self.assertNotIn("refresh", res_ok.data)
        self.assertIsNotNone(res_ok.cookies.get(settings.REFRESH_COOKIE_NAME))

        res_wrong_pw = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "testlogin", "password": "WrongPassword123!"},
            format="json",
        )
        res_unknown = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "nobody_exists_xyz", "password": "WrongPassword123!"},
            format="json",
        )
        self.assertEqual(res_wrong_pw.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_unknown.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_wrong_pw.data["detail"], res_unknown.data["detail"])

    def test_cookie_refresh_rotation_and_replay_rejection(self):
        User.objects.create_user(username="rotuser", password="SecurePassword123!")
        login_res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "rotuser", "password": "SecurePassword123!"},
            format="json",
        )
        cookie1 = login_res.cookies[settings.REFRESH_COOKIE_NAME].value

        # Rotate via cookie
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = cookie1
        ref_res = self.client.post(reverse("token_refresh"))
        self.assertEqual(ref_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", ref_res.data)
        cookie2 = ref_res.cookies[settings.REFRESH_COOKIE_NAME].value
        self.assertNotEqual(cookie1, cookie2)

        # Replaying old cookie1 must fail with 401
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = cookie1
        replay_res = self.client.post(reverse("token_refresh"))
        self.assertEqual(replay_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Valid alias still works with cookie2
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = cookie2
        alias_res = self.client.post(reverse("token_refresh_alias"))
        self.assertEqual(alias_res.status_code, status.HTTP_200_OK)


class AccountManagementTests(TestCase):
    """Profile, password-version token invalidation, logout, and GDPR delete."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="gdpruser", email="gdpr@example.com", password="CurrentPassword123!"
        )

    def tearDown(self):
        cache.clear()

    def _login(self, username="gdpruser", password="CurrentPassword123!"):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": username, "password": password},
            format="json",
        )
        return res.data["access"], res.cookies[settings.REFRESH_COOKIE_NAME].value

    def test_get_user_profile(self):
        access, _ = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = self.client.get(reverse("auth-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "gdpruser")
        self.assertEqual(res.data["email"], "gdpr@example.com")

    def test_change_password_invalidates_prior_access_and_refresh_tokens(self):
        old_access, old_cookie = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")

        res = self.client.post(
            reverse("auth-password-change"),
            {"old_password": "CurrentPassword123!", "new_password": "NewSecurePassword123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        new_access = res.data["access"]

        # Old access token MUST fail immediately (password version mismatch)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")
        self.assertEqual(
            self.client.get(reverse("auth-me")).status_code, status.HTTP_401_UNAUTHORIZED
        )

        # Old refresh cookie MUST fail (blacklisted + password version mismatch)
        self.client.credentials()
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = old_cookie
        self.assertEqual(
            self.client.post(reverse("token_refresh")).status_code, status.HTTP_401_UNAUTHORIZED
        )

        # New access token works cleanly
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access}")
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old_password(self):
        access, _ = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = self.client.post(
            reverse("auth-password-change"),
            {"old_password": "WrongPassword!", "new_password": "NewSecurePassword123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_account_blocks_takeover_upon_reregister(self):
        access, _ = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        res_no_pw = self.client.delete(reverse("auth-me"), {}, format="json")
        self.assertEqual(res_no_pw.status_code, status.HTTP_400_BAD_REQUEST)

        res_wrong_pw = self.client.delete(
            reverse("auth-me"), {"password": "WrongPassword!"}, format="json"
        )
        self.assertEqual(res_wrong_pw.status_code, status.HTTP_400_BAD_REQUEST)

        res_ok = self.client.delete(
            reverse("auth-me"), {"password": "CurrentPassword123!"}, format="json"
        )
        self.assertEqual(res_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username="gdpruser").exists())

        # Re-register same username; stale JWT for deleted user must still fail
        self.client.credentials()
        self.client.post(
            reverse("auth-register"),
            {"username": "gdpruser", "password": "AttackerPassword123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(
            self.client.get(reverse("auth-me")).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_blacklists_cookie_token(self):
        access, cookie = self._login()
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = cookie
        res = self.client.post(reverse("auth-logout"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Replay of logged-out refresh cookie must fail
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = cookie
        self.assertEqual(
            self.client.post(reverse("token_refresh")).status_code, status.HTTP_401_UNAUTHORIZED
        )


class BookmarkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username="user1", password="Password123!")
        self.user2 = User.objects.create_user(username="user2", password="Password123!")
        Bookmark.objects.create(user=self.user1, surah_number=1, ayah_number=1, note="test")

    def test_get_bookmarks_unauthenticated(self):
        response = self.client.get(reverse("bookmark-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_bookmarks_authenticated_and_idor(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse("bookmark-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

        self.client.force_authenticate(user=self.user2)
        response2 = self.client.get(reverse("bookmark-list"))
        self.assertEqual(len(response2.data["results"]), 0)

    def test_create_bookmark_validation_and_note_limit(self):
        self.client.force_authenticate(user=self.user1)
        res_ok = self.client.post(
            reverse("bookmark-list"),
            {"surah_number": 2, "ayah_number": 286, "note": "Last ayah of Al-Baqarah"},
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        res_bad_surah = self.client.post(
            reverse("bookmark-list"), {"surah_number": 115, "ayah_number": 1}
        )
        self.assertEqual(res_bad_surah.status_code, status.HTTP_400_BAD_REQUEST)

        res_bad_ayah = self.client.post(
            reverse("bookmark-list"), {"surah_number": 1, "ayah_number": 8}
        )
        self.assertEqual(res_bad_ayah.status_code, status.HTTP_400_BAD_REQUEST)

        res_long_note = self.client.post(
            reverse("bookmark-list"),
            {"surah_number": 3, "ayah_number": 1, "note": "x" * 1001},
        )
        self.assertEqual(res_long_note.status_code, status.HTTP_400_BAD_REQUEST)

        res_dup = self.client.post(reverse("bookmark-list"), {"surah_number": 1, "ayah_number": 1})
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

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
    """Prayer notification preferences including reciter normalization and upsert."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="notifuser", password="Password123!")
        self.client.force_authenticate(user=self.user)

    def test_create_isha_and_sunrise_notifications(self):
        res = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "isha", "adhan_reciter": "mishary_alafasy", "is_enabled": True},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["adhan_reciter"], "mishary_alafasy")

        # Upsert existing notification instead of 500 IntegrityError, normalizing legacy 'mishary'
        res_upd = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "isha", "adhan_reciter": "mishary", "is_enabled": False},
        )
        self.assertEqual(res_upd.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_upd.data["adhan_reciter"], "mishary_alafasy")
        self.assertEqual(
            PrayerNotification.objects.filter(user=self.user, prayer_name="isha").count(), 1
        )

    def test_validate_adhan_reciter(self):
        res_ok = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "fajr", "adhan_reciter": "abdulbasit", "is_enabled": True},
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        res_bad = self.client.post(
            reverse("notification-list"),
            {"prayer_name": "dhuhr", "adhan_reciter": "unknown_fake_reciter", "is_enabled": True},
        )
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)


class QuranEndpointsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch("httpx.Client.get")
    def test_surah_list_and_detail_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"code": 200, "status": "OK", "data": []}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        self.assertEqual(self.client.get(reverse("surah-list")).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.get(reverse("surah-detail", args=[1]), {"lang": "ru"}).status_code,
            status.HTTP_200_OK,
        )

    def test_surah_detail_invalid_surah_number(self):
        self.assertEqual(
            self.client.get(reverse("surah-detail", args=[115])).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    @patch("httpx.Client.get")
    def test_external_api_errors(self, mock_get):
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")
        self.assertEqual(
            self.client.get(reverse("surah-list")).status_code,
            status.HTTP_504_GATEWAY_TIMEOUT,
        )

        mock_get.side_effect = httpx.RequestError("DNS lookup failed")
        self.assertEqual(
            self.client.get(reverse("surah-list")).status_code,
            status.HTTP_502_BAD_GATEWAY,
        )


class PrayerTimesAndHijriTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch("httpx.Client.get")
    def test_prayer_times_and_hijri_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"code": 200, "data": {"timings": {"Fajr": "05:00"}}}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp

        res = self.client.get(
            reverse("prayer-times"),
            {"lat": "21.42", "lng": "39.82", "method": "4", "school": "1"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Ensure DD-MM-YYYY date path segment was used (avoiding /timings 302)
        called_url = mock_get.call_args[0][0]
        self.assertRegex(called_url, r"/timings/\d{2}-\d{2}-\d{4}\?")

        res_h = self.client.get(reverse("hijri-date"))
        self.assertEqual(res_h.status_code, status.HTTP_200_OK)

    def test_prayer_and_hijri_validation(self):
        self.assertEqual(
            self.client.get(reverse("prayer-times"), {"lat": "95.0", "lng": "39.82"}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.get(reverse("prayer-times"), {"lat": "abc", "lng": "39.82"}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.get(reverse("prayer-times"), {"method": "99"}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.get(reverse("prayer-times"), {"school": "5"}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.get(reverse("hijri-date"), {"date": "2026/12/21"}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class NamesOfAllahTests(TestCase):
    def test_names_of_allah_returns_99_names(self):
        res = APIClient().get(reverse("names-of-allah"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 99)
        self.assertEqual(len(res.data["names"]), 99)
        self.assertEqual(res.data["names"][0]["arabic"], "الرَّحْمَن")
        self.assertEqual(res.data["names"][98]["arabic"], "الصَّبُور")


class SecurityAndFrontendTests(TestCase):
    @override_settings(AUDIO_CDN_BASE="https://cdn.example.com/audio")
    def test_health_config_security_and_frontend_serving(self):
        client = APIClient()
        health = client.get(reverse("health-check"))
        self.assertEqual(health.status_code, status.HTTP_200_OK)
        self.assertEqual(health.data["db"], "connected")
        self.assertEqual(health["X-Content-Type-Options"], "nosniff")
        self.assertEqual(health["X-Frame-Options"], "DENY")
        self.assertIn("default-src 'none'", health["Content-Security-Policy"])

        cfg = client.get(reverse("public-config"))
        self.assertEqual(cfg.status_code, status.HTTP_200_OK)
        self.assertEqual(cfg.data["audioCdnBase"], "https://cdn.example.com/audio")

        home = self.client.get("/")
        self.assertEqual(home.status_code, status.HTTP_200_OK)
        self.assertIn("script-src 'self'", home["Content-Security-Policy"])
        self.assertNotIn("'unsafe-inline'", home["Content-Security-Policy"])

        legacy = self.client.get("/pages/reciter-alafasy.html")
        self.assertEqual(legacy.status_code, status.HTTP_301_MOVED_PERMANENTLY)
        self.assertEqual(legacy["Location"], "/pages/reciter.html?id=mishary_alafasy")

        missing = self.client.get("/pages/nonexistent-page-xyz.html")
        self.assertEqual(missing.status_code, status.HTTP_404_NOT_FOUND)
