from random import choices
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.text import slugify
import uuid
import os
from django.utils import timezone
from decimal import Decimal
from django.conf import settings
from apps.supplier.models import Supplier  # Import Supplier from supplier app
from django.db.models import Sum
from django.db.models.signals import post_delete
from django.dispatch import receiver
from apps.utils import optimize_image
GENDER_CHOICES = [
    ('MALE', 'Male'),
    ('FEMALE', 'Female'),
    ('UNISEX', 'Unisex'),
]

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    wholesale_cutoff = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class OnlineCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    order = models.PositiveIntegerField(default=0, db_index=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='MALE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, blank=True)
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    online_category = models.ForeignKey(OnlineCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_old')
    online_categories = models.ManyToManyField(OnlineCategory, blank=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], null=True, blank=True)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    wholesale_cutoff = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True,null=True)
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    minimum_stock = models.IntegerField(default=10)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='UNISEX')
    assign_to_online = models.BooleanField(default=False, null=True)
    # Ecommerce status fields
    is_new_arrival = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    ecommerce_statuses = models.ManyToManyField('ecommerce.ProductStatus', blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.image:
            optimize_image(self.image, max_width=1080, max_height=1080)
            
        if not self.sku and self.category:
            # Generate SKU by combining category name, timestamp, and a random component
            category_prefix = self.category.name[:3].upper()  # First 3 letters of category name
            timestamp = timezone.now().strftime('%y%m%d')  # YYMMDD format
            random_component = str(uuid.uuid4())[:4]  # First 4 characters of UUID
            self.sku = f"{category_prefix}-{timestamp}-{random_component}"
        
        # Calculate total stock from variants (through designs)
        if self.id:  # Only calculate if the product already exists
            total_variant_stock = ProductVariation.objects.filter(
                design__product=self
            ).aggregate(total=Sum('stock'))['total'] or 0
            self.stock_quantity = total_variant_stock
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def resolve_wholesale_cutoff(self):
        if self.wholesale_cutoff:
            return self.wholesale_cutoff
        if self.category and self.category.wholesale_cutoff:
            return self.category.wholesale_cutoff
        return WholesalePricingSettings.load().global_wholesale_cutoff

    def resolve_price_type(self, quantity):
        cutoff = self.resolve_wholesale_cutoff()
        if self.wholesale_price and quantity >= cutoff:
            return 'wholesale'
        return 'retail'

    def resolve_unit_price(self, quantity):
        return self.wholesale_price if self.resolve_price_type(quantity) == 'wholesale' else self.retail_price

    @property
    def galleries(self):
        from .models import Gallery
        return Gallery.objects.filter(design__product=self)

    @property
    def variations(self):
        from .models import ProductVariation
        return ProductVariation.objects.filter(design__product=self)
    
    def delete(self, *args, **kwargs):
        """Override delete to also delete the main product image and gallery folder from filesystem"""
        from django.conf import settings
        import shutil
        
        # Delete main product image
        if self.image:
            try:
                if os.path.isfile(self.image.path):
                    os.remove(self.image.path)
            except (ValueError, OSError):
                pass
        
        # Delete entire gallery folder for this product
        if self.id:
            gallery_folder = os.path.join(settings.MEDIA_ROOT, 'gallery', str(self.id))
            if os.path.exists(gallery_folder) and os.path.isdir(gallery_folder):
                try:
                    shutil.rmtree(gallery_folder)
                except OSError as e:
                    # Log error but don't stop deletion
                    print(f"Error deleting gallery folder {gallery_folder}: {e}")
        
        super().delete(*args, **kwargs)

class Design(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='designs')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} - {self.name}"

class ProductVariation(models.Model):
    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name='colors')
    size = models.CharField(max_length=50, default='Standard')
    color = models.CharField(max_length=50, default='Default')
    color_hax = models.CharField(max_length=50, default='#FFFFFF')
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    assign_to_online=models.BooleanField(default=False,null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('design', 'size', 'color')

    def __str__(self):
        return f"{self.design.product.name} - {self.design.name} - {self.color} ({self.size})"
class MeterialComposition(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='material_compositions')
    percentige=models.PositiveIntegerField()
    title = models.CharField(max_length=50,null=True,blank=True)

class WhoIsThisFor(models.Model):
      product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='who_is_this_for')
      title=models.TextField(blank=True,null=True)
      description=models.TextField(blank=True,null=True)
class Features(models.Model):
      product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='features')
      title=models.TextField(blank=True,null=True)
      description=models.TextField(blank=True,null=True)
      
      
class Gallery(models.Model):
    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name='galleries')
    color = models.CharField(max_length=50)
    color_hax=models.CharField(max_length=50,null=True,default='#ffff')  # must match ProductVariation.color
    alt_text = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ['design', 'color']

    def __str__(self):
        return f"{self.design.product.name} - {self.design.name} - {self.color}"

def gallery_upload_path(instance, filename):
    """Generate upload path: gallery/{product_id}/{design_id}/{color_name}/{imageType}.{ext}"""
    return f'gallery/{instance.gallery.design.product.id}/{instance.gallery.design.id}/{instance.gallery.color.lower()}/{instance.imageType.lower()}.{filename.split(".")[-1]}'

class Image(models.Model):
    IMAGE_TYPES = [
        ('PRIMARY', 'Primary'),
        ('SECONDARY', 'Secondary'),
        ('THIRD', 'Third'),
        ('FOURTH', 'Fourth'),
    ]
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='images')
    imageType = models.CharField(max_length=50, choices=IMAGE_TYPES)
    image = models.ImageField(upload_to=gallery_upload_path)
    alt_text = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ['gallery', 'imageType']

    def __str__(self):
        return f"{self.gallery.design.product.name} - {self.gallery.design.name} - {self.gallery.color} - {self.get_imageType_display()}"
    
    def save(self, *args, **kwargs):
        if self.image:
            optimize_image(self.image, max_width=1080, max_height=1080)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Override delete to also delete the file from filesystem"""
        if self.image:
            # Delete the file from filesystem
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)


class WholesalePricingSettings(models.Model):
    global_wholesale_cutoff = models.PositiveIntegerField(default=10)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wholesale Pricing Settings'
        verbose_name_plural = 'Wholesale Pricing Settings'

    def __str__(self):
        return "Wholesale Pricing Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'global_wholesale_cutoff': 10})
        return obj

    def delete(self, *args, **kwargs):
        pass

# class ProductImage(models.Model):
#     product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
#     variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, null=True, blank=True, related_name='images')
#     image = models.ImageField(upload_to='products/')
#     is_primary = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Image for {self.product.name}"

class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('GIFT', 'Gift Transaction'),
        ('ADJ', 'Adjustment'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, null=True, blank=True, related_name='stock_movements')
    movement_type = models.CharField(max_length=4, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reference_number = models.CharField(max_length=50, blank=True)  # For linking to purchase orders, sales, etc.
    notes = models.TextField(blank=True)
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    created_at = models.DateTimeField(auto_now_add=True)
  

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name} ({self.quantity})"

class InventoryAlert(models.Model):
    ALERT_TYPES = [
        ('LOW', 'Low Stock'),
        ('OUT', 'Out of Stock'),
        ('EXP', 'Expiring Soon'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='alerts')
    variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, null=True, blank=True, related_name='alerts')
    alert_type = models.CharField(max_length=3, choices=ALERT_TYPES)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_alerts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.product.name}"

    def resolve(self):
        self.is_active = False
        self.resolved_at = timezone.now()
        self.save()


# Signal to handle file deletion when Image is deleted
@receiver(post_delete, sender=Image)
def delete_image_file(sender, instance, **kwargs):
    """Delete the image file from filesystem when Image instance is deleted"""
    if instance.image:
        try:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        except (ValueError, OSError):
            # File might have been already deleted or path might be invalid
            pass


# Signal to handle file deletion when Gallery is deleted (cascade delete)
@receiver(post_delete, sender=Gallery)
def delete_gallery_files(sender, instance, **kwargs):
    """Delete all image files when Gallery is deleted"""
    # This is a backup in case the Image post_delete signal doesn't fire
    # The Image post_delete signal should handle individual file deletion
    pass


# Signal to handle file deletion when Product is deleted
@receiver(post_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    """Delete the main product image file from filesystem when Product instance is deleted"""
    if instance.image:
        try:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        except (ValueError, OSError):
            # File might have been already deleted or path might be invalid
            pass


# ─────────────────────────────────────────────────────────────────────────────
# Per-Branch Inventory Models
# ─────────────────────────────────────────────────────────────────────────────

class BranchProduct(models.Model):
    """Per-branch stock and optional price overrides for a product."""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="branch_products",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="branch_products",
    )
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    minimum_stock = models.IntegerField(default=10)
    cost_price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="If set, overrides product.cost_price for this branch.",
    )
    wholesale_price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="If set, overrides product.wholesale_price for this branch.",
    )
    retail_price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="If set, overrides product.retail_price for this branch.",
    )

    class Meta:
        unique_together = ("product", "branch")
        ordering = ["branch", "product"]

    def __str__(self):
        return f"{self.product.name} @ {self.branch.name}"

    @property
    def effective_cost_price(self):
        return self.cost_price_override or self.product.cost_price

    @property
    def effective_retail_price(self):
        return self.retail_price_override or self.product.retail_price


class BranchVariationStock(models.Model):
    """Per-branch stock count for a specific product variation."""
    variation = models.ForeignKey(
        ProductVariation,
        on_delete=models.CASCADE,
        related_name="branch_stocks",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="variation_stocks",
    )
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ("variation", "branch")

    def __str__(self):
        return f"{self.variation} @ {self.branch.name} ({self.stock})"


# ─────────────────────────────────────────────────────────────────────────────
# Stock Transfer System
# ─────────────────────────────────────────────────────────────────────────────

class StockTransfer(models.Model):
    """A transfer of stock between two branches."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    source_branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="outgoing_transfers",
    )
    dest_branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="incoming_transfers",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    notes = models.TextField(blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transfer_requests",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transfer_approvals",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transfer #{self.pk}: {self.source_branch} → {self.dest_branch} ({self.status})"


class StockTransferItem(models.Model):
    """A line item in a stock transfer."""
    transfer = models.ForeignKey(
        StockTransfer,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation = models.ForeignKey(
        ProductVariation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField()

    def __str__(self):
        label = self.product.name
        if self.variation:
            label += f" ({self.variation.size}/{self.variation.color})"
        return f"{label} x{self.quantity}"
