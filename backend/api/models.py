from django.db import models


class Reciter(models.Model):
    """Quran reciter with audio metadata"""
    reciter_id = models.CharField(max_length=50, unique=True, help_text="Unique identifier for reciter")
    name_ar = models.CharField(max_length=200, help_text="Arabic name")
    name_en = models.CharField(max_length=200, help_text="English name")
    transliteration = models.CharField(max_length=100, blank=True)
    style = models.CharField(max_length=50, choices=[
        ('murattal', 'Murattal'),
        ('mujawwad', 'Mujawwad'),
        ('tajweed', 'Tajweed')
    ], default='murattal')
    country = models.CharField(max_length=100)
    bio_en = models.TextField(blank=True, help_text="English biography")
    bio_ru = models.TextField(blank=True, help_text="Russian biography")
    bio_uz = models.TextField(blank=True, help_text="Uzbek biography")
    server_url = models.URLField(help_text="Base URL for audio files")
    edition = models.CharField(max_length=100, help_text="Quranic edition code (e.g., ar.alafasy)")
    photo_url = models.URLField(blank=True)
    initial_letter = models.CharField(max_length=1, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name_en']
        verbose_name_plural = "Reciters"

    def __str__(self):
        return f"{self.name_en} ({self.country})"


class Bookmark(models.Model):
    """User bookmarks for Quran verses"""
    surah_number = models.IntegerField()
    ayah_number = models.IntegerField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('surah_number', 'ayah_number')
        ordering = ['-created_at']
        verbose_name_plural = "Bookmarks"

    def __str__(self):
        return f"Surah {self.surah_number}:{self.ayah_number}"


class PrayerNotification(models.Model):
    """Prayer notification settings"""
    PRAYER_CHOICES = [
        ('fajr', 'Fajr'),
        ('sunrise', 'Sunrise'),
        ('dhuhr', 'Dhuhr'),
        ('asr', 'Asr'),
        ('maghrib', 'Maghrib'),
        ('isha', 'Isha'),
    ]
    prayer_name = models.CharField(max_length=20, choices=PRAYER_CHOICES)
    adhan_reciter = models.CharField(max_length=50, default='mishary')
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['prayer_name']
        verbose_name_plural = "Prayer Notifications"

    def __str__(self):
        return f"{self.prayer_name} — {self.adhan_reciter}"
