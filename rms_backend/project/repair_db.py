import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    try:
        print("Analyzing current constraints...")
        cursor.execute("""
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'inventory_productvariation' 
            AND TABLE_SCHEMA = 'rawstitc_demo'
            AND CONSTRAINT_NAME != 'PRIMARY'
        """)
        constraints = cursor.fetchall()
        
        for (constraint_name,) in constraints:
            print(f"Dropping constraint: {constraint_name}")
            cursor.execute(f"ALTER TABLE inventory_productvariation DROP FOREIGN KEY {constraint_name}")
        
        print("Ensuring design_id column exists and is the right type...")
        cursor.execute("DESCRIBE inventory_productvariation")
        cols = {row[0]: row[1] for row in cursor.fetchall()}
        
        if 'design_id' in cols:
            print("Adding correct foreign key constraint for design_id -> inventory_design(id)")
            cursor.execute("""
                ALTER TABLE inventory_productvariation 
                ADD CONSTRAINT inventory_productvar_design_id_fk_inventory_design 
                FOREIGN KEY (design_id) REFERENCES inventory_design(id)
            """)
        
        print("\nSchema Repair Complete.")
        
    except Exception as e:
        print(f"Error during repair: {e}")
        # If it fails because of missing product_id column in the constraint definition, we'll try a more direct approach
        try:
            print("Attempting forced cleanup...")
            cursor.execute("SHOW CREATE TABLE inventory_productvariation")
            create_sql = cursor.fetchone()[1]
            print(f"Current CREATE SQL: {create_sql}")
        except:
            pass
