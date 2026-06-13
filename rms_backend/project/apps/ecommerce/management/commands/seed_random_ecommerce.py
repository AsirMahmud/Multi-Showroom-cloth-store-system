from __future__ import annotations

import random
from decimal import Decimal
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand
from django.db import transaction
try:
    from PIL import Image as PILImage
except ImportError:  # pragma: no cover - fallback for environments without Pillow
    PILImage = None

from apps.ecommerce.models import ProductStatus
from apps.inventory.models import (
    Category,
    Design,
    Features,
    MeterialComposition,
    OnlineCategory,
    Product,
    ProductVariation,
    WhoIsThisFor,
)
from apps.supplier.models import Supplier


class Command(BaseCommand):
    help = "Seed random ecommerce-ready demo products for storefront testing."

    DEMO_SKU_PREFIX = "ECOM-DEMO"

    CATEGORY_BLUEPRINTS = [
        {"name": "Oversized Tees", "gender": "UNISEX", "root": "Unisex", "base_price": 890},
        {"name": "Graphic Tees", "gender": "UNISEX", "root": "Unisex", "base_price": 950},
        {"name": "Casual Shirts", "gender": "MALE", "root": "Men", "base_price": 1450},
        {"name": "Polo Shirts", "gender": "MALE", "root": "Men", "base_price": 1290},
        {"name": "Hoodies", "gender": "UNISEX", "root": "Unisex", "base_price": 1890},
        {"name": "Jackets", "gender": "MALE", "root": "Men", "base_price": 2490},
        {"name": "Kurtis", "gender": "FEMALE", "root": "Women", "base_price": 1690},
        {"name": "Co-ord Sets", "gender": "FEMALE", "root": "Women", "base_price": 2190},
        {"name": "Trousers", "gender": "FEMALE", "root": "Women", "base_price": 1190},
        {"name": "Denim", "gender": "UNISEX", "root": "Unisex", "base_price": 1990},
    ]

    COLORS = [
        ("Black", "#111111"),
        ("White", "#F5F5F5"),
        ("Navy", "#1E3A5F"),
        ("Olive", "#556B2F"),
        ("Maroon", "#7F1D1D"),
        ("Beige", "#D6C3A5"),
        ("Sky Blue", "#7EC8E3"),
        ("Charcoal", "#36454F"),
        ("Mustard", "#D4A017"),
        ("Teal", "#0F766E"),
        ("Rust", "#B7410E"),
        ("Blush", "#E8A0BF"),
    ]

    MATERIALS = [
        ("Cotton", 100),
        ("Cotton", 80),
        ("Polyester", 20),
        ("Linen", 55),
        ("Viscose", 45),
        ("Denim Cotton", 70),
        ("Spandex", 5),
        ("French Terry", 60),
        ("Rayon", 40),
    ]

    ADJECTIVES = [
        "Urban",
        "Everyday",
        "Relaxed",
        "Studio",
        "Heritage",
        "Signature",
        "Essential",
        "Weekend",
        "Nomad",
        "Classic",
        "Modern",
        "Cloud",
    ]

    NOUNS = [
        "Edit",
        "Line",
        "Fit",
        "Layer",
        "Form",
        "Pulse",
        "Wave",
        "Craft",
        "Ease",
        "Motion",
        "Thread",
        "Canvas",
    ]

    AUDIENCE_SEGMENTS = [
        ("Daily Wear", "Easy to wear for office runs, coffee breaks, and evening hangouts."),
        ("Travel Ready", "Lightweight and wrinkle-friendly for quick packing and long days out."),
        ("Minimal Wardrobe", "Built for shoppers who prefer a few versatile pieces over a crowded closet."),
        ("Gift Friendly", "A safe pick when you want a polished present without guessing trends too hard."),
    ]

    FEATURE_POOL = [
        ("Soft Touch Finish", "Feels broken-in from day one without losing structure."),
        ("Breathable Fabric", "Designed to stay comfortable in humid weather."),
        ("Easy Styling", "Pairs cleanly with denim, trousers, or layered outerwear."),
        ("Colorfast Dye", "Holds its tone better through regular washing."),
        ("Clean Silhouette", "Cut to look sharp without feeling restrictive."),
        ("Low Maintenance", "Simple care routine for everyday use."),
    ]

    STATUS_BLUEPRINTS = [
        ("New Arrival", True),
        ("Trending", True),
        ("Featured", True),
        ("Best Seller", False),
    ]

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=100, help="Number of demo products to create or update.")
        parser.add_argument("--seed", type=int, default=20260610, help="Random seed for reproducible demo data.")
        parser.add_argument(
            "--with-images",
            action="store_true",
            help="Generate simple placeholder uploads for product images. Slower, so disabled by default.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count = max(1, options["count"])
        rng = random.Random(options["seed"])
        with_images = options["with_images"]

        supplier = self._get_supplier()
        categories = self._get_categories()
        statuses = self._get_statuses()

        created = 0
        updated = 0

        for index in range(1, count + 1):
            blueprint = rng.choice(self.CATEGORY_BLUEPRINTS)
            product_name = self._build_product_name(rng, blueprint["name"], index)
            sku = f"{self.DEMO_SKU_PREFIX}-{index:03d}"
            cost_price, wholesale_price, retail_price = self._build_prices(rng, blueprint["base_price"])

            product, was_created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": product_name,
                    "barcode": f"{880000000000 + index}",
                    "description": self._build_description(rng, blueprint["name"]),
                    "category": categories[blueprint["name"]]["category"],
                    "online_category": categories[blueprint["name"]]["online"],
                    "supplier": supplier,
                    "cost_price": cost_price,
                    "wholesale_price": wholesale_price,
                    "retail_price": retail_price,
                    "minimum_stock": 5,
                    "gender": blueprint["gender"],
                    "assign_to_online": True,
                    "is_active": True,
                },
            )

            if was_created:
                created += 1
            else:
                updated += 1

            product.name = product_name
            product.barcode = f"{880000000000 + index}"
            product.description = self._build_description(rng, blueprint["name"])
            product.category = categories[blueprint["name"]]["category"]
            product.online_category = categories[blueprint["name"]]["online"]
            product.supplier = supplier
            product.cost_price = cost_price
            product.wholesale_price = wholesale_price
            product.retail_price = retail_price
            product.minimum_stock = 5
            product.gender = blueprint["gender"]
            product.assign_to_online = True
            product.is_active = True
            product.is_new_arrival = False
            product.is_trending = False
            product.is_featured = False
            if with_images:
                product.image = self._build_product_image(product_name, rng.choice(self.COLORS)[1])
            product.save()

            product.online_categories.set([categories[blueprint["name"]]["root"], categories[blueprint["name"]]["online"]])
            product.ecommerce_statuses.clear()
            self._apply_statuses(product, statuses, rng)
            self._reset_related_content(product)
            self._seed_story_blocks(product, rng)
            self._seed_variations(product, rng)
            product.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Random ecommerce demo data ready: {created} created, {updated} updated, target count {count}."
            )
        )

    def _get_supplier(self) -> Supplier:
        supplier, _ = Supplier.objects.get_or_create(
            phone="01700000099",
            defaults={
                "company_name": "Demo Ecommerce Sourcing Ltd",
                "contact_person": "Catalog Seeder",
                "email": "catalog-demo@example.com",
                "address": "Dhaka, Bangladesh",
                "is_active": True,
            },
        )
        supplier.company_name = "Demo Ecommerce Sourcing Ltd"
        supplier.contact_person = "Catalog Seeder"
        supplier.email = "catalog-demo@example.com"
        supplier.address = "Dhaka, Bangladesh"
        supplier.is_active = True
        supplier.save()
        return supplier

    def _get_categories(self):
        roots = {}
        mapping = {}
        for root_name, gender in (("Men", "MALE"), ("Women", "FEMALE"), ("Unisex", "UNISEX")):
            root_online, _ = OnlineCategory.objects.get_or_create(
                name=root_name,
                defaults={"gender": gender, "description": f"{root_name} storefront collection"},
            )
            root_online.gender = gender
            root_online.description = f"{root_name} storefront collection"
            root_online.save()
            roots[root_name] = root_online

        for order, blueprint in enumerate(self.CATEGORY_BLUEPRINTS, start=1):
            category, _ = Category.objects.get_or_create(
                name=blueprint["name"],
                defaults={"description": f"Demo retail category for {blueprint['name']}"},
            )
            online_category, _ = OnlineCategory.objects.get_or_create(
                name=blueprint["name"],
                defaults={
                    "description": f"Demo online category for {blueprint['name']}",
                    "parent": roots[blueprint["root"]],
                    "gender": blueprint["gender"],
                    "order": order,
                },
            )
            online_category.parent = roots[blueprint["root"]]
            online_category.gender = blueprint["gender"]
            online_category.order = order
            online_category.description = f"Demo online category for {blueprint['name']}"
            online_category.save()
            mapping[blueprint["name"]] = {
                "category": category,
                "online": online_category,
                "root": roots[blueprint["root"]],
            }
        return mapping

    def _get_statuses(self):
        statuses = {}
        for order, (name, display_on_home) in enumerate(self.STATUS_BLUEPRINTS, start=1):
            status, _ = ProductStatus.objects.get_or_create(
                name=name,
                defaults={
                    "display_order": order,
                    "display_on_home": display_on_home,
                    "is_active": True,
                },
            )
            status.display_order = order
            status.display_on_home = display_on_home
            status.is_active = True
            status.save()
            statuses[name] = status
        return statuses

    def _build_product_name(self, rng: random.Random, category_name: str, index: int) -> str:
        return f"{rng.choice(self.ADJECTIVES)} {rng.choice(self.NOUNS)} {category_name} {index:03d}"

    def _build_description(self, rng: random.Random, category_name: str) -> str:
        sentence_a = f"A {category_name.lower()} built for regular rotation with a cleaner, more polished finish."
        sentence_b = rng.choice(
            [
                "Works equally well for weekday errands and low-key evenings out.",
                "Balanced enough for everyday wear while still feeling intentionally styled.",
                "Designed to be easy to pair, easy to wear, and easy to reorder when testing flows.",
            ]
        )
        sentence_c = rng.choice(
            [
                "The fabric focus stays on comfort, airflow, and reliable shape through repeat wear.",
                "The cut leans relaxed without looking oversized or sloppy on the body.",
                "The overall feel is modern, soft, and straightforward to merchandise online.",
            ]
        )
        return " ".join([sentence_a, sentence_b, sentence_c])

    def _build_prices(self, rng: random.Random, base_price: int):
        retail = Decimal(str(base_price + rng.randint(0, 7) * 90))
        cost = (retail * Decimal("0.48")).quantize(Decimal("0.01"))
        wholesale = (retail * Decimal("0.82")).quantize(Decimal("0.01"))
        return cost, wholesale, retail.quantize(Decimal("0.01"))

    def _build_product_image(self, product_name: str, hex_color: str) -> SimpleUploadedFile:
        if PILImage is None:
            return None
        image = PILImage.new("RGB", (1200, 1200), self._hex_to_rgb(hex_color))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        filename = f"{product_name.lower().replace(' ', '-')}.png"
        return SimpleUploadedFile(filename, buffer.read(), content_type="image/png")

    def _apply_statuses(self, product: Product, statuses: dict[str, ProductStatus], rng: random.Random) -> None:
        chosen = []
        if rng.random() < 0.55:
            chosen.append(statuses["New Arrival"])
            product.is_new_arrival = True
        if rng.random() < 0.45:
            chosen.append(statuses["Trending"])
            product.is_trending = True
        if rng.random() < 0.35:
            chosen.append(statuses["Featured"])
            product.is_featured = True
        if rng.random() < 0.20:
            chosen.append(statuses["Best Seller"])

        if not chosen:
            chosen.append(statuses["New Arrival"])
            product.is_new_arrival = True

        product.save()
        product.ecommerce_statuses.set(chosen)

    def _reset_related_content(self, product: Product) -> None:
        product.designs.all().delete()
        product.material_compositions.all().delete()
        product.who_is_this_for.all().delete()
        product.features.all().delete()

    def _seed_story_blocks(self, product: Product, rng: random.Random) -> None:
        material_choices = rng.sample(self.MATERIALS, k=2)
        total = material_choices[0][1] + material_choices[1][1]
        scale = Decimal("100") / Decimal(str(total))
        percentages = [
            int((Decimal(str(material_choices[0][1])) * scale).quantize(Decimal("1"))),
            100,
        ]
        percentages[1] -= percentages[0]

        for (name, _), percent in zip(material_choices, percentages):
            MeterialComposition.objects.create(product=product, title=name, percentige=percent)

        for title, description in rng.sample(self.AUDIENCE_SEGMENTS, k=2):
            WhoIsThisFor.objects.create(product=product, title=title, description=description)

        for title, description in rng.sample(self.FEATURE_POOL, k=3):
            Features.objects.create(product=product, title=title, description=description)

    def _seed_variations(self, product: Product, rng: random.Random) -> None:
        design = Design.objects.create(
            product=product,
            name="Core Edition",
            description="Single design version for quick storefront testing.",
        )
        for color_name, color_hex in rng.sample(self.COLORS, k=rng.randint(2, 4)):
            ProductVariation.objects.create(
                design=design,
                size="Standard",
                color=color_name,
                color_hax=color_hex,
                stock=rng.randint(4, 40),
                assign_to_online=True,
                is_active=True,
            )

    def _hex_to_rgb(self, value: str):
        value = value.lstrip("#")
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
