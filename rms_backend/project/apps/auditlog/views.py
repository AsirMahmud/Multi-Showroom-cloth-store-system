from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import AuditLog
from .serializers import AuditLogSerializer


class IsAdminRole(permissions.BasePermission):
    """Only allow users with admin role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only read view of audit log entries.
    Supports filtering by: action, entity_type, branch, actor, date range.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        "action": ["exact"],
        "entity_type": ["exact"],
        "branch": ["exact"],
        "actor": ["exact"],
        "created_at": ["gte", "lte"],
    }
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return AuditLog.objects.select_related("actor", "branch").all()
