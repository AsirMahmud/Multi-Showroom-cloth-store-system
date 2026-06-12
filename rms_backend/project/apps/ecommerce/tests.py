from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.inventory.models import Design, Product, ProductVariation
from apps.online_preorder.models import OnlinePreorder


class PublicProductDesignColorTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Design gallery product",
            sku="DESIGN-GALLERY-1",
            cost_price=Decimal("100.00"),
            wholesale_price=Decimal("120.00"),
            retail_price=Decimal("150.00"),
            assign_to_online=True,
        )
        self.floral = Design.objects.create(product=self.product, name="Floral")
        self.striped = Design.objects.create(product=self.product, name="Striped")
        self.floral_black = ProductVariation.objects.create(
            design=self.floral,
            color="Black",
            color_hax="#000000",
            stock=2,
        )
        self.floral_red = ProductVariation.objects.create(
            design=self.floral,
            color="Red",
            color_hax="#ff0000",
            stock=3,
        )
        self.striped_black = ProductVariation.objects.create(
            design=self.striped,
            color="Black",
            color_hax="#000000",
            stock=7,
        )

    def test_selected_design_scopes_colors_and_stock(self):
        response = APIClient().get(
            reverse(
                "public-product-detail-by-color",
                kwargs={"product_id": self.product.id, "color_slug": "black"},
            ),
            {"design": "striped"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["design"]["name"], "Striped")
        self.assertEqual(response.data["total_stock_for_color"], 7)
        self.assertEqual(
            [color["color_name"] for color in response.data["available_colors"]],
            ["Black"],
        )

    def test_listing_returns_same_color_in_two_designs_as_two_products(self):
        response = APIClient().get(
            reverse("public-products-by-color"),
            {"product_id": self.product.id, "color": "Black"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            {item["combination_id"] for item in response.data["results"]},
            {self.floral_black.id, self.striped_black.id},
        )
        self.assertEqual(
            {item["design_name"] for item in response.data["results"]},
            {"Floral", "Striped"},
        )

    def test_detail_can_resolve_exact_combination(self):
        response = APIClient().get(
            reverse(
                "public-product-detail-by-color",
                kwargs={"product_id": self.product.id, "color_slug": "black"},
            ),
            {"combination_id": self.striped_black.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["combination_id"], self.striped_black.id)
        self.assertEqual(response.data["design"]["name"], "Striped")
        self.assertEqual(response.data["total_stock_for_color"], 7)

    def test_cart_prices_exact_combination_id(self):
        response = APIClient().post(
            reverse("public-cart-price"),
            {
                "items": [{
                    "productId": self.product.id,
                    "quantity": 3,
                    "variations": {
                        "combination_id": str(self.striped_black.id),
                        "color": "Black",
                        "design_name": "Floral",
                    },
                }],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["errors"], [])
        self.assertEqual(response.data["items"][0]["combination_id"], self.striped_black.id)
        self.assertEqual(response.data["items"][0]["max_stock"], 7)
        self.assertEqual(response.data["items"][0]["variant"]["design_name"], "Striped")

    def test_order_stores_combination_and_product_snapshots(self):
        response = APIClient().post(
            reverse("create-online-preorder"),
            {
                "customer_name": "Test Customer",
                "customer_phone": "01700000000",
                "items": [{
                    "product_id": self.product.id,
                    "combination_id": self.floral_black.id,
                    "quantity": 1,
                }],
                "delivery_method": "Inside Dhaka",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        preorder = OnlinePreorder.objects.get(id=response.data["id"])
        item = preorder.items[0]
        self.assertEqual(item["combination_id"], self.floral_black.id)
        self.assertEqual(item["product_name"], self.product.name)
        self.assertEqual(item["product_sku"], self.product.sku)
        self.assertEqual(item["design_name"], "Floral")
        self.assertEqual(item["color"], "Black")
