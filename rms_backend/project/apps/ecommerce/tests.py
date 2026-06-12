from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.ecommerce.discount_utils import calculate_discounted_price
from apps.ecommerce.models import Discount
from apps.inventory.models import Design, Product, ProductVariation
from apps.inventory.pricing import normalize_product_price
from apps.online_preorder.models import OnlinePreorder
from apps.sales.serializers import SaleSerializer


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

    def test_product_price_rounding_uses_half_up_whole_taka(self):
        self.assertEqual(normalize_product_price("120.20"), Decimal("120"))
        self.assertEqual(normalize_product_price("123"), Decimal("123"))
        self.assertEqual(normalize_product_price("120.50"), Decimal("121"))
        self.assertEqual(normalize_product_price("129.90"), Decimal("130"))

    def test_product_save_normalizes_selling_prices_but_not_cost(self):
        self.product.cost_price = Decimal("100.25")
        self.product.wholesale_price = Decimal("120.20")
        self.product.retail_price = Decimal("129.90")
        self.product.save()
        self.product.refresh_from_db()

        self.assertEqual(self.product.cost_price, Decimal("100.25"))
        self.assertEqual(self.product.wholesale_price, Decimal("120.00"))
        self.assertEqual(self.product.retail_price, Decimal("130.00"))

    def test_discounted_product_price_is_rounded_after_discount(self):
        self.product.retail_price = Decimal("123.00")
        self.product.save()
        discount = Discount.objects.create(
            name="Ten percent",
            discount_type="PRODUCT",
            value=Decimal("10.00"),
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=1),
        )
        discount.products.add(self.product)

        result = calculate_discounted_price(self.product)

        self.assertEqual(result["original_price"], 123.0)
        self.assertEqual(result["final_price"], 111.0)
        self.assertEqual(result["discount_amount"], 12.0)

    def test_pos_item_discount_is_adjusted_to_a_whole_unit_price(self):
        serializer = SaleSerializer()
        prepared = serializer._prepare_items_data([{
            "product_id": self.product.id,
            "design_name": self.floral.name,
            "color": self.floral_black.color,
            "quantity": 1,
            "discount": Decimal("12.60"),
        }])

        self.assertEqual(prepared[0]["unit_price"], Decimal("150"))
        self.assertEqual(prepared[0]["discount"], Decimal("13"))


from django.contrib.auth import get_user_model
from apps.ecommerce.models import LandingPage, LandingPageSection, LandingPageCollageItem

class LandingPageOrganizerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpassword"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.landing_page, _ = LandingPage.objects.get_or_create(
            name="Main Storefront Home",
            defaults={"is_active": True}
        )

    def test_public_endpoint_returns_empty_when_no_published_sections(self):
        # Even if there are draft sections, public should return empty if there is no published section
        LandingPageSection.objects.create(
            landing_page=self.landing_page,
            section_type='HERO',
            layout_variant='existing',
            display_order=0,
            status='DRAFT'
        )
        response = self.client.get(reverse('public-landing-page'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_section_crud_and_validation(self):
        # Create draft section
        url = reverse('landing-page-sections-list')
        response = self.client.post(url, {
            'landing_page': self.landing_page.id,
            'section_type': 'HERO',
            'layout_variant': 'split-image-text',
            'display_order': 1,
            'config': {
                'title': 'Test title',
                'youtube_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }
        }, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['layout_variant'], 'split-image-text')
        # Check YouTube URL was normalized to embed format
        self.assertEqual(response.data['config']['youtube_url'], 'https://www.youtube.com/embed/dQw4w9WgXcQ')

    def test_reorder_sections(self):
        sec1 = LandingPageSection.objects.create(
            landing_page=self.landing_page, section_type='HERO', layout_variant='v1', display_order=5, status='DRAFT'
        )
        sec2 = LandingPageSection.objects.create(
            landing_page=self.landing_page, section_type='AD_BANNER', layout_variant='v1', display_order=10, status='DRAFT'
        )
        
        url = reverse('landing-page-sections-reorder')
        response = self.client.post(url, [sec2.id, sec1.id], format='json')
        self.assertEqual(response.status_code, 200)
        
        sec1.refresh_from_db()
        sec2.refresh_from_db()
        self.assertEqual(sec1.display_order, 1)
        self.assertEqual(sec2.display_order, 0)

    def test_duplicate_section(self):
        sec = LandingPageSection.objects.create(
            landing_page=self.landing_page, section_type='HERO', layout_variant='v1', display_order=1, status='DRAFT'
        )
        LandingPageCollageItem.objects.create(
            section=sec, title_override="Cat Card", display_order=0
        )
        
        url = reverse('landing-page-sections-duplicate', kwargs={'pk': sec.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 201)
        
        # Verify duplicated sections and items
        self.assertEqual(LandingPageSection.objects.filter(status='DRAFT').count(), 2)
        self.assertEqual(LandingPageCollageItem.objects.all().count(), 2)

    def test_publish_sections(self):
        # Create draft section
        sec = LandingPageSection.objects.create(
            landing_page=self.landing_page, section_type='HERO', layout_variant='v1', display_order=1, status='DRAFT'
        )
        LandingPageCollageItem.objects.create(
            section=sec, title_override="Cat Card", display_order=0
        )
        
        # Publish
        url = reverse('landing-page-sections-publish')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        
        # Verify published copies
        self.assertEqual(LandingPageSection.objects.filter(status='PUBLISHED').count(), 1)
        self.assertEqual(LandingPageCollageItem.objects.filter(section__status='PUBLISHED').count(), 1)
        
        # Verify public endpoint now returns published section
        pub_response = self.client.get(reverse('public-landing-page'))
        self.assertEqual(pub_response.status_code, 200)
        self.assertEqual(len(pub_response.data), 1)

