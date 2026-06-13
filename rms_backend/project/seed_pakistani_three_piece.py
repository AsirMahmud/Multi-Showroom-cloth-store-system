from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.db import transaction

from apps.ecommerce.models import ProductStatus
from apps.inventory.models import (
    Category,
    Design,
    Features,
    Gallery,
    Image,
    MeterialComposition,
    OnlineCategory,
    Product,
    ProductVariation,
    WhoIsThisFor,
)


ASSET_DIR = Path.cwd() / "seed_assets" / "pakistani_three_piece"

PRODUCTS = [
    {
        "sku": "PK3-NOOR-EMERALD",
        "name": "Noor Emerald Embroidered Three Piece",
        "description": (
            "An elegant Pakistani three-piece set with a richly embroidered lawn "
            "kameez, tailored trousers, and a lightweight chiffon dupatta."
        ),
        "design": "Noor Embroidered",
        "color": "Emerald Green",
        "color_hex": "#065F46",
        "image": "emerald-noor.png",
        "cost_price": "2100.00",
        "wholesale_price": "3150.00",
        "retail_price": "4250.00",
        "stock": 14,
        "materials": [("Embroidered Lawn", 70), ("Chiffon Dupatta", 30)],
        "features": [
            ("Three-piece set", "Includes embroidered kameez, trousers, and dupatta."),
            ("Festive detailing", "Antique-gold inspired threadwork and border accents."),
        ],
    },
    {
        "sku": "PK3-MEHER-MAROON",
        "name": "Meher Ivory Maroon Formal Three Piece",
        "description": (
            "A formal Pakistani three-piece ensemble pairing ivory jacquard with "
            "deep maroon embroidery and a coordinated organza dupatta."
        ),
        "design": "Meher Jacquard",
        "color": "Ivory Maroon",
        "color_hex": "#7F1D1D",
        "image": "maroon-meher.png",
        "cost_price": "2750.00",
        "wholesale_price": "3950.00",
        "retail_price": "5450.00",
        "stock": 10,
        "materials": [("Woven Jacquard", 75), ("Organza Dupatta", 25)],
        "features": [
            ("Formal three-piece", "Ivory kameez and trousers with maroon dupatta."),
            ("Detailed finish", "Embroidered neckline, cuffs, hem, and dupatta edging."),
        ],
    },
    {
        "sku": "PK3-SAHAR-BLUE",
        "name": "Sahar Powder Blue Printed Three Piece",
        "description": (
            "A fresh summer Pakistani three-piece set in breathable printed cotton "
            "with matching trousers and an airy indigo voile dupatta."
        ),
        "design": "Sahar Botanical",
        "color": "Powder Blue",
        "color_hex": "#93C5FD",
        "image": "blue-sahar.png",
        "cost_price": "1550.00",
        "wholesale_price": "2250.00",
        "retail_price": "3150.00",
        "stock": 18,
        "materials": [("Printed Cotton", 75), ("Voile Dupatta", 25)],
        "features": [
            ("Everyday three-piece", "Comfortable kameez, trousers, and printed dupatta."),
            ("Summer fabric", "Lightweight cotton and voile for warm-weather wear."),
        ],
    },
]


def attach_file(field, source_path: Path):
    with source_path.open("rb") as source:
        field.save(source_path.name, File(source), save=True)


@transaction.atomic
def run():
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
    new_arrival, _ = ProductStatus.objects.get_or_create(
        name="New Arrivals",
        defaults={"display_on_home": True, "display_order": 1, "is_active": True},
    )

    created_products = []
    for data in PRODUCTS:
        Product.objects.filter(sku=data["sku"]).delete()
        source_path = ASSET_DIR / data["image"]
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        product = Product.objects.create(
            name=data["name"],
            sku=data["sku"],
            description=data["description"],
            category=category,
            cost_price=Decimal(data["cost_price"]),
            wholesale_price=Decimal(data["wholesale_price"]),
            retail_price=Decimal(data["retail_price"]),
            minimum_stock=3,
            is_active=True,
            gender="FEMALE",
            assign_to_online=True,
            is_new_arrival=True,
        )
        product.online_categories.set([online_category])
        product.ecommerce_statuses.set([new_arrival])
        attach_file(product.image, source_path)

        design = Design.objects.create(product=product, name=data["design"])
        variation = ProductVariation.objects.create(
            design=design,
            size="Standard",
            color=data["color"],
            color_hax=data["color_hex"],
            stock=data["stock"],
            assign_to_online=True,
            is_active=True,
        )
        gallery = Gallery.objects.create(
            design=design,
            color=data["color"],
            color_hax=data["color_hex"],
            alt_text=data["name"],
        )
        image = Image(
            gallery=gallery,
            imageType="PRIMARY",
            alt_text=data["name"],
        )
        attach_file(image.image, source_path)

        for title, percentage in data["materials"]:
            MeterialComposition.objects.create(
                product=product,
                title=title,
                percentige=percentage,
            )
        WhoIsThisFor.objects.create(
            product=product,
            title="Women",
            description="Designed for festive occasions, gatherings, and polished everyday wear.",
        )
        for title, description in data["features"]:
            Features.objects.create(
                product=product,
                title=title,
                description=description,
            )

        product.save()
        created_products.append(
            {
                "product_id": product.id,
                "combination_id": variation.id,
                "sku": product.sku,
                "name": product.name,
                "stock": product.stock_quantity,
            }
        )

    return created_products


print(run())
