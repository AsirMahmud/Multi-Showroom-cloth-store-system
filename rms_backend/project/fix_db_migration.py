import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.inventory.models import Product, Design
from django.db import connection

# 1. Create a default design for every product that doesn't have one
products = Product.objects.all()
for product in products:
    if not Design.objects.filter(product=product).exists():
        Design.objects.create(product=product, name="Default Design")
        print(f"Created default design for product: {product.name}")

# 2. Check if we need to manually move product_id to design_id for ProductVariation
# This is tricky because the column design_id might not exist yet.
# We will do this via the migration.

print("Designs created. Now you should run:")
print("python manage.py migrate inventory 0020 --fake")
print("python manage.py migrate inventory")
