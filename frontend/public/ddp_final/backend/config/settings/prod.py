from .base import *
import os

DEBUG = False

# Sécurité HTTPS en production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# WhiteNoise pour les fichiers statiques
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Logs vers fichier en production
import logging
LOGGING["root"]["handlers"] = ["console", "file"]

# ── Email SMTP Gmail ──────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')  # Mot de passe d'application Gmail
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER', 'noreply@materniterahama.ci')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'maaboritedinma@gmail.com')
