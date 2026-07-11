"""
Noor Al-Quran — Django Admin Configuration
"""
from django.contrib import admin
from .models import Bookmark, PrayerNotification
@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('surah_number', 'ayah_number', 'note', 'created_at')
    list_filter = ('surah_number', 'created_at')
    search_fields = ('note',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Reference', {
            'fields': ('surah_number', 'ayah_number')
        }),
        ('Content', {
            'fields': ('note',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PrayerNotification)
class PrayerNotificationAdmin(admin.ModelAdmin):
    list_display = ('prayer_name', 'adhan_reciter', 'is_enabled', 'created_at')
    list_filter = ('prayer_name', 'is_enabled', 'created_at')
    search_fields = ('adhan_reciter',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Prayer Configuration', {
            'fields': ('prayer_name', 'adhan_reciter', 'is_enabled')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
