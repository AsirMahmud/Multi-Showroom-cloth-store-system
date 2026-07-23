import os
import django
import sys
from django.core.files import File

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.ecommerce.models import HomePageSettings, DeliverySettings, HeroSlide, Brand

def seed_settings():
    print("Seeding Ecommerce Settings...")
    
    # 1. Update Home Page Settings
    hps = HomePageSettings.load()
    hps.footer_tagline = "Your one-stop destination for premium fashion and lifestyle garments."
    hps.footer_address = "123 Fashion Street, Sector 11, Uttara, Dhaka, Bangladesh"
    hps.footer_phone = "+880 1712-345678"
    hps.footer_email = "info@ferdoustextile.com"
    hps.footer_facebook_url = "https://facebook.com"
    hps.footer_instagram_url = "https://instagram.com"
    hps.footer_twitter_url = "https://twitter.com"
    hps.footer_github_url = ""
    
    hps.hero_badge_text = "New Collection 2026"
    hps.hero_heading_line1 = "FIND"
    hps.hero_heading_line2 = "CLOTHES"
    hps.hero_heading_line3 = "THAT"
    hps.hero_heading_line4 = "Matches"
    hps.hero_heading_line5 = "YOUR STYLE"
    hps.hero_description = "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style."
    
    # Set hero primary image
    hero_img_path = r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\hero_primary_1781090571213.png'
    if os.path.exists(hero_img_path):
        with open(hero_img_path, 'rb') as f:
            hps.hero_primary_image.save(os.path.basename(hero_img_path), File(f), save=False)
            print("Hero primary image loaded and set.")
            
    hps.save()
    print("Home Page Settings saved successfully.")

    # 2. Update Delivery Settings
    ds = DeliverySettings.load()
    ds.inside_dhaka_charge = 60.00
    ds.inside_gazipur_charge = 80.00
    ds.outside_dhaka_charge = 120.00
    ds.save()
    print("Delivery Settings saved successfully.")

    # 3. Create a new Hero Slide
    summer_img_path = r'C:\Users\KHAN GADGET\.gemini\antigravity-ide\brain\59a4428c-4371-4550-a2e2-d820e290aec5\hero_slide_summer_1781090586973.png'
    if os.path.exists(summer_img_path):
        # Delete existing hero slides of order 2 to prevent duplicates if run multiple times
        HeroSlide.objects.filter(display_order=2).delete()
        
        slide = HeroSlide(
            title="SUMMER\nCOLLECTION",
            subtitle="Discover the lightweight breathable styles of this season.",
            button_text="Explore Collection",
            bg_color="bg-slate-900",
            layout="split-clean",
            display_order=2,
            is_active=True
        )
        with open(summer_img_path, 'rb') as f:
            slide.image.save(os.path.basename(summer_img_path), File(f), save=False)
        slide.save()
        print("Summer Collection Hero Slide created successfully.")

    # 4. Create Mock Brands
    mock_brands = [
        {"name": "Aura Wear", "logo_text": "AURA", "display_order": 1},
        {"name": "Zen Cotton", "logo_text": "ZEN", "display_order": 2},
        {"name": "Vanguard Apparel", "logo_text": "VNGD", "display_order": 3},
        {"name": "Stellar Style", "logo_text": "STLR", "display_order": 4},
        {"name": "Nomad Knitwear", "logo_text": "NMD", "display_order": 5}
    ]
    
    for brand_data in mock_brands:
        brand, created = Brand.objects.get_or_create(
            name=brand_data["name"],
            defaults={
                "logo_text": brand_data["logo_text"],
                "display_order": brand_data["display_order"],
                "is_active": True
            }
        )
        if created:
            print(f"Created Brand: {brand.name}")
        else:
            brand.logo_text = brand_data["logo_text"]
            brand.display_order = brand_data["display_order"]
            brand.save()
            print(f"Updated Brand: {brand.name}")

    print("All Ecommerce settings seeded successfully!")

if __name__ == '__main__':
    seed_settings()
