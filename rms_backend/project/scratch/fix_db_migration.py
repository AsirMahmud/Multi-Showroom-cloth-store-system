import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection, transaction
from apps.inventory.models import Product, Design, ProductVariation, Gallery

cursor = connection.cursor()

print("1. Creating default designs for any products without designs...")
with transaction.atomic():
    products = Product.objects.all()
    for product in products:
        design, created = Design.objects.get_or_create(
            product=product,
            defaults={'name': 'Design 1'}
        )
        if created:
            print(f"Created default Design 1 for product #{product.id} ({product.name})")

print("\n2. Checking and adding design_id column to inventory_productvariation if missing...")
cursor.execute("DESCRIBE inventory_productvariation;")
pv_cols = [col[0] for col in cursor.fetchall()]

if 'design_id' not in pv_cols:
    print("Adding design_id column to inventory_productvariation...")
    cursor.execute("ALTER TABLE inventory_productvariation ADD COLUMN design_id bigint NULL;")
    cursor.execute("ALTER TABLE inventory_productvariation ADD CONSTRAINT fk_pv_design FOREIGN KEY (design_id) REFERENCES inventory_design(id) ON DELETE CASCADE;")
    print("design_id column added to inventory_productvariation.")

    # Populate design_id from product_id
    print("Populating design_id in inventory_productvariation...")
    cursor.execute("""
        UPDATE inventory_productvariation pv
        JOIN inventory_design d ON d.product_id = pv.product_id
        SET pv.design_id = d.id
        WHERE pv.design_id IS NULL;
    """)
    print("Populated design_id for variations.")

print("\n3. Checking and adding design_id column to inventory_gallery if missing...")
cursor.execute("DESCRIBE inventory_gallery;")
gal_cols = [col[0] for col in cursor.fetchall()]

if 'design_id' not in gal_cols:
    print("Adding design_id column to inventory_gallery...")
    cursor.execute("ALTER TABLE inventory_gallery ADD COLUMN design_id bigint NULL;")
    cursor.execute("ALTER TABLE inventory_gallery ADD CONSTRAINT fk_gal_design FOREIGN KEY (design_id) REFERENCES inventory_design(id) ON DELETE CASCADE;")
    print("design_id column added to inventory_gallery.")

    # Populate design_id from product_id
    print("Populating design_id in inventory_gallery...")
    cursor.execute("""
        UPDATE inventory_gallery g
        JOIN inventory_design d ON d.product_id = g.product_id
        SET g.design_id = d.id
        WHERE g.design_id IS NULL;
    """)
    print("Populated design_id for galleries.")

print("\nDB Schema Fix Completed Successfully!")
