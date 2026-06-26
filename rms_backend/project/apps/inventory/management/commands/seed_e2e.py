from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.inventory.models import Category, OnlineCategory
from apps.supplier.models import Supplier


class Command(BaseCommand):
    help = "Seed the isolated RMS browser-test database."

    def handle(self, *args, **options):
        user_model = get_user_model()
        user, _ = user_model.objects.update_or_create(
            username="e2e-admin",
            defaults={
                "role": "admin",
                "is_active": True,
                "is_staff": True,
            },
        )
        user.set_password("e2e-password")
        user.save(update_fields=["password"])

        Category.objects.get_or_create(
            name="Pakistani Suits",
            defaults={"description": "E2E product category"},
        )
        OnlineCategory.objects.get_or_create(
            name="Three Piece",
            defaults={"description": "E2E online category", "gender": "FEMALE"},
        )
        Supplier.objects.get_or_create(
            contact_person="E2E Supplier",
            phone="0000000000",
            defaults={"company_name": "E2E Textiles"},
        )

        self.stdout.write(self.style.SUCCESS("Seeded RMS E2E data."))
