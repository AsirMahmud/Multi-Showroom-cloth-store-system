import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

tables = ['inventory_meterialcomposition', 'inventory_whoisthisfor', 'inventory_features', 'inventory_gallery', 'inventory_image']

with connection.cursor() as cursor:
    for table in tables:
        try:
            print(f"\n--- Table: {table} ---")
            cursor.execute(f"DESCRIBE {table}")
            for col in cursor.fetchall():
                print(col)
            
            print(f"Constraints for {table}:")
            cursor.execute(f"""
                SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = '{table}' 
                AND TABLE_SCHEMA = 'rawstitc_demo'
                AND REFERENCED_TABLE_NAME IS NOT NULL
            """)
            for fk in cursor.fetchall():
                print(fk)
        except Exception as e:
            print(f"Error inspecting {table}: {e}")
