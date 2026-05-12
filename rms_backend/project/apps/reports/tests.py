from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.customer.models import Customer
from apps.expenses.models import Expense, ExpenseCategory
from apps.inventory.models import Category, Product, StockMovement
from apps.preorder.models import Preorder
from apps.reports.views import ReportViewSet
from apps.sales.models import Sale, SaleItem


class ReportAccuracyTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(
            username="report-admin",
            password="secret123",
        )
        self.category = Category.objects.create(name="Saree")
        self.product = Product.objects.create(
            name="Classic Saree",
            category=self.category,
            cost_price=Decimal("60.00"),
            wholesale_price=Decimal("80.00"),
            retail_price=Decimal("100.00"),
            stock_quantity=5,
            minimum_stock=2,
        )
        self.customer = Customer.objects.create(
            first_name="Amina",
            last_name="Rahman",
            phone="+8801700000001",
        )
        self.expense_category = ExpenseCategory.objects.create(name="Rent")

        self.sale = Sale.objects.create(
            customer=self.customer,
            customer_phone=self.customer.phone,
            date=timezone.now(),
            subtotal=Decimal("0.00"),
            tax=Decimal("20.00"),
            discount=Decimal("0.00"),
            total=Decimal("0.00"),
            payment_method="cash",
            status="completed",
        )
        SaleItem.objects.create(
            sale=self.sale,
            product=self.product,
            design_name="Default",
            color="Red",
            quantity=2,
            unit_price=Decimal("100.00"),
            discount=Decimal("0.00"),
            total=Decimal("200.00"),
        )
        self.sale.refresh_from_db()

        Expense.objects.create(
            description="Shop rent",
            amount=Decimal("30.00"),
            date=timezone.now().date(),
            category=self.expense_category,
            payment_method="CASH",
            status="APPROVED",
        )

        StockMovement.objects.create(
            product=self.product,
            movement_type="OUT",
            quantity=2,
            reference_number=self.sale.invoice_number,
            notes="Sale movement",
        )

        Preorder.objects.create(
            customer_name="Nabila",
            customer_phone="+8801700000002",
            items=[
                {
                    "product_id": self.product.id,
                    "quantity": 1,
                    "unit_price": "150.00",
                    "total": "150.00",
                    "color": "Blue",
                }
            ],
            total_amount=Decimal("150.00"),
            status="COMPLETED",
            profit=Decimal("40.00"),
        )

        today = timezone.localdate()
        self.query_params = {
            "date_from": today.strftime("%Y-%m-%d"),
            "date_to": today.strftime("%Y-%m-%d"),
        }

    def _get_response(self, action_name):
        view = ReportViewSet.as_view({"get": action_name})
        request = self.factory.get(f"/reports/{action_name}/", self.query_params)
        force_authenticate(request, user=self.user)
        return view(request)

    def test_overview_uses_gross_profit_minus_expenses(self):
        response = self._get_response("overview")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data["gross_profit"])), Decimal("80.00"))
        self.assertEqual(Decimal(str(response.data["total_expenses"])), Decimal("30.00"))
        self.assertEqual(Decimal(str(response.data["net_profit"])), Decimal("50.00"))
        self.assertEqual(Decimal(str(response.data["net_revenue"])), Decimal("200.00"))
        self.assertEqual(Decimal(str(response.data["profit_margin"])), Decimal("25.00"))
        self.assertEqual(Decimal(str(response.data["total_sales"])), Decimal("220.00"))
        self.assertEqual(Decimal(str(response.data["preorder_total_revenue"])), Decimal("150.00"))

    def test_profit_loss_uses_cost_aware_net_profit_and_margin(self):
        response = self._get_response("profit_loss")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data["gross_profit"])), Decimal("80.00"))
        self.assertEqual(Decimal(str(response.data["net_profit"])), Decimal("50.00"))
        self.assertEqual(Decimal(str(response.data["net_revenue"])), Decimal("200.00"))
        self.assertEqual(response.data["profit_margin_basis"], "net_revenue")
        self.assertEqual(Decimal(str(response.data["profit_margin"])), Decimal("25.00"))
        self.assertEqual(Decimal(str(response.data["profit_by_category"][0]["cost"])), Decimal("120.00"))

    def test_inventory_valuation_uses_cost_and_returns_potential_revenue(self):
        response = self._get_response("inventory")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data["total_stock_value"])), Decimal("300.00"))
        self.assertEqual(Decimal(str(response.data["potential_revenue"])), Decimal("500.00"))
        self.assertEqual(Decimal(str(response.data["stock_by_category"][0]["total_value"])), Decimal("300.00"))
        self.assertEqual(Decimal(str(response.data["stock_movements"][0]["total_value"])), Decimal("120.00"))
        self.assertEqual(Decimal(str(response.data["low_stock_items"][0]["price"])), Decimal("60.00"))

