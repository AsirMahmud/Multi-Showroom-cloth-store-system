import os
import sys
import django

sys.path.append(r'd:\Web dev\Ecommerce-with-retail-management-sytstem-main\Ecommerce-with-retail-management-sytstem-main\rms_backend\project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("DESCRIBE inventory_product;")
    print("--- inventory_product columns ---")
    for row in cursor.fetchall():
        print(row)

    print("\n--- Applied inventory migrations ---")
    cursor.execute("SELECT app, name, applied FROM django_migrations WHERE app='inventory';")
    for row in cursor.fetchall():
        print(row)
