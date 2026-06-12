import os
import django
import sys
import random
from decimal import Decimal
from pathlib import Path

# Setup Django environment
PROJECT_ROOT = Path("d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project")
sys.path.append(str(PROJECT_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rms.settings")
django.setup()

from django.core.files import File
from django.db import transaction
from apps.inventory.models import (
    Product,
    Category,
    OnlineCategory,
    Design,
    ProductVariation,
    Gallery,
    Image,
    StockMovement,
    MeterialComposition,
    WhoIsThisFor,
    Features
)
from apps.ecommerce.models import ProductStatus
from apps.supplier.models import Supplier

# Absolute paths to the three-piece assets
ASSET_DIR = PROJECT_ROOT / "seed_assets" / "pakistani_three_piece"
COLORS_INFO = [
    {
        "color": "Emerald Green",
        "color_hex": "#065F46",
        "path": ASSET_DIR / "emerald-noor.png"
    },
    {
        "color": "Ivory Maroon",
        "color_hex": "#7F1D1D",
        "path": ASSET_DIR / "maroon-meher.png"
    },
    {
        "color": "Powder Blue",
        "color_hex": "#93C5FD",
        "path": ASSET_DIR / "blue-sahar.png"
    }
]

BRANDS = [
    "Noor", "Meher", "Sahar", "Khaadi", "Sapphire", "Zaha", "Maria.B", "Sana Safinaz",
    "Gul Ahmed", "Elan", "Zara", "Agha Noor", "Asim Jofa", "Crimson", "Mushq", "Baroque"
]

COLLECTIONS = [
    "Emerald", "Ruby", "Sapphire", "Ivory", "Maroon", "Indigo", "Lavender", "Crimson",
    "Scarlet", "Amber", "Teal", "Opal", "Quartz", "Jasmine", "Orchid", "Lily",
    "Rose", "Dahlia", "Tulip", "Violet"
]

STYLES = [
    "Embroidered", "Printed", "Formal", "Luxury", "Chiffon", "Lawn", "Cotton",
    "Jacquard", "Silk", "Organza", "Cambric", "Voile", "Georgette", "Velvet"
]

def seed_products():
    print("Verifying three-piece dress image assets...")
    for item in COLORS_INFO:
        if not item["path"].exists():
            print(f"Error: Asset not found at {item['path']}")
            sys.exit(1)
            
    print("Assets verified successfully.")
    
    # 1. Categories & Online Categories Setup
    category, _ = Category.objects.get_or_create(
        name="Pakistani Three Piece",
        defaults={"description": "Pakistani three-piece kameez, trousers, and dupatta sets."},
    )
    online_category, _ = OnlineCategory.objects.get_or_create(
        name="Pakistani Three Piece",
        defaults={
            "description": "Shop Pakistani three-piece collections.",
            "gender": "FEMALE",
            "order": 1,
        },
    )
    
    # 2. Product Status Setup
    status_new, _ = ProductStatus.objects.get_or_create(
        name="New Arrival",
        defaults={"display_on_home": True, "display_order": 1, "is_active": True}
    )
    status_trending, _ = ProductStatus.objects.get_or_create(
        name="Trending",
        defaults={"display_on_home": True, "display_order": 2, "is_active": True}
    )
    status_featured, _ = ProductStatus.objects.get_or_create(
        name="Featured",
        defaults={"display_on_home": True, "display_order": 3, "is_active": True}
    )
    
    # 3. Supplier Setup
    supplier = Supplier.objects.first()
    if not supplier:
        supplier = Supplier.objects.create(
            phone="01700000099",
            company_name="Demo Ecommerce Sourcing Ltd",
            contact_person="Catalog Seeder",
            email="catalog-demo@example.com",
            address="Dhaka, Bangladesh",
            is_active=True,
        )
        print(f"Created new supplier: {supplier.company_name}")
    else:
        print(f"Using existing supplier: {supplier.company_name}")

    # 4. Clean up previous runs of this script to avoid duplication
    print("Cleaning up old seeded products...")
    deleted_count, _ = Product.objects.filter(sku__startswith="ECOM-3PC-").delete()
    print(f"Deleted {deleted_count} old seeded products.")
    
    total_products_created = 0
    total_variations_created = 0
    
    print("\nStarting generation of 80 products...")
    
    for i in range(1, 81):
        brand = BRANDS[(i - 1) % len(BRANDS)]
        collection = COLLECTIONS[((i - 1) * 3) % len(COLLECTIONS)]
        style = STYLES[((i - 1) * 7) % len(STYLES)]
        
        name = f"{brand} {collection} {style} Three Piece {i:03d}"
        sku = f"ECOM-3PC-{i:03d}"
        
        # Calculate random prices
        cost = Decimal(f"{random.randint(1500, 3000)}.00")
        retail = Decimal(f"{int(cost * Decimal('1.50'))}.00")
        wholesale = Decimal(f"{int(cost * Decimal('1.25'))}.00")
        
        # Select a random main product image from the three available
        main_image_info = random.choice(COLORS_INFO)
        
        with transaction.atomic():
            # Create product record
            product = Product.objects.create(
                name=name,
                sku=sku,
                barcode=f"880123456{i:03d}",
                description=f"Premium {brand} {collection} collection. Crafted with authentic {style.lower()} fabric, this luxurious three-piece set offers unparalleled comfort and elegance for formal, semi-formal, or festive occasions. Complete with beautifully matching trousers and a lightweight dupatta.",
                category=category,
                supplier=supplier,
                cost_price=cost,
                wholesale_price=wholesale,
                retail_price=retail,
                wholesale_cutoff=10,
                minimum_stock=10,
                is_active=True,
                gender="FEMALE",
                assign_to_online=True,
                is_new_arrival=(i % 3 == 0),
                is_trending=(i % 4 == 0),
                is_featured=(i % 5 == 0)
            )
            
            # Attach online category and statuses
            product.online_categories.add(online_category)
            statuses_to_add = [status_new]
            if product.is_trending:
                statuses_to_add.append(status_trending)
            if product.is_featured:
                statuses_to_add.append(status_featured)
            product.ecommerce_statuses.add(*statuses_to_add)
            
            # Attach main product image
            with open(main_image_info["path"], "rb") as f:
                product.image.save(f"main_{sku}_{main_image_info['color'].lower().replace(' ', '_')}.png", File(f), save=True)
                
            # Create 2 designs per product
            designs_info = [
                {"name": f"Classic {brand} Cut", "desc": "Traditional fitting specifications with classic embroidery pattern."},
                {"name": f"Contemporary {brand} Cut", "desc": "Modern slim fitting cut with contemporary printing style."}
            ]
            
            total_product_stock = 0
            
            for design_data in designs_info:
                design = Design.objects.create(
                    product=product,
                    name=design_data["name"],
                    description=design_data["desc"]
                )
                
                # Each design gets 2 different color variations selected from the 3 colors
                chosen_colors = random.sample(COLORS_INFO, 2)
                
                for color_info in chosen_colors:
                    var_stock = random.randint(10, 45)
                    total_product_stock += var_stock
                    
                    variation = ProductVariation.objects.create(
                        design=design,
                        size="Standard",
                        color=color_info["color"],
                        color_hax=color_info["color_hex"],
                        stock=var_stock,
                        is_active=True,
                        assign_to_online=True
                    )
                    
                    # Create stock movement record
                    StockMovement.objects.create(
                        product=product,
                        variation=variation,
                        movement_type="IN",
                        quantity=var_stock,
                        reference_number="INIT-SEED",
                        notes=f"Initial seed stock of {var_stock} for {color_info['color']}."
                    )
                    
                    # Create gallery for this design-color combination
                    gallery = Gallery.objects.create(
                        design=design,
                        color=color_info["color"],
                        color_hax=color_info["color_hex"],
                        alt_text=f"Gallery view for {product.name} - {color_info['color']}"
                    )
                    
                    # Attach 3 images to the gallery:
                    # 1. PRIMARY: matching color image
                    # 2. SECONDARY: another three-piece dress image
                    # 3. THIRD: the last three-piece dress image
                    other_colors = [c for c in COLORS_INFO if c["color"] != color_info["color"]]
                    img_slots = [
                        ("PRIMARY", color_info["path"]),
                        ("SECONDARY", other_colors[0]["path"]),
                        ("THIRD", other_colors[1]["path"])
                    ]
                    
                    for image_type, img_path in img_slots:
                        img_obj = Image(
                            gallery=gallery,
                            imageType=image_type,
                            alt_text=f"{product.name} {color_info['color']} {image_type.lower()}"
                        )
                        with open(img_path, "rb") as f:
                            img_obj.image.save(
                                f"{image_type.lower()}_{sku}_{design.id}_{color_info['color'].lower().replace(' ', '_')}.png",
                                File(f),
                                save=False
                            )
                        img_obj.save()
                    
                    total_variations_created += 1
            
            # Update overall product stock count
            product.stock_quantity = total_product_stock
            product.save()
            
            # Seed extra metadata details
            MeterialComposition.objects.create(
                product=product,
                title=f"{style} Fabric",
                percentige=70
            )
            MeterialComposition.objects.create(
                product=product,
                title="Voile Dupatta",
                percentige=30
            )
            WhoIsThisFor.objects.create(
                product=product,
                title="Women",
                description="Perfect option for festive occasions, Eid festivals, and elegant social gatherings."
            )
            Features.objects.create(
                product=product,
                title="Complete Three Piece set",
                description="Includes semi-stitched or stitched kameez/kurti, matching trousers, and dupatta."
            )
            Features.objects.create(
                product=product,
                title="High-density Weaving",
                description="Breathable and durable threads designed for lasting shine and comfort."
            )
            
            total_products_created += 1
            if total_products_created % 10 == 0:
                print(f"Created {total_products_created}/80 products...")
                
    print(f"\nSeeding complete!")
    print(f"Total Products Created: {total_products_created}")
    print(f"Total Design-Color Variations Created: {total_variations_created}")

if __name__ == "__main__":
    seed_products()
