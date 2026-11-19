/**
 * Noor Al-Quran — Native IndexedDB Storage Engine
 * High-performance, quota-aware offline storage for Surahs, Translations, and Hadiths.
 */

(function () {
  'use strict';

  const DB_NAME = 'NoorQuranDB';
  const DB_VERSION = 1;

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this browser.'));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Surahs store: keyed by `${surahNum}_${lang}`
        if (!db.objectStoreNames.contains('surahs')) {
          db.createObjectStore('surahs', { keyPath: 'key' });
        }
        // Hadiths store: keyed by collection name e.g. 'bukhari', 'muslim'
        if (!db.objectStoreNames.contains('hadiths')) {
          db.createObjectStore('hadiths', { keyPath: 'collection' });
        }
        // Meta store: settings, quota, download progress
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function getSurah(surahNum, lang) {
    try {
      const db = await openDB();
      lang = lang || 'en';
      const key = `${surahNum}_${lang}`;
      return new Promise((resolve, reject) => {
        const tx = db.transaction('surahs', 'readonly');
        const store = tx.objectStore('surahs');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function saveSurah(surahNum, lang, data) {
    try {
      const db = await openDB();
      lang = lang || 'en';
      const key = `${surahNum}_${lang}`;
      return new Promise((resolve, reject) => {
        const tx = db.transaction('surahs', 'readwrite');
        const store = tx.objectStore('surahs');
        const req = store.put({
          key: key,
          surahNum: parseInt(surahNum, 10),
          lang: lang,
          data: data,
          updatedAt: Date.now()
        });
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  async function getCachedSurahCount(lang) {
    try {
      const db = await openDB();
      lang = lang || 'en';
      return new Promise((resolve) => {
        const tx = db.transaction('surahs', 'readonly');
        const store = tx.objectStore('surahs');
        const req = store.getAllKeys();
        req.onsuccess = () => {
          const keys = req.result || [];
          const count = keys.filter(k => k.endsWith(`_${lang}`)).length;
          resolve(count);
        };
        req.onerror = () => resolve(0);
      });
    } catch (e) {
      return 0;
    }
  }

  async function getHadiths(collection) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('hadiths', 'readonly');
        const store = tx.objectStore('hadiths');
        const req = store.get(collection);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function saveHadiths(collection, data) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('hadiths', 'readwrite');
        const store = tx.objectStore('hadiths');
        const req = store.put({
          collection: collection,
          data: data,
          updatedAt: Date.now()
        });
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  async function getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usageMB = (est.usage / (1024 * 1024)).toFixed(1);
        const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
        return { usageMB, quotaMB };
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }
    return { usageMB: '0', quotaMB: 'Unknown' };
  }

  window.NoorDB = {
    getSurah,
    saveSurah,
    getCachedSurahCount,
    getHadiths,
    saveHadiths,
    getStorageEstimate
  };
})();

