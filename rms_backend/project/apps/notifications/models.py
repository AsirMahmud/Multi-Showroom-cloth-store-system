from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification for users."""

    class Kind(models.TextChoices):
        LOW_STOCK = "LOW_STOCK", "Low Stock"
        DUE_PAYMENT = "DUE_PAYMENT", "Due Payment"
        ONLINE_PREORDER = "ONLINE_PREORDER", "Online Preorder"
        LARGE_SALE = "LARGE_SALE", "Large Sale"
        STOCK_TRANSFER = "STOCK_TRANSFER", "Stock Transfer"
        GENERAL = "GENERAL", "General"

    # Targeting ---------------------------------------------------------------
    # At least one of recipient_user / recipient_role should be set.
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Specific user recipient. If null, uses recipient_role.",
    )
    recipient_role = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Role-based targeting (e.g. 'admin'). Empty = all roles.",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Content -----------------------------------------------------------------
    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
        default=Kind.GENERAL,
        db_index=True,
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    link = models.CharField(
        max_length=300,
        blank=True,
        help_text="Frontend path to navigate to on click, e.g. /sales/due",
    )

    # State -------------------------------------------------------------------
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.kind}] {self.title}"
