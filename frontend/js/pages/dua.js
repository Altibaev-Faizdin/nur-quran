'use strict';

// Sacred duas preserved verbatim
const DAILY_DUAS = [
  {
    cat: 'morning',
    ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
    en: 'O Allah, by You we enter the morning and by You we enter the evening.',
    ru: 'О Аллах, с Тобой мы вошли в утро и с Тобой мы вошли в вечер.',
  },
  {
    cat: 'morning',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ',
    en: 'O Allah, I ask You for the good of this day.',
    ru: 'О Аллах, я прошу Тебя о благе этого дня.',
  },
  {
    cat: 'evening',
    ar: 'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَة',
    en: 'O Allah, Knower of the unseen and the seen.',
    ru: 'О Аллах, Знающий скрытое и явное.',
  },
  {
    cat: 'protection',
    ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    en: 'In the name of Allah, with His name nothing in the earth or sky can cause harm, and He is the Hearing and the Knowing.',
    ru: 'Во имя Аллаха, Его именем ничто не может причинить вред ни на земле, ни на небе, и Он - Слышащий, Знающий.',
  },
  {
    cat: 'protection',
    ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ شَرِّ مَا خَلَقَ',
    en: 'I seek refuge in the Complete Words of Allah from the evil of that which He has created.',
    ru: 'Я прибегаю к защите совершенными словами Аллаха от зла того, что Он создал.',
  },
  {
    cat: 'forgiveness',
    ar: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا',
    en: 'Our Lord, forgive us our sins and the waste in our affairs.',
    ru: 'Господь наш, прости нам наши грехи и неразумные действия в наших делах.',
  },
  {
    cat: 'forgiveness',
    ar: 'اللَّهُمَّ اغْفِرْ لِي جَمِيعَ ذُنُوبِي',
    en: 'O Allah, forgive me all my sins.',
    ru: 'О Аллах, прости мне все мои грехи.',
  },
  {
    cat: 'blessing',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    en: 'Our Lord, give us good in this life and good in the afterlife.',
    ru: 'Господь наш, даруй нам благо в этой жизни и благо в загробной жизни.',
  },
  {
    cat: 'blessing',
    ar: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا',
    en: 'O Allah, bless for us what You have provided us.',
    ru: 'О Аллах, благослови нас в том, что Ты нам даровал.',
  },
  {
    cat: 'morning',
    ar: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    en: 'O Living, O Eternal, by Your mercy I seek assistance.',
    ru: 'О Живой, О Самодостаточный, Твоей милостью я прошу помощи.',
  },
  {
    cat: 'evening',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ العَفْوَ وَالعَافِيَة',
    en: 'O Allah, I ask You for pardon and well-being.',
    ru: 'О Аллах, я прошу Тебя о прощении и благополучии.',
  },
  {
    cat: 'protection',
    ar: 'اللَّهُمَّ احْفَظْنِي بِإِسْلَامِي وَحِفْظ دِينِي',
    en: 'O Allah, protect me with my Islam and the preservation of my religion.',
    ru: 'О Аллах, защити меня моим исламом и сохрани мою веру.',
  },
  {
    cat: 'forgiveness',
    ar: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
    en: 'My Lord, forgive and have mercy, and You are the Most Merciful.',
    ru: 'Господь мой, прости и помилуй, Ты - Милосерднейший из милосердых.',
  },
  {
    cat: 'blessing',
    ar: 'اللَّهُمَّ اجْعَلْ لَنَا نُورًا فِي قُلُوبِنَا',
    en: 'O Allah, make for us light in our hearts.',
    ru: 'О Аллах, создай для нас свет в наших сердцах.',
  },
  {
    cat: 'morning',
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ',
    en: 'Glory be to Allah and His praise, equal to the number of His creations.',
    ru: 'Хвала Аллаху и благодарность Ему за число Его творений.',
  },
  {
    cat: 'evening',
    ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ',
    en: 'O Allah, You are my Lord, there is no deity except You.',
    ru: 'О Аллах, Ты - мой Господь, нет бога кроме Тебя.',
  },
  {
    cat: 'protection',
    ar: 'بِسْمِ اللَّهِ أَتَوَسَّدُكُنَّ أَسْتَوْدِعُكُنَّ اللَّهَ',
    en: 'In the name of Allah, I lie down with you, I entrust you to Allah.',
    ru: 'Во имя Аллаха, я ложусь с вами, я вверяю вас Аллаху.',
  },
  {
    cat: 'forgiveness',
    ar: 'اللَّهُمَّ إِنك عَفُوٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    en: 'O Allah, You are pardoning and love pardon, so pardon me.',
    ru: 'О Аллах, Ты прощение и любишь прощение, потому прости мне.',
  },
  {
    cat: 'blessing',
    ar: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ',
    en: 'My Lord, make me of those who establish prayer.',
    ru: 'Господь мой, сделай меня из тех, кто совершает намаз.',
  },
  {
    cat: 'morning',
    ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا',
    en: 'Praise be to Allah who gave us life after death.',
    ru: 'Хвала Аллаху, Который вернул нас к жизни после смерти.',
  },
  {
    cat: 'evening',
    ar: 'اللَّهُمَّ غَفّار اغْفِرْ لِي',
    en: 'O Allah, forgiver, forgive me.',
    ru: 'О Аллах, Прощающий, прости мне.',
  },
  {
    cat: 'protection',
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    en: 'There is no might and no power except by Allah.',
    ru: 'Нет мощи и силы кроме как в Аллахе.',
  },
  {
    cat: 'forgiveness',
    ar: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ',
    en: 'My Lord, forgive me and my parents.',
    ru: 'Господь мой, прости мне и моим родителям.',
  },
  {
    cat: 'blessing',
    ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَة',
    en: 'O Allah, I ask You for well-being.',
    ru: 'О Аллах, я прошу Тебя о благополучии.',
  },
];

let currentFilter = 'all';

function displayDuas(filter = 'all', search = '') {
  const grid = document.getElementById('duasGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;
  grid.innerHTML = '';

  const q = search.toLowerCase();
  const filtered = DAILY_DUAS.filter((d) => {
    const matchFilter = filter === 'all' || d.cat === filter;
    const matchSearch =
      d.ar.includes(search) || d.en.toLowerCase().includes(q) || d.ru.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  if (noResults) noResults.classList.toggle('hidden', filtered.length > 0);
  if (filtered.length === 0) return;

  const catLabels = {
    morning: '🌅 Morning',
    evening: '🌙 Evening',
    protection: '🛡️ Protection',
    forgiveness: '🤲 Forgiveness',
    blessing: '✨ Blessing',
  };

  filtered.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'dua-card';

    const catEl = document.createElement('div');
    catEl.className = 'dua-category';
    catEl.textContent = catLabels[d.cat] || d.cat;

    const arEl = document.createElement('div');
    arEl.className = 'dua-ar';
    arEl.textContent = d.ar;

    const enEl = document.createElement('div');
    enEl.className = 'dua-en';
    enEl.textContent = d.en;

    const ruEl = document.createElement('div');
    ruEl.className = 'dua-ru';
    ruEl.textContent = d.ru;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copy dua');
    btn.textContent = '📋 Copy Dua';

    card.append(catEl, arEl, enEl, ruEl, btn);
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  displayDuas();

  document.querySelectorAll('.tab-btn[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-cat') || 'all';
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const search = document.getElementById('searchInput');
      displayDuas(currentFilter, search ? search.value : '');
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      displayDuas(currentFilter, e.target.value);
    });
  }

  document.getElementById('duasGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const card = btn.closest('.dua-card');
    const text = card?.querySelector('.dua-ar')?.textContent || '';
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});
