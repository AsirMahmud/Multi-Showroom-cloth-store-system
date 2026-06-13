from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authentication.models import UserRole
from apps.branches.models import AttendanceRecord, Branch, Employee, PayrollRecord
from apps.customer.models import Customer
from apps.expenses.models import Expense, ExpenseCategory
from apps.inventory.models import Category, Product, ProductVariation, StockMovement
from apps.preorder.models import Preorder
from apps.sales.models import Sale
from apps.supplier.models import Supplier


class Command(BaseCommand):
    help = "Seed realistic demo data for multi-branch RMS"

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()

        dhaka, _ = Branch.objects.get_or_create(
            name="Dhaka Central Branch",
            defaults={"address": "Gulshan Avenue, Dhaka", "is_active": True},
        )
        chittagong, _ = Branch.objects.get_or_create(
            name="Chittagong Port Branch",
            defaults={"address": "Agrabad Commercial Area, Chittagong", "is_active": True},
        )
        sylhet, _ = Branch.objects.get_or_create(
            name="Sylhet City Branch",
            defaults={"address": "Zindabazar, Sylhet", "is_active": True},
        )

        admin = self._upsert_user(
            user_model,
            username="demo_admin",
            email="admin@clothco.demo",
            password="demo12345",
            role=UserRole.ADMIN,
            managed_branch=None,
            is_staff=True,
            is_superuser=True,
        )
        manager_dhaka = self._upsert_user(
            user_model,
            username="manager_dhaka",
            email="manager.dhaka@clothco.demo",
            password="demo12345",
            role=UserRole.BRANCH_MANAGER,
            managed_branch=dhaka,
        )
        manager_ctg = self._upsert_user(
            user_model,
            username="manager_ctg",
            email="manager.ctg@clothco.demo",
            password="demo12345",
            role=UserRole.BRANCH_MANAGER,
            managed_branch=chittagong,
        )
        hr = self._upsert_user(
            user_model,
            username="demo_hr",
            email="hr@clothco.demo",
            password="demo12345",
            role=UserRole.HR,
            managed_branch=None,
        )
        hr.hr_branches.set([dhaka, chittagong, sylhet])

        supplier, _ = Supplier.objects.get_or_create(
            company_name="Cotton Source Ltd",
            contact_person="Nayeem Karim",
            phone="01730000001",
            defaults={"email": "sales@cottonsource.demo", "address": "Narayanganj"},
        )
        cat_shirt, _ = Category.objects.get_or_create(name="Shirt", defaults={"description": "All shirts"})
        cat_pant, _ = Category.objects.get_or_create(name="Pant", defaults={"description": "All pants"})

        prod_oxford = self._upsert_product("SKU-DEMO-001", "Oxford Shirt", cat_shirt, supplier, "700.00", "1000.00", "1200.00")
        prod_chino = self._upsert_product("SKU-DEMO-002", "Chino Pant", cat_pant, supplier, "900.00", "1300.00", "1550.00")

        self._upsert_variation(prod_oxford, "Standard", "Blue", 60)
        self._upsert_variation(prod_oxford, "Standard", "White", 50)
        self._upsert_variation(prod_chino, "Standard", "Khaki", 40)
        self._upsert_variation(prod_chino, "Standard", "Black", 35)

        today = date.today()
        customers = [
            ("01741000001", "Arafat", "Hossain"),
            ("01741000002", "Sadia", "Ahmed"),
            ("01741000003", "Nusrat", "Jahan"),
            ("01741000004", "Mahin", "Rahman"),
            ("01741000005", "Ishrat", "Khan"),
        ]
        customer_objs = []
        for phone, first_name, last_name in customers:
            cust, _ = Customer.objects.get_or_create(
                phone=phone,
                defaults={"first_name": first_name, "last_name": last_name, "customer_type": "shop"},
            )
            customer_objs.append(cust)

        for idx, branch in enumerate([dhaka, chittagong, sylhet], start=1):
            for offset in range(1, 6):
                total = Decimal("2500.00") + Decimal(str((idx * offset) * 350))
                Sale.objects.get_or_create(
                    invoice_number=f"INV-DEMO-{idx}{offset:02d}",
                    defaults={
                        "customer": customer_objs[(idx + offset - 1) % len(customer_objs)],
                        "customer_phone": customer_objs[(idx + offset - 1) % len(customer_objs)].phone,
                        "date": today - timedelta(days=offset),
                        "sale_type": "shop",
                        "subtotal": total,
                        "tax": Decimal("0.00"),
                        "discount": Decimal("150.00"),
                        "total": total - Decimal("150.00"),
                        "total_profit": Decimal("450.00"),
                        "total_loss": Decimal("0.00"),
                        "payment_method": "cash" if offset % 2 else "mobile",
                        "status": "completed",
                        "amount_paid": total - Decimal("150.00"),
                        "amount_due": Decimal("0.00"),
                        "gift_amount": Decimal("0.00"),
                        "notes": f"Demo sale {offset} for {branch.name}",
                        "branch": branch,
                    },
                )

        rent_cat, _ = ExpenseCategory.objects.get_or_create(name="Rent", defaults={"color": "#EF4444"})
        utility_cat, _ = ExpenseCategory.objects.get_or_create(name="Utilities", defaults={"color": "#3B82F6"})
        marketing_cat, _ = ExpenseCategory.objects.get_or_create(name="Marketing", defaults={"color": "#10B981"})

        Expense.objects.get_or_create(
            description="Dhaka Showroom Rent",
            branch=dhaka,
            date=today.replace(day=1),
            defaults={
                "amount": Decimal("48000.00"),
                "category": rent_cat,
                "payment_method": "BANK_TRANSFER",
                "status": "PAID",
            },
        )
        Expense.objects.get_or_create(
            description="Chittagong Electricity Bill",
            branch=chittagong,
            date=today - timedelta(days=3),
            defaults={
                "amount": Decimal("7600.00"),
                "category": utility_cat,
                "payment_method": "CASH",
                "status": "APPROVED",
            },
        )
        Expense.objects.get_or_create(
            description="Sylhet Facebook Campaign",
            branch=sylhet,
            date=today - timedelta(days=6),
            defaults={
                "amount": Decimal("5200.00"),
                "category": marketing_cat,
                "payment_method": "CARD",
                "status": "APPROVED",
            },
        )

        employees = [
            ("Rahim Uddin", dhaka, "Sales Executive", "22000.00", manager_dhaka),
            ("Shila Akter", dhaka, "Cashier", "20000.00", None),
            ("Tariq Hasan", chittagong, "Store Keeper", "21000.00", manager_ctg),
            ("Nila Sultana", chittagong, "Sales Executive", "20500.00", None),
            ("Moin Ahmed", sylhet, "Branch Assistant", "19000.00", None),
        ]
        employee_objs = []
        for i, (full_name, branch, designation, salary, linked_user) in enumerate(employees, start=1):
            employee, _ = Employee.objects.get_or_create(
                full_name=full_name,
                branch=branch,
                defaults={
                    "designation": designation,
                    "base_salary": Decimal(salary),
                    "email": f"employee{i}@clothco.demo",
                    "phone": f"0175000000{i}",
                    "hire_date": today - timedelta(days=90 + i * 20),
                    "user": linked_user,
                    "is_active": True,
                },
            )
            employee_objs.append(employee)

        for employee in employee_objs:
            for d in range(1, 11):
                work_day = today - timedelta(days=d)
                status = "present"
                if d in (3, 8):
                    status = "late"
                elif d == 6:
                    status = "leave"
                AttendanceRecord.objects.get_or_create(
                    employee=employee,
                    date=work_day,
                    defaults={"status": status},
                )

            PayrollRecord.objects.get_or_create(
                employee=employee,
                period_start=today.replace(day=1),
                defaults={
                    "gross_amount": employee.base_salary,
                    "deductions": Decimal("800.00"),
                    "net_amount": employee.base_salary - Decimal("800.00"),
                    "is_paid": False,
                    "notes": "Auto seeded payroll",
                },
            )

        Preorder.objects.get_or_create(
            customer_name="Tahmid Rahman",
            customer_phone="01760000001",
            status="PENDING",
            branch=dhaka,
            defaults={
                "customer_email": "tahmid@demo.com",
                "items": [
                    {
                        "product_id": prod_oxford.id,
                        "design_name": "Standard",
                        "color": "White",
                        "quantity": 2,
                        "unit_price": "1200.00",
                        "discount": "100.00",
                        "total": "2300.00",
                    }
                ],
                "deposit_paid": Decimal("500.00"),
                "total_amount": Decimal("2300.00"),
                "expected_delivery_date": today + timedelta(days=7),
                "quantity": 2,
                "profit": Decimal("700.00"),
                "unit_price": Decimal("1200.00"),
                "cost_price": Decimal("700.00"),
                "notes": "Seeded preorder example",
            },
        )

        self._ensure_stock_movement(prod_oxford, "Standard", "Blue", dhaka, 20, "IN", "STK-DEMO-DHK-001")
        self._ensure_stock_movement(prod_chino, "Standard", "Khaki", chittagong, 15, "IN", "STK-DEMO-CTG-001")

        self.stdout.write(self.style.SUCCESS("Realistic demo data seeded successfully."))
        self.stdout.write("Admin login: demo_admin / demo12345")
        self.stdout.write("HR login: demo_hr / demo12345")
        self.stdout.write("Branch managers: manager_dhaka / manager_ctg (password: demo12345)")

    def _upsert_user(self, user_model, username, email, password, role, managed_branch, is_staff=False, is_superuser=False):
        user, _ = user_model.objects.get_or_create(username=username, defaults={"email": email})
        user.email = email
        user.role = role
        user.managed_branch = managed_branch
        user.is_staff = is_staff or role == UserRole.ADMIN
        user.is_superuser = is_superuser
        user.set_password(password)
        user.save()
        return user

    def _upsert_product(self, sku, name, category, supplier, cost_price, wholesale_price, retail_price):
        product, _ = Product.objects.get_or_create(
            sku=sku,
            defaults={
                "name": name,
                "category": category,
                "supplier": supplier,
                "cost_price": Decimal(cost_price),
                "wholesale_price": Decimal(wholesale_price),
                "retail_price": Decimal(retail_price),
                "minimum_stock": 10,
                "is_active": True,
                "gender": "UNISEX",
            },
        )
        return product

    def _upsert_variation(self, product, design_name, color, stock):
        from apps.inventory.models import Design
        design, _ = Design.objects.get_or_create(
            product=product,
            name=design_name,
            defaults={"is_active": True}
        )
        variation, _ = ProductVariation.objects.get_or_create(
            design=design,
            color=color,
            defaults={"stock": stock, "color_hax": "#1f2937", "is_active": True},
        )
        if variation.stock < stock:
            variation.stock = stock
            variation.save(update_fields=["stock"])
        return variation

    def _ensure_stock_movement(self, product, design_name, color, branch, qty, movement_type, reference):
        variation = ProductVariation.objects.filter(
            design__product=product, 
            design__name=design_name, 
            color=color
        ).first()
        if not variation:
            return
        StockMovement.objects.get_or_create(
            product=product,
            variation=variation,
            reference_number=reference,
            defaults={
                "movement_type": movement_type,
                "quantity": qty,
                "notes": "Seeded stock movement",
                "branch": branch,
            },
        )
