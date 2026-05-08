from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            "id",
            "kind",
            "title",
            "body",
            "link",
            "is_read",
            "branch",
            "branch_name",
            "created_at",
        ]
        read_only_fields = fields
