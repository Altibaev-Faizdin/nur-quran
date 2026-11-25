// Sacred reference data — preserved verbatim from original shared.js
const NAMES_OF_ALLAH_DATA = [
  {
    "num": 1,
    "arabic": "الرَّحْمَن",
    "transliteration": "Ar-Rahman",
    "meaning_en": "The Most Gracious",
    "meaning_ru": "Милостивый"
  },
  {
    "num": 2,
    "arabic": "الرَّحِيم",
    "transliteration": "Ar-Rahim",
    "meaning_en": "The Most Merciful",
    "meaning_ru": "Милосердный"
  },
  {
    "num": 3,
    "arabic": "الْمَلِك",
    "transliteration": "Al-Malik",
    "meaning_en": "The King",
    "meaning_ru": "Царь"
  },
  {
    "num": 4,
    "arabic": "الْقُدُّوس",
    "transliteration": "Al-Quddus",
    "meaning_en": "The Most Holy",
    "meaning_ru": "Пресвятой"
  },
  {
    "num": 5,
    "arabic": "السَّلَام",
    "transliteration": "As-Salam",
    "meaning_en": "The Source of Peace",
    "meaning_ru": "Мир"
  },
  {
    "num": 6,
    "arabic": "الْمُؤْمِن",
    "transliteration": "Al-Mu'min",
    "meaning_en": "The Guardian of Faith",
    "meaning_ru": "Дарующий безопасность"
  },
  {
    "num": 7,
    "arabic": "الْمُهَيْمِن",
    "transliteration": "Al-Muhaymin",
    "meaning_en": "The Protector",
    "meaning_ru": "Хранитель"
  },
  {
    "num": 8,
    "arabic": "الْعَزِيز",
    "transliteration": "Al-Aziz",
    "meaning_en": "The Mighty",
    "meaning_ru": "Могущественный"
  },
  {
    "num": 9,
    "arabic": "الْجَبَّار",
    "transliteration": "Al-Jabbar",
    "meaning_en": "The Compeller",
    "meaning_ru": "Принуждающий"
  },
  {
    "num": 10,
    "arabic": "الْمُتَكَبِّر",
    "transliteration": "Al-Mutakabbir",
    "meaning_en": "The Majestic",
    "meaning_ru": "Величественный"
  },
  {
    "num": 11,
    "arabic": "الْخَالِق",
    "transliteration": "Al-Khaliq",
    "meaning_en": "The Creator",
    "meaning_ru": "Творец"
  },
  {
    "num": 12,
    "arabic": "الْبَارِئ",
    "transliteration": "Al-Bari'",
    "meaning_en": "The Evolver",
    "meaning_ru": "Создатель"
  },
  {
    "num": 13,
    "arabic": "الْمُصَوِّر",
    "transliteration": "Al-Musawwir",
    "meaning_en": "The Fashioner",
    "meaning_ru": "Придающий форму"
  },
  {
    "num": 14,
    "arabic": "الْغَفَّار",
    "transliteration": "Al-Ghaffar",
    "meaning_en": "The Forgiver",
    "meaning_ru": "Всепрощающий"
  },
  {
    "num": 15,
    "arabic": "الْقَهَّار",
    "transliteration": "Al-Qahhar",
    "meaning_en": "The Subduer",
    "meaning_ru": "Всепобеждающий"
  },
  {
    "num": 16,
    "arabic": "الْوَهَّاب",
    "transliteration": "Al-Wahhab",
    "meaning_en": "The Bestower",
    "meaning_ru": "Дарующий"
  },
  {
    "num": 17,
    "arabic": "الرَّزَّاق",
    "transliteration": "Ar-Razzaq",
    "meaning_en": "The Provider",
    "meaning_ru": "Кормилец"
  },
  {
    "num": 18,
    "arabic": "الْفَتَّاح",
    "transliteration": "Al-Fattah",
    "meaning_en": "The Opener",
    "meaning_ru": "Открывающий"
  },
  {
    "num": 19,
    "arabic": "الْعَلِيم",
    "transliteration": "Al-Alim",
    "meaning_en": "The All-Knowing",
    "meaning_ru": "Всезнающий"
  },
  {
    "num": 20,
    "arabic": "الْقَابِض",
    "transliteration": "Al-Qabid",
    "meaning_en": "The Constrictor",
    "meaning_ru": "Сжимающий"
  },
  {
    "num": 21,
    "arabic": "الْبَاسِط",
    "transliteration": "Al-Basit",
    "meaning_en": "The Expander",
    "meaning_ru": "Расширяющий"
  },
  {
    "num": 22,
    "arabic": "الْخَافِض",
    "transliteration": "Al-Khafid",
    "meaning_en": "The Abaser",
    "meaning_ru": "Унижающий"
  },
  {
    "num": 23,
    "arabic": "الرَّافِع",
    "transliteration": "Ar-Rafi'",
    "meaning_en": "The Exalter",
    "meaning_ru": "Возвышающий"
  },
  {
    "num": 24,
    "arabic": "الْمُعِز",
    "transliteration": "Al-Mu'izz",
    "meaning_en": "The Bestower of Honor",
    "meaning_ru": "Чествующий"
  },
  {
    "num": 25,
    "arabic": "الْمُذِل",
    "transliteration": "Al-Mudhill",
    "meaning_en": "The Humiliator",
    "meaning_ru": "Унижающий"
  },
  {
    "num": 26,
    "arabic": "السَّمِيع",
    "transliteration": "As-Sami'",
    "meaning_en": "The All-Hearing",
    "meaning_ru": "Всеслышащий"
  },
  {
    "num": 27,
    "arabic": "الْبَصِير",
    "transliteration": "Al-Basir",
    "meaning_en": "The All-Seeing",
    "meaning_ru": "Всевидящий"
  },
  {
    "num": 28,
    "arabic": "الْحَكَم",
    "transliteration": "Al-Hakam",
    "meaning_en": "The Judge",
    "meaning_ru": "Судья"
  },
  {
    "num": 29,
    "arabic": "الْعَدْل",
    "transliteration": "Al-Adl",
    "meaning_en": "The Just",
    "meaning_ru": "Справедливый"
  },
  {
    "num": 30,
    "arabic": "اللَّطِيف",
    "transliteration": "Al-Latif",
    "meaning_en": "The Subtle One",
    "meaning_ru": "Тонкий"
  },
  {
    "num": 31,
    "arabic": "الْخَبِير",
    "transliteration": "Al-Khabir",
    "meaning_en": "The All-Aware",
    "meaning_ru": "Осведомлённый"
  },
  {
    "num": 32,
    "arabic": "الْحَلِيم",
    "transliteration": "Al-Halim",
    "meaning_en": "The Forbearing",
    "meaning_ru": "Терпеливый"
  },
  {
    "num": 33,
    "arabic": "الْعَظِيم",
    "transliteration": "Al-Azim",
    "meaning_en": "The Magnificent",
    "meaning_ru": "Величайший"
  },
  {
    "num": 34,
    "arabic": "الْغَفُور",
    "transliteration": "Al-Ghafur",
    "meaning_en": "The Forgiving",
    "meaning_ru": "Прощающий"
  },
  {
    "num": 35,
    "arabic": "الشَّكُور",
    "transliteration": "Ash-Shakur",
    "meaning_en": "The Appreciative",
    "meaning_ru": "Благодарный"
  },
  {
    "num": 36,
    "arabic": "الْعَلِيّ",
    "transliteration": "Al-Ali'",
    "meaning_en": "The Most High",
    "meaning_ru": "Высочайший"
  },
  {
    "num": 37,
    "arabic": "الْكَبِير",
    "transliteration": "Al-Kabir",
    "meaning_en": "The Most Great",
    "meaning_ru": "Великий"
  },
  {
    "num": 38,
    "arabic": "الْحَفِيظ",
    "transliteration": "Al-Hafiz",
    "meaning_en": "The Preserver",
    "meaning_ru": "Хранящий"
  },
  {
    "num": 39,
    "arabic": "الْمُقِيت",
    "transliteration": "Al-Muqit",
    "meaning_en": "The Nourisher",
    "meaning_ru": "Питающий"
  },
  {
    "num": 40,
    "arabic": "الْحَسِيب",
    "transliteration": "Al-Hasib",
    "meaning_en": "The Reckoner",
    "meaning_ru": "Считающий"
  },
  {
    "num": 41,
    "arabic": "الْجَلِيل",
    "transliteration": "Al-Jalil",
    "meaning_en": "The Majestic",
    "meaning_ru": "Величественный"
  },
  {
    "num": 42,
    "arabic": "الْكَرِيم",
    "transliteration": "Al-Karim",
    "meaning_en": "The Generous",
    "meaning_ru": "Щедрый"
  },
  {
    "num": 43,
    "arabic": "الرَّقِيب",
    "transliteration": "Ar-Raqib",
    "meaning_en": "The Watchful",
    "meaning_ru": "Наблюдающий"
  },
  {
    "num": 44,
    "arabic": "الْمُجِيب",
    "transliteration": "Al-Mujib",
    "meaning_en": "The Responsive",
    "meaning_ru": "Отвечающий"
  },
  {
    "num": 45,
    "arabic": "الْوَاسِع",
    "transliteration": "Al-Wasi'",
    "meaning_en": "The All-Encompassing",
    "meaning_ru": "Необъятный"
  },
  {
    "num": 46,
    "arabic": "الْحَكِيم",
    "transliteration": "Al-Hakim",
    "meaning_en": "The Wise",
    "meaning_ru": "Мудрый"
  },
  {
    "num": 47,
    "arabic": "الْوَدُود",
    "transliteration": "Al-Wadud",
    "meaning_en": "The Loving",
    "meaning_ru": "Любящий"
  },
  {
    "num": 48,
    "arabic": "الْمَجِيد",
    "transliteration": "Al-Majid",
    "meaning_en": "The Most Glorious",
    "meaning_ru": "Славный"
  },
  {
    "num": 49,
    "arabic": "الْبَاعِث",
    "transliteration": "Al-Ba'ith",
    "meaning_en": "The Resurrector",
    "meaning_ru": "Воскрешающий"
  },
  {
    "num": 50,
    "arabic": "الشَّهِيد",
    "transliteration": "Ash-Shahid",
    "meaning_en": "The Witness",
    "meaning_ru": "Свидетель"
  },
  {
    "num": 51,
    "arabic": "الْحَقّ",
    "transliteration": "Al-Haqq",
    "meaning_en": "The Truth",
    "meaning_ru": "Истина"
  },
  {
    "num": 52,
    "arabic": "الْوَكِيل",
    "transliteration": "Al-Wakil",
    "meaning_en": "The Trustee",
    "meaning_ru": "Попечитель"
  },
  {
    "num": 53,
    "arabic": "الْقَوِيّ",
    "transliteration": "Al-Qawi",
    "meaning_en": "The Most Strong",
    "meaning_ru": "Сильный"
  },
  {
    "num": 54,
    "arabic": "الْمَتِين",
    "transliteration": "Al-Matin",
    "meaning_en": "The Firm",
    "meaning_ru": "Твёрдый"
  },
  {
    "num": 55,
    "arabic": "الْوَلِيّ",
    "transliteration": "Al-Wali",
    "meaning_en": "The Protecting Friend",
    "meaning_ru": "Покровитель"
  },
  {
    "num": 56,
    "arabic": "الْحَمِيد",
    "transliteration": "Al-Hamid",
    "meaning_en": "The Praiseworthy",
    "meaning_ru": "Достохвальный"
  },
  {
    "num": 57,
    "arabic": "الْمُحْصِي",
    "transliteration": "Al-Muhsi",
    "meaning_en": "The Counter",
    "meaning_ru": "Исчисляющий"
  },
  {
    "num": 58,
    "arabic": "الْمُبْدِئ",
    "transliteration": "Al-Mubdi'",
    "meaning_en": "The Originator",
    "meaning_ru": "Начинающий"
  },
  {
    "num": 59,
    "arabic": "الْمُعِيد",
    "transliteration": "Al-Mu'id",
    "meaning_en": "The Restorer",
    "meaning_ru": "Возобновляющий"
  },
  {
    "num": 60,
    "arabic": "الْمُحْيِي",
    "transliteration": "Al-Muhyi",
    "meaning_en": "The Giver of Life",
    "meaning_ru": "Дающий жизнь"
  },
  {
    "num": 61,
    "arabic": "الْمُمِيت",
    "transliteration": "Al-Mumit",
    "meaning_en": "The Taker of Life",
    "meaning_ru": "Умерщвляющий"
  },
  {
    "num": 62,
    "arabic": "الْحَيّ",
    "transliteration": "Al-Hayy",
    "meaning_en": "The Ever-Living",
    "meaning_ru": "Вечно живой"
  },
  {
    "num": 63,
    "arabic": "الْقَيُّوم",
    "transliteration": "Al-Qayyum",
    "meaning_en": "The Self-Subsisting",
    "meaning_ru": "Самодостаточный"
  },
  {
    "num": 64,
    "arabic": "الْوَاجِد",
    "transliteration": "Al-Wajid",
    "meaning_en": "The Finder",
    "meaning_ru": "Находящий"
  },
  {
    "num": 65,
    "arabic": "الْمَاجِد",
    "transliteration": "Al-Majid",
    "meaning_en": "The Noble",
    "meaning_ru": "Благородный"
  },
  {
    "num": 66,
    "arabic": "الْوَاحِد",
    "transliteration": "Al-Wahid",
    "meaning_en": "The One",
    "meaning_ru": "Единый"
  },
  {
    "num": 67,
    "arabic": "الأَحَد",
    "transliteration": "Al-Ahad",
    "meaning_en": "The Unique",
    "meaning_ru": "Единственный"
  },
  {
    "num": 68,
    "arabic": "الصَّمَد",
    "transliteration": "As-Samad",
    "meaning_en": "The Eternal",
    "meaning_ru": "Вечный"
  },
  {
    "num": 69,
    "arabic": "الْقَادِر",
    "transliteration": "Al-Qadir",
    "meaning_en": "The Capable",
    "meaning_ru": "Могущий"
  },
  {
    "num": 70,
    "arabic": "الْمُقْتَدِر",
    "transliteration": "Al-Muqtadir",
    "meaning_en": "The Powerful",
    "meaning_ru": "Всесильный"
  },
  {
    "num": 71,
    "arabic": "الْمُقَدِّم",
    "transliteration": "Al-Muqaddim",
    "meaning_en": "The Expediter",
    "meaning_ru": "Выдвигающий вперёд"
  },
  {
    "num": 72,
    "arabic": "الْمُؤَخِّر",
    "transliteration": "Al-Mu'akhkhir",
    "meaning_en": "The Delayer",
    "meaning_ru": "Откладывающий"
  },
  {
    "num": 73,
    "arabic": "الأَوَّل",
    "transliteration": "Al-Awwal",
    "meaning_en": "The First",
    "meaning_ru": "Первый"
  },
  {
    "num": 74,
    "arabic": "الآخِر",
    "transliteration": "Al-Akhir",
    "meaning_en": "The Last",
    "meaning_ru": "Последний"
  },
  {
    "num": 75,
    "arabic": "الظَّاهِر",
    "transliteration": "Az-Zahir",
    "meaning_en": "The Manifest",
    "meaning_ru": "Явный"
  },
  {
    "num": 76,
    "arabic": "الْبَاطِن",
    "transliteration": "Al-Batin",
    "meaning_en": "The Hidden",
    "meaning_ru": "Скрытый"
  },
  {
    "num": 77,
    "arabic": "الْوَالِي",
    "transliteration": "Al-Wali",
    "meaning_en": "The Governor",
    "meaning_ru": "Правитель"
  },
  {
    "num": 78,
    "arabic": "الْمُتَعَالِي",
    "transliteration": "Al-Muta'ali",
    "meaning_en": "The Most Exalted",
    "meaning_ru": "Превознесённый"
  },
  {
    "num": 79,
    "arabic": "الْبَرّ",
    "transliteration": "Al-Barr",
    "meaning_en": "The Source of Goodness",
    "meaning_ru": "Благой"
  },
  {
    "num": 80,
    "arabic": "التَّوَّاب",
    "transliteration": "At-Tawwab",
    "meaning_en": "The Ever-Returning",
    "meaning_ru": "Принимающий покаяние"
  },
  {
    "num": 81,
    "arabic": "الْمُنْتَقِم",
    "transliteration": "Al-Muntaqim",
    "meaning_en": "The Avenger",
    "meaning_ru": "Мститель"
  },
  {
    "num": 82,
    "arabic": "الْعَفُوّ",
    "transliteration": "Al-Afuww",
    "meaning_en": "The Pardoner",
    "meaning_ru": "Прощающий"
  },
  {
    "num": 83,
    "arabic": "الرَّؤُوف",
    "transliteration": "Ar-Ra'uf",
    "meaning_en": "The Compassionate",
    "meaning_ru": "Сострадательный"
  },
  {
    "num": 84,
    "arabic": "مَالِكُ الْمُلْك",
    "transliteration": "Malik-ul-Mulk",
    "meaning_en": "Owner of All Sovereignty",
    "meaning_ru": "Владыка царства"
  },
  {
    "num": 85,
    "arabic": "ذُو الْجَلَالِ وَالإِكْرَام",
    "transliteration": "Dhul-Jalali-wal-Ikram",
    "meaning_en": "Lord of Majesty and Generosity",
    "meaning_ru": "Обладатель величия и щедрости"
  },
  {
    "num": 86,
    "arabic": "الْمُقْسِط",
    "transliteration": "Al-Muqsit",
    "meaning_en": "The Equitable",
    "meaning_ru": "Справедливый"
  },
  {
    "num": 87,
    "arabic": "الْجَامِع",
    "transliteration": "Al-Jami'",
    "meaning_en": "The Gatherer",
    "meaning_ru": "Собирающий"
  },
  {
    "num": 88,
    "arabic": "الْغَنِيّ",
    "transliteration": "Al-Ghani",
    "meaning_en": "The Self-Sufficient",
    "meaning_ru": "Богатый"
  },
  {
    "num": 89,
    "arabic": "الْمُغْنِي",
    "transliteration": "Al-Mughni",
    "meaning_en": "The Enricher",
    "meaning_ru": "Обогащающий"
  },
  {
    "num": 90,
    "arabic": "الْمَانِع",
    "transliteration": "Al-Mani'",
    "meaning_en": "The Preventer",
    "meaning_ru": "Удерживающий"
  },
  {
    "num": 91,
    "arabic": "الضَّارّ",
    "transliteration": "Ad-Darr",
    "meaning_en": "The Distresser",
    "meaning_ru": "Причиняющий вред"
  },
  {
    "num": 92,
    "arabic": "النَّافِع",
    "transliteration": "An-Nafi'",
    "meaning_en": "The Benefiter",
    "meaning_ru": "Приносящий пользу"
  },
  {
    "num": 93,
    "arabic": "النُّور",
    "transliteration": "An-Nur",
    "meaning_en": "The Light",
    "meaning_ru": "Свет"
  },
  {
    "num": 94,
    "arabic": "الْهَادِي",
    "transliteration": "Al-Hadi",
    "meaning_en": "The Guide",
    "meaning_ru": "Ведущий правым путём"
  },
  {
    "num": 95,
    "arabic": "الْبَدِيع",
    "transliteration": "Al-Badi'",
    "meaning_en": "The Incomparable",
    "meaning_ru": "Несравненный"
  },
  {
    "num": 96,
    "arabic": "الْبَاقِي",
    "transliteration": "Al-Baqi",
    "meaning_en": "The Everlasting",
    "meaning_ru": "Вечный"
  },
  {
    "num": 97,
    "arabic": "الْوَارِث",
    "transliteration": "Al-Warith",
    "meaning_en": "The Inheritor",
    "meaning_ru": "Наследующий"
  },
  {
    "num": 98,
    "arabic": "الرَّشِيد",
    "transliteration": "Ar-Rashid",
    "meaning_en": "The Rightly Guided",
    "meaning_ru": "Ведущий истинным путём"
  },
  {
    "num": 99,
    "arabic": "الصَّبُور",
    "transliteration": "As-Sabur",
    "meaning_en": "The Patient",
    "meaning_ru": "Терпеливый"
  }
];
window.NAMES_OF_ALLAH_DATA = NAMES_OF_ALLAH_DATA;
