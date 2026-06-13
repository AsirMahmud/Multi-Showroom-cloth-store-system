import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection
from apps.inventory.models import ProductVariation, Gallery

def check_table(model):
    table_name = model._meta.db_table
    model_fields = [f.column for f in model._meta.fields]
    
    with connection.cursor() as cursor:
        cursor.execute(f"DESCRIBE {table_name}")
        db_columns = [col[0] for col in cursor.fetchall()]
    
    print(f"\n--- {table_name} ---")
    print(f"Model fields: {model_fields}")
    print(f"DB columns:    {db_columns}")
    
    missing_in_db = [f for f in model_fields if f not in db_columns]
    extra_in_db = [c for c in db_columns if c not in model_fields]
    
    if missing_in_db:
        print(f"MISSING IN DB: {missing_in_db}")
    if extra_in_db:
        print(f"EXTRA IN DB:   {extra_in_db}")

check_table(ProductVariation)
check_table(Gallery)
