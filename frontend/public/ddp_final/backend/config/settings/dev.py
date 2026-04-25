from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

INTERNAL_IPS = ["127.0.0.1"]

# PostgreSQL — même base en dev et en prod pour éviter les surprises
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "ddp_db"),
        "USER": os.environ.get("DB_USER", "ddp_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# Logs verbeux en dev
LOGGING["root"]["level"] = "DEBUG"

# Email en dev — affiche dans la console
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
CONTACT_EMAIL = 'maaboritedinma@gmail.com'
