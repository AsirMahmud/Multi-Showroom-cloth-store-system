from rest_framework import serializers
from .models import (
    Discount, Brand, HomePageSettings, DeliverySettings, HeroSlide, PromotionalModal, ProductStatus,
    LandingPage, LandingPageSection, LandingPageCollageItem, LandingPageProductSelection
)
from apps.inventory.serializers import ProductSerializer, CategorySerializer, OnlineCategorySerializer


class ProductStatusSerializer(serializers.ModelSerializer):
    """Serializer for ProductStatus model"""
    class Meta:
        model = ProductStatus
        fields = ['id', 'name', 'slug', 'display_on_home', 'display_order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'slug']


class DiscountSerializer(serializers.ModelSerializer):
    """Serializer for Discount model"""
    
    # Include nested serializers for better API response
    categories_detail = CategorySerializer(source='categories', read_only=True, many=True)
    online_categories_detail = OnlineCategorySerializer(source='online_categories', read_only=True, many=True)
    products_detail = ProductSerializer(source='products', read_only=True, many=True)
    
    # Add display fields
    discount_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Discount
        fields = [
            'id',
            'name',
            'discount_type',
            'discount_type_display',
            'value',
            'description',
            'start_date',
            'end_date',
            'status',
            'status_display',
            'categories',
            'categories_detail',
            'online_categories',
            'online_categories_detail',
            'products',
            'products_detail',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'status']
    
    def get_discount_type_display(self, obj):
        """Get human-readable discount type"""
        return obj.get_discount_type_display()
    
    def get_status_display(self, obj):
        """Get human-readable status"""
        return obj.get_status_display()
    
    def validate(self, data):
        """Custom validation for discount"""
        # Check if start_date is before end_date
        # Use existing instance data if fields are missing (for partial updates)
        start_date = data.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = data.get('end_date', getattr(self.instance, 'end_date', None))
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })
        
        # Validate discount_type specific requirements
        discount_type = data.get('discount_type', getattr(self.instance, 'discount_type', 'APP_WIDE'))
        
        # For M2M fields in validate(), they might be lists of PKs or objects
        # We check both the new data and the existing instance if it's a partial update
        categories = data.get('categories')
        online_categories = data.get('online_categories')
        products = data.get('products')
        
        if discount_type == 'CATEGORY':
            # Check if at least one category selection exists (either new or existing)
            has_cats = False
            if categories or online_categories:
                has_cats = True
            elif self.instance:
                if self.instance.categories.exists() or self.instance.online_categories.exists():
                    has_cats = True
            
            if not has_cats:
                raise serializers.ValidationError({
                    'categories': 'At least one category or online category is required for CATEGORY discount type.'
                })
        
        if discount_type == 'PRODUCT':
            # Check if at least one product selection exists
            has_prods = False
            if products:
                has_prods = True
            elif self.instance and self.instance.products.exists():
                has_prods = True
                
            if not has_prods:
                raise serializers.ValidationError({
                    'products': 'At least one product is required for PRODUCT discount type.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create discount with automatic status setting"""
        from django.utils import timezone
        
        now = timezone.now()
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')
        
        # Set status based on dates
        if start_date > now:
            validated_data['status'] = 'SCHEDULED'
        elif end_date < now:
            validated_data['status'] = 'EXPIRED'
        else:
            validated_data['status'] = 'ACTIVE'
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update discount with automatic status setting"""
        from django.utils import timezone
        
        now = timezone.now()
        start_date = validated_data.get('start_date', instance.start_date)
        end_date = validated_data.get('end_date', instance.end_date)
        
        # Update status based on dates
        if start_date > now:
            validated_data['status'] = 'SCHEDULED'
        elif end_date < now:
            validated_data['status'] = 'EXPIRED'
        else:
            validated_data['status'] = 'ACTIVE'
        
        return super().update(instance, validated_data)


class DiscountListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing discounts"""
    
    # Include nested serializers for better API response
    categories_detail = CategorySerializer(source='categories', read_only=True, many=True)
    online_categories_detail = OnlineCategorySerializer(source='online_categories', read_only=True, many=True)
    products_detail = ProductSerializer(source='products', read_only=True, many=True)

    # Add display fields
    discount_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Discount
        fields = [
            'id',
            'name',
            'discount_type',
            'discount_type_display',
            'value',
            'start_date',
            'end_date',
            'status',
            'status_display',
            'categories',
            'categories_detail',
            'online_categories',
            'online_categories_detail',
            'products',
            'products_detail',
            'is_active',
            'created_at',
        ]
    
    def get_discount_type_display(self, obj):
        """Get human-readable discount type"""
        return obj.get_discount_type_display()

    def get_status_display(self, obj):
        """Get human-readable status"""
        return obj.get_status_display()


class BrandSerializer(serializers.ModelSerializer):
    """Serializer for Brand model"""
    logo_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = [
            'id',
            'name',
            'logo_image',
            'logo_image_url',
            'logo_text',
            'website_url',
            'is_active',
            'display_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_logo_image_url(self, obj):
        if obj.logo_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo_image.url)
            return obj.logo_image.url
        return None


class HomePageSettingsSerializer(serializers.ModelSerializer):
    """Serializer for HomePageSettings model"""
    logo_image_url = serializers.SerializerMethodField()
    hero_primary_image_url = serializers.SerializerMethodField()
    hero_secondary_image_url = serializers.SerializerMethodField()
    collage_card_1_image_url = serializers.SerializerMethodField()
    collage_card_2_image_url = serializers.SerializerMethodField()
    collage_card_3_image_url = serializers.SerializerMethodField()
    collage_card_4_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = HomePageSettings
        fields = [
            'id',
            'logo_image',
            'logo_image_url',
            'logo_text',
            'min_product_buying_count',
            'min_unique_product_variants',
            'min_order_amount',
            'footer_tagline',
            'footer_address',
            'footer_phone',
            'footer_email',
            'footer_facebook_url',
            'footer_instagram_url',
            'footer_twitter_url',
            'footer_github_url',
            'footer_map_embed_url',
            'hero_badge_text',
            'hero_heading_line1',
            'hero_heading_line2',
            'hero_heading_line3',
            'hero_heading_line4',
            'hero_heading_line5',
            'hero_description',
            'hero_primary_image',
            'hero_primary_image_url',
            'hero_secondary_image',
            'hero_secondary_image_url',
            'stat_brands',
            'stat_products',
            'stat_customers',
            'collage_enabled',
            'collage_badge_text',
            'collage_heading',
            'collage_description',
            'collage_card_1_title',
            'collage_card_1_subtitle',
            'collage_card_1_link',
            'collage_card_1_image',
            'collage_card_1_image_url',
            'collage_card_2_title',
            'collage_card_2_subtitle',
            'collage_card_2_link',
            'collage_card_2_image',
            'collage_card_2_image_url',
            'collage_card_3_title',
            'collage_card_3_subtitle',
            'collage_card_3_link',
            'collage_card_3_image',
            'collage_card_3_image_url',
            'collage_card_4_title',
            'collage_card_4_subtitle',
            'collage_card_4_link',
            'collage_card_4_image',
            'collage_card_4_image_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_logo_image_url(self, obj):
        if obj.logo_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo_image.url)
            return obj.logo_image.url
        return None
    
    def get_hero_primary_image_url(self, obj):
        if obj.hero_primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_primary_image.url)
            return obj.hero_primary_image.url
        return None
    
    def get_hero_secondary_image_url(self, obj):
        if obj.hero_secondary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_secondary_image.url)
            return obj.hero_secondary_image.url
        return None

    def _get_image_url(self, obj, field_name):
        image = getattr(obj, field_name, None)
        if image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image.url)
            return image.url
        return None

    def get_collage_card_1_image_url(self, obj):
        return self._get_image_url(obj, 'collage_card_1_image')

    def get_collage_card_2_image_url(self, obj):
        return self._get_image_url(obj, 'collage_card_2_image')

    def get_collage_card_3_image_url(self, obj):
        return self._get_image_url(obj, 'collage_card_3_image')

    def get_collage_card_4_image_url(self, obj):
        return self._get_image_url(obj, 'collage_card_4_image')

    def update(self, instance, validated_data):
        """Handle image replacement with old file cleanup and canonical naming."""
        import os
        request = self.context.get('request')

        def replace_image(field_name: str, new_file):
            if not new_file:
                return
            # delete previous file if exists
            old_file = getattr(instance, field_name, None)
            if old_file:
                try:
                    old_file.delete(save=False)
                except Exception:
                    pass
            # set canonical filename
            base = {
                'logo_image': 'logo',
                'hero_primary_image': 'primary',
                'hero_secondary_image': 'secondary',
                'collage_card_1_image': 'collage-card-1',
                'collage_card_2_image': 'collage-card-2',
                'collage_card_3_image': 'collage-card-3',
                'collage_card_4_image': 'collage-card-4',
            }.get(field_name, field_name)
            _, ext = os.path.splitext(getattr(new_file, 'name', '') or '')
            if not ext:
                ext = '.jpg'
            new_file.name = f"{base}{ext}"
            setattr(instance, field_name, new_file)

        # Handle explicit delete flags coming from request (e.g., remove_logo_image=true)
        if request is not None:
            remove_logo = str(request.data.get('remove_logo_image', 'false')).lower() == 'true'
            remove_primary = str(request.data.get('remove_hero_primary_image', 'false')).lower() == 'true'
            remove_secondary = str(request.data.get('remove_hero_secondary_image', 'false')).lower() == 'true'
            remove_collage_1 = str(request.data.get('remove_collage_card_1_image', 'false')).lower() == 'true'
            remove_collage_2 = str(request.data.get('remove_collage_card_2_image', 'false')).lower() == 'true'
            remove_collage_3 = str(request.data.get('remove_collage_card_3_image', 'false')).lower() == 'true'
            remove_collage_4 = str(request.data.get('remove_collage_card_4_image', 'false')).lower() == 'true'
            if remove_logo and getattr(instance, 'logo_image', None):
                try:
                    instance.logo_image.delete(save=False)
                except Exception:
                    pass
                instance.logo_image = None
            if remove_primary and getattr(instance, 'hero_primary_image', None):
                try:
                    instance.hero_primary_image.delete(save=False)
                except Exception:
                    pass
                instance.hero_primary_image = None
            if remove_secondary and getattr(instance, 'hero_secondary_image', None):
                try:
                    instance.hero_secondary_image.delete(save=False)
                except Exception:
                    pass
                instance.hero_secondary_image = None
            if remove_collage_1 and getattr(instance, 'collage_card_1_image', None):
                try:
                    instance.collage_card_1_image.delete(save=False)
                except Exception:
                    pass
                instance.collage_card_1_image = None
            if remove_collage_2 and getattr(instance, 'collage_card_2_image', None):
                try:
                    instance.collage_card_2_image.delete(save=False)
                except Exception:
                    pass
                instance.collage_card_2_image = None
            if remove_collage_3 and getattr(instance, 'collage_card_3_image', None):
                try:
                    instance.collage_card_3_image.delete(save=False)
                except Exception:
                    pass
                instance.collage_card_3_image = None
            if remove_collage_4 and getattr(instance, 'collage_card_4_image', None):
                try:
                    instance.collage_card_4_image.delete(save=False)
                except Exception:
                    pass
                instance.collage_card_4_image = None

        # Extract image files from validated_data first
        logo_file = validated_data.pop('logo_image', None)
        primary_file = validated_data.pop('hero_primary_image', None)
        secondary_file = validated_data.pop('hero_secondary_image', None)
        collage_1_file = validated_data.pop('collage_card_1_image', None)
        collage_2_file = validated_data.pop('collage_card_2_image', None)
        collage_3_file = validated_data.pop('collage_card_3_image', None)
        collage_4_file = validated_data.pop('collage_card_4_image', None)

        # Update non-file fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle images with cleanup and naming
        replace_image('logo_image', logo_file)
        replace_image('hero_primary_image', primary_file)
        replace_image('hero_secondary_image', secondary_file)
        replace_image('collage_card_1_image', collage_1_file)
        replace_image('collage_card_2_image', collage_2_file)
        replace_image('collage_card_3_image', collage_3_file)
        replace_image('collage_card_4_image', collage_4_file)

        instance.save()
        return instance


class DeliverySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySettings
        fields = [
            'inside_dhaka_charge',
            'inside_gazipur_charge',
            'outside_dhaka_charge',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class HeroSlideSerializer(serializers.ModelSerializer):
    """Serializer for HeroSlide model"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = HeroSlide
        fields = [
            'id',
            'title',
            'subtitle',
            'button_text',
            'image',
            'image_url',
            'bg_color',
            'layout',
            'title_class',
            'subtitle_class',
            'stats',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PromotionalModalSerializer(serializers.ModelSerializer):
    """Serializer for PromotionalModal model"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PromotionalModal
        fields = [
            'id',
            'title',
            'description',
            'discount_code',
            'cta_text',
            'cta_url',
            'image',
            'image_url',
            'layout',
            'color_theme',
            'display_rules',
            'targeting_rules',
            'start_date',
            'end_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def validate(self, data):
        """Custom validation"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })
        return data


class LandingPageCollageItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_detail = CategorySerializer(source='category', read_only=True)
    online_category_detail = OnlineCategorySerializer(source='online_category', read_only=True)

    class Meta:
        model = LandingPageCollageItem
        fields = [
            'id', 'section', 'category', 'category_detail', 'online_category',
            'online_category_detail', 'title_override', 'link_override', 'image', 'image_url', 'display_order'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class LandingPageSectionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    mobile_image_url = serializers.SerializerMethodField()
    collage_items = LandingPageCollageItemSerializer(many=True, read_only=True)
    product_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    products_detail = serializers.SerializerMethodField()

    class Meta:
        model = LandingPageSection
        fields = [
            'id', 'landing_page', 'section_type', 'layout_variant', 'display_order',
            'is_active', 'status', 'start_date', 'end_date', 'config',
            'image', 'image_url', 'mobile_image', 'mobile_image_url', 'collage_items',
            'product_ids', 'products_detail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_mobile_image_url(self, obj):
        if obj.mobile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.mobile_image.url)
            return obj.mobile_image.url
        return None

    def get_products_detail(self, obj):
        from apps.inventory.serializers import ProductSerializer
        selections = obj.product_selections.select_related('product').all()
        products = [selection.product for selection in selections]
        return ProductSerializer(products, many=True, context=self.context).data

    def validate_config(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Config must be a dictionary.")
        
        # YouTube URL normalization for banner sections
        youtube_url = value.get('youtube_url')
        if youtube_url:
            import re
            # 1. Handle iframe extraction
            if '<iframe' in youtube_url.lower():
                match = re.search(r'src=["\']([^"\']+)["\']', youtube_url)
                if match:
                    youtube_url = match.group(1)
            
            # 2. Extract 11-char video ID
            video_id = None
            match_v = re.search(r'(?:v=|\&v=)([a-zA-Z0-9_-]{11})', youtube_url)
            if match_v:
                video_id = match_v.group(1)
            else:
                match_shorts = re.search(r'shorts/([a-zA-Z0-9_-]{11})', youtube_url)
                if match_shorts:
                    video_id = match_shorts.group(1)
                else:
                    match_embed = re.search(r'embed/([a-zA-Z0-9_-]{11})', youtube_url)
                    if match_embed:
                        video_id = match_embed.group(1)
                    else:
                        match_share = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', youtube_url)
                        if match_share:
                            video_id = match_share.group(1)
            
            if video_id:
                value['youtube_url'] = f"https://www.youtube.com/embed/{video_id}"
            elif "youtube.com/embed/" in youtube_url:
                value['youtube_url'] = youtube_url
            else:
                raise serializers.ValidationError("Only valid YouTube or YouTube Shorts URLs/embed links are accepted.")
        return value

    def create(self, validated_data):
        product_ids = validated_data.pop('product_ids', None)
        instance = super().create(validated_data)
        if product_ids is not None:
            self._save_product_selections(instance, product_ids)
        return instance

    def update(self, instance, validated_data):
        product_ids = validated_data.pop('product_ids', None)
        instance = super().update(instance, validated_data)
        if product_ids is not None:
            self._save_product_selections(instance, product_ids)
        return instance

    def _save_product_selections(self, instance, product_ids):
        from .models import LandingPageProductSelection
        instance.product_selections.all().delete()
        for order, prod_id in enumerate(product_ids):
            LandingPageProductSelection.objects.create(
                section=instance,
                product_id=prod_id,
                display_order=order
            )


class LandingPageSerializer(serializers.ModelSerializer):
    sections = LandingPageSectionSerializer(many=True, read_only=True)

    class Meta:
        model = LandingPage
        fields = ['id', 'name', 'is_active', 'sections', 'created_at', 'updated_at']

