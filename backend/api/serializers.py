"""
Noor Al-Quran — DRF Serializers
Proper data serialization for all API responses
"""
from rest_framework import serializers
from .models import Bookmark, PrayerNotification, Reciter


class BookmarkSerializer(serializers.ModelSerializer):
    """Serialize Bookmark model for API responses"""

    class Meta:
        model = Bookmark
        fields = ('id', 'surah_number', 'ayah_number', 'note', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_surah_number(self, value):
        if not 1 <= value <= 114:
            raise serializers.ValidationError("Surah number must be between 1 and 114.")
        return value

    def validate_ayah_number(self, value):
        if not 1 <= value <= 286:
            raise serializers.ValidationError("Ayah number must be between 1 and 286.")
        return value


class PrayerNotificationSerializer(serializers.ModelSerializer):
    """Serialize PrayerNotification model"""

    class Meta:
        model = PrayerNotification
        fields = ('id', 'prayer_name', 'adhan_reciter', 'is_enabled', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ReciterSerializer(serializers.ModelSerializer):
    """Serialize Reciter model with all recitation details"""

    class Meta:
        model = Reciter
        fields = (
            'id',
            'reciter_id',
            'name_ar',
            'name_en',
            'transliteration',
            'style',
            'country',
            'bio_en',
            'bio_ru',
            'bio_uz',
            'server_url',
            'edition',
            'photo_url',
            'initial_letter',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class NameOfAllahSerializer(serializers.Serializer):
    """Serialize a single Name of Allah"""
    num = serializers.IntegerField()
    arabic = serializers.CharField()
    transliteration = serializers.CharField()
    meaning_en = serializers.CharField()
    meaning_ru = serializers.CharField()
