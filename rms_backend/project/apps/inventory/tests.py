import shutil
import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import Design, Gallery, Image, Product, ProductVariation
from .serializers import (
    ColorImagesUploadSerializer,
    EcommerceProductDetailSerializer,
    ProductCreateSerializer,
    ProductSerializer,
)
from .views import ImageViewSet, ProductViewSet


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

    def test_upload_color_image_endpoint_creates_gallery_image(self):
        media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media_root, True)

        user = get_user_model().objects.create_user(
            username="inventory-upload-test",
            password="test-password",
            role="admin",
        )
        image = SimpleUploadedFile(
            "black.gif",
            (
                b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
                b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,"
                b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
                b"D\x01\x00;"
            ),
            content_type="image/gif",
        )
        request = APIRequestFactory().post(
            f"/api/inventory/products/{self.product.id}/upload_color_images/",
            {
                "design_id": self.floral.id,
                "color": "Black",
                "color_hax": "#000000",
                "alt_text": "Black floral three piece",
                "images": [image],
                "image_types": ["PRIMARY"],
            },
            format="multipart",
        )
        force_authenticate(request, user=user)

        with self.settings(MEDIA_ROOT=media_root):
            response = ProductViewSet.as_view(
                {"post": "upload_color_images"}
            )(request, pk=self.product.id)

        self.assertEqual(response.status_code, 201, response.data)
        uploaded = Image.objects.get(
            gallery__design=self.floral,
            gallery__color="Black",
            imageType="PRIMARY",
        )
        self.assertEqual(uploaded.alt_text, "Black floral three piece")

    def test_product_create_endpoint_creates_designs_and_colors(self):
        user = get_user_model().objects.create_user(
            username="inventory-create-test",
            password="test-password",
            role="admin",
        )
        request = APIRequestFactory().post(
            "/api/inventory/products/",
            {
                "name": "Pakistani Three Piece",
                "description": "Three-piece lawn suit",
                "cost_price": "1000.00",
                "wholesale_price": "1300.00",
                "retail_price": "1600.00",
                "wholesale_cutoff": 10,
                "minimum_stock": 5,
                "is_active": True,
                "gender": "FEMALE",
                "designs": [
                    {
                        "name": "Floral",
                        "colors": [
                            {
                                "color": "Black",
                                "color_hax": "#000000",
                                "stock": 7,
                            }
                        ],
                    }
                ],
            },
            format="json",
        )
        force_authenticate(request, user=user)

        response = ProductViewSet.as_view({"post": "create"})(request)

        self.assertEqual(response.status_code, 201, response.data)
        product = Product.objects.get(id=response.data["id"])
        self.assertEqual(product.stock_quantity, 7)
        self.assertTrue(
            product.designs.filter(
                name="Floral",
                colors__color="Black",
                colors__stock=7,
            ).exists()
        )

    def test_legacy_image_endpoint_creates_image_with_gallery(self):
        media_root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media_root, True)
        user = get_user_model().objects.create_user(
            username="legacy-image-test",
            password="test-password",
            role="admin",
        )
        request = APIRequestFactory().post(
            "/api/inventory/images/",
            {
                "gallery": self.floral_gallery.id,
                "imageType": "PRIMARY",
                "image": self._uploaded_image("legacy.gif"),
                "alt_text": "Legacy gallery upload",
            },
            format="multipart",
        )
        force_authenticate(request, user=user)

        with self.settings(MEDIA_ROOT=media_root):
            response = ImageViewSet.as_view({"post": "create"})(request)

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(
            Image.objects.filter(
                gallery=self.floral_gallery,
                imageType="PRIMARY",
                alt_text="Legacy gallery upload",
            ).exists()
        )

    def test_legacy_image_endpoint_requires_gallery(self):
        user = get_user_model().objects.create_user(
            username="missing-gallery-test",
            password="test-password",
            role="admin",
        )
        request = APIRequestFactory().post(
            "/api/inventory/images/",
            {
                "imageType": "PRIMARY",
                "image": self._uploaded_image("missing.gif"),
            },
            format="multipart",
        )
        force_authenticate(request, user=user)

        response = ImageViewSet.as_view({"post": "create"})(request)

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("gallery", response.data)

    def test_legacy_image_endpoint_rejects_unknown_gallery(self):
        user = get_user_model().objects.create_user(
            username="invalid-gallery-test",
            password="test-password",
            role="admin",
        )
        request = APIRequestFactory().post(
            "/api/inventory/images/",
            {
                "gallery": 999999,
                "imageType": "PRIMARY",
                "image": self._uploaded_image("invalid.gif"),
            },
            format="multipart",
        )
        force_authenticate(request, user=user)

        response = ImageViewSet.as_view({"post": "create"})(request)

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("gallery", response.data)

    @staticmethod
    def _uploaded_image(name):
        return SimpleUploadedFile(
            name,
            (
                b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
                b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,"
                b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
                b"D\x01\x00;"
            ),
            content_type="image/gif",
        )
