"""
Noor Al-Quran — DRF Serializers
Proper data serialization for all API responses
"""

from rest_framework import serializers

from .models import Bookmark, PrayerNotification

SURAH_AYAH_COUNTS = (
    7,
    286,
    200,
    176,
    120,
    165,
    206,
    75,
    129,
    109,
    123,
    111,
    43,
    52,
    99,
    128,
    111,
    110,
    98,
    135,
    112,
    78,
    118,
    64,
    77,
    227,
    93,
    88,
    69,
    60,
    34,
    30,
    73,
    54,
    45,
    83,
    182,
    88,
    75,
    85,
    54,
    53,
    89,
    59,
    37,
    35,
    38,
    29,
    18,
    45,
    60,
    49,
    62,
    55,
    78,
    96,
    29,
    22,
    24,
    13,
    14,
    11,
    11,
    18,
    12,
    12,
    30,
    52,
    52,
    44,
    28,
    28,
    20,
    56,
    40,
    31,
    50,
    40,
    46,
    42,
    29,
    19,
    36,
    25,
    22,
    17,
    19,
    26,
    30,
    20,
    15,
    21,
    11,
    8,
    8,
    19,
    5,
    8,
    8,
    11,
    11,
    8,
    3,
    9,
    5,
    4,
    7,
    3,
    6,
    3,
    5,
    4,
    5,
    6,
)


class BookmarkSerializer(serializers.ModelSerializer):
    """Serialize Bookmark model for API responses"""

    class Meta:
        model = Bookmark
        fields = ("id", "surah_number", "ayah_number", "note", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_surah_number(self, value):
        if not 1 <= value <= 114:
            raise serializers.ValidationError("Surah number must be between 1 and 114.")
        return value

    def validate(self, attrs):
        surah_number = attrs.get("surah_number") or (
            self.instance.surah_number if self.instance else None
        )
        ayah_number = attrs.get("ayah_number") or (
            self.instance.ayah_number if self.instance else None
        )

        if surah_number is not None:
            if not 1 <= surah_number <= 114:
                raise serializers.ValidationError(
                    {"surah_number": "Surah number must be between 1 and 114."}
                )
            max_ayahs = SURAH_AYAH_COUNTS[surah_number - 1]
            if ayah_number is not None:
                if not 1 <= ayah_number <= max_ayahs:
                    raise serializers.ValidationError(
                        {
                            "ayah_number": f"Surah {surah_number} only has {max_ayahs} ayahs. Received {ayah_number}."
                        }
                    )
        return attrs


class PrayerNotificationSerializer(serializers.ModelSerializer):
    """Serialize PrayerNotification model"""

    VALID_RECITERS = [
        "mishary",
        "abdulbasit",
        "ghamdi",
        "minshawi",
        "maher",
        "islam_sobhi",
        "yasser_dosari",
        "sherif_mostafa",
        "abdurrahman_mossad",
        "raad_kurdi",
    ]

    class Meta:
        model = PrayerNotification
        fields = ("id", "prayer_name", "adhan_reciter", "is_enabled", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_adhan_reciter(self, value):
        if value not in self.VALID_RECITERS:
            raise serializers.ValidationError(
                f"Invalid reciter. Valid choices: {', '.join(self.VALID_RECITERS)}"
            )
        return value


class NameOfAllahSerializer(serializers.Serializer):
    """Serialize a single Name of Allah"""

    num = serializers.IntegerField()
    arabic = serializers.CharField()
    transliteration = serializers.CharField()
    meaning_en = serializers.CharField()
    meaning_ru = serializers.CharField()
