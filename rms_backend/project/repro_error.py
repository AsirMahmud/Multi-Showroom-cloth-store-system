import os
import django
import sys
from django.db import connection, transaction

sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.inventory.models import Product, Category, Design, Gallery

def reproduce():
    try:
        with transaction.atomic():
            cat = Category.objects.first()
            if not cat:
                cat = Category.objects.create(name="Test Cat")
            
            print(f"Using category: {cat.id}")
            
            p = Product.objects.create(
                name="Test Repro",
                category=cat,
                cost_price=100,
                wholesale_price=150,
                retail_price=200
            )
            print(f"Created product: {p.id}")
            
            d = Design.objects.create(
                product=p,
                name="Default Design"
            )
            print(f"Created design: {d.id}")
            
            print("Attempting to create gallery...")
            g = Gallery.objects.create(
                design=d,
                color="Black",
                color_hax="#000000"
            )
            print(f"Created gallery: {g.id}")
            
    except Exception as e:
        print(f"Caught error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reproduce()
