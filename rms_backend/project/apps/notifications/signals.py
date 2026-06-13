"""
Signal-based notification triggers.

These fire automatically when relevant events occur in the system:
  - Low stock alerts
  - New online preorders
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification


@receiver(post_save, sender="inventory.InventoryAlert")
def notify_low_stock(sender, instance, created, **kwargs):
    """Create a notification when a new low/out-of-stock alert fires."""
    if not created:
        return
    Notification.objects.create(
        recipient_role="admin",
        branch=instance.branch,
        kind=Notification.Kind.LOW_STOCK,
        title=f"Low stock: {instance.product.name}",
        body=instance.message,
        link="/inventory",
    )


@receiver(post_save, sender="online_preorder.OnlinePreorder")
def notify_online_preorder(sender, instance, created, **kwargs):
    """Notify admin when a new online preorder is placed."""
    if not created:
        return
    Notification.objects.create(
        recipient_role="admin",
        kind=Notification.Kind.ONLINE_PREORDER,
        title="New online preorder",
        body=f"Order #{instance.id} has been placed.",
        link="/online-preorders",
    )
