from decimal import Decimal

from django.test import TestCase

from .models import Design, Gallery, Product, ProductVariation
from .serializers import (
    ColorImagesUploadSerializer,
    EcommerceProductDetailSerializer,
    ProductCreateSerializer,
    ProductSerializer,
)


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


class DesignColorGalleryTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Gallery product",
            sku="GALLERY-PRODUCT-1",
            cost_price=Decimal("100.00"),
            wholesale_price=Decimal("120.00"),
            retail_price=Decimal("150.00"),
        )
        self.floral = Design.objects.create(product=self.product, name="Floral")
        self.striped = Design.objects.create(product=self.product, name="Striped")
        self.floral_black = ProductVariation.objects.create(
            design=self.floral,
            color="Black",
            color_hax="#000000",
            stock=3,
        )
        self.striped_black = ProductVariation.objects.create(
            design=self.striped,
            color="Black",
            color_hax="#000000",
            stock=5,
        )
        self.floral_gallery = Gallery.objects.create(
            design=self.floral,
            color="Black",
            color_hax="#000000",
        )
        self.striped_gallery = Gallery.objects.create(
            design=self.striped,
            color="Black",
            color_hax="#000000",
        )

    def test_same_color_can_have_a_gallery_per_design(self):
        data = ProductSerializer(self.product).data

        self.assertEqual(len(data["galleries"]), 2)
        self.assertEqual(
            {gallery["design_name"] for gallery in data["galleries"]},
            {"Floral", "Striped"},
        )

    def test_nested_product_update_preserves_existing_galleries(self):
        serializer = ProductCreateSerializer(
            self.product,
            data={
                "designs": [
                    {
                        "id": self.floral.id,
                        "name": "Floral Updated",
                        "colors": [{
                            "id": self.floral_black.id,
                            "color": "Black",
                            "color_hax": "#000000",
                            "stock": 4,
                        }],
                    },
                    {
                        "id": self.striped.id,
                        "name": "Striped",
                        "colors": [{
                            "id": self.striped_black.id,
                            "color": "Black",
                            "color_hax": "#000000",
                            "stock": 5,
                        }],
                    },
                ],
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        self.assertEqual(Gallery.objects.filter(design__product=self.product).count(), 2)
        self.assertTrue(Gallery.objects.filter(id=self.floral_gallery.id).exists())
        self.assertTrue(Gallery.objects.filter(id=self.striped_gallery.id).exists())
        self.assertEqual(self.product.designs.get(id=self.floral.id).name, "Floral Updated")

    def test_gallery_upload_requires_design_id(self):
        serializer = ColorImagesUploadSerializer(data={"color": "Black", "images": []})

        self.assertFalse(serializer.is_valid())
        self.assertIn("design_id", serializer.errors)
