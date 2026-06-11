from decimal import Decimal

from django.test import TestCase

from .models import Product
from .serializers import EcommerceProductDetailSerializer


class EcommerceProductDetailSerializerTests(TestCase):
    def test_detail_serializer_includes_size_chart(self):
        product = Product.objects.create(
            name="Detail serializer product",
            sku="DETAIL-SERIALIZER-1",
            cost_price=Decimal("100.00"),
            wholesale_price=Decimal("120.00"),
            retail_price=Decimal("150.00"),
            assign_to_online=True,
        )

        data = EcommerceProductDetailSerializer(product).data

        self.assertIn("size_chart", data)
        self.assertEqual(data["size_chart"], [])
