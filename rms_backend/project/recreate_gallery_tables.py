import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Dropping foreign keys and tables...")
    try:
        cursor.execute("ALTER TABLE inventory_image DROP FOREIGN KEY inventory_image_gallery_id_c8e61ff2_fk_inventory_gallery_id")
    except Exception as e:
        print("Could not drop image FK:", e)
        
    try:
        cursor.execute("DROP TABLE IF EXISTS inventory_image")
        print("Dropped inventory_image")
    except Exception as e:
        print("Could not drop inventory_image table:", e)
        
    try:
        cursor.execute("DROP TABLE IF EXISTS inventory_gallery")
        print("Dropped inventory_gallery")
    except Exception as e:
        print("Could not drop inventory_gallery table:", e)
        
    print("\nRecreating inventory_gallery table...")
    cursor.execute("""
        CREATE TABLE `inventory_gallery` (
          `id` bigint(20) NOT NULL AUTO_INCREMENT,
          `color` varchar(50) NOT NULL,
          `alt_text` varchar(255) NOT NULL,
          `color_hax` varchar(50) DEFAULT NULL,
          `product_id` bigint(20) NOT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `inventory_gallery_product_id_color_uniq` (`product_id`, `color`),
          CONSTRAINT `inventory_gallery_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `inventory_product` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    """)
    print("Created inventory_gallery")
    
    print("\nRecreating inventory_image table...")
    cursor.execute("""
        CREATE TABLE `inventory_image` (
          `id` bigint(20) NOT NULL AUTO_INCREMENT,
          `imageType` varchar(50) NOT NULL,
          `image` varchar(100) NOT NULL,
          `alt_text` varchar(255) NOT NULL,
          `gallery_id` bigint(20) NOT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `inventory_image_gallery_id_imageType_uniq` (`gallery_id`, `imageType`),
          CONSTRAINT `inventory_image_gallery_id_fk` FOREIGN KEY (`gallery_id`) REFERENCES `inventory_gallery` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    """)
    print("Created inventory_image")
