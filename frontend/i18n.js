const i18n = {
  ru: {
    nav_quran: 'Коран',
    nav_reciters: 'Чтецы',
    nav_prayer: 'Время намаза',
    nav_tools: 'Инструменты ▾',
    nav_dua: 'Ежедневное дуа',
    nav_tasbih: 'Тасбих',
    nav_qibla: 'Кибла',
    nav_hijri: 'Хиджри',
    nav_hadith: 'Хадисы',
    nav_names: '99 Имен',
    nav_account: 'Аккаунт ▾',
    nav_bookmarks: 'Закладки',
    mn_home: 'Главная',
    mn_quran: 'Коран',
    mn_reciters: 'Аудио',
    mn_prayer: 'Намаз',
    mn_profile: 'Профиль',
    mn_account: 'Аккаунт',
    mn_account_title: 'Мой аккаунт',
    auth_login_title: 'С возвращением',
    auth_login_sub: 'Войдите, чтобы синхронизировать закладки',
    auth_login_btn: 'Войти',
    auth_logout_btn: 'Выйти',
    auth_no_account: 'Нет аккаунта?',
    auth_register_link: 'Зарегистрироваться',
    auth_register_title: 'Присоединяйтесь к Noor Al-Quran',
    auth_register_sub: 'Создайте аккаунт для сохранения закладок',
    auth_register_btn: 'Создать аккаунт',
    auth_have_account: 'Уже есть аккаунт?',
    auth_login_link: 'Войти здесь',
    settings_title: 'Настройки',
    settings_lang: 'Язык'
  },
  en: {
    nav_quran: 'Quran',
    nav_reciters: 'Reciters',
    nav_prayer: 'Prayer Times',
    nav_tools: 'Tools ▾',
    nav_dua: 'Daily Dua',
    nav_tasbih: 'Tasbih Counter',
    nav_qibla: 'Qibla Compass',
    nav_hijri: 'Hijri Calendar',
    nav_hadith: 'Hadith',
    nav_names: '99 Names',
    nav_account: 'Account ▾',
    nav_bookmarks: 'Bookmarks',
    mn_home: 'Home',
    mn_quran: 'Quran',
    mn_reciters: 'Audio',
    mn_prayer: 'Prayer',
    mn_profile: 'Profile',
    mn_account: 'Account',
    mn_account_title: 'My Account',
    auth_login_title: 'Welcome Back',
    auth_login_sub: 'Sign in to sync your bookmarks',
    auth_login_btn: 'Log In',
    auth_logout_btn: 'Logout',
    auth_no_account: 'Don\'t have an account?',
    auth_register_link: 'Register here',
    auth_register_title: 'Join Noor Al-Quran',
    auth_register_sub: 'Create an account to save bookmarks',
    auth_register_btn: 'Create Account',
    auth_have_account: 'Already have an account?',
    auth_login_link: 'Log in here',
    settings_title: 'Settings',
    settings_lang: 'Language'
  },
  uz: {
    nav_quran: 'Qur\'on',
    nav_reciters: 'Qorilar',
    nav_prayer: 'Namoz vaqtlari',
    nav_tools: 'Asboblar ▾',
    nav_dua: 'Kundalik duo',
    nav_tasbih: 'Tasbeh',
    nav_qibla: 'Qibla',
    nav_hijri: 'Hijriy',
    nav_hadith: 'Hadislar',
    nav_names: '99 Ism',
    nav_account: 'Hisob ▾',
    nav_bookmarks: 'Xatchо\'plar',
    mn_home: 'Asosiy',
    mn_quran: 'Qur\'on',
    mn_reciters: 'Audio',
    mn_prayer: 'Namoz',
    mn_profile: 'Profil',
    mn_account: 'Hisob',
    mn_account_title: 'Mening hisobim',
    auth_login_title: 'Xush kelibsiz',
    auth_login_sub: 'Xatcho\'plarni sinxronlashtirish uchun kiring',
    auth_login_btn: 'Kirish',
    auth_logout_btn: 'Chiqish',
    auth_no_account: 'Hisobingiz yo\'qmi?',
    auth_register_link: 'Ro\'yxatdan o\'tish',
    auth_register_title: 'Noor Al-Quran-ga qo\'shiling',
    auth_register_sub: 'Xatcho\'plarni saqlash uchun hisob yarating',
    auth_register_btn: 'Hisob yaratish',
    auth_have_account: 'Hisobingiz bormi?',
    auth_login_link: 'Shu yerga kiring',
    settings_title: 'Sozlamalar',
    settings_lang: 'Til'
  }
};

window.setLanguage = function(lang) {
  localStorage.setItem('lang', lang);
  applyLanguage(lang);
};

window.applyLanguage = function(lang) {
  if (!i18n[lang]) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      if (el.tagName === 'INPUT' && el.type === 'placeholder') {
        el.placeholder = i18n[lang][key];
      } else {
        el.textContent = i18n[lang][key];
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('lang') || 'en';
  applyLanguage(lang);
});
