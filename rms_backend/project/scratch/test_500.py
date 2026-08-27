import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from apps.ecommerce.views import PublicProductsByColorView
from apps.inventory.views import OnlineCategoryViewSet

factory = APIRequestFactory()

print("Testing PublicProductsByColorView...")
try:
    req = factory.get('/api/ecommerce/public/products-by-color/?only_in_stock=true&page=1&page_size=8', HTTP_HOST='localhost')
    view = PublicProductsByColorView.as_view()
    res = view(req)
    print("PublicProductsByColorView Status:", res.status_code)
    print("Count:", res.data.get('count'))
    print("Results length:", len(res.data.get('results', [])))
except Exception as e:
    import traceback
    traceback.print_exc()

print("\nTesting OnlineCategoryViewSet...")
try:
    req = factory.get('/api/inventory/online-categories/', HTTP_HOST='localhost')
    view = OnlineCategoryViewSet.as_view({'get': 'list'})
    res = view(req)
    print("OnlineCategoryViewSet Status:", res.status_code)
    print("Categories count:", len(res.data))
except Exception as e:
    import traceback
    traceback.print_exc()
