from django.contrib import admin
from .models import WholesalePricingSettings


@admin.register(WholesalePricingSettings)
class WholesalePricingSettingsAdmin(admin.ModelAdmin):
    list_display = ('global_wholesale_cutoff', 'updated_at')
