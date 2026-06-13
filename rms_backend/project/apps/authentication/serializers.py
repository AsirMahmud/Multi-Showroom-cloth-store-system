from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'managed_branch']

    def create(self, validated_data):
        role = validated_data.pop("role", None)
        managed_branch = validated_data.pop("managed_branch", None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        if role:
            user.role = role
        if managed_branch:
            user.managed_branch = managed_branch
        user.save(update_fields=["role", "managed_branch"])
        return user
