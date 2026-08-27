import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

import random
from decimal import Decimal
from django.db import transaction
from apps.inventory.models import Product, Category, OnlineCategory, Design, ProductVariation, Gallery, Image
from apps.ecommerce.models import ProductStatus, HomePageSettings, DeliverySettings, HeroSlide

def seed_demo_ecommerce():
    print("Starting Ecommerce Demo Data Seeding...")
    with transaction.atomic():
        # 1. Delivery & Homepage settings
        delivery, _ = DeliverySettings.objects.get_or_create(id=1)
        delivery.inside_dhaka_charge = Decimal('70.00')
        delivery.outside_dhaka_charge = Decimal('130.00')
        delivery.free_delivery_cutoff = Decimal('3000.00')
        delivery.save()

        hp, _ = HomePageSettings.objects.get_or_create(id=1)
        hp.site_title = "Trendy Fashion House"
        hp.hero_title = "New Arrival Summer Collection 2026"
        hp.hero_subtitle = "Discover premium designs and three-piece apparel crafted for luxury and elegance."
        hp.save()

        # 2. Product Statuses
        status_new, _ = ProductStatus.objects.get_or_create(name="New Arrival", defaults={'slug': 'new-arrival', 'is_active': True})
        status_trending, _ = ProductStatus.objects.get_or_create(name="Trending", defaults={'slug': 'trending', 'is_active': True})
        status_featured, _ = ProductStatus.objects.get_or_create(name="Featured", defaults={'slug': 'featured', 'is_active': True})

        # 3. Online Categories
        cat_three_piece, _ = OnlineCategory.objects.get_or_create(name="Three Piece Collection", defaults={'slug': 'three-piece', 'gender': 'FEMALE'})
        cat_saree, _ = OnlineCategory.objects.get_or_create(name="Silk & Premium Sarees", defaults={'slug': 'sarees', 'gender': 'FEMALE'})
        cat_kurti, _ = OnlineCategory.objects.get_or_create(name="Designer Kurtis", defaults={'slug': 'kurtis', 'gender': 'FEMALE'})
        cat_mens, _ = OnlineCategory.objects.get_or_create(name="Men's Casual & Formal", defaults={'slug': 'mens-wear', 'gender': 'MALE'})

        category_inventory, _ = Category.objects.get_or_create(name="Clothing & Apparel", defaults={'slug': 'clothing-apparel'})

        # 4. Demo Products Blueprint
        products_data = [
          {
            "name": "Pakistani Luxury Lawn 3-Piece Suite",
            "category": cat_three_piece,
            "cost_price": "1800.00",
            "wholesale_price": "2400.00",
            "retail_price": "3200.00",
            "gender": "FEMALE",
            "status": [status_new, status_featured],
            "designs": ["Design 1 - Floral Bloom", "Design 2 - Emerald Garden", "Design 3 - Royal Blue Print"]
          },
          {
            "name": "Organza Embroidered Designer Dress",
            "category": cat_three_piece,
            "cost_price": "2200.00",
            "wholesale_price": "3100.00",
            "retail_price": "4200.00",
            "gender": "FEMALE",
            "status": [status_trending, status_featured],
            "designs": ["Design 1 - Pastel Pink", "Design 2 - Mint Elegance"]
          },
          {
            "name": "Katan Silk Traditional Party Saree",
            "category": cat_saree,
            "cost_price": "2500.00",
            "wholesale_price": "3800.00",
            "retail_price": "5200.00",
            "gender": "FEMALE",
            "status": [status_new, status_trending],
            "designs": ["Design 1 - Crimson Red", "Design 2 - Golden Zari"]
          },
          {
            "name": "Premium Cotton Casual Kurti",
            "category": cat_kurti,
            "cost_price": "650.00",
            "wholesale_price": "950.00",
            "retail_price": "1450.00",
            "gender": "FEMALE",
            "status": [status_trending],
            "designs": ["Design 1 - Indigo Dye", "Design 2 - Sunshine Yellow"]
          },
          {
            "name": "Men's Premium Slim Fit Panjabi",
            "category": cat_mens,
            "cost_price": "1200.00",
            "wholesale_price": "1700.00",
            "retail_price": "2450.00",
            "gender": "MALE",
            "status": [status_featured, status_new],
            "designs": ["Design 1 - Crisp White", "Design 2 - Navy Embroidery", "Design 3 - Charcoal Black"]
          }
        ]

        seeded_count = 0
        for p_info in products_data:
            sku_code = f"DEMO-{random.randint(1000, 9999)}"
            product = Product.objects.create(
                name=p_info["name"],
                sku=sku_code,
                description=f"High quality demo product: {p_info['name']}. Perfect for retail and online showcase.",
                category=category_inventory,
                cost_price=Decimal(p_info["cost_price"]),
                wholesale_price=Decimal(p_info["wholesale_price"]),
                retail_price=Decimal(p_info["retail_price"]),
                gender=p_info["gender"],
                is_active=True,
                assign_to_online=True,
                is_featured=status_featured in p_info["status"],
                is_new_arrival=status_new in p_info["status"],
                is_trending=status_trending in p_info["status"],
                stock_quantity=0
            )
            product.online_categories.add(p_info["category"])
            product.ecommerce_statuses.set(p_info["status"])

            total_stock = 0
            for d_name in p_info["designs"]:
                design = Design.objects.create(
                    product=product,
                    name=d_name,
                    description=f"Exclusive design pattern: {d_name}"
                )
                stock_val = random.randint(15, 60)
                total_stock += stock_val
                ProductVariation.objects.create(
                    design=design,
                    color="Standard",
                    color_hax="#FFFFFF",
                    stock=stock_val,
                    is_active=True
                )
                Gallery.objects.create(
                    design=design,
                    color="Standard",
                    color_hax="#FFFFFF",
                    alt_text=f"{product.name} - {d_name}"
                )

            product.stock_quantity = total_stock
            product.save()
            seeded_count += 1
            print(f"Created Product #{product.id}: {product.name} ({len(p_info['designs'])} Designs, {total_stock} Total Stock)")

    print(f"\nSuccessfully seeded {seeded_count} demo products with auto designs for Ecommerce storefront!")

if __name__ == "__main__":
    seed_demo_ecommerce()
