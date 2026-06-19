"""
Management command to populate Quran reciters in the database.
Run with: python manage.py load_reciters
"""
from django.core.management.base import BaseCommand
from api.models import Reciter


class Command(BaseCommand):
    help = 'Populate or update the 6 Quran reciters in the database'

    RECITERS_DATA = [
        {
            'reciter_id': 'alafasy',
            'name_ar': 'مشاري راشد العفاسي',
            'name_en': 'Mishary Rashid Alafasy',
            'transliteration': 'Mishary Rashid Al-Afasy',
            'style': 'murattal',
            'country': 'Kuwait',
            'bio_en': (
                'Sheikh Mishary Rashid Alafasy is one of the most popular Quran reciters '
                'worldwide, celebrated for his beautiful, melodious voice. Born in Kuwait in 1976, '
                'he has memorized the entire Quran and contributed enormously to Islamic recitation globally.'
            ),
            'bio_ru': (
                'Шейх Мишари Рашид Алафаси — один из самых популярных чтецов Корана в мире, '
                'известный своим красивым мелодичным голосом. Родился в Кувейте в 1976 году.'
            ),
            'bio_uz': (
                "Shayx Mishori Rashid Alafasiy dunyoning eng mashhur Qur'on qorilaridan biri bo'lib, "
                "chiroyli va ohangdor ovozi bilan mashhur. U 1976 yilda Quvaytda tug'ilgan."
            ),
            'server_url': 'https://server8.mp3quran.net/afs/',
            'edition': 'ar.alafasy',
            'photo_url': 'https://tvquran.com/uploads/photo/29.jpg',
            'initial_letter': 'م',
        },
        {
            'reciter_id': 'abdulbasit',
            'name_ar': 'عبد الباسط عبد الصمد',
            'name_en': 'Abdul Basit Abd us-Samad',
            'transliteration': 'Abd al-Basit Abd as-Samad',
            'style': 'mujawwad',
            'country': 'Egypt',
            'bio_en': (
                'Sheikh Abdul Basit Abd us-Samad was an Egyptian Quran reciter widely regarded '
                'as one of the greatest of all time. Born in 1927, his recitations remain iconic '
                'and are broadcast worldwide.'
            ),
            'bio_ru': (
                'Шейх Абдул Басит — египетский чтец Корана, широко считающийся одним из '
                'величайших всех времён. Родился в 1927 году, его чтения транслируются по всему миру.'
            ),
            'bio_uz': (
                "Shayx Abdul Basit Abd us-Samad barcha zamonlarning eng buyuk Qur'on qorilaridan biri "
                "deb e'tirof etilgan misrlik qori. 1927 yilda tug'ilgan."
            ),
            'server_url': 'https://server7.mp3quran.net/basit/',
            'edition': 'ar.abdulbasitmurattal',
            'photo_url': 'https://tvquran.com/uploads/photo/15.jpg',
            'initial_letter': 'ع',
        },
        {
            'reciter_id': 'ghamdi',
            'name_ar': 'سعد الغامدي',
            'name_en': 'Saad Al-Ghamdi',
            'transliteration': "Sa'd al-Ghamdi",
            'style': 'murattal',
            'country': 'Saudi Arabia',
            'bio_en': (
                'Sheikh Saad Al-Ghamdi is a Saudi Quran reciter beloved for his clear, calm, '
                'and melodious recitation style. He is widely listened to for daily Quran reading.'
            ),
            'bio_ru': (
                'Шейх Саад аль-Гамди — саудовский чтец Корана, известный своим ясным, спокойным '
                'и мелодичным стилем чтения.'
            ),
            'bio_uz': (
                "Shayx Sa'd al-G'amdiy ​​aniq, tinch va ohangdor qiroat uslubi bilan sevimli "
                "Saudiyalik Qur'on qoridir."
            ),
            'server_url': 'https://server7.mp3quran.net/s_gmd/',
            'edition': 'ar.saoodshuraym',
            'photo_url': 'https://tvquran.com/uploads/photo/45.jpg',
            'initial_letter': 'س',
        },
        {
            'reciter_id': 'minshawi',
            'name_ar': 'محمد صديق المنشاوي',
            'name_en': 'Mohamed Siddiq El-Minshawi',
            'transliteration': 'Muhammad Siddiq al-Minshawi',
            'style': 'mujawwad',
            'country': 'Egypt',
            'bio_en': (
                'Sheikh Mohamed Siddiq El-Minshawi was an Egyptian Quran reciter known for his '
                'deep emotional connection to the Quran. His recitations carry a profound spiritual depth.'
            ),
            'bio_ru': (
                'Шейх Мухаммад Сиддик аль-Миншауи — египетский чтец, известный своей глубокой '
                'эмоциональной связью с Кораном.'
            ),
            'bio_uz': (
                "Shayx Muhammad Siddiq al-Minshaviy Qur'on bilan chuqur hissiy aloqasi bilan mashhur "
                "misrlik Qur'on qoridir."
            ),
            'server_url': 'https://server10.mp3quran.net/minsh/',
            'edition': 'ar.minshawimujawwad',
            'photo_url': 'https://tvquran.com/uploads/photo/68.jpg',
            'initial_letter': 'م',
        },
        {
            'reciter_id': 'maher',
            'name_ar': 'ماهر المعيقلي',
            'name_en': 'Maher Al Muaiqly',
            'transliteration': 'Maher al-Mu\'ayqali',
            'style': 'murattal',
            'country': 'Saudi Arabia',
            'bio_en': (
                'Sheikh Maher Al Muaiqly is the Imam of the Grand Mosque in Makkah, celebrated '
                'for his resonant and moving recitation. He leads Taraweeh prayers during Ramadan.'
            ),
            'bio_ru': (
                'Шейх Махир аль-Муайкали — имам Заповедной мечети в Мекке, известный своим '
                'выразительным и трогательным чтением.'
            ),
            'bio_uz': (
                "Shayx Mohir al-Mu'ayqaliy Makkadagi Masjid al-Haraomning imomi bo'lib, "
                "ta'sirchan qiroati bilan mashhur."
            ),
            'server_url': 'https://server12.mp3quran.net/maher/',
            'edition': 'ar.maheralmuaiqly',
            'photo_url': 'https://tvquran.com/uploads/photo/76.jpg',
            'initial_letter': 'م',
        },
        {
            'reciter_id': 'saud_juma',
            'name_ar': 'عبد الرزاق العرفج',
            'name_en': 'Abd Ar-Razzaq Al-Arfaj',
            'transliteration': "Abd ar-Razzaq al-Arfaj",
            'style': 'murattal',
            'country': 'Saudi Arabia',
            'bio_en': (
                "Abd Ar-Razzaq Al-Arfaj is a distinguished Saudi Quran reciter known for his "
                "clear and melodious recitation style."
            ),
            'bio_ru': (
                "Абд Ар-Раззак аль-Арфадж — выдающийся саудовский чтец Корана, известный своим "
                "ясным и мелодичным стилем чтения."
            ),
            'bio_uz': (
                "Abd Ar-Razzaq Al-Arfaj aniq va ohangdor qiroati bilan mashhur "
                "taniqli Saudiyalik Qur'on qoridir."
            ),
            'server_url': 'https://server6.mp3quran.net/arfaj/',
            'edition': 'ar.arfaj',
            'photo_url': 'https://tvquran.com/uploads/photo/87.jpg',
            'initial_letter': 'ع',
        },
    ]

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for data in self.RECITERS_DATA:
            reciter, created = Reciter.objects.update_or_create(
                reciter_id=data['reciter_id'],
                defaults=data,
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created:  {reciter.name_en}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'  ↺ Updated:  {reciter.name_en}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! {created_count} created, {updated_count} updated. '
            f'Total: {Reciter.objects.filter(is_active=True).count()} active reciters.'
        ))
