import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

def add_column_if_missing(table, column, col_def):
    cursor.execute(f"DESCRIBE {table};")
    cols = [col[0] for col in cursor.fetchall()]
    if column not in cols:
        print(f"Adding {column} to {table}...")
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_def};")
            print(f"Added {column} to {table}.")
        except Exception as e:
            print(f"Error adding {column} to {table}: {e}")
    else:
        print(f"Column {column} already exists in {table}.")

print("1. Ensuring wholesale_cutoff columns exist...")
add_column_if_missing('inventory_product', 'wholesale_cutoff', 'int unsigned NULL')
add_column_if_missing('inventory_category', 'wholesale_cutoff', 'int unsigned NULL')

print("\n2. Ensuring design_id columns exist...")
add_column_if_missing('inventory_productvariation', 'design_id', 'bigint NULL')
add_column_if_missing('inventory_gallery', 'design_id', 'bigint NULL')

print("\n3. Creating default designs for existing products in SQL...")
cursor.execute("""
    INSERT INTO inventory_design (name, description, created_at, updated_at, product_id)
    SELECT 'Design 1', '', NOW(), NOW(), p.id
    FROM inventory_product p
    WHERE NOT EXISTS (
        SELECT 1 FROM inventory_design d WHERE d.product_id = p.id
    );
""")
print("Default designs verified/created.")

print("\n4. Linking productvariation and gallery to design_id in SQL...")
try:
    cursor.execute("""
        UPDATE inventory_productvariation pv
        JOIN inventory_design d ON d.product_id = pv.product_id
        SET pv.design_id = d.id
        WHERE pv.design_id IS NULL;
    """)
    print("Linked variations to designs.")
except Exception as e:
    print("Error linking variations to designs:", e)

try:
    cursor.execute("""
        UPDATE inventory_gallery g
        JOIN inventory_design d ON d.product_id = g.product_id
        SET g.design_id = d.id
        WHERE g.design_id IS NULL;
    """)
    print("Linked galleries to designs.")
except Exception as e:
    print("Error linking galleries to designs:", e)

print("\nSchema Fix Applied Successfully!")
