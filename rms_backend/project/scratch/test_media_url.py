import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from rms.urls import urlpatterns
from django.urls import resolve

factory = APIRequestFactory()
req = factory.get('/media/gallery/105/141/standard/primary.webp', HTTP_HOST='localhost')

match = resolve('/media/gallery/105/141/standard/primary.webp')
print("Resolved match func:", match.func)
print("Resolved match kwargs:", match.kwargs)

response = match.func(req, **match.kwargs)
print("HTTP Response status code:", response.status_code)
print("Content-Type:", response.get('Content-Type'))
