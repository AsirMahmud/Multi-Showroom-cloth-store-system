import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

def column_exists(table, column):
    with connection.cursor() as cursor:
        cursor.execute(f"SHOW COLUMNS FROM {table} LIKE '{column}'")
        return cursor.fetchone() is not None

with connection.cursor() as cursor:
    print("Fixing inventory_productvariation...")
    
    # Ensure design_id exists
    if not column_exists('inventory_productvariation', 'design_id'):
        print("Adding design_id to inventory_productvariation")
        cursor.execute("ALTER TABLE inventory_productvariation ADD COLUMN design_id bigint(20)")
        
    # Link design_id if possible
    if column_exists('inventory_productvariation', 'product_id'):
        cursor.execute("""
            UPDATE inventory_productvariation v
            JOIN inventory_design d ON v.product_id = d.product_id
            SET v.design_id = d.id
            WHERE v.design_id IS NULL
        """)

    # Fix color and size
    if not column_exists('inventory_productvariation', 'color'):
        print("Adding color CharField to inventory_productvariation")
        cursor.execute("ALTER TABLE inventory_productvariation ADD COLUMN color varchar(50) DEFAULT 'Default'")
        
    if not column_exists('inventory_productvariation', 'size'):
        print("Adding size CharField to inventory_productvariation")
        cursor.execute("ALTER TABLE inventory_productvariation ADD COLUMN size varchar(50) DEFAULT 'Standard'")

    # Drop old columns
    for col in ['product_id', 'chest_size', 'waist_size', 'height', 'color_id', 'size_id']:
        if column_exists('inventory_productvariation', col):
            print(f"Dropping {col} from inventory_productvariation")
            try:
                cursor.execute(f"ALTER TABLE inventory_productvariation DROP COLUMN {col}")
            except Exception as e:
                print(f"Failed to drop {col}: {e}")

    print("Fixing inventory_gallery...")
    if not column_exists('inventory_gallery', 'design_id'):
        print("Adding design_id to inventory_gallery")
        cursor.execute("ALTER TABLE inventory_gallery ADD COLUMN design_id bigint(20)")
        
    if not column_exists('inventory_gallery', 'color'):
        print("Adding color CharField to inventory_gallery")
        cursor.execute("ALTER TABLE inventory_gallery ADD COLUMN color varchar(50) DEFAULT 'Default'")

    # Drop old columns
    for col in ['product_id', 'color_id']:
        if column_exists('inventory_gallery', col):
            print(f"Dropping {col} from inventory_gallery")
            try:
                cursor.execute(f"ALTER TABLE inventory_gallery DROP COLUMN {col}")
            except Exception as e:
                print(f"Failed to drop {col}: {e}")

    print("DB Schema fixed manually to match models.py.")
