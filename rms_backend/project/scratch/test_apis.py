import os
import django
import json
from decimal import Decimal
from django.conf import settings
from django.test import RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate
# Removed direct User import

import sys
from unittest.mock import MagicMock

# Mock PIL for environments without it (e.g. Python 3.14 on Windows)
mock_pil = MagicMock()
sys.modules["PIL"] = mock_pil
sys.modules["PIL.Image"] = mock_pil.Image

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.inventory.models import Product, OnlineCategory, Category, Design, ProductVariation, Gallery, Image
from apps.inventory.views import ProductViewSet, OnlineCategoryViewSet
from apps.ecommerce.views import PublicProductsByColorView, PublicProductDetailByColorView, CreateOnlinePreorderView
from apps.online_preorder.views import PublicCreateOnlinePreorderView

def test_product_listing():
    print("\n--- Testing Product Listing ---")
    factory = APIRequestFactory()
    view = ProductViewSet.as_view({'get': 'list'})
    request = factory.get('/api/inventory/products/')
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # We need a user for this view (IsAuthenticated)
    user = User.objects.first()
    if not user:
        user = User.objects.create_superuser('admin', 'admin@test.com', 'admin')
    
    force_authenticate(request, user=user)
    response = view(request)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Found {len(response.data.get('results', []))} products")
    else:
        print(f"Error: {response.data}")

def test_all_online():
    print("\n--- Testing All Online Showcase ---")
    factory = APIRequestFactory()
    view = ProductViewSet.as_view({'get': 'all_online'})
    request = factory.get('/api/inventory/products/all_online/')
    response = view(request)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Found {len(response.data.get('results', []))} online products")
    else:
        print(f"Error: {response.data}")

def test_products_by_color():
    print("\n--- Testing Ecom Products By Color ---")
    factory = APIRequestFactory()
    view = PublicProductsByColorView.as_view()
    request = factory.get('/api/ecommerce/public/products-by-color/')
    response = view(request)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Found {len(response.data)} items")
    else:
        print(f"Error: {response.data}")

def test_order_creation():
    print("\n--- Testing Order Creation ---")
    all_products = Product.objects.all()
    print(f"Total products in DB: {all_products.count()}")
    for p in all_products:
        print(f"Product {p.id}: {p.name}, active={p.is_active}, online={p.assign_to_online}")
    
    product = Product.objects.filter(is_active=True, assign_to_online=True).first()
    if not product:
        print("No active online product found for testing order creation.")
        return

    # Find a variation
    variation = ProductVariation.objects.filter(design__product=product).first()
    if not variation:
        print(f"No variation found for product {product.id}")
        return

    payload = {
        "customer_name": "Test User",
        "customer_phone": "01712345678",
        "customer_address": "Test Address",
        "payment_method": "COD",
        "delivery_charge": 100,
        "items": [
            {
                "product_id": product.id,
                "color": variation.color,
                "size": variation.size,
                "quantity": 1,
                "unit_price": float(product.retail_price),
                "discount": 0
            }
        ]
    }
    
    factory = APIRequestFactory()
    view = PublicCreateOnlinePreorderView.as_view()
    request = factory.post('/api/online-preorder/orders/create/', payload, format='json')
    response = view(request)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"Order created successfully: ID {response.data.get('id')}")
        # Check if product_image is in the response (this tests my fix)
        items = response.data.get('items', [])
        if items:
            print(f"Product image in response: {items[0].get('product_image')}")
    else:
        print(f"Error: {response.data}")

def test_product_details():
    print("\n--- Testing Product Details ---")
    product = Product.objects.filter(is_active=True, assign_to_online=True).first()
    if not product:
        print("No active online product found for testing detail view.")
        return
        
    # Find a valid color for this product
    variation = ProductVariation.objects.filter(design__product=product).first()
    if not variation:
        print(f"No variation found for product {product.id} for testing detail view.")
        return
        
    color_slug = variation.color.lower()
    factory = APIRequestFactory()
    view = PublicProductDetailByColorView.as_view()
    # Path is /public/product-details/<int:product_id>/<slug:color_slug>/
    request = factory.get(f'/api/ecommerce/public/product-details/{product.id}/{color_slug}/')
    response = view(request, product_id=product.id, color_slug=color_slug)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Product detail retrieved: {response.data.get('product', {}).get('name')}")
    else:
        print(f"Error: {response.data}")

if __name__ == "__main__":
    try:
        test_product_listing()
        test_all_online()
        test_products_by_color()
        test_product_details()
        test_order_creation()
    except Exception as e:
        import traceback
        print(f"\nCRITICAL ERROR during testing: {e}")
        traceback.print_exc()
