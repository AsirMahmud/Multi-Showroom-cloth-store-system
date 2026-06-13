from django.db import migrations


def seed_default_branch_and_backfill(apps, schema_editor):
    Branch = apps.get_model("branches", "Branch")
    CustomUser = apps.get_model("authentication", "CustomUser")
    Sale = apps.get_model("sales", "Sale")
    Expense = apps.get_model("expenses", "Expense")
    StockMovement = apps.get_model("inventory", "StockMovement")
    Preorder = apps.get_model("preorder", "Preorder")

    default_branch, _ = Branch.objects.get_or_create(
        name="Main Branch",
        defaults={"address": "Default company branch", "is_active": True},
    )

    Sale.objects.filter(branch__isnull=True).update(branch=default_branch)
    Expense.objects.filter(branch__isnull=True).update(branch=default_branch)
    StockMovement.objects.filter(branch__isnull=True).update(branch=default_branch)
    Preorder.objects.filter(branch__isnull=True).update(branch=default_branch)

    # Keep existing users functional; managers/HR can be adjusted later in admin.
    CustomUser.objects.filter(managed_branch__isnull=True).update(managed_branch=default_branch)


class Migration(migrations.Migration):
    dependencies = [
        ("branches", "0001_multi_branch"),
        ("authentication", "0002_multi_branch"),
        ("sales", "0005_multi_branch"),
        ("expenses", "0002_multi_branch"),
        ("inventory", "0018_multi_branch"),
        ("preorder", "0010_multi_branch"),
    ]

    operations = [
        migrations.RunPython(
            seed_default_branch_and_backfill, migrations.RunPython.noop
        ),
    ]
