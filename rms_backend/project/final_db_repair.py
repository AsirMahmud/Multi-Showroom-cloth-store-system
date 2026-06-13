import os
import django
import sys
from django.db import connection

sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

def get_constraints(table_name):
    with connection.cursor() as cursor:
        cursor.execute(f"""
            SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = '{table_name}' 
            AND TABLE_SCHEMA = 'rawstitc_demo'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        """)
        return cursor.fetchall()

def repair():
    with connection.cursor() as cursor:
        # 1. Fix inventory_productvariation
        print("Checking inventory_productvariation...")
        fks = get_constraints('inventory_productvariation')
        for name, col, ref in fks:
            if ref == 'inventory_product' or col == 'product_id':
                print(f"Dropping stale FK {name} on {col} referencing {ref}")
                try:
                    cursor.execute(f"ALTER TABLE inventory_productvariation DROP FOREIGN KEY {name}")
                except Exception as e: print(f"Error dropping {name}: {e}")
        
        try:
            print("Adding FK to inventory_design for productvariation...")
            cursor.execute("ALTER TABLE inventory_productvariation ADD CONSTRAINT fk_variation_design FOREIGN KEY (design_id) REFERENCES inventory_design(id)")
        except Exception as e: print(f"Note: {e}")

        # 2. Fix inventory_gallery
        print("\nChecking inventory_gallery...")
        fks = get_constraints('inventory_gallery')
        for name, col, ref in fks:
            if ref == 'inventory_product' or col == 'product_id':
                print(f"Dropping stale FK {name} on {col} referencing {ref}")
                try:
                    cursor.execute(f"ALTER TABLE inventory_gallery DROP FOREIGN KEY {name}")
                except Exception as e: print(f"Error dropping {name}: {e}")
        
        try:
            print("Adding FK to inventory_design for gallery...")
            cursor.execute("ALTER TABLE inventory_gallery ADD CONSTRAINT fk_gallery_design FOREIGN KEY (design_id) REFERENCES inventory_design(id)")
        except Exception as e: print(f"Note: {e}")

        # 3. Fix other related tables
        for table in ['inventory_meterialcomposition', 'inventory_whoisthisfor', 'inventory_features']:
             print(f"\nChecking {table}...")
             # These should point to product_id, but check if they point to the correct table
             fks = get_constraints(table)
             has_correct_fk = False
             for name, col, ref in fks:
                 if col == 'product_id' and ref == 'inventory_product':
                     has_correct_fk = True
                     print(f"Table {table} has correct FK on product_id")
             
             if not has_correct_fk:
                 print(f"Table {table} MISSING correct FK or has wrong one. Fixing...")
                 # Drop all and recreate if necessary
                 for name, col, ref in fks:
                     try:
                         cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {name}")
                     except: pass
                 try:
                     cursor.execute(f"ALTER TABLE {table} ADD CONSTRAINT fk_{table}_product FOREIGN KEY (product_id) REFERENCES inventory_product(id)")
                     print(f"Fixed FK for {table}")
                 except Exception as e: print(f"Error fixing {table}: {e}")

if __name__ == "__main__":
    repair()
