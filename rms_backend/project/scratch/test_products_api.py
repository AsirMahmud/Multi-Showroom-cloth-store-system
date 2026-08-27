import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.inventory.views import ProductViewSet
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.filter(username="ridhad").first() or User.objects.filter(is_superuser=True).first()

factory = APIRequestFactory()

print("Testing GET /api/inventory/products/?search=&page_size=20&page=1&expand=category,online_categories,ecommerce_statuses ...")
try:
    req = factory.get(
        '/api/inventory/products/?search=&page_size=20&page=1&expand=category,online_categories,ecommerce_statuses',
        HTTP_HOST='localhost'
    )
    if user:
        force_authenticate(req, user=user)

    view = ProductViewSet.as_view({'get': 'list'})
    res = view(req)
    print("ProductViewSet status code:", res.status_code)
    if res.status_code != 200:
        print("Data:", res.data)
except Exception as e:
    import traceback
    traceback.print_exc()
