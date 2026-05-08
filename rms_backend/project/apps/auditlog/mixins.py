"""
AuditLoggedMixin — drop into any DRF ModelViewSet to auto-log CUD operations.

Usage:
    class ProductViewSet(AuditLoggedMixin, ModelViewSet):
        ...
"""

import json
from django.forms.models import model_to_dict
from .models import AuditLog


def _get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _get_branch_id(request):
    try:
        return int(request.headers.get("X-Branch-Id", ""))
    except (ValueError, TypeError):
        return None


def _serializable(obj):
    """Convert a model instance to a JSON-serializable dict."""
    try:
        d = model_to_dict(obj)
        # model_to_dict doesn't serialize date/datetime; force strings
        return json.loads(json.dumps(d, default=str))
    except Exception:
        return {"id": getattr(obj, "pk", None)}


class AuditLoggedMixin:
    """DRF ModelViewSet mixin that writes AuditLog entries for create/update/delete."""

    # Override in the ViewSet to customise the entity_type label
    audit_entity_type: str | None = None

    def _entity_type(self):
        if self.audit_entity_type:
            return self.audit_entity_type
        model = getattr(self, "queryset", None)
        if model is not None:
            return model.model.__name__
        return self.__class__.__name__.replace("ViewSet", "")

    def _log(self, action, instance, before=None, after=None):
        request = self.request
        branch_id = _get_branch_id(request)
        AuditLog.objects.create(
            actor=request.user if request.user.is_authenticated else None,
            action=action,
            entity_type=self._entity_type(),
            entity_id=instance.pk,
            entity_repr=str(instance)[:200],
            branch_id=branch_id,
            before_json=before,
            after_json=after,
            ip_address=_get_client_ip(request),
        )

    def perform_create(self, serializer):
        super().perform_create(serializer)
        instance = serializer.instance
        self._log(AuditLog.Action.CREATE, instance, after=_serializable(instance))

    def perform_update(self, serializer):
        instance = serializer.instance
        before = _serializable(instance)
        super().perform_update(serializer)
        instance.refresh_from_db()
        self._log(AuditLog.Action.UPDATE, instance, before=before, after=_serializable(instance))

    def perform_destroy(self, instance):
        before = _serializable(instance)
        pk = instance.pk
        super().perform_destroy(instance)
        # instance is deleted, so we create a minimal log
        AuditLog.objects.create(
            actor=self.request.user if self.request.user.is_authenticated else None,
            action=AuditLog.Action.DELETE,
            entity_type=self._entity_type(),
            entity_id=pk,
            entity_repr=str(instance)[:200],
            branch_id=_get_branch_id(self.request),
            before_json=before,
            after_json=None,
            ip_address=_get_client_ip(self.request),
        )
