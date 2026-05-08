from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


PERMISSION_CATALOG = [
    # Global resources
    ("manage_categories", "Manage Categories", "global", "Create/edit/delete inventory categories."),
    ("manage_online_categories", "Manage Online Categories", "global", "Create/edit/delete e-commerce categories."),
    ("manage_brands", "Manage Brands", "global", "Create/edit/delete brands."),
    ("manage_suppliers", "Manage Suppliers", "global", "Create/edit/delete suppliers."),
    ("manage_customers", "Manage Customers", "global", "Create/edit/delete customers."),
    ("view_customers", "View Customers", "global", "Read customer profiles and history."),
    ("manage_discounts", "Manage Discounts", "global", "Create/edit/delete discounts and coupons."),
    ("manage_hero_slides", "Manage Hero Slides", "global", "Edit homepage hero slides."),
    ("manage_promotional_modals", "Manage Promotional Modals", "global", "Edit promotional modal popups."),
    ("manage_home_page_settings", "Manage Home Page Settings", "global", "Edit storefront branding/footer."),
    ("manage_product_status", "Manage Product Status", "global", "Manage e-commerce product status tags."),
    ("manage_product_catalog", "Manage Product Catalog", "global", "Create/edit catalog metadata for products."),
    ("manage_expense_categories", "Manage Expense Categories", "global", "Create/edit expense categories."),
    # Branch operations
    ("view_sales", "View Sales", "branch", "Read sales for accessible branches."),
    ("create_sale", "Create Sale", "branch", "Use POS to create a sale."),
    ("void_sale", "Void Sale", "branch", "Void / cancel a sale."),
    ("manage_due_payments", "Manage Due Payments", "branch", "Add or settle due payments."),
    ("view_expenses", "View Expenses", "branch", "Read branch expenses."),
    ("create_expense", "Create Expense", "branch", "Submit a branch expense."),
    ("approve_expense", "Approve Expense", "branch", "Approve / reject expense submissions."),
    ("view_inventory", "View Inventory", "branch", "Read inventory in accessible branches."),
    ("add_stock", "Add Stock", "branch", "Add stock to inventory."),
    ("transfer_stock", "Transfer Stock", "branch", "Initiate stock transfers between branches."),
    ("view_employees", "View Employees", "branch", "Read employee profiles."),
    ("manage_employees", "Manage Employees", "branch", "Create/edit/deactivate employees."),
    ("manage_attendance", "Manage Attendance", "branch", "Record and edit attendance."),
    ("manage_payroll", "Manage Payroll", "branch", "Run and edit payroll."),
    ("view_preorders", "View Preorders", "branch", "Read preorders."),
    ("manage_preorders", "Manage Preorders", "branch", "Create/edit/cancel preorders."),
    ("manage_online_preorders", "Manage Online Preorders", "branch", "Verify and process online preorders."),
    # System
    ("manage_branches", "Manage Branches", "system", "Create/edit/deactivate branches."),
    ("manage_accounts", "Manage Accounts", "system", "Use the Account Center."),
    ("manage_permissions", "Manage Permissions", "system", "Grant and revoke permissions."),
    ("view_audit_log", "View Audit Log", "system", "Inspect the audit log."),
    ("flush_database", "Flush Database", "system", "Wipe operational tables."),
    ("manage_settings", "Manage Settings", "system", "Edit global system settings."),
    ("view_reports", "View Reports", "system", "Access the reports module."),
    ("export_data", "Export Data", "system", "Export CSV/Excel data."),
]


def seed_catalog(apps, schema_editor):
    Permission = apps.get_model("authentication", "Permission")
    for code, name, category, description in PERMISSION_CATALOG:
        Permission.objects.update_or_create(
            code=code,
            defaults={
                "name": name,
                "category": category,
                "description": description,
            },
        )


def unseed_catalog(apps, schema_editor):
    Permission = apps.get_model("authentication", "Permission")
    Permission.objects.filter(code__in=[c for c, *_ in PERMISSION_CATALOG]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0002_multi_branch"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Permission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(db_index=True, max_length=64, unique=True)),
                ("name", models.CharField(max_length=128)),
                ("description", models.TextField(blank=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("global", "Global resources"),
                            ("branch", "Branch operations"),
                            ("system", "System"),
                        ],
                        default="branch",
                        max_length=16,
                    ),
                ),
            ],
            options={"ordering": ["category", "code"]},
        ),
        migrations.CreateModel(
            name="UserPermissionGrant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("granted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "granted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="permissions_granted",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "permission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="grants",
                        to="authentication.permission",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="permission_grants",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-granted_at"],
                "unique_together": {("user", "permission")},
            },
        ),
        migrations.RunPython(seed_catalog, unseed_catalog),
    ]
