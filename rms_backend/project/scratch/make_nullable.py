import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

print("Making legacy product_id columns nullable in productvariation and gallery...")
try:
    cursor.execute("ALTER TABLE inventory_productvariation MODIFY COLUMN product_id bigint NULL;")
    print("inventory_productvariation.product_id is now nullable.")
except Exception as e:
    print("Error modifying productvariation.product_id:", e)

try:
    cursor.execute("ALTER TABLE inventory_gallery MODIFY COLUMN product_id bigint NULL;")
    print("inventory_gallery.product_id is now nullable.")
except Exception as e:
    print("Error modifying gallery.product_id:", e)

print("Nullability fix completed!")
