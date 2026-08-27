import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.conf import settings
from pathlib import Path

print("MEDIA_ROOT is:", settings.MEDIA_ROOT)
print("MEDIA_URL is:", settings.MEDIA_URL)
print("MEDIA_ROOT exists?", os.path.exists(settings.MEDIA_ROOT))

requested_path = os.path.join(settings.MEDIA_ROOT, "gallery/105/141/standard/primary.webp")
print("Requested file path:", requested_path)
print("Requested file exists?", os.path.exists(requested_path))

# Check directory contents of media
media_dir = Path(settings.MEDIA_ROOT)
if media_dir.exists():
    print("\n--- Files in MEDIA_ROOT ---")
    for item in media_dir.glob("**/*"):
        if item.is_file():
            print(item.relative_to(media_dir))
