from django.contrib.auth.models import User
from django.db import models


class Bookmark(models.Model):
    """User bookmarks for Quran verses"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookmarks")
    surah_number = models.IntegerField()
    ayah_number = models.IntegerField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "surah_number", "ayah_number")
        indexes = [
            models.Index(fields=["user", "-created_at"], name="bm_user_created_idx"),
        ]
        ordering = ["-created_at"]
        verbose_name_plural = "Bookmarks"

    def __str__(self):
        return f"Surah {self.surah_number}:{self.ayah_number}"


class PrayerNotification(models.Model):
    """Prayer notification settings"""

    PRAYER_CHOICES = [
        ("fajr", "Fajr"),
        ("sunrise", "Sunrise"),
        ("dhuhr", "Dhuhr"),
        ("asr", "Asr"),
        ("maghrib", "Maghrib"),
        ("isha", "Isha"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    prayer_name = models.CharField(max_length=20, choices=PRAYER_CHOICES)
    adhan_reciter = models.CharField(max_length=50, default="mishary_alafasy")
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "prayer_name")
        ordering = ["prayer_name"]
        verbose_name_plural = "Prayer Notifications"

    def __str__(self):
        return f"{self.prayer_name} — {self.adhan_reciter}"
