import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

tables = ['inventory_product', 'inventory_productvariation', 'inventory_gallery', 'inventory_design', 'inventory_branchproduct']

for table in tables:
    try:
        cursor.execute(f"DESCRIBE {table};")
        cols = cursor.fetchall()
        print(f"\n--- Columns in {table} ---")
        for col in cols:
            print(col[0], col[1])
    except Exception as e:
        print(f"\n--- Table {table} Error: {e} ---")
