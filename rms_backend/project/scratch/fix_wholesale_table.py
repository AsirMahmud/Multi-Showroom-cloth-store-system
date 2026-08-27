import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

print("Creating inventory_wholesalepricingsettings table if not exists...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS inventory_wholesalepricingsettings (
    id bigint AUTO_INCREMENT PRIMARY KEY,
    global_wholesale_cutoff int unsigned NOT NULL DEFAULT 10,
    updated_at datetime(6) NOT NULL
);
""")
print("Table created.")

cursor.execute("SELECT COUNT(*) FROM inventory_wholesalepricingsettings;")
count = cursor.fetchone()[0]

if count == 0:
    print("Inserting default row into inventory_wholesalepricingsettings...")
    cursor.execute("""
    INSERT INTO inventory_wholesalepricingsettings (id, global_wholesale_cutoff, updated_at)
    VALUES (1, 10, NOW());
    """)
    print("Default row inserted.")

print("WholesalePricingSettings table fix completed!")
