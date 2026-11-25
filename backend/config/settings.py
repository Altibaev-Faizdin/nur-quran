"""
Noor Al-Quran — Django Settings (Production-Ready)
"""

import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

try:
    import dj_database_url
except ImportError:
    dj_database_url = None

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── DEBUG & SECRET_KEY (BUILD-02) ───────────────────────────────────────────
DEBUG = (
    os.getenv("DEBUG") if os.getenv("DEBUG") is not None else os.getenv("DJANGO_DEBUG", "False")
).strip().lower() in ("true", "1", "yes")

DEV_SECRET_KEY = "django-insecure-dev-only-secret-key-for-noor-al-quran-dev-minimum-50-characters"
RAW_SECRET_KEY = os.getenv("SECRET_KEY", "").strip()

if DEBUG:
    SECRET_KEY = RAW_SECRET_KEY if RAW_SECRET_KEY else DEV_SECRET_KEY
else:
    # Production requirements: mandatory >= 50 characters and not django-insecure-
    if not RAW_SECRET_KEY:
        raise ValueError(
            "CRITICAL: SECRET_KEY environment variable is not set and DEBUG is False. "
            "Production requires a secret key with length >= 50 characters."
        )
    if len(RAW_SECRET_KEY) < 50:
        raise ValueError(
            f"CRITICAL: Production SECRET_KEY is too short ({len(RAW_SECRET_KEY)} chars). "
            "Must be at least 50 characters."
        )
    if RAW_SECRET_KEY.startswith("django-insecure-"):
        raise ValueError("CRITICAL: Production SECRET_KEY must not use 'django-insecure-' prefix.")
    SECRET_KEY = RAW_SECRET_KEY

# ─── ALLOWED HOSTS (SEC-06) ──────────────────────────────────────────────────
DEFAULT_ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "[::1]",
    "nur-quran.onrender.com",
    "nuur-quran.onrender.com",
    "nur-quran.netlify.app",
    "nuur-quran.netlify.app",
    "noor-al-quran.netlify.app",
]
env_hosts = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
if env_hosts:
    ALLOWED_HOSTS = env_hosts
elif DEBUG:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]
else:
    ALLOWED_HOSTS = DEFAULT_ALLOWED_HOSTS.copy()

if os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME").strip()
    if render_host and render_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(render_host)

# ─── APPLICATIONS ────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "rest_framework_simplejwt",
    "api",
]

# ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "api.middleware.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ─── DATABASE ────────────────────────────────────────────────────────────────
if dj_database_url and os.getenv("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            default=os.getenv("DATABASE_URL"),
            conn_max_age=600,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

AUDIO_CDN_BASE = os.getenv("AUDIO_CDN_BASE", "").strip()

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── CACHING (PERF-06: FileBasedCache fallback) ──────────────────────────────
if os.getenv("REDIS_URL"):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": os.getenv("REDIS_URL"),
        }
    }
else:
    CACHE_DIR = BASE_DIR / "cache"
    try:
        CACHE_DIR.mkdir(exist_ok=True)
    except Exception:
        pass
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
            "LOCATION": str(CACHE_DIR),
            "TIMEOUT": 1800,
            "MAX_ENTRIES": 1000,
        }
    }

# ─── REST FRAMEWORK ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("api.authentication.PasswordVersionJWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("THROTTLE_ANON", "2000/hour"),
        "user": os.getenv("THROTTLE_USER", "10000/hour"),
        "auth": os.getenv("THROTTLE_AUTH", "10/minute"),
        "register": os.getenv("THROTTLE_REGISTER", "5/minute"),
    },
    "NUM_PROXIES": int(os.getenv("NUM_PROXIES", "1")),
}

# ─── COOKIE & SESSION SECURITY ────────────────────────────────────────────────
REFRESH_COOKIE_NAME = "nq_refresh"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "False" if DEBUG else "True").strip().lower() in (
    "true",
    "1",
    "yes",
)
_raw_samesite = (
    (os.getenv("COOKIE_SAMESITE") or os.getenv("COOKIE_SAME_SITE") or "Lax").strip().capitalize()
)
COOKIE_SAMESITE = _raw_samesite if _raw_samesite in ("Lax", "Strict", "None") else "Lax"

# ─── JWT SETTINGS (SEC-07) ───────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# ─── CORS & CSRF (SEC-06) ────────────────────────────────────────────────────
DEFAULT_CORS_ORIGINS = [
    "https://nur-quran.netlify.app",
    "https://nuur-quran.netlify.app",
    "https://noor-al-quran.netlify.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_cors = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
if env_cors:
    CORS_ALLOWED_ORIGINS = env_cors
elif DEBUG:
    CORS_ALLOWED_ORIGINS = DEFAULT_CORS_ORIGINS + [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        "https://nur-quran.netlify.app",
        "https://nuur-quran.netlify.app",
        "https://noor-al-quran.netlify.app",
    ]

CSRF_TRUSTED_ORIGINS = [
    origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith(("http://", "https://"))
]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ─── SECURITY HEADERS (PRODUCTION) ───────────────────────────────────────────
if not DEBUG:
    if "test" in sys.argv or not COOKIE_SECURE:
        SECURE_SSL_REDIRECT = False
        SESSION_COOKIE_SECURE = COOKIE_SECURE
        CSRF_COOKIE_SECURE = COOKIE_SECURE
    else:
        SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").strip().lower() in (
            "true",
            "1",
        )
        SESSION_COOKIE_SECURE = True
        CSRF_COOKIE_SECURE = True
        SECURE_HSTS_SECONDS = 31536000  # 1 year
        SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# ─── LOGGING CONFIGURATION ───────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "api": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}


# ─── SENTRY ERROR MONITORING (OPTIONAL) ──────────────────────────────────────
SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
if SENTRY_DSN and not DEBUG and "test" not in sys.argv:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            send_default_pii=False,
        )
    except ImportError:
        pass
