from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q
from django.db import IntegrityError, transaction
from datetime import datetime
from .models import Discount, Brand, HomePageSettings, DeliverySettings, HeroSlide, PromotionalModal, ProductStatus
from .serializers import (
    DiscountSerializer, DiscountListSerializer, BrandSerializer, 
    HomePageSettingsSerializer, DeliverySettingsSerializer, 
    HeroSlideSerializer, PromotionalModalSerializer, ProductStatusSerializer
)
from django.utils.text import slugify
from apps.inventory.models import Product, ProductVariation, Gallery, Image, OnlineCategory
from apps.inventory.serializers import EcommerceProductSerializer
from apps.customer.models import Customer
from apps.online_preorder.models import OnlinePreorder
from apps.online_preorder.serializers import OnlinePreorderSerializer, OnlinePreorderCreateSerializer
from django.db.models import Sum
from decimal import Decimal
from .discount_utils import calculate_discounted_price
from apps.authentication.permissions import HasReadWritePermission


def resolve_ecommerce_combination(
    *,
    combination_id=None,
    product_id=None,
    design_name='',
    color='',
):
    """Resolve one active, online design-color combination."""
    queryset = ProductVariation.objects.select_related('design__product').filter(
        is_active=True,
        design__product__is_active=True,
        design__product__assign_to_online=True,
    )
    if combination_id:
        queryset = queryset.filter(id=combination_id)
    else:
        queryset = queryset.filter(
            design__product_id=product_id,
            design__name__iexact=design_name,
            color__iexact=color,
        )
    return queryset.first()


class DiscountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing discounts
    - List all discounts
    - Create new discount
    - Update existing discount
    - Delete discount
    - Get active discounts
    - Get expired discounts
    """
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_discounts")]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DiscountListSerializer
        return DiscountSerializer
    
    def get_queryset(self):
        queryset = Discount.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by discount type
        discount_type = self.request.query_params.get('discount_type', None)
        if discount_type:
            queryset = queryset.filter(discount_type=discount_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """Get all currently active discounts"""
        now = timezone.now()
        active_discounts = self.queryset.filter(
            is_active=True,
            status='ACTIVE',
            products__isnull=True,
            categories__isnull=True,
            online_categories__isnull=True,
            start_date__lte=now,
            end_date__gte=now
        )
        serializer = self.get_serializer(active_discounts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get all expired discounts"""
        now = timezone.now()
        expired_discounts = self.queryset.filter(
            end_date__lt=now
        )
        serializer = self.get_serializer(expired_discounts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def scheduled(self, request):
        """Get all scheduled discounts"""
        now = timezone.now()
        scheduled_discounts = self.queryset.filter(
            start_date__gt=now
        )
        serializer = self.get_serializer(scheduled_discounts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a discount"""
        discount = self.get_object()
        discount.is_active = True
        discount.save()
        serializer = self.get_serializer(discount)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a discount"""
        discount = self.get_object()
        discount.is_active = False
        discount.save()
        serializer = self.get_serializer(discount)
        return Response(serializer.data)


class ProductStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product statuses (home page sections)
    """
    queryset = ProductStatus.objects.all()
    serializer_class = ProductStatusSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_product_status")]

    def get_permissions(self):
        # Listing/retrieving stays public so the storefront can render sections.
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a discount"""
        discount = self.get_object()
        discount.is_active = False
        discount.save()
        serializer = self.get_serializer(discount)
        return Response(serializer.data)


class BrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing brands
    """
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_brands")]
    
    def get_queryset(self):
        queryset = Brand.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('display_order', 'name')


class HomePageSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing home page settings (singleton)
    """
    queryset = HomePageSettings.objects.all()
    serializer_class = HomePageSettingsSerializer
    permission_classes = [
        HasReadWritePermission(read=None, write="manage_home_page_settings")
    ]
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        """Always return the singleton instance"""
        return HomePageSettings.load()
    
    def list(self, request):
        """Return the singleton instance"""
        instance = HomePageSettings.load()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request):
        """Update or create the singleton instance"""
        instance = HomePageSettings.load()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def update(self, request, id=None):
        """Update the singleton instance"""
        instance = HomePageSettings.load()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, id=None):
        """Partially update the singleton instance"""
        instance = HomePageSettings.load()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublicHomePageSettingsView(APIView):
    """Public API endpoint for home page settings"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get home page settings for public access"""
        try:
            settings = HomePageSettings.load()
            serializer = HomePageSettingsSerializer(settings, context={'request': request})
            return Response(serializer.data)
        except HomePageSettings.DoesNotExist:
            # Return default values if settings don't exist
            return Response({
                'logo_image_url': None,
                'logo_text': None,
                'footer_tagline': None,
                'footer_address': None,
                'footer_phone': None,
                'footer_email': None,
                'footer_facebook_url': None,
                'footer_instagram_url': None,
                'footer_twitter_url': None,
                'footer_github_url': None,
                'footer_map_embed_url': None,
                'hero_badge_text': 'New Collection 2024',
                'hero_heading_line1': 'FIND',
                'hero_heading_line2': 'CLOTHES',
                'hero_heading_line3': 'THAT',
                'hero_heading_line4': 'Matches',
                'hero_heading_line5': 'YOUR STYLE',
                'hero_description': 'Browse through our diverse range of meticulously crafted garments...',
                'hero_primary_image_url': None,
                'hero_secondary_image_url': None,
                'stat_brands': '200+',
                'stat_products': '2,000+',
                'stat_customers': '30,000+',
                'collage_enabled': False,
                'collage_badge_text': None,
                'collage_heading': None,
                'collage_description': None,
                'collage_card_1_title': None,
                'collage_card_1_subtitle': None,
                'collage_card_1_link': None,
                'collage_card_1_image_url': None,
                'collage_card_2_title': None,
                'collage_card_2_subtitle': None,
                'collage_card_2_link': None,
                'collage_card_2_image_url': None,
                'collage_card_3_title': None,
                'collage_card_3_subtitle': None,
                'collage_card_3_link': None,
                'collage_card_3_image_url': None,
                'collage_card_4_title': None,
                'collage_card_4_subtitle': None,
                'collage_card_4_link': None,
                'collage_card_4_image_url': None,
            })


class PublicBrandsView(APIView):
    """Public API endpoint for active brands"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get active brands for public access"""
        brands = Brand.objects.filter(is_active=True).order_by('display_order', 'name')
        serializer = BrandSerializer(brands, many=True, context={'request': request})
        return Response(serializer.data)


class PublicProductsByColorView(APIView):
    """Public API: list each design-color combination as a separate product."""
    permission_classes = [AllowAny]

    def get_cover_image_url(self, request, variation: ProductVariation):
        product = variation.design.product
        gallery = Gallery.objects.filter(
            design=variation.design,
            color__iexact=variation.color,
        ).first()
        if gallery:
            primary = gallery.images.filter(imageType='PRIMARY').first()
            image_obj = primary or gallery.images.first()
            if image_obj and image_obj.image:
                return request.build_absolute_uri(image_obj.image.url)
        # Fallback to product.image
        if product.image:
            return request.build_absolute_uri(product.image.url)
        return None

    def get(self, request):
        """
        Returns a flat list where each color of a product is its own card.
        Optional query params:
        - search: filter by product name contains
        - category: filter by category slug
        - online_category: filter by online category slug
        - product_type(s): alias for online category slug(s), comma-separated
        - gender: filter by product gender (MALE, FEMALE, UNISEX, or men/women for convenience)
        - only_in_stock: true|false
        - price_min, price_max: numeric filters on product price
        - color(s): comma-separated color names to include
        - size(s): comma-separated sizes to include (must exist for the color)
        - sort: one of [name, price_asc, price_desc]
        - page: page number (default 1)
        - page_size: items per page (default 24)
        """
        search = request.query_params.get('search')
        category_slug = request.query_params.get('category')
        online_category_slug = request.query_params.get('online_category')
        product_types_csv = request.query_params.get('product_types') or request.query_params.get('product_type')
        gender_param = request.query_params.get('gender')
        only_in_stock = str(request.query_params.get('only_in_stock', 'false')).lower() == 'true'
        product_id = request.query_params.get('product_id')
        product_ids_csv = request.query_params.get('product_ids')
        status_slug = request.query_params.get('status')
        # Color and size filters (support both singular and plural names)
        colors_csv = request.query_params.get('colors') or request.query_params.get('color') or ''
        sizes_csv = request.query_params.get('sizes') or request.query_params.get('size') or ''
        wanted_colors = {c.strip().lower() for c in colors_csv.split(',') if c.strip()} if colors_csv else None
        wanted_sizes = {s.strip().lower() for s in sizes_csv.split(',') if s.strip()} if sizes_csv else None

        # Only return products explicitly assigned to online and active
        products = Product.objects.filter(is_active=True, assign_to_online=True).prefetch_related('online_categories').select_related('category')
        if search:
            products = products.filter(name__icontains=search)
        if category_slug:
            products = products.filter(category__slug=category_slug)
        if online_category_slug:
            # Handle parent/child category filtering
            # If the category has children, include products from child categories
            # If it's a child category, only show products in that category
            try:
                category = OnlineCategory.objects.get(slug=online_category_slug)
                # Get all child category IDs (recursively if needed)
                child_ids = [category.id]
                # Get direct children
                children = OnlineCategory.objects.filter(parent=category)
                child_ids.extend([child.id for child in children])
                # Filter products by category or any of its children
                products = products.filter(online_categories__id__in=child_ids)
            except OnlineCategory.DoesNotExist:
                # If category doesn't exist, return empty result
                products = products.none()
        # Support multiple product types (maps to online_category slugs)
        if product_types_csv:
            type_slugs = [s.strip() for s in product_types_csv.split(',') if s.strip()]
            if type_slugs:
                products = products.filter(online_categories__slug__in=type_slugs)
        # Gender filter: support both backend values (MALE, FEMALE, UNISEX) and convenience values (men, women)
        if gender_param:
            gender_lower = gender_param.strip().upper()
            # Map convenience values to backend values
            gender_mapping = {
                'MEN': 'MALE',
                'WOMEN': 'FEMALE',
                'MAN': 'MALE',
                'WOMAN': 'FEMALE',
                'UNISEX': 'UNISEX',
            }
            # Use mapping if available, otherwise use the value directly (assuming it's already MALE/FEMALE/UNISEX)
            gender_value = gender_mapping.get(gender_lower, gender_lower)
            # Filter: include products with matching gender OR UNISEX (unisex products show for all genders)
            if gender_value in ['MALE', 'FEMALE']:
                products = products.filter(
                    Q(gender=gender_value) | Q(gender='UNISEX')
                )
            elif gender_value == 'UNISEX':
                products = products.filter(gender='UNISEX')
        # Price range filter
        try:
            price_min = request.query_params.get('price_min')
            price_max = request.query_params.get('price_max')
            if price_min is not None:
                products = products.filter(retail_price__gte=price_min)
            if price_max is not None:
                products = products.filter(retail_price__lte=price_max)
        except Exception:
            pass
        if product_id:
            products = products.filter(id=product_id)
        elif product_ids_csv:
            try:
                ids = [int(x) for x in product_ids_csv.split(',') if x.strip().isdigit()]
                if ids:
                    products = products.filter(id__in=ids)
            except Exception:
                pass
        
        if status_slug:
            products = products.filter(ecommerce_statuses__slug=status_slug)

        products = products.distinct()

        result = []
        variations = ProductVariation.objects.filter(
            design__product__in=products,
            is_active=True,
        ).select_related('design__product').order_by('design__product_id', 'design_id', 'id')
        for variation in variations:
            product = variation.design.product
            color_name = variation.color.strip()
            design_name = variation.design.name.strip()
            total_stock = max(0, variation.stock)
            if wanted_colors and color_name.lower() not in wanted_colors:
                continue
            if wanted_sizes and design_name.lower() not in wanted_sizes:
                continue
            if only_in_stock and total_stock <= 0:
                continue

            discount_info = calculate_discounted_price(product)
            color_slug = slugify(color_name)
            design_slug = slugify(design_name)
            result.append({
                'combination_id': variation.id,
                'parent_product_id': product.id,
                'product_id': product.id,
                'product_name': product.name,
                'display_name': f'{product.name} - {design_name} - {color_name}',
                'product_price': str(product.retail_price),
                'discount_info': discount_info if discount_info['discount_type'] else None,
                'design_id': variation.design_id,
                'design_name': design_name,
                'design_slug': design_slug,
                'color_name': color_name,
                'color_slug': color_slug,
                'total_stock': total_stock,
                'cover_image_url': self.get_cover_image_url(request, variation),
                'product_url': (
                    f'/product/{product.id}/{color_slug}'
                    f'?design={design_slug}&combination_id={variation.id}'
                ),
            })

        # Sorting (on resulting flat list)
        sort = request.query_params.get('sort') or ''
        if sort == 'name':
            result.sort(key=lambda x: x['product_name'])
        elif sort == 'price_asc':
            result.sort(key=lambda x: float(x['product_price']))
        elif sort == 'price_desc':
            result.sort(key=lambda x: float(x['product_price']), reverse=True)

        # Pagination
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 24))
        except ValueError:
            page, page_size = 1, 24
        total = len(result)
        start = max(0, (page - 1) * page_size)
        end = start + page_size
        results_page = result[start:end]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': results_page,
        })


class PublicProductDetailByColorView(APIView):
    """Public API: product detail for a design-color combination."""
    permission_classes = [AllowAny]

    def get(self, request, product_id: int, color_slug: str):
        try:
            # Only return products explicitly assigned to online and active
            product = Product.objects.prefetch_related('online_categories').select_related('category').get(id=product_id, is_active=True, assign_to_online=True)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        # Resolve actual color name by matching slug against variations
        variations_qs = ProductVariation.objects.filter(
            design__product=product,
            is_active=True,
        ).select_related('design')
        requested_combination_id = request.query_params.get('combination_id')
        requested_design_slug = slugify(request.query_params.get('design', ''))

        # Build product-wide color metadata for backward-compatible color-only links.
        product_color_meta = {}
        for v in variations_qs:
            color_name = v.color.strip()
            color_key = slugify(color_name)
            meta = product_color_meta.setdefault(color_key, {
                'color_name': color_name,
                'color_slug': color_key,
                'total_stock': 0,
                'color_hex': v.color_hax or None,
            })
            meta['total_stock'] += max(0, v.stock)

        # Find requested color
        if color_slug not in product_color_meta:
            return Response({'detail': 'Color not found for this product'}, status=status.HTTP_404_NOT_FOUND)
        current_color_name = product_color_meta[color_slug]['color_name']

        matching_designs = []
        for variation in variations_qs.filter(color__iexact=current_color_name).select_related('design'):
            design_slug = slugify(variation.design.name)
            if not any(item['slug'] == design_slug for item in matching_designs):
                matching_designs.append({
                    'id': variation.design_id,
                    'name': variation.design.name,
                    'slug': design_slug,
                })

        selected_combination = None
        if requested_combination_id:
            try:
                selected_combination = variations_qs.get(
                    id=int(requested_combination_id),
                    color__iexact=current_color_name,
                )
            except (TypeError, ValueError, ProductVariation.DoesNotExist):
                return Response(
                    {'detail': 'Combination not found for this product'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        selected_design_meta = (
            {
                'id': selected_combination.design_id,
                'name': selected_combination.design.name,
                'slug': slugify(selected_combination.design.name),
            }
            if selected_combination
            else next(
                (item for item in matching_designs if item['slug'] == requested_design_slug),
                matching_designs[0] if matching_designs and not requested_design_slug else None,
            )
        )
        if not selected_design_meta:
            return Response({'detail': 'Design not found for this color'}, status=status.HTTP_404_NOT_FOUND)

        selected_design_id = selected_design_meta['id']
        selected_design_variations = variations_qs.filter(design_id=selected_design_id)
        current_variations = selected_design_variations.filter(color__iexact=current_color_name)
        selected_combination = selected_combination or current_variations.first()
        current_color_hex = current_variations.values_list('color_hax', flat=True).first()

        available_colors = {}
        for variation in selected_design_variations:
            variant_color = variation.color.strip()
            variant_slug = slugify(variant_color)
            meta = available_colors.setdefault(variant_slug, {
                'color_name': variant_color,
                'color_slug': variant_slug,
                'combination_id': variation.id,
                'total_stock': 0,
                'color_hex': variation.color_hax or None,
            })
            meta['total_stock'] += max(0, variation.stock)

        available_designs = []
        for design in product.designs.prefetch_related('colors').all():
            active_colors = [color for color in design.colors.all() if color.is_active]
            if not active_colors:
                continue
            selected_color = next(
                (color for color in active_colors if slugify(color.color) == color_slug),
                active_colors[0],
            )
            available_designs.append({
                'id': design.id,
                'name': design.name,
                'slug': slugify(design.name),
                'color_slug': slugify(selected_color.color),
                'combination_id': selected_color.id,
                'total_stock': sum(max(0, color.stock) for color in active_colors),
            })

        # Images for current color
        images = []
        gallery = Gallery.objects.filter(
            design_id=selected_design_id,
            color__iexact=current_color_name,
        ).first()
        if gallery:
            images_qs = gallery.images.order_by('imageType')
            for img in images_qs:
                if img.image:
                    images.append({
                        'type': img.imageType,
                        'url': request.build_absolute_uri(img.image.url)
                    })
        elif product.image:
            images.append({'type': 'PRIMARY', 'url': request.build_absolute_uri(product.image.url)})

        # Variations for current color. Grouped by design (removing size-based logic)
        # while keeping `sizes` key populated for storefront compatibility.
        variation_entries = []
        size_entries = []
        design_to_variation = {}
        for v in current_variations:
            design_name = v.design.name
            stock_qty = max(0, v.stock)
            if design_name not in design_to_variation:
                design_to_variation[design_name] = {
                    'id': v.id,
                    'combination_id': v.id,
                    'design_name': design_name,
                    'size': design_name,  # Map design_name to size for client
                    'stock_qty': stock_qty,
                    'in_stock': stock_qty > 0,
                }
            else:
                design_to_variation[design_name]['stock_qty'] += stock_qty
                design_to_variation[design_name]['in_stock'] = (
                    design_to_variation[design_name]['stock_qty'] > 0
                )
        
        for design_name, entry in design_to_variation.items():
            variation_entries.append(entry)
            size_entries.append({
                'size': design_name,
                'stock_qty': entry['stock_qty'],
                'in_stock': entry['in_stock'],
            })

        # Calculate priority-based discount
        discount_info = calculate_discounted_price(product)
        
        data = {
            'combination_id': selected_combination.id if selected_combination else None,
            'product': {
                'id': product.id,
                'name': product.name,
                'price': str(product.retail_price),
                'category': product.category.name if product.category else None,
                'online_categories': [
                    {'id': cat.id, 'name': cat.name, 'slug': cat.slug}
                    for cat in product.online_categories.all()
                ],
            },
            'discount_info': discount_info if discount_info['discount_type'] else None,
            'color': {
                'name': current_color_name,
                'slug': color_slug,
                'hex': current_color_hex,
            },
            'design': selected_design_meta,
            'images': images,
            'sizes': size_entries,
            'variations': variation_entries,
            'available_colors': list(available_colors.values()),
            'available_designs': available_designs,
            'total_stock_for_color': sum(e['stock_qty'] for e in variation_entries),
        }
        return Response(data)


class PublicDeliverySettingsView(APIView):
    """Public API: get delivery charges (inside/outside Dhaka)."""
    permission_classes = [AllowAny]

    def get(self, request):
        settings = DeliverySettings.load()
        serializer = DeliverySettingsSerializer(settings)
        return Response(serializer.data)


class DeliverySettingsView(APIView):
    """Authenticated API: update delivery charges."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = DeliverySettings.load()
        serializer = DeliverySettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings = DeliverySettings.load()
        serializer = DeliverySettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class HeroSlideViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hero slides
    """
    queryset = HeroSlide.objects.all()
    serializer_class = HeroSlideSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_hero_slides")]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = HeroSlide.objects.all()
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('display_order', 'created_at')


class PublicHeroSlidesView(APIView):
    """Public API endpoint for active hero slides"""
    permission_classes = [AllowAny]

    def get(self, request):
        slides = HeroSlide.objects.filter(is_active=True).order_by('display_order', 'created_at')
        serializer = HeroSlideSerializer(slides, many=True, context={'request': request})
        return Response(serializer.data)


class PromotionalModalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing promotional modals
    """
    queryset = PromotionalModal.objects.all()
    serializer_class = PromotionalModalSerializer
    permission_classes = [
        HasReadWritePermission(read=None, write="manage_promotional_modals")
    ]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return PromotionalModal.objects.all().order_by('-created_at')


class PublicPromotionalModalView(APIView):
    """Public API endpoint for active promotional modals"""
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        active_modals = PromotionalModal.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('-created_at')
        
        # We might only want to return one or all depending on requirements.
        # Returning all allows frontend to decide priority or display rules.
        serializer = PromotionalModalSerializer(active_modals, many=True, context={'request': request})
        return Response(serializer.data)


class PublicCartPriceView(APIView):
    """
    Public API: Accepts cart items and returns authoritative pricing.
    Body: { items: [{ productId: string|number, quantity: number }] }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        items = request.data.get('items') or []
        if not isinstance(items, list):
            return Response({'detail': 'Invalid items'}, status=status.HTTP_400_BAD_REQUEST)

        product_ids = []
        normalized = []
        for line in items:
            try:
                raw_pid = str(line.get('productId') or '')
                if '/' in raw_pid:
                    pid = int(raw_pid.split('/')[0])
                else:
                    pid = int(raw_pid)
                
                qty = int(line.get('quantity'))
                if qty <= 0:
                    continue
                variations = line.get('variations') or {}
                raw_combination_id = (
                    line.get('combination_id')
                    or line.get('combinationId')
                    or (variations.get('combination_id') if isinstance(variations, dict) else None)
                )
                combination_id = int(raw_combination_id) if raw_combination_id else None
                color = (variations.get('color') or '').strip() if isinstance(variations, dict) else ''
                design_name = (variations.get('design_name') or variations.get('design') or variations.get('size') or '').strip() if isinstance(variations, dict) else ''
                product_ids.append(pid)
                normalized.append({
                    'product_id': pid,
                    'combination_id': combination_id,
                    'quantity': qty,
                    'color': color,
                    'size': design_name,
                    'design_name': design_name
                })
            except Exception:
                continue

        # Use select_related and prefetch_related for optimized queries
        products = Product.objects.filter(
            id__in=product_ids, 
            is_active=True, 
            assign_to_online=True
        ).select_related(
            'category',
            'supplier'
        ).prefetch_related(
            'online_categories',
            'ecommerce_statuses',
            'designs__colors',
            'designs__galleries__images',
        )
        prod_map = {p.id: p for p in products}

        result_items = []
        errors = []
        subtotal = Decimal('0.00')
        for line in normalized:
            p = prod_map.get(line['product_id'])
            if not p:
                errors.append({
                    'productId': line['product_id'],
                    'code': 'PRODUCT_UNAVAILABLE',
                    'detail': 'This product is not available online.',
                })
                continue
            
            # Apply priority-based discount (Product > Category > Global)
            discount_info = calculate_discounted_price(p)
            unit_price = Decimal(str(discount_info['final_price']))
            original_price = Decimal(str(discount_info['original_price']))

            combination = resolve_ecommerce_combination(
                combination_id=line.get('combination_id'),
                product_id=p.id,
                design_name=line.get('design_name'),
                color=line.get('color'),
            )
            if combination and combination.design.product_id != p.id:
                combination = None

            if not combination:
                errors.append({
                    'productId': p.id,
                    'code': 'VARIANT_REQUIRED',
                    'detail': 'A valid design-color combination is required.',
                })
                continue
            variant_color = combination.color
            variant_design = combination.design.name
            max_stock = max(0, combination.stock)
            if max_stock <= 0:
                errors.append({
                    'productId': p.id,
                    'code': 'OUT_OF_STOCK',
                    'detail': f'{variant_color} / {variant_design} is out of stock.',
                    'variant': {'color': variant_color, 'size': variant_design},
                })
                continue
            if line['quantity'] > max_stock:
                errors.append({
                    'productId': p.id,
                    'code': 'INSUFFICIENT_STOCK',
                    'detail': f'Only {max_stock} item(s) are available.',
                    'max_stock': max_stock,
                    'variant': {'color': variant_color, 'size': variant_design},
                })
                continue

            line_total = unit_price * line['quantity']
            subtotal += line_total
            
            # Get primary image from gallery, fallback to product image
            # Use prefetched galleries to avoid additional queries
            image_url = None
            try:
                gallery = Gallery.objects.filter(
                    design__product=p,
                    design__name__iexact=variant_design,
                    color__iexact=variant_color,
                ).first()
                if gallery:
                    primary = gallery.images.filter(imageType='PRIMARY').first()
                    image = primary or gallery.images.first()
                    if image and image.image:
                        image_url = request.build_absolute_uri(image.image.url)
            except Exception:
                pass
            
            # Fallback to product's main image if no primary image found
            if not image_url and p.image:
                image_url = request.build_absolute_uri(p.image.url)
            
            result_items.append({
                'productId': p.id,
                'combination_id': combination.id,
                'name': p.name,
                'image_url': image_url,
                'unit_price': unit_price,
                'original_price': original_price,
                'discount_info': discount_info if discount_info['discount_type'] else None,
                'quantity': line['quantity'],
                'validated_quantity': line['quantity'],
                'max_stock': max_stock,
                'variant': {
                    'combination_id': combination.id,
                    'color': variant_color,
                    'size': variant_design,
                    'design_name': variant_design,
                },
                'line_total': line_total,
            })

        delivery = DeliverySettings.load()
        
        # Serialize products with full information
        product_serializer = EcommerceProductSerializer(
            list(prod_map.values()), 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'items': result_items,
            'products': product_serializer.data,  # Array of products with full info
            'subtotal': subtotal,
            'delivery': DeliverySettingsSerializer(delivery).data,
            'errors': errors,
        })


class CreateOnlinePreorderView(APIView):
    """
    Public API endpoint to create a customer and online preorder in one request.
    Accepts the full checkout payload and creates customer if needed, then creates preorder.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Create customer (if needed) and online preorder.
        Expected payload:
        {
            "customer_name": "John Doe",
            "customer_phone": "01712345678",
            "customer_email": "john@example.com",
            "shipping_address": {
                "city_corporation": "Dhaka North City Corporation",
                "thana": "Mohammadpur",
                "place": "Shahbagh",
                "address": "Full address"
            },
            "notes": "Optional notes",
            "items": [
                {
                    "product_id": 96,
                    "size": "28",
                    "color": "Purple",
                    "quantity": 1,
                    "unit_price": 12000,
                    "discount": 0
                }
            ],
            "delivery_charge": 0,
            "delivery_method": "Inside Dhaka",
            "expected_delivery_date": "2025-12-31"  # Optional
        }
        """
        # Extract customer data
        customer_name = request.data.get('customer_name', '').strip()
        customer_phone = request.data.get('customer_phone', '').strip()
        customer_email = request.data.get('customer_email', '').strip()

        # Validate required fields
        if not customer_phone:
            return Response(
                {'error': 'customer_phone is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not customer_name:
            return Response(
                {'error': 'customer_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate items
        items = request.data.get('items', [])
        if not items or not isinstance(items, list):
            return Response(
                {'error': 'items is required and must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        authoritative_items = []
        for item in items:
            try:
                product_id = int(item.get('product_id'))
                quantity = int(item.get('quantity'))
                raw_combination_id = item.get('combination_id') or item.get('combinationId')
                combination_id = int(raw_combination_id) if raw_combination_id else None
                design_name = str(item.get('design_name') or item.get('design') or item.get('size') or '').strip()
                color = str(item.get('color') or '').strip()
            except (TypeError, ValueError):
                return Response({'error': 'Invalid order item.'}, status=status.HTTP_400_BAD_REQUEST)

            if quantity <= 0 or (not combination_id and (not design_name or not color)):
                return Response(
                    {'error': 'Each item requires a positive quantity and a valid combination.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                product = Product.objects.get(
                    id=product_id,
                    is_active=True,
                    assign_to_online=True,
                )
            except Product.DoesNotExist:
                return Response(
                    {'error': f'Product {product_id} is not available.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            combination = resolve_ecommerce_combination(
                combination_id=combination_id,
                product_id=product.id,
                design_name=design_name,
                color=color,
            )
            if not combination or combination.design.product_id != product.id:
                return Response(
                    {'error': f'Combination is not available for product {product.id}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            design_name = combination.design.name
            color = combination.color
            stock = max(0, combination.stock)
            if stock < quantity:
                return Response(
                    {'error': f'Only {stock} item(s) are available for {product.name} ({color} / {design_name}).'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            discount_info = calculate_discounted_price(product)
            original_price = Decimal(str(discount_info['original_price']))
            final_price = Decimal(str(discount_info['final_price']))
            authoritative_items.append({
                'combination_id': combination.id,
                'product_id': product.id,
                'product_sku': product.sku,
                'product_name': product.name,
                'design_name': design_name,
                'size': design_name,  # for backward compatibility
                'color': color,
                'quantity': quantity,
                'unit_price': float(original_price),
                'discount': float((original_price - final_price) * quantity),
            })

        # Create or get customer
        try:
            customer = Customer.objects.get(phone=customer_phone)
            # Update customer info if provided
            if customer_name:
                name_parts = customer_name.split(maxsplit=1)
                customer.first_name = name_parts[0] if len(name_parts) > 0 else ''
                customer.last_name = name_parts[1] if len(name_parts) > 1 else ''
            if customer_email:
                # Only update email if it's not already set or if it's different
                # Handle email uniqueness - if email exists for another customer, skip updating
                try:
                    existing_customer_with_email = Customer.objects.exclude(id=customer.id).get(email=customer_email)
                    # Email already belongs to another customer, skip updating
                    pass
                except Customer.DoesNotExist:
                    # Email is available, update it
                    customer.email = customer_email
            customer.save()
        except Customer.DoesNotExist:
            # Create new customer
            name_parts = customer_name.split(maxsplit=1)
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            # Build address from shipping_address if provided
            shipping_address = request.data.get('shipping_address', {})
            address_parts = []
            if shipping_address.get('address'):
                address_parts.append(shipping_address['address'])
            if shipping_address.get('place'):
                address_parts.append(shipping_address['place'])
            if shipping_address.get('thana'):
                address_parts.append(shipping_address['thana'])
            if shipping_address.get('city_corporation'):
                address_parts.append(shipping_address['city_corporation'])
            address_text = ', '.join(address_parts) if address_parts else ''

            # Handle email uniqueness
            email_to_use = customer_email if customer_email else f"{customer_phone}@temp.com"
            if customer_email:
                try:
                    # Check if email already exists
                    Customer.objects.get(email=customer_email)
                    # Email exists, use a different one
                    email_to_use = f"{customer_phone}@temp.com"
                except Customer.DoesNotExist:
                    # Email is available
                    pass

            try:
                customer = Customer.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    phone=customer_phone,
                    email=email_to_use,
                    address=address_text,
                    gender='O'  # Default to Other
                )
            except IntegrityError:
                # Handle case where phone might have been created between check and create
                customer = Customer.objects.get(phone=customer_phone)

        # Build shipping address JSON
        shipping_address_data = request.data.get('shipping_address', {})
        
        delivery_settings = DeliverySettings.load()
        delivery_method = request.data.get('delivery_method', '')
        delivery_charges = {
            'Inside Dhaka': delivery_settings.inside_dhaka_charge,
            'Inside Gazipur': delivery_settings.inside_gazipur_charge,
            'Outside Dhaka': delivery_settings.outside_dhaka_charge,
        }
        if delivery_method not in delivery_charges:
            return Response(
                {'error': 'Invalid delivery method.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items_subtotal = sum(
            float(item.get('quantity', 0)) * float(item.get('unit_price', 0)) - float(item.get('discount', 0) or 0)
            for item in authoritative_items
        )
        delivery_charge = float(delivery_charges[delivery_method])
        total_amount = Decimal(str(items_subtotal + delivery_charge))

        # Create online preorder (standalone model)
        preorder_data = {
            'customer_name': customer_name,
            'customer_phone': customer_phone,
            'customer_email': customer_email if customer_email else '',
            'items': authoritative_items,
            'shipping_address': shipping_address_data if shipping_address_data else None,
            'delivery_charge': Decimal(str(delivery_charge)),
            'delivery_method': delivery_method,
            'total_amount': total_amount,
            'notes': request.data.get('notes', '') or '',
            'status': 'PENDING',
        }

        # Handle expected_delivery_date if provided
        expected_delivery_date = request.data.get('expected_delivery_date')
        if expected_delivery_date:
            try:
                # Parse date string if it's a string
                if isinstance(expected_delivery_date, str):
                    preorder_data['expected_delivery_date'] = datetime.strptime(expected_delivery_date, '%Y-%m-%d').date()
                else:
                    preorder_data['expected_delivery_date'] = expected_delivery_date
            except (ValueError, TypeError):
                # Invalid date format, skip it
                pass

        serializer = OnlinePreorderCreateSerializer(data=preorder_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            online_preorder = serializer.save()
        
        # Send notification alerts
        try:
            from apps.online_preorder.email_utils import send_admin_order_notification, send_customer_order_received
            send_admin_order_notification(online_preorder.id)
            send_customer_order_received(online_preorder.id)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger notifications in ecommerce view: {str(e)}")
            
        return Response(OnlinePreorderSerializer(online_preorder).data, status=status.HTTP_201_CREATED)
