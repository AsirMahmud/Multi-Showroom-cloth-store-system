import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Adding color_hax to inventory_productvariation...")
    cursor.execute("ALTER TABLE inventory_productvariation ADD COLUMN color_hax varchar(50) DEFAULT '#FFFFFF'")
    
    print("Adding color_hax to inventory_gallery...")
    cursor.execute("ALTER TABLE inventory_gallery ADD COLUMN color_hax varchar(50) DEFAULT '#FFFFFF'")

print("DB Schema fixed.")
