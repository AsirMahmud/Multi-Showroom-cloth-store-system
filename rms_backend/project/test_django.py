import os
import django
import sys

# Set up django environment
sys.path.append('d:/Web dev/Ecommerce-with-retail-management-sytstem-main/Ecommerce-with-retail-management-sytstem-main/rms_backend/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.ecommerce.models import ProductStatus, HomePageSettings, DeliverySettings, HeroSlide, Brand

print("Product Statuses:")
for ps in ProductStatus.objects.all():
    print(f"  - ID: {ps.id}, Name: {ps.name}, Slug: {ps.slug}, Home: {ps.display_on_home}")

print("\nHome Page Settings:")
try:
    hps = HomePageSettings.objects.get(pk=1)
    print(f"  - Tagline: {hps.footer_tagline}")
    print(f"  - Address: {hps.footer_address}")
    print(f"  - Phone: {hps.footer_phone}")
    print(f"  - Email: {hps.footer_email}")
    print(f"  - Hero Line 1: {hps.hero_heading_line1}")
    print(f"  - Hero Image: {hps.hero_primary_image}")
except HomePageSettings.DoesNotExist:
    print("  - Home Page Settings does not exist!")

print("\nDelivery Settings:")
try:
    ds = DeliverySettings.objects.get(pk=1)
    print(f"  - Inside Dhaka: {ds.inside_dhaka_charge}")
    print(f"  - Inside Gazipur: {ds.inside_gazipur_charge}")
    print(f"  - Outside Dhaka: {ds.outside_dhaka_charge}")
except DeliverySettings.DoesNotExist:
    print("  - Delivery Settings does not exist!")

print("\nHero Slides:")
for hs in HeroSlide.objects.all():
    print(f"  - ID: {hs.id}, Title: {hs.title}, Order: {hs.display_order}, Image: {hs.image}")

print("\nBrands:")
for b in Brand.objects.all():
    print(f"  - ID: {b.id}, Name: {b.name}, Logo: {b.logo_image}")
