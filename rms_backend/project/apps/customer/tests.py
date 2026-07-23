from decimal import Decimal

from django.test import TestCase

from apps.customer.models import Customer
from apps.customer.serializers import CustomerSerializer
from apps.inventory.models import Category, Product
from apps.sales.models import Sale, SaleItem


class CustomerPurchaseHistorySerializerTests(TestCase):
    def test_history_supports_sale_items_without_size(self):
        category = Category.objects.create(name="Three Piece")
        product = Product.objects.create(
            name="Pink Jasmine",
            category=category,
            cost_price=Decimal("100.00"),
            wholesale_price=Decimal("150.00"),
            retail_price=Decimal("200.00"),
        )
        customer = Customer.objects.create(first_name="Test", phone="+8801700000099")
        sale = Sale.objects.create(
            customer=customer,
            customer_phone=customer.phone,
            subtotal=Decimal("200.00"),
            tax=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("200.00"),
            payment_method="cash",
            status="pending",
        )
        SaleItem.objects.create(
            sale=sale,
            product=product,
            design_name="Floral",
            color="Pink",
            quantity=1,
            unit_price=Decimal("200.00"),
            total=Decimal("200.00"),
        )

        item = CustomerSerializer(customer).data["purchase_history"][0]["items"][0]

        self.assertIsNone(item["size"])
        self.assertEqual(item["design_name"], "Floral")