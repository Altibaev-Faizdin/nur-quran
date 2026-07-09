# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc1] - 2024-06-28

### Added
- Complete Quranic text for all 114 Surahs with translations (English, Russian, Uzbek).
- Audio player supporting 10 famous reciters (e.g., Mishary Alafasy, Abdul Basit).
- Deep-linking functionality to share specific Ayahs (e.g., `?surah=1&ayah=2`).
- Prayer times module integrating geolocation and Aladhan API.
- Hadith library with major collections via API.
- Tasbih (digital counter) with auto-saving and tactile feedback.
- JWT-based authentication system for users.
- Secure Bookmarks feature linked to user accounts.
- Qibla compass and 99 Names of Allah utilities.
- Production-ready settings with PostgreSQL, Redis, WhiteNoise, and Gunicorn support.
- Comprehensive `README.md` and MIT License.

### Changed
- Backend architecture finalized using Django REST Framework.
- Local development proxy script created for CORS-free local testing.
- Strict security configuration (`DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`).

### Fixed
- IDOR vulnerability in the `Bookmarks` endpoint by filtering through `get_queryset`.
- Mixed-content errors in Audio fetching from external HTTP sources.
- Layout issues on mobile devices for the Surah index grid.
- Broken audio player states during track completion.
- N+1 query problems in DRF serializers.
