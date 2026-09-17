from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Bookmark

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_user_success(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'testuser',
            'password': 'SecurePassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_register_user_invalid_username(self):
        response = self.client.post(reverse('auth-register'), {
            'username': 'te', # too short
            'password': 'SecurePassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_login_user(self):
        User.objects.create_user(username='testlogin', password='SecurePassword123!')
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'testlogin',
            'password': 'SecurePassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

class BookmarkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='Password123!')
        self.user2 = User.objects.create_user(username='user2', password='Password123!')
        
        # User1 bookmarks
        Bookmark.objects.create(user=self.user1, surah_number=1, ayah_number=1, note='test')
        
    def test_get_bookmarks_unauthenticated(self):
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_get_bookmarks_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['surah_number'], 1)

    def test_idor_bookmarks(self):
        """User2 should not see User1's bookmarks"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
        
    def test_create_bookmark(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(reverse('bookmark-list'), {
            'surah_number': 2,
            'ayah_number': 255,
            'note': 'Ayatul Kursi'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bookmark.objects.filter(user=self.user1).count(), 2)

    def test_create_invalid_bookmark(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(reverse('bookmark-list'), {
            'surah_number': 200, # Invalid surah
            'ayah_number': 1
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_idor_bookmark_detail(self):
        """User2 should not be able to fetch User1's specific bookmark"""
        b = Bookmark.objects.create(user=self.user1, surah_number=2, ayah_number=2, note='test2')
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(reverse('bookmark-detail', args=[b.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_idor_bookmark_delete(self):
        """User2 should not be able to delete User1's specific bookmark"""
        b = Bookmark.objects.create(user=self.user1, surah_number=3, ayah_number=3, note='test3')
        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(reverse('bookmark-detail', args=[b.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Bookmark.objects.filter(id=b.id).count(), 1)

class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='Password123!')
        self.user2 = User.objects.create_user(username='user2', password='Password123!')

    def test_idor_notifications(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(reverse('notification-list'), {
            'prayer_name': 'fajr',
            'is_enabled': True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        n_id = response.data['id']

        self.client.force_authenticate(user=self.user2)
        response2 = self.client.get(reverse('notification-detail', args=[n_id]))
        self.assertEqual(response2.status_code, status.HTTP_404_NOT_FOUND)

class JWTTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['code'], 'token_not_valid')

    def test_missing_auth_header(self):
        response = self.client.get(reverse('bookmark-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_returns_username(self):
        """register endpoint should return username field for frontend caching"""
        response = self.client.post(reverse('auth-register'), {
            'username': 'unamecheck',
            'password': 'SecurePassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], 'unamecheck')


class DuplicateBookmarkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='bmuser', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_duplicate_bookmark_rejected(self):
        """Database unique_together constraint must reject duplicate bookmarks"""
        self.client.post(reverse('bookmark-list'), {
            'surah_number': 1, 'ayah_number': 1
        })
        response2 = self.client.post(reverse('bookmark-list'), {
            'surah_number': 1, 'ayah_number': 1
        })
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Bookmark.objects.filter(user=self.user).count(), 1)


class HealthCheckTests(TestCase):
    def test_health_check_returns_ok(self):
        """Health check must return 200 with status ok for Render zero-downtime deploys"""
        client = APIClient()
        response = client.get(reverse('health-check'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
