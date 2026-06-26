import os
from pathlib import Path

from .settings import *  # noqa: F403


DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.getenv(
            "RMS_E2E_DB",
            str(Path(BASE_DIR) / ".e2e" / "rms.sqlite3"),  # noqa: F405
        ),
    }
}

MEDIA_ROOT = os.getenv(
    "RMS_E2E_MEDIA_ROOT",
    str(Path(BASE_DIR) / ".e2e" / "media"),  # noqa: F405
)

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:3100", "http://localhost:3100"]
CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:3100", "http://localhost:3100"]
