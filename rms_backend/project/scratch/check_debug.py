import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.conf import settings

print("settings.DEBUG is:", settings.DEBUG)
print("os.getenv('DEBUG') is:", repr(os.getenv('DEBUG')))
