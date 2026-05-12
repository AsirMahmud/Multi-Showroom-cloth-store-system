import os
import django
import sys
from django.db import connection

sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

def add_fk_if_not_exists(table, column, ref_table, ref_column='id'):
    with connection.cursor() as cursor:
        # Check if FK already exists
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = '{table}' 
            AND COLUMN_NAME = '{column}'
            AND TABLE_SCHEMA = 'rawstitc_demo'
            AND REFERENCED_TABLE_NAME = '{ref_table}'
        """)
        if cursor.fetchone()[0] == 0:
            print(f"Adding FK to {table}.{column} -> {ref_table}.{ref_column}")
            try:
                cursor.execute(f"ALTER TABLE {table} ADD CONSTRAINT fk_{table}_{column} FOREIGN KEY ({column}) REFERENCES {ref_table}({ref_column})")
            except Exception as e:
                print(f"Failed to add FK to {table}: {e}")
        else:
            print(f"FK already exists for {table}.{column}")

def fix_all():
    # Table, Column, Reference Table
    fks_to_add = [
        ('inventory_design', 'product_id', 'inventory_product'),
        ('inventory_productvariation', 'design_id', 'inventory_design'),
        ('inventory_gallery', 'design_id', 'inventory_design'),
        ('inventory_meterialcomposition', 'product_id', 'inventory_product'),
        ('inventory_whoisthisfor', 'product_id', 'inventory_product'),
        ('inventory_features', 'product_id', 'inventory_product'),
        ('inventory_image', 'gallery_id', 'inventory_gallery'),
    ]
    
    for table, col, ref in fks_to_add:
        add_fk_if_not_exists(table, col, ref)

if __name__ == "__main__":
    fix_all()
