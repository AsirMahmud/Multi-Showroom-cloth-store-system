from django.db import migrations

def seed_permission(apps, schema_editor):
    Permission = apps.get_model("authentication", "Permission")
    Permission.objects.update_or_create(
        code="manage_landing_page",
        defaults={
            "name": "Manage Landing Page",
            "category": "global",
            "description": "Manage storefront dynamic layouts and publish updates."
        }
    )

def unseed_permission(apps, schema_editor):
    Permission = apps.get_model("authentication", "Permission")
    Permission.objects.filter(code="manage_landing_page").delete()

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_permission_userpermissiongrant'),
    ]

    operations = [
        migrations.RunPython(seed_permission, unseed_permission),
    ]
