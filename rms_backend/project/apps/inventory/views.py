from rest_framework import viewsets, filters, status, permissions, pagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Sum, Count, Avg, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from .models import Category, OnlineCategory, Product, Design, ProductVariation, StockMovement, InventoryAlert, MeterialComposition, WhoIsThisFor, Features, Gallery, Image, WholesalePricingSettings, StockTransfer, StockTransferItem, BranchVariationStock, BranchProduct
from apps.supplier.models import Supplier
from apps.supplier.serializers import SupplierSerializer
from .serializers import (
    CategorySerializer,
    OnlineCategorySerializer,
    ProductSerializer,
    ProductCreateSerializer,
    ProductVariationSerializer,
    ImageSerializer,
    GallerySerializer,
    ColorImagesUploadSerializer,
    StockMovementSerializer,
    InventoryAlertSerializer,
    BulkPriceUpdateSerializer,

    BulkImageUploadSerializer,
    MeterialCompositionSerializer,
    WhoIsThisForSerializer,
    FeaturesSerializer,
    EcommerceProductSerializer,
    EcommerceProductDetailSerializer,
    WholesalePricingSettingsSerializer,
    StockTransferSerializer,
    CreateStockTransferSerializer,
)
from rest_framework.exceptions import ValidationError
from apps.sales.models import SaleItem
from apps.branches.permissions import (
    get_allowed_branch_ids,
    get_requested_branch_id,
    is_admin,
)
from apps.authentication.permissions import HasReadWritePermission


def _branch_filter_q(request, field='branch_id'):
    """Build a Q object that scopes a queryset by the request's branch context.

    Returns Q() (matches everything) when the caller is admin and no branch is
    requested. Returns Q(pk__in=[]) (matches nothing) when the caller asked for
    a branch they cannot access.
    """
    requested = get_requested_branch_id(request)
    if requested:
        if not request.user.can_access_branch(requested):
            return Q(pk__in=[])
        # Include rows that explicitly belong to the branch + legacy null rows
        # so we don't lose visibility into pre-multi-branch data.
        return Q(**{field: requested}) | Q(**{f'{field}__isnull': True})
    if is_admin(request.user):
        return Q()
    allowed = get_allowed_branch_ids(request.user)
    return Q(**{f'{field}__in': allowed}) | Q(**{f'{field}__isnull': True})

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']
    # Anyone authenticated may read; write requires `manage_categories`.
    permission_classes = [HasReadWritePermission(read=None, write="manage_categories")]

    def get_queryset(self):
        queryset = Category.objects.prefetch_related('products')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        # Only return root categories (those without parent)
        if self.action == 'list':
            return queryset.filter(parent=None)
        return queryset

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        products = category.products.all()
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        category = self.get_object()
        total_products = category.products.count()
        active_products = category.products.filter(is_active=True).count()
        low_stock_products = category.products.filter(stock_quantity__lte=F('minimum_stock')).count()
        total_value = category.products.aggregate(
            total=Sum(F('retail_price') * F('stock_quantity'))
        )['total'] or 0

        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'low_stock_products': low_stock_products,
            'total_value': total_value
        })


class WholesalePricingSettingsViewSet(viewsets.ViewSet):
    permission_classes = [HasReadWritePermission(read=None, write="manage_settings")]

    def list(self, request):
        settings_obj = WholesalePricingSettings.load()
        serializer = WholesalePricingSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def create(self, request):
        settings_obj = WholesalePricingSettings.load()
        serializer = WholesalePricingSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_suppliers")]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'contact_person', 'email']

    def get_queryset(self):
        queryset = Supplier.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'online_categories', 'supplier', 'is_active']
    search_fields = ['name', 'sku', 'barcode', 'description']
    ordering_fields = ['name', 'created_at', 'stock_quantity', 'retail_price', 'wholesale_price']
    ordering = ['-created_at']
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    # Read open to authenticated users; catalog edits require manage_product_catalog.
    # Branch-scoped sub-actions like add_stock check `add_stock` separately.
    permission_classes = [HasReadWritePermission(read=None, write="manage_product_catalog")]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductSerializer

    def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs['context'] = {'request': self.request}
        return serializer_class(*args, **kwargs)

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        online_categories = self.request.query_params.getlist('online_category')
        supplier = self.request.query_params.get('supplier', None)
        is_active = self.request.query_params.get('is_active', None)
        stock_status = self.request.query_params.get('stock_status', None)

        if search:
            search_query = Q(name__icontains=search) | \
                          Q(sku__icontains=search) | \
                          Q(barcode__icontains=search) | \
                          Q(description__icontains=search)
            
            # If search is numeric, also search by ID exactly
            if search.isdigit():
                search_query |= Q(id=int(search))
                
            queryset = queryset.filter(search_query)
        
        if category:
            queryset = queryset.filter(category_id=category)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        if online_categories:
            queryset = queryset.filter(online_categories__id__in=online_categories).distinct()
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if stock_status:
            if stock_status == 'low':
                queryset = queryset.filter(stock_quantity__lte=F('minimum_stock'))
            elif stock_status == 'out':
                queryset = queryset.filter(stock_quantity=0)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive product statistics based on current filters"""
        # Get filtered queryset (respects search, category, status, stock filters)
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_products = queryset.count()
        active_products = queryset.filter(is_active=True).count()
        low_stock_products = queryset.filter(stock_quantity__lte=F('minimum_stock')).count()
        out_of_stock_products = queryset.filter(stock_quantity=0).count()
        
        # Calculate total cost (cost_price * stock_quantity)
        total_cost = queryset.aggregate(
            total=Sum(F('cost_price') * F('stock_quantity'))
        )['total'] or 0
        
        # Calculate total value (retail_price * stock_quantity)
        total_value = queryset.aggregate(
            total=Sum(F('retail_price') * F('stock_quantity'))
        )['total'] or 0
        
        # Calculate potential profit ((retail_price - cost_price) * stock_quantity)
        potential_profit = queryset.aggregate(
            total=Sum((F('retail_price') - F('cost_price')) * F('stock_quantity'))
        )['total'] or 0
        
        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'low_stock_products': low_stock_products,
            'out_of_stock_products': out_of_stock_products,
            'total_cost': float(total_cost),
            'total_value': float(total_value),
            'potential_profit': float(potential_profit),
        })

    @action(detail=False, methods=['post'])
    def bulk_price_update(self, request):
        serializer = BulkPriceUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product_ids = serializer.validated_data['product_ids']
            price_adjustment = serializer.validated_data['price_adjustment']
            adjustment_type = serializer.validated_data['adjustment_type']

            products = Product.objects.filter(id__in=product_ids)
            
            for product in products:
                if adjustment_type == 'percentage':
                    new_price = product.retail_price * (1 + price_adjustment / 100)
                else:
                    new_price = product.retail_price + price_adjustment
                product.retail_price = new_price
                product.save()

            return Response({'message': 'Prices updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        product = self.get_object()
        serializer = BulkImageUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            images = serializer.validated_data['images']
            is_primary = serializer.validated_data['is_primary']

            # This method needs to be updated for new Gallery/Image structure
            # For now, we'll skip this functionality
            pass

            return Response({'message': 'Images uploaded successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        # This method needs to be updated for new Gallery/Image structure
        # For now, we'll return an error
        return Response({'detail': 'Use upload_color_images endpoint instead'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_color_images(self, request, pk=None):
        """Upload up to 4 images for a specific color of a product."""
        product = self.get_object()
        serializer = ColorImagesUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        color = serializer.validated_data['color']
        design_id = serializer.validated_data['design_id']
        images = serializer.validated_data['images']
        image_types = serializer.validated_data.get('image_types', [])
        color_hax = serializer.validated_data.get('color_hax')
        alt_text = serializer.validated_data.get('alt_text', '')

        try:
            design = Design.objects.get(id=design_id, product=product)
        except Design.DoesNotExist:
            return Response(
                {'design_id': 'Design does not belong to this product.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not design.colors.filter(color__iexact=color).exists():
            return Response(
                {'color': 'Color does not belong to this design.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create gallery for this design and color
        gallery, created = Gallery.objects.get_or_create(
            design=design, 
            color=color,
            defaults={
                'alt_text': alt_text,
                'color_hax': color_hax or '#FFFFFF'
            }
        )
        
        # Update color_hax if gallery already exists
        if not created and color_hax:
            gallery.color_hax = color_hax
        if not created and alt_text:
            gallery.alt_text = alt_text
        if not created:
            gallery.save()

        # Use provided image_types if available, otherwise fall back to calculating based on existing count
        created_images = []
        default_image_types = ['PRIMARY', 'SECONDARY', 'THIRD', 'FOURTH']
        
        for i, image in enumerate(images):
            # Use provided imageType if available, otherwise calculate based on existing images
            if image_types and i < len(image_types):
                image_type = image_types[i]
            else:
                # Fallback: find next available image type
                existing_types = set(gallery.images.values_list('imageType', flat=True))
                for default_type in default_image_types:
                    if default_type not in existing_types:
                        image_type = default_type
                        break
                else:
                    # All types are taken, skip this image
                    continue
            
            # Check if this imageType already exists - if so, delete it first (replacing)
            existing_image = gallery.images.filter(imageType=image_type).first()
            if existing_image:
                existing_image.delete()
            
            created_images.append(Image.objects.create(
                gallery=gallery, 
                image=image, 
                imageType=image_type,
                alt_text=alt_text
            ))

        return Response(ImageSerializer(created_images, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_design(self, request, pk=None):
        product = self.get_object()
        serializer = DesignSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def designs(self, request, pk=None):
        product = self.get_object()
        designs = product.designs.all()
        serializer = DesignSerializer(designs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def galleries(self, request, pk=None):
        product = self.get_object()
        galleries = product.galleries.all()
        serializer = GallerySerializer(galleries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        """Add stock to a specific variation and record movement"""
        from .serializers import AddStockSerializer
        
        product = self.get_object()
        serializer = AddStockSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        variation_id = serializer.validated_data['variation_id']
        quantity = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')
        reference_number = serializer.validated_data.get('reference_number', 'MANUAL')

        try:
            variation = ProductVariation.objects.get(id=variation_id, design__product=product)
        except ProductVariation.DoesNotExist:
            return Response({'detail': 'Variation not found for this product'}, status=status.HTTP_404_NOT_FOUND)

        # Update variation stock
        variation.stock = variation.stock + quantity
        variation.save()

        # Record stock movement, stamping the originating branch.
        branch_id = (
            get_requested_branch_id(request)
            or request.user.managed_branch_id
        )
        StockMovement.objects.create(
            product=product,
            variation=variation,
            branch_id=branch_id,
            movement_type='IN',
            quantity=quantity,
            reference_number=reference_number,
            notes=notes or 'Stock added via add_stock action'
        )

        # Recalculate product total stock
        total_variant_stock = ProductVariation.objects.filter(design__product=product).aggregate(
            total=Sum('stock')
        )['total'] or 0
        product.stock_quantity = total_variant_stock
        product.save()

        return Response({
            'detail': 'Stock added successfully', 
            'product_id': product.id, 
            'variation_id': variation.id, 
            'new_stock': variation.stock
        })

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get comprehensive product analytics"""
        product = self.get_object()
        
        # Get date range from query params
        days_param = request.query_params.get('days')
        
        if days_param is None:
            # All-time data - no date filtering
            stock_movements = StockMovement.objects.filter(
                product=product
            ).order_by('created_at')
            
            sales_items = SaleItem.objects.filter(
                product=product,
                sale__status='completed'
            )
        else:
            # Specific time range
            days = int(days_param)
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            stock_movements = StockMovement.objects.filter(
                product=product,
                created_at__range=[start_date, end_date]
            ).order_by('created_at')
            
            sales_items = SaleItem.objects.filter(
                product=product,
                sale__date__range=[start_date, end_date],
                sale__status='completed'
            )
        
        # Stock movement analytics
        stock_in = stock_movements.filter(movement_type='IN').aggregate(
            total_quantity=Sum('quantity'),
            total_movements=Count('id')
        )
        
        stock_out = stock_movements.filter(movement_type='OUT').aggregate(
            total_quantity=Sum('quantity'),
            total_movements=Count('id')
        )
        
        # Sales analytics
        sales_analytics = sales_items.aggregate(
            total_quantity_sold=Sum('quantity'),
            total_revenue=Sum('total'),
            total_profit=Sum('profit'),
            total_loss=Sum('loss'),
            average_price=Avg('unit_price'),
            total_sales=Count('id')
        )
        
        # Monthly stock movements for chart
        monthly_stock_data = []
        if days_param is None:
            # For all-time data, get all months from the first movement to now
            first_movement = stock_movements.first()
            if first_movement:
                start_date = first_movement.created_at.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                start_date = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = timezone.now()
        
        current_date = start_date
        while current_date <= end_date:
            month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_stock_in = stock_movements.filter(
                movement_type='IN',
                created_at__range=[month_start, month_end]
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            month_stock_out = stock_movements.filter(
                movement_type='OUT',
                created_at__range=[month_start, month_end]
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            monthly_stock_data.append({
                'month': current_date.strftime('%Y-%m'),
                'stock_in': month_stock_in,
                'stock_out': month_stock_out,
                'net_change': month_stock_in - month_stock_out
            })
            
            current_date = (month_start + timedelta(days=32)).replace(day=1)
        
        # Monthly sales data for chart
        monthly_sales_data = []
        if days_param is None:
            # For all-time data, get all months from the first sale to now
            first_sale = sales_items.first()
            if first_sale:
                start_date = first_sale.sale.date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                start_date = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = timezone.now()
        
        current_date = start_date
        while current_date <= end_date:
            month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_sales = sales_items.filter(
                sale__date__range=[month_start, month_end]
            ).aggregate(
                quantity=Sum('quantity'),
                revenue=Sum('total'),
                profit=Sum('profit'),
                loss=Sum('loss')
            )
            
            monthly_sales_data.append({
                'month': current_date.strftime('%Y-%m'),
                'quantity_sold': month_sales['quantity'] or 0,
                'revenue': float(month_sales['revenue'] or 0),
                'profit': float(month_sales['profit'] or 0),
                'loss': float(month_sales['loss'] or 0)
            })
            
            current_date = (month_start + timedelta(days=32)).replace(day=1)
        
        # Recent stock movements
        recent_stock_movements = stock_movements.order_by('-created_at')[:10]
        
        # Recent sales
        recent_sales = sales_items.order_by('-sale__date')[:10]
        
        # Profit margin calculation
        total_cost = float(sales_analytics['total_quantity_sold'] or 0) * float(product.cost_price)
        total_revenue = float(sales_analytics['total_revenue'] or 0)
        profit_margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0
        
        analytics_data = {
            'product_info': {
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'current_stock': product.stock_quantity,
                'cost_price': float(product.cost_price),
                'wholesale_price': float(product.wholesale_price),
                'retail_price': float(product.retail_price),
                'profit_margin_percentage': ((float(product.retail_price) - float(product.cost_price)) / float(product.retail_price) * 100)
            },
            'stock_analytics': {
                'total_stock_in': stock_in['total_quantity'] or 0,
                'total_stock_out': stock_out['total_quantity'] or 0,
                'stock_in_movements': stock_in['total_movements'] or 0,
                'stock_out_movements': stock_out['total_movements'] or 0,
                'net_stock_change': (stock_in['total_quantity'] or 0) - (stock_out['total_quantity'] or 0)
            },
            'sales_analytics': {
                'total_quantity_sold': sales_analytics['total_quantity_sold'] or 0,
                'total_revenue': float(sales_analytics['total_revenue'] or 0),
                'total_profit': float(sales_analytics['total_profit'] or 0),
                'total_loss': float(sales_analytics['total_loss'] or 0),
                'average_price': float(sales_analytics['average_price'] or 0),
                'total_sales': sales_analytics['total_sales'] or 0,
                'profit_margin': profit_margin,
                'net_profit': float(sales_analytics['total_profit'] or 0) - float(sales_analytics['total_loss'] or 0)
            },
            'charts': {
                'monthly_stock': monthly_stock_data,
                'monthly_sales': monthly_sales_data
            },
            'recent_activity': {
                'stock_movements': [
                    {
                        'id': movement.id,
                        'movement_type': movement.movement_type,
                        'quantity': movement.quantity,
                        'reference_number': movement.reference_number,
                        'notes': movement.notes,
                        'created_at': movement.created_at.isoformat()
                    }
                    for movement in recent_stock_movements
                ],
                'sales': [
                    {
                        'id': sale_item.id,
                        'sale_id': sale_item.sale.id,
                        'invoice_number': sale_item.sale.invoice_number,
                        'quantity': sale_item.quantity,
                        'unit_price': float(sale_item.unit_price),
                        'total': float(sale_item.total),
                        'profit': float(sale_item.profit),
                        'loss': float(sale_item.loss),
                        'sale_date': sale_item.sale.date.isoformat(),
                        'customer_name': f"{sale_item.sale.customer.first_name} {sale_item.sale.customer.last_name}" if sale_item.sale.customer else "Walk-in Customer",
                        'payment_method': sale_item.sale.payment_method
                    }
                    for sale_item in recent_sales
                ]
            }
        }
        
        return Response(analytics_data)

    @action(detail=True, methods=['get'])
    def stock_history(self, request, pk=None):
        """Get detailed stock movement history"""
        product = self.get_object()
        
        # Get date range from query params
        days_param = request.query_params.get('days')
        
        if days_param is None:
            # All-time data - no date filtering
            stock_movements = StockMovement.objects.filter(
                product=product
            ).order_by('-created_at')
        else:
            # Specific time range
            days = int(days_param)
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            stock_movements = StockMovement.objects.filter(
                product=product,
                created_at__range=[start_date, end_date]
            ).order_by('-created_at')
        
        history_data = []
        for movement in stock_movements:
            history_data.append({
                'id': movement.id,
                'movement_type': movement.movement_type,
                'quantity': movement.quantity,
                'reference_number': movement.reference_number,
                'notes': movement.notes,
                'created_at': movement.created_at.isoformat(),
                'variation_info': f"{movement.variation.design.name} - {movement.variation.color}" if movement.variation else "General"
            })
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'stock_history': history_data
        })

    @action(detail=True, methods=['get'])
    def sales_history(self, request, pk=None):
        """Get detailed sales history"""
        product = self.get_object()
        
        # Get date range from query params
        days_param = request.query_params.get('days')
        
        if days_param is None:
            # All-time data - no date filtering
            sales_items = SaleItem.objects.filter(
                product=product,
                sale__status='completed'
            ).order_by('-sale__date')
        else:
            # Specific time range
            days = int(days_param)
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            sales_items = SaleItem.objects.filter(
                product=product,
                sale__date__range=[start_date, end_date],
                sale__status='completed'
            ).order_by('-sale__date')
        
        sales_data = []
        for sale_item in sales_items:
            sales_data.append({
                'id': sale_item.id,
                'sale_id': sale_item.sale.id,
                'invoice_number': sale_item.sale.invoice_number,
                'quantity': sale_item.quantity,
                'design_name': sale_item.design_name,
                'color': sale_item.color,
                'unit_price': float(sale_item.unit_price),
                'discount': float(sale_item.discount),
                'total': float(sale_item.total),
                'profit': float(sale_item.profit),
                'loss': float(sale_item.loss),
                'sale_date': sale_item.sale.date.isoformat(),
                'customer_name': f"{sale_item.sale.customer.first_name} {sale_item.sale.customer.last_name}" if sale_item.sale.customer else "Walk-in Customer",
                'payment_method': sale_item.sale.payment_method
            })
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'sales_history': sales_data
        })

    # Ecommerce Showcase APIs
    @action(detail=False, methods=['get'], permission_classes=[])
    def new_arrivals(self, request):
        """Get new arrival products for ecommerce showcase"""
        limit = int(request.query_params.get('limit', 8))
        online_category = request.query_params.get('online_category', None)
        
        queryset = Product.objects.filter(is_active=True, assign_to_online=True).order_by('-created_at')
        
        if online_category:
            if online_category.isdigit():
                queryset = queryset.filter(online_categories__id=online_category)
            else:
                queryset = queryset.filter(
                    Q(online_categories__slug=online_category) | 
                    Q(online_categories__parent__slug=online_category)
                ).distinct()
        
        products = queryset[:limit]
        serializer = EcommerceProductSerializer(products, many=True, context={'request': request})
        
        return Response({
            'products': serializer.data,
            'count': len(serializer.data),
            'online_category': online_category
        })

    @action(detail=False, methods=['get'], permission_classes=[])
    def top_selling(self, request):
        """Get top selling products based on sales data"""
        limit = int(request.query_params.get('limit', 8))
        online_category = request.query_params.get('online_category', None)
        days = int(request.query_params.get('days', 30))  # Last 30 days by default
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get top selling products based on quantity sold
        top_products = Product.objects.filter(
            is_active=True,
            assign_to_online=True,
            saleitem__sale__date__range=[start_date, end_date]
        ).annotate(
            total_sold=Sum('saleitem__quantity')
        ).filter(
            total_sold__gt=0
        ).order_by('-total_sold')
        
        if online_category:
            if online_category.isdigit():
                top_products = top_products.filter(online_categories__id=online_category)
            else:
                top_products = top_products.filter(
                    Q(online_categories__slug=online_category) | 
                    Q(online_categories__parent__slug=online_category)
                ).distinct()
        
        products = top_products[:limit]
        serializer = EcommerceProductSerializer(products, many=True, context={'request': request})
        
        return Response({
            'products': serializer.data,
            'count': len(serializer.data),
            'online_category': online_category,
            'period_days': days
        })

    @action(detail=False, methods=['get'], permission_classes=[])
    def featured(self, request):
        """Get featured products for ecommerce showcase"""
        limit = int(request.query_params.get('limit', 8))
        online_category = request.query_params.get('online_category', None)
        
        # For now, we'll use products with high stock and recent updates as "featured"
        # You can add a 'featured' boolean field to Product model later
        queryset = Product.objects.filter(
            is_active=True,
            assign_to_online=True,
            stock_quantity__gt=0
        ).order_by('-updated_at', '-stock_quantity')
        
        if online_category:
            if online_category.isdigit():
                queryset = queryset.filter(online_categories__id=online_category)
            else:
                queryset = queryset.filter(
                    Q(online_categories__slug=online_category) | 
                    Q(online_categories__parent__slug=online_category)
                ).distinct()
        
        products = queryset[:limit]
        serializer = EcommerceProductSerializer(products, many=True, context={'request': request})
        
        return Response({
            'products': serializer.data,
            'count': len(serializer.data),
            'online_category': online_category
        })

    @action(detail=False, methods=['get'], permission_classes=[])
    def showcase(self, request):
        """Get all showcase data including dynamic status sections"""
        from apps.ecommerce.models import ProductStatus
        
        limit = int(request.query_params.get('limit', 4))
        online_category = request.query_params.get('online_category', None)
        
        # Get all active statuses to be displayed on home
        active_statuses = ProductStatus.objects.filter(
            is_active=True,
            display_on_home=True
        ).order_by('display_order', 'name')
        
        sections_data = {}
        processed_slugs = []

        for status in active_statuses:
            products = Product.objects.filter(
                is_active=True,
                assign_to_online=True,
                ecommerce_statuses=status
            )
            
            if online_category:
                if online_category.isdigit():
                    products = products.filter(online_categories__id=online_category)
                else:
                    products = products.filter(
                        Q(online_categories__slug=online_category) | 
                        Q(online_categories__parent__slug=online_category)
                    ).distinct()
            
            # Use specific limit if provided as query param for this slug
            # e.g. ?new-arrivals_limit=8
            status_limit = int(request.query_params.get(f'{status.slug}_limit', limit))
            
            products = products.order_by('-updated_at', '-created_at')[:status_limit]
            
            products_data = EcommerceProductSerializer(
                products, 
                many=True, 
                context={'request': request}
            ).data
            
            sections_data[status.slug] = {
                'name': status.name,
                'products': products_data,
                'count': len(products_data)
            }
            processed_slugs.append(status.slug)

        # Only include legacy fallbacks if explicitly requested via query parameter ?include_legacy=true
        include_legacy = request.query_params.get('include_legacy', 'false').lower() == 'true'
        
        if include_legacy:
            if 'new-arrivals' not in sections_data and 'new_arrivals' not in sections_data:
                new_arrivals = Product.objects.filter(
                    is_active=True,
                    assign_to_online=True,
                    is_new_arrival=True,
                )
                if online_category:
                    new_arrivals = new_arrivals.filter(online_categories__id=online_category)
                new_arrivals = new_arrivals.order_by('-updated_at', '-created_at')[:int(request.query_params.get('new_arrivals_limit', 4))]
                new_arrivals_data = EcommerceProductSerializer(new_arrivals, many=True, context={'request': request}).data
                if len(new_arrivals_data) > 0:
                    sections_data['new_arrivals'] = {
                        'name': 'New Arrivals',
                        'products': new_arrivals_data,
                        'count': len(new_arrivals_data)
                    }

            if 'featured' not in sections_data:
                featured = Product.objects.filter(
                    is_active=True,
                    assign_to_online=True,
                    is_featured=True,
                    stock_quantity__gt=0,
                ).order_by('-updated_at')
                if online_category:
                    featured = featured.filter(online_categories__id=online_category)
                featured = featured[:int(request.query_params.get('featured_limit', 4))]
                featured_data = EcommerceProductSerializer(featured, many=True, context={'request': request}).data
                if len(featured_data) > 0:
                    sections_data['featured'] = {
                        'name': 'Featured Products',
                        'products': featured_data,
                        'count': len(featured_data)
                    }

        response_data = {
            **sections_data,
            'dynamic_section_slugs': processed_slugs,
            'online_category': online_category
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'], permission_classes=[])
    def showcase_detail(self, request, pk=None):
        """Get detailed product information for ecommerce showcase"""
        product = self.get_object()
        
        # Get product with all related data
        product_data = EcommerceProductDetailSerializer(product, context={'request': request}).data
        
        # Get related products (same online_categories, excluding current product)
        related_products = Product.objects.filter(
            online_categories__in=product.online_categories.all(),
            is_active=True,
            assign_to_online=True
        ).exclude(id=product.id).distinct()[:4]
        
        related_data = EcommerceProductSerializer(related_products, many=True, context={'request': request}).data
        
        return Response({
            'product': product_data,
            'related_products': related_data,
            'related_count': len(related_data)
        })

    @action(detail=True, methods=['post'])
    def toggle_online_assignment(self, request, pk=None):
        """Toggle assign_to_online status for a product"""
        product = self.get_object()
        product.assign_to_online = not product.assign_to_online
        product.save()
        
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'message': f'Product {"assigned to" if product.assign_to_online else "unassigned from"} online',
            'assign_to_online': product.assign_to_online,
            'product': serializer.data
        })

    @action(detail=True, methods=['patch'])
    def update_ecommerce_status(self, request, pk=None):
        """Update ecommerce status fields (is_new_arrival, is_trending, is_featured, ecommerce_statuses)"""
        product = self.get_object()
        
        # Allowed fields for ecommerce status
        allowed_fields = ['is_new_arrival', 'is_trending', 'is_featured']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(product, field, request.data[field])
        
        # Handle Many-to-Many ecommerce_statuses
        if 'ecommerce_statuses' in request.data:
            status_ids = request.data.get('ecommerce_statuses', [])
            product.ecommerce_statuses.set(status_ids)
        
        product.save()
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def bulk_update_ecommerce_status(self, request):
        """Bulk update ecommerce status for multiple products"""
        product_ids = request.data.get('product_ids', [])
        ecommerce_fields = {}
        
        # Allowed fields for ecommerce status
        allowed_fields = ['is_new_arrival', 'is_trending', 'is_featured']
        
        for field in allowed_fields:
            if field in request.data:
                ecommerce_fields[field] = request.data[field]
        
        if not product_ids or not ecommerce_fields:
            return Response(
                {'error': 'product_ids and at least one ecommerce status field are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        # Update all products
        updated_count = Product.objects.filter(id__in=product_ids).update(**ecommerce_fields)
        
        # Return updated products
        products = Product.objects.filter(id__in=product_ids)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        
        return Response({
            'message': f'Updated {updated_count} products',
            'products': serializer.data
        })

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def all_online(self, request):
        """Public: list all products assigned to online (optionally filter by online_category)"""
        online_category = request.query_params.get('online_category')
        queryset = Product.objects.filter(is_active=True, assign_to_online=True)
        if online_category:
            if online_category.isdigit():
                queryset = queryset.filter(online_categories__id=online_category)
            else:
                try:
                    category = OnlineCategory.objects.get(slug=online_category)
                    # Get all child category IDs (recursively if needed)
                    child_ids = [category.id]
                    # Get direct children
                    children = OnlineCategory.objects.filter(parent=category)
                    child_ids.extend([child.id for child in children])
                    # Filter products by category or any of its children
                    queryset = queryset.filter(online_categories__id__in=child_ids)
                except OnlineCategory.DoesNotExist:
                    queryset = queryset.none()
        queryset = queryset.order_by('-created_at')
        serializer = EcommerceProductSerializer(queryset, many=True, context={'request': request})
        return Response({
            'products': serializer.data,
            'count': len(serializer.data)
        })

class ProductVariationViewSet(viewsets.ModelViewSet):
    queryset = ProductVariation.objects.all()
    serializer_class = ProductVariationSerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_product_catalog")]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product', 'is_active']
    search_fields = ['color']

    def perform_create(self, serializer):
        variation = serializer.save()
        # Update main product stock by recalculating from all variants
        product = variation.product
        total_variant_stock = product.variations.aggregate(
            total=Sum('stock')
        )['total'] or 0
        product.stock_quantity = total_variant_stock
        product.save()

    def perform_update(self, serializer):
        # Track stock delta for movement logging
        instance: ProductVariation = self.get_object()
        previous_stock = instance.stock
        variation = serializer.save()
        new_stock = variation.stock
        delta = new_stock - previous_stock
        if delta != 0:
            StockMovement.objects.create(
                product=variation.product,
                variation=variation,
                movement_type='IN' if delta > 0 else 'OUT',
                quantity=abs(delta),
                reference_number='MANUAL',
                notes='Manual stock update via variation update'
            )
        # Update main product stock by recalculating from all variants
        product = variation.product
        total_variant_stock = product.variations.aggregate(
            total=Sum('stock')
        )['total'] or 0
        product.stock_quantity = total_variant_stock
        product.save()

    def perform_destroy(self, instance):
        product = instance.product
        instance.delete()
        # Update main product stock by recalculating from remaining variants
        total_variant_stock = product.variations.aggregate(
            total=Sum('stock')
        )['total'] or 0
        product.stock_quantity = total_variant_stock
        product.save()

    def get_queryset(self):
        queryset = ProductVariation.objects.all()
        product = self.request.query_params.get('product', None)
        variation_code = self.request.query_params.get('variation_code', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if product:
            queryset = queryset.filter(product_id=product)
        if variation_code:
            queryset = queryset.filter(variation_code=variation_code)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset

# ProductImageViewSet replaced by ImageViewSet

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Stamp the originating branch on the movement so analytics scope correctly.
        branch_id = (
            get_requested_branch_id(self.request)
            or self.request.user.managed_branch_id
        )
        save_kwargs = {"created_by": self.request.user}
        if branch_id:
            save_kwargs["branch_id"] = branch_id
        movement = serializer.save(**save_kwargs)

        # Update variant stock if specified
        if movement.variation:
            if movement.movement_type == 'IN':
                movement.variation.stock += movement.quantity
            elif movement.movement_type in ['OUT', 'GIFT']:
                if movement.variation.stock < movement.quantity:
                    raise ValidationError(f"Not enough stock in variation. Available: {movement.variation.stock}")
                movement.variation.stock -= movement.quantity
            movement.variation.save()

        # Update main product stock by recalculating from all colors across designs
        product = movement.product
        total_variant_stock = ProductVariation.objects.filter(design__product=product).aggregate(
            total=Sum('stock')
        )['total'] or 0
        product.stock_quantity = total_variant_stock
        product.save()

        # Check for alerts (branch-aware so each branch sees its own warnings)
        if product.stock_quantity <= product.minimum_stock:
            InventoryAlert.objects.create(
                product=product,
                variation=movement.variation,
                branch_id=branch_id,
                alert_type='LOW',
                message=f'Low stock alert: {product.name} has {product.stock_quantity} units remaining'
            )
        elif product.stock_quantity == 0:
            InventoryAlert.objects.create(
                product=product,
                variation=movement.variation,
                branch_id=branch_id,
                alert_type='OUT',
                message=f'Out of stock alert: {product.name} has no units remaining'
            )

    def get_queryset(self):
        queryset = StockMovement.objects.filter(_branch_filter_q(self.request))
        product_id = self.request.query_params.get('product', None)
        movement_type = self.request.query_params.get('type', None)

        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)

        return queryset


class InventoryAlertViewSet(viewsets.ModelViewSet):
    queryset = InventoryAlert.objects.all()
    serializer_class = InventoryAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = InventoryAlert.objects.filter(_branch_filter_q(self.request))
        is_active = self.request.query_params.get('active', None)
        alert_type = self.request.query_params.get('type', None)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)

        return queryset

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.resolve()
        return Response({'message': 'Alert resolved successfully'})

class MeterialCompositionViewSet(viewsets.ModelViewSet):
    queryset = MeterialComposition.objects.all()
    serializer_class = MeterialCompositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = MeterialComposition.objects.all()
        product = self.request.query_params.get('product', None)
        if product:
            queryset = queryset.filter(product_id=product)
        return queryset

class WhoIsThisForViewSet(viewsets.ModelViewSet):
    queryset = WhoIsThisFor.objects.all()
    serializer_class = WhoIsThisForSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = WhoIsThisFor.objects.all()
        product = self.request.query_params.get('product', None)
        if product:
            queryset = queryset.filter(product_id=product)
        return queryset

class FeaturesViewSet(viewsets.ModelViewSet):
    queryset = Features.objects.all()
    serializer_class = FeaturesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Features.objects.all()
        product = self.request.query_params.get('product', None)
        if product:
            queryset = queryset.filter(product_id=product)
        return queryset

class GalleryViewSet(viewsets.ModelViewSet):
    queryset = Gallery.objects.all()
    serializer_class = GallerySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Gallery.objects.all()
        product = self.request.query_params.get('product', None)
        design = self.request.query_params.get('design', None)
        color = self.request.query_params.get('color', None)
        if product:
            queryset = queryset.filter(design__product_id=product)
        if design:
            queryset = queryset.filter(design_id=design)
        if color:
            queryset = queryset.filter(color=color)
        return queryset

class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Image.objects.all()
        gallery = self.request.query_params.get('gallery', None)
        product = self.request.query_params.get('product', None)
        if gallery:
            queryset = queryset.filter(gallery_id=gallery)
        if product:
            queryset = queryset.filter(gallery__design__product_id=product)
        return queryset

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_date_range(self, period):
        today = timezone.now()
        if period == 'day':
            start_date = today - timedelta(days=1)
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        elif period == 'year':
            start_date = today - timedelta(days=365)
        else:
            start_date = today - timedelta(days=30)  # Default to month
        return start_date, today

    @action(detail=False, methods=['get'])
    def overview(self, request):
        # Get date range from query params
        period = request.query_params.get('period', 'month')
        start_date, end_date = self._get_date_range(period)

        # Basic metrics
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        out_of_stock_products = Product.objects.filter(stock_quantity=0).count()
        low_stock_products = Product.objects.filter(stock_quantity__lte=F('minimum_stock')).count()
        
        # Calculate total inventory value
        total_inventory_value = Product.objects.aggregate(
            total=Sum(F('cost_price') * F('stock_quantity'))
        )['total'] or 0

        # Stock movement metrics (branch scoped)
        scoped_movements = StockMovement.objects.filter(_branch_filter_q(request))
        stock_movements = scoped_movements.filter(
            created_at__range=(start_date, end_date)
        )
        stock_in = stock_movements.filter(movement_type='IN').aggregate(
            total=Sum('quantity')
        )['total'] or 0
        stock_out = stock_movements.filter(movement_type='OUT').aggregate(
            total=Sum('quantity')
        )['total'] or 0

        # Category distribution
        category_distribution = Category.objects.annotate(
            product_count=Count('products'),
            total_value=Sum(F('products__retail_price') * F('products__stock_quantity'))
        ).values('name', 'product_count', 'total_value')

        # Top selling products
        top_selling_products = Product.objects.annotate(
            total_sold=Sum(
                Case(
                    When(
                        stock_movements__movement_type='OUT',
                        then='stock_movements__quantity'
                    ),
                    default=0,
                    output_field=IntegerField()
                )
            )
        ).order_by('-total_sold')[:5]

        # Stock health metrics
        stock_health = {
            'healthy': Product.objects.filter(stock_quantity__gt=F('minimum_stock')).count(),
            'low': low_stock_products,
            'out': out_of_stock_products
        }

        # Recent stock movements (branch scoped)
        recent_movements = scoped_movements.select_related(
            'product', 'variation'
        ).order_by('-created_at')[:10]

        # Supplier performance
        supplier_metrics = Supplier.objects.annotate(
            total_products=Count('products'),
            total_value=Sum(F('products__retail_price') * F('products__stock_quantity')),
            low_stock_count=Count(
                'products',
                filter=Q(products__stock_quantity__lte=F('products__minimum_stock'))
            )
        ).values(
            'company_name',
            'total_products',
            'total_value',
            'low_stock_count'
        ).order_by('-total_value')

        return Response({
            'metrics': {
                'total_products': total_products,
                'active_products': active_products,
                'out_of_stock_products': out_of_stock_products,
                'low_stock_products': low_stock_products,
                'total_inventory_value': total_inventory_value,
                'stock_in': stock_in,
                'stock_out': stock_out,
                'stock_health': stock_health
            },
            'category_distribution': category_distribution,
            'top_selling_products': ProductSerializer(top_selling_products, many=True, context={'request': request}).data,
            'recent_movements': StockMovementSerializer(recent_movements, many=True).data,
            'supplier_metrics': list(supplier_metrics)  # Convert QuerySet to list
        })

    @action(detail=False, methods=['get'])
    def stock_alerts(self, request):
        # Get low stock and out of stock products
        low_stock_products = Product.objects.filter(
            stock_quantity__lte=F('minimum_stock')
        ).select_related('category', 'supplier')
        
        out_of_stock_products = Product.objects.filter(
            stock_quantity=0
        ).select_related('category', 'supplier')

        # Get active alerts (branch scoped)
        active_alerts = InventoryAlert.objects.filter(
            _branch_filter_q(request),
            is_active=True,
        ).select_related('product', 'variation')

        return Response({
            'low_stock': ProductSerializer(low_stock_products, many=True, context={'request': request}).data,
            'out_of_stock': ProductSerializer(out_of_stock_products, many=True, context={'request': request}).data,
            'active_alerts': InventoryAlertSerializer(active_alerts, many=True).data
        })

    @action(detail=False, methods=['get'])
    def category_metrics(self, request):
        categories = Category.objects.annotate(
            total_products=Count('products'),
            active_products=Count('products', filter=Q(products__is_active=True)),
            low_stock_products=Count(
                'products',
                filter=Q(products__stock_quantity__lte=F('products__minimum_stock'))
            ),
            total_value=Sum(F('products__retail_price') * F('products__stock_quantity'))
        ).values('name', 'total_products', 'active_products', 'low_stock_products', 'total_value')

        return Response(categories)

    @action(detail=False, methods=['get'])
    def online_category_metrics(self, request):
        categories = OnlineCategory.objects.annotate(
            total_products=Count('products'),
            active_products=Count('products', filter=Q(products__is_active=True)),
            low_stock_products=Count(
                'products',
                filter=Q(products__stock_quantity__lte=F('products__minimum_stock'))
            ),
            total_value=Sum(F('products__retail_price') * F('products__stock_quantity'))
        ).values('name', 'total_products', 'active_products', 'low_stock_products', 'total_value')

        return Response(categories)

    @action(detail=False, methods=['get'])
    def stock_movement_analysis(self, request):
        period = request.query_params.get('period', 'month')
        start_date, end_date = self._get_date_range(period)

        # Daily stock movements (branch scoped)
        daily_movements = StockMovement.objects.filter(
            _branch_filter_q(request),
            created_at__range=(start_date, end_date),
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            stock_in=Sum('quantity', filter=Q(movement_type='IN')),
            stock_out=Sum('quantity', filter=Q(movement_type='OUT'))
        ).order_by('date')

        # Movement by category (branch scoped)
        category_movements = StockMovement.objects.filter(
            _branch_filter_q(request),
            created_at__range=(start_date, end_date),
        ).values('product__category__name').annotate(
            stock_in=Sum('quantity', filter=Q(movement_type='IN')),
            stock_out=Sum('quantity', filter=Q(movement_type='OUT'))
        )

        return Response({
            'daily_movements': daily_movements,
            'category_movements': category_movements
        })


class OnlineCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing online categories.
    """
    queryset = OnlineCategory.objects.all()
    serializer_class = OnlineCategorySerializer
    permission_classes = [HasReadWritePermission(read=None, write="manage_online_categories")]
    filterset_fields = ['name', 'parent', 'gender']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        For list and retrieve actions, allow public access.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('parent')
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_order(self, request):
        """
        Bulk update the order of categories.
        Expects: [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...]
        """
        from django.db import transaction
        
        try:
            order_data = request.data
            if not isinstance(order_data, list):
                return Response(
                    {'error': 'Expected a list of category orders'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                for item in order_data:
                    category_id = item.get('id')
                    new_order = item.get('order')
                    
                    if category_id is None or new_order is None:
                        continue
                    
                    OnlineCategory.objects.filter(id=category_id).update(order=new_order)
            
            return Response({'message': 'Order updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

from django.db import transaction

class StockTransferViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasReadWritePermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateStockTransferSerializer
        return StockTransferSerializer

    def get_queryset(self):
        qs = StockTransfer.objects.all().select_related(
            'source_branch', 'dest_branch', 'requested_by', 'approved_by'
        ).prefetch_related('items__product', 'items__variation', 'items__variation__design')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
            
        branch_q = _branch_filter_q(self.request, field='source_branch_id') | _branch_filter_q(self.request, field='dest_branch_id')
        qs = qs.filter(branch_q)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        with transaction.atomic():
            transfer = StockTransfer.objects.create(
                source_branch_id=data['source_branch'],
                dest_branch_id=data['dest_branch'],
                notes=data.get('notes', ''),
                requested_by=self.request.user,
                status=StockTransfer.Status.PENDING
            )
            for item in data['items']:
                StockTransferItem.objects.create(
                    transfer=transfer,
                    product_id=item['product'],
                    variation_id=item.get('variation'),
                    quantity=item['quantity']
                )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != StockTransfer.Status.PENDING:
            return Response({"detail": "Only pending transfers can be approved."}, status=400)
        
        transfer.status = StockTransfer.Status.APPROVED
        transfer.approved_by = request.user
        transfer.save()
        return Response(StockTransferSerializer(transfer).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != StockTransfer.Status.APPROVED:
            return Response({"detail": "Only approved transfers can be completed."}, status=400)
            
        with transaction.atomic():
            transfer.status = StockTransfer.Status.COMPLETED
            transfer.save()
            
            for item in transfer.items.all():
                if item.variation:
                    source_bvs, _ = BranchVariationStock.objects.get_or_create(
                        branch=transfer.source_branch,
                        variation=item.variation,
                        defaults={'stock': 0}
                    )
                    source_bvs.stock = max(0, source_bvs.stock - item.quantity)
                    source_bvs.save()
                    
                    dest_bvs, _ = BranchVariationStock.objects.get_or_create(
                        branch=transfer.dest_branch,
                        variation=item.variation,
                        defaults={'stock': 0}
                    )
                    dest_bvs.stock += item.quantity
                    dest_bvs.save()
                    
                    StockMovement.objects.create(
                        product=item.product,
                        variation=item.variation,
                        branch=transfer.source_branch,
                        movement_type='OUT',
                        quantity=item.quantity,
                        reference_number=f"TRF-{transfer.id}",
                        notes=f"Transfer out to {transfer.dest_branch.name}",
                        created_by=request.user
                    )
                    StockMovement.objects.create(
                        product=item.product,
                        variation=item.variation,
                        branch=transfer.dest_branch,
                        movement_type='IN',
                        quantity=item.quantity,
                        reference_number=f"TRF-{transfer.id}",
                        notes=f"Transfer in from {transfer.source_branch.name}",
                        created_by=request.user
                    )
                
                source_bp, _ = BranchProduct.objects.get_or_create(
                    branch=transfer.source_branch,
                    product=item.product
                )
                source_bp.stock_quantity = max(0, source_bp.stock_quantity - item.quantity)
                source_bp.save()
                
                dest_bp, _ = BranchProduct.objects.get_or_create(
                    branch=transfer.dest_branch,
                    product=item.product
                )
                dest_bp.stock_quantity += item.quantity
                dest_bp.save()
                
        return Response(StockTransferSerializer(transfer).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status in [StockTransfer.Status.COMPLETED, StockTransfer.Status.CANCELLED]:
            return Response({"detail": "Transfer cannot be cancelled."}, status=400)
            
        transfer.status = StockTransfer.Status.CANCELLED
        transfer.save()
        return Response(StockTransferSerializer(transfer).data)
