from .base import *
import os
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

DEBUG = False
SECRET_KEY = (
    os.environ.get("SECRET_KEY")
    or os.environ.get("DJANGO_SECRET_KEY")
    or "change-me-in-production"
)

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("ALLOWED_HOSTS", "").split(",")
    if host.strip()
]
if os.environ.get("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(os.environ["RENDER_EXTERNAL_HOSTNAME"])

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
for origin in ["https://ddp-frontend.onrender.com"]:
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)

# ── Base de données PostgreSQL Render ──
if os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.parse(
            os.environ["DATABASE_URL"],
            conn_max_age=600,
            ssl_require=os.environ.get("DB_SSL_REQUIRE", "").lower()
            in {"1", "true", "yes"},
        )
    }
else:
    required_db_vars = ["PGDATABASE", "PGUSER", "PGPASSWORD", "PGHOST"]
    missing_db_vars = [name for name in required_db_vars if not os.environ.get(name)]
    if missing_db_vars:
        raise ImproperlyConfigured(
            "Production database is not configured. Set DATABASE_URL or these "
            f"PostgreSQL variables: {', '.join(required_db_vars)}."
        )

    DATABASES = {"default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("PGDATABASE"),
        "USER": os.environ.get("PGUSER"),
        "PASSWORD": os.environ.get("PGPASSWORD"),
        "HOST": os.environ.get("PGHOST"),
        "PORT": os.environ.get("PGPORT", "5432"),
        "CONN_MAX_AGE": 600,
    }}

# ── Sécurité HTTPS ──
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Fichiers statiques WhiteNoise ──
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ── Email SMTP Gmail ──
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("EMAIL_HOST_USER", "noreply@materniterahama.ci")
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "maaboritedinma@gmail.com")
