from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """Tracks CRUD operations on sensitive entities."""

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
    )
    action = models.CharField(
        max_length=10,
        choices=Action.choices,
        db_index=True,
    )
    entity_type = models.CharField(
        max_length=60,
        db_index=True,
        help_text="e.g. 'Product', 'Sale', 'Expense'",
    )
    entity_id = models.PositiveIntegerField(
        db_index=True,
        help_text="PK of the affected object",
    )
    entity_repr = models.CharField(
        max_length=200,
        blank=True,
        help_text="Human-readable representation, e.g. product name",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    before_json = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of the entity before the change",
    )
    after_json = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of the entity after the change",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} {self.entity_type}#{self.entity_id} by {self.actor}"
