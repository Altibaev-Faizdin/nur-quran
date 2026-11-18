from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# ─── Router for ModelViewSets ────────────────────────────────────────────────
router = DefaultRouter()
router.register(r"bookmarks", views.BookmarkViewSet, basename="bookmark")
router.register(r"notifications", views.PrayerNotificationViewSet, basename="notification")

urlpatterns = [
    # Health check for Render (independent of external APIs)
    path("health/", views.health_check, name="health-check"),
    # Auth routes
    path("auth/register/", views.register_user, name="auth-register"),
    path("auth/login/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", views.logout_user, name="auth-logout"),
    path("auth/me/", views.user_me, name="auth-me"),
    path("auth/password/change/", views.change_password, name="auth-password-change"),
    # JWT alias endpoints
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh_alias"),
    path(
        "token/obtain/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair_alias"
    ),
    # ViewSet routes
    path("", include(router.urls)),
    # ── Quran ──
    path("surahs/", views.surah_list, name="surah-list"),
    path("surahs/<int:surah_number>/", views.surah_detail, name="surah-detail"),
    # ── Prayer times & Hijri ──
    path("prayer-times/", views.prayer_times, name="prayer-times"),
    path("hijri-date/", views.hijri_date, name="hijri-date"),
    # ── 99 Names ──
    path("names/", views.names_of_allah, name="names-of-allah"),
]
