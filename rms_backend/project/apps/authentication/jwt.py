from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["managed_branch_id"] = user.managed_branch_id
        token["branch_ids"] = user.get_accessible_branch_ids()
        # Permission codes the frontend uses for hide/disable decisions.
        # Admins implicitly receive every code in the catalog.
        token["permissions"] = user.get_permission_codes()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["managed_branch_id"] = self.user.managed_branch_id
        data["branch_ids"] = self.user.get_accessible_branch_ids()
        data["permissions"] = self.user.get_permission_codes()
        data["username"] = self.user.username
        return data


class RoleAwareTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleAwareTokenObtainPairSerializer
