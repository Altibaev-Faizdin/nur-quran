from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# ─── Router for ModelViewSets ────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'reciters',       views.ReciterViewSet,             basename='reciter')
router.register(r'bookmarks',      views.BookmarkViewSet,            basename='bookmark')
router.register(r'notifications',  views.PrayerNotificationViewSet,  basename='notification')

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),

    # ── Quran ──
    path('surahs/',                                  views.surah_list,               name='surah-list'),
    path('surahs/<int:surah_number>/',               views.surah_detail,             name='surah-detail'),

    # ── Audio ──
    path('audio/<int:surah_number>/<int:ayah_number>/',                       views.ayah_audio,                name='ayah-audio'),
    path('audio/<str:reciter_id>/<int:surah_number>/<int:ayah_number>/',      views.ayah_audio_by_reciter_id,  name='ayah-audio-by-reciter'),

    # ── Prayer times ──
    path('prayer-times/', views.prayer_times, name='prayer-times'),
    path('hijri-date/',   views.hijri_date,   name='hijri-date'),

    # ── 99 Names ──
    path('names/', views.names_of_allah, name='names-of-allah'),
]
