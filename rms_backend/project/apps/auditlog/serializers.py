from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True, default=None)
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "action",
            "entity_type",
            "entity_id",
            "entity_repr",
            "branch",
            "branch_name",
            "before_json",
            "after_json",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
