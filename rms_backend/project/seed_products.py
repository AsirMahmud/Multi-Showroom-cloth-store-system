import os
import django
import sys
import random
from decimal import Decimal
import uuid

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.core.files import File
from django.db import transaction
from apps.inventory.models import Product, Category, OnlineCategory, Design, ProductVariation, Gallery, Image, StockMovement
from apps.supplier.models import Supplier

# Absolute paths to the generated images
IMAGE_PATHS = {
    'hoodie': r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\hoodie_black_1781086638187.png',
    'jacket': r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\denim_jacket_1781086654372.png',
    'shirt': r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\casual_shirt_1781086670745.png',
    'polo': r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\polo_shirt_1781086689893.png'
}

# Categories config
CATEGORIES_CONFIG = {
    'hoodie': {
        'category_name': 'Hoodies',
        'online_category_name': 'Hoodies',
        'default_color': 'Black',
        'default_hex': '#000000',
        'names': [
            "Aura Premium Hoodie", "Stellar Comfort Hoodie", "Vortex Fleece Hoodie", "Quantum Hooded Sweatshirt", 
            "Urban Edge Zip Hoodie", "Cyberpunk Oversized Hoodie", "Lunar Pullover Hoodie", "Nebula Soft Hoodie", 
            "Cosmic Streetwear Hoodie", "Eclipse Heavyweight Hoodie", "Zen Cotton Hoodie", "Nomad Sherpa Hoodie", 
            "Solar Tech Hoodie", "Apex Athlete Hoodie", "Gravity Ribbed Hoodie", "Velocity Active Hoodie", 
            "Infinity Cozy Hoodie", "Nova Hooded Top", "Titan Knit Hoodie", "Summit Mountain Hoodie", 
            "Vanguard Crop Hoodie", "Stratus Cloud Hoodie", "Helix Thermal Hoodie", "Breeze Light Hoodie", 
            "Phoenix Winter Hoodie"
        ],
        'cost_range': (12.00, 22.00)
    },
    'jacket': {
        'category_name': 'Jackets',
        'online_category_name': 'Jackets',
        'default_color': 'Indigo',
        'default_hex': '#4B0082',
        'names': [
            "Nomad Canvas Jacket", "Vanguard Denim Jacket", "Apex Windbreaker", "Lunar Bomber Jacket", 
            "Zen Puffer Jacket", "Solar Utility Jacket", "Cosmic Coach Jacket", "Quantum Tech Jacket", 
            "Stellar Suede Jacket", "Vortex Leather Jacket", "Aura Fleece Jacket", "Summit Trail Jacket", 
            "Infinity Track Jacket", "Helix Softshell Jacket", "Stratus Rain Jacket", "Nebula Varsity Jacket", 
            "Phoenix Field Jacket", "Titan Cargo Jacket", "Nova Classic Blazer", "Eclipse Parka Jacket", 
            "Urban Edge Denim Jacket", "Cyberpunk Techwear Jacket", "Velocity Active Jacket", "Breeze Light Jacket", 
            "Gravity Wool Jacket"
        ],
        'cost_range': (20.00, 35.00)
    },
    'shirt': {
        'category_name': 'Casual Shirts',
        'online_category_name': 'Casual Shirts',
        'default_color': 'Olive Green',
        'default_hex': '#556B2F',
        'names': [
            "Zen Linen Shirt", "Nomad Flannel Shirt", "Solar Chambray Shirt", "Aura Corduroy Shirt", 
            "Quantum Oxford Shirt", "Stellar Cotton Shirt", "Cosmic Denim Shirt", "Lunar Resort Shirt", 
            "Vanguard Utility Shirt", "Summit Camp Shirt", "Infinity Poplin Shirt", "Helix Micro-print Shirt", 
            "Stratus Striped Shirt", "Nebula Checkered Shirt", "Phoenix Pattern Shirt", "Titan Flannel Shirt", 
            "Nova Brushed Shirt", "Eclipse Indigo Shirt", "Urban Edge Casual Shirt", "Cyberpunk Modular Shirt", 
            "Vortex Heavyweight Shirt", "Velocity Light Shirt", "Breeze Summer Shirt", "Gravity Twill Shirt", 
            "Apex Work Shirt"
        ],
        'cost_range': (10.00, 18.00)
    },
    'polo': {
        'category_name': 'Polo Shirts',
        'online_category_name': 'Polo Shirts',
        'default_color': 'Navy Blue',
        'default_hex': '#000080',
        'names': [
            "Apex Performance Polo", "Zen Pique Polo", "Nomad Classic Polo", "Solar Athletic Polo", 
            "Quantum Knit Polo", "Stellar Mercerized Polo", "Cosmic Stripe Polo", "Lunar Premium Polo", 
            "Vanguard Golf Polo", "Summit Active Polo", "Infinity Comfort Polo", "Helix Tech Polo", 
            "Stratus Breathable Polo", "Nebula Vintage Polo", "Phoenix Textured Polo", "Titan Heavyweight Polo", 
            "Nova Stretch Polo", "Eclipse Soft Polo", "Urban Edge Polo", "Cyberpunk Modern Polo", 
            "Vortex Classic Polo", "Velocity Dry-fit Polo", "Breeze Pique Polo", "Gravity Smart Polo", 
            "Aura Fine Polo"
        ],
        'cost_range': (8.00, 15.00)
    }
}

def seed():
    print("Starting seeding...")
    
    # 1. Verify files exist
    for key, path in IMAGE_PATHS.items():
        if not os.path.exists(path):
            print(f"Error: Image for {key} at {path} does not exist!")
            return
            
    # Get categories & suppliers or verify they exist
    categories = {}
    online_categories = {}
    for key, conf in CATEGORIES_CONFIG.items():
        cat_name = conf['category_name']
        ocat_name = conf['online_category_name']
        
        try:
            categories[key] = Category.objects.get(name=cat_name)
        except Category.DoesNotExist:
            print(f"Error: Category '{cat_name}' not found in DB.")
            return
            
        try:
            online_categories[key] = OnlineCategory.objects.get(name=ocat_name)
        except OnlineCategory.DoesNotExist:
            print(f"Error: Online Category '{ocat_name}' not found in DB.")
            return

    # Use first available supplier
    supplier = Supplier.objects.first()
    if not supplier:
        print("Error: No Supplier found in DB.")
        return
    print(f"Using Supplier: {supplier.company_name} (ID: {supplier.id})")

    total_created = 0
    
    for key, conf in CATEGORIES_CONFIG.items():
        print(f"\nProcessing category: {conf['category_name']}...")
        category_obj = categories[key]
        online_category_obj = online_categories[key]
        main_img_path = IMAGE_PATHS[key]
        
        for name in conf['names']:
            # Check if this product already exists to make script idempotent/resumeable
            if Product.objects.filter(name=name).exists():
                print(f"Product '{name}' already exists. Skipping creation.")
                total_created += 1
                continue

            # Generate prices
            cost = Decimal(f"{random.uniform(*conf['cost_range']):.2f}")
            retail = Decimal(f"{cost * Decimal('2.0'):.2f}")
            wholesale = Decimal(f"{cost * Decimal('1.4'):.2f}")
            
            # Use retry loop in case of transient DB connection drops
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with transaction.atomic():
                        # Create product
                        product = Product(
                            name=name,
                            description=f"Premium high-quality {name.lower()} with modern style and standard fit.",
                            category=category_obj,
                            supplier=supplier,
                            cost_price=cost,
                            wholesale_price=wholesale,
                            retail_price=retail,
                            wholesale_cutoff=10,
                            minimum_stock=10,
                            is_active=True,
                            gender=random.choice(['UNISEX', 'MALE', 'FEMALE']),
                            assign_to_online=True,
                            is_new_arrival=random.choice([True, False]),
                            is_trending=random.choice([True, False]),
                            is_featured=random.choice([True, False])
                        )
                        
                        # Save product image
                        with open(main_img_path, 'rb') as f:
                            product.image.save(f"{key}_{os.path.basename(main_img_path)}", File(f), save=False)
                        
                        product.save() # This generates SKU
                        
                        # Link online categories (m2m)
                        product.online_categories.add(online_category_obj)
                        
                        # Create Design
                        design = Design.objects.create(
                            product=product,
                            name="Standard Fit Design",
                            description="Standard design template with regular fitting specifications."
                        )
                        
                        # Create Variations and stock movements
                        sizes = ['S', 'M', 'L', 'XL']
                        total_stock = 0
                        for size in sizes:
                            var_stock = random.randint(15, 60)
                            total_stock += var_stock
                            
                            variation = ProductVariation.objects.create(
                                design=design,
                                size=size,
                                color=conf['default_color'],
                                color_hax=conf['default_hex'],
                                stock=var_stock,
                                is_active=True,
                                assign_to_online=True
                            )
                            
                            # Create stock movement
                            StockMovement.objects.create(
                                product=product,
                                variation=variation,
                                movement_type='IN',
                                quantity=var_stock,
                                reference_number='INIT-SEED',
                                notes='Initial stock seeded programmatically.'
                            )
                            
                        # Update product stock quantity
                        product.stock_quantity = total_stock
                        product.save()
                        
                        # Create Gallery for the design
                        gallery = Gallery.objects.create(
                            design=design,
                            color=conf['default_color'],
                            color_hax=conf['default_hex'],
                            alt_text=f"Gallery view for {name}"
                        )
                        
                        # Create 4 images for the gallery repeating our 4 generated product pictures
                        image_types = [
                            ('PRIMARY', IMAGE_PATHS['hoodie']),
                            ('SECONDARY', IMAGE_PATHS['jacket']),
                            ('THIRD', IMAGE_PATHS['shirt']),
                            ('FOURTH', IMAGE_PATHS['polo'])
                        ]
                        
                        for img_type, path in image_types:
                            img_obj = Image(
                                gallery=gallery,
                                imageType=img_type,
                                alt_text=f"{name} {img_type.lower()} view"
                            )
                            with open(path, 'rb') as f:
                                img_obj.image.save(f"{img_type.lower()}_{os.path.basename(path)}", File(f), save=False)
                            img_obj.save()
                            
                        total_created += 1
                        print(f"Successfully created product: {name} ({total_created}/100)")
                        break # Success, break retry loop
                except Exception as e:
                    print(f"Error creating product '{name}' (Attempt {attempt+1}/{max_retries}): {e}")
                    if attempt == max_retries - 1:
                        raise e # Re-raise if all retries failed

    print(f"\nSuccessfully verified/created {total_created} products in the database!")

if __name__ == '__main__':
    seed()
