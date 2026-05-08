"""Admin views that power the Roles & Permissions UI.

Exposes:
    GET    /auth/permissions/                       (list catalog)
    GET    /auth/users/<id>/permissions/            (codes the user holds)
    PUT    /auth/users/<id>/permissions/            (replace codes)
    POST   /auth/users/<id>/permissions/<code>/     (grant single)
    DELETE /auth/users/<id>/permissions/<code>/     (revoke single)
    GET    /auth/role-defaults/                     (cheatsheet of role defaults)

All endpoints require admin (mirrors the Account Center).
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.branches.permissions import is_admin

from .models import (
    Permission,
    ROLE_DEFAULT_PERMISSIONS,
    UserPermissionGrant,
    UserRole,
)


User = get_user_model()


def _require_admin(request):
    if not is_admin(request.user):
        return Response(
            {"detail": "Only admin can manage permissions."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


class PermissionCatalogView(APIView):
    """Lists every permission code in the catalog, grouped by category."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden
        items = list(
            Permission.objects.values("id", "code", "name", "description", "category")
        )
        return Response(items)


class RoleDefaultsView(APIView):
    """Returns the role-defaults cheatsheet used by the matrix UI."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden
        all_codes = list(Permission.objects.values_list("code", flat=True))
        return Response(
            {
                "admin": all_codes,
                "branch_manager": ROLE_DEFAULT_PERMISSIONS.get(
                    UserRole.BRANCH_MANAGER, []
                ),
                "hr": ROLE_DEFAULT_PERMISSIONS.get(UserRole.HR, []),
            }
        )


class UserPermissionsView(APIView):
    """Read or replace the explicit grants for a single user."""

    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        explicit = list(
            UserPermissionGrant.objects.filter(user=user).values_list(
                "permission__code", flat=True
            )
        )
        defaults = ROLE_DEFAULT_PERMISSIONS.get(user.role, [])
        if user.is_superuser or user.role == UserRole.ADMIN:
            defaults = list(Permission.objects.values_list("code", flat=True))

        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "role": user.role,
                "default_codes": defaults,
                "granted_codes": explicit,
                "effective_codes": user.get_permission_codes(),
            }
        )

    def put(self, request, user_id):
        """Replace all explicit grants for the user with the supplied list."""
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        codes = request.data.get("codes", [])
        if not isinstance(codes, list):
            return Response(
                {"detail": "`codes` must be a list of permission codes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permissions_qs = Permission.objects.filter(code__in=codes)
        UserPermissionGrant.objects.filter(user=user).exclude(
            permission__in=permissions_qs
        ).delete()
        for permission in permissions_qs:
            UserPermissionGrant.objects.get_or_create(
                user=user,
                permission=permission,
                defaults={"granted_by": request.user},
            )

        return Response(
            {
                "user_id": user.id,
                "granted_codes": list(
                    UserPermissionGrant.objects.filter(user=user).values_list(
                        "permission__code", flat=True
                    )
                ),
                "effective_codes": user.get_permission_codes(),
            }
        )


class UserPermissionGrantView(APIView):
    """Grant or revoke a single permission for a user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, user_id, code):
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden
        try:
            user = User.objects.get(pk=user_id)
            permission = Permission.objects.get(code=code)
        except (User.DoesNotExist, Permission.DoesNotExist):
            return Response(status=status.HTTP_404_NOT_FOUND)
        UserPermissionGrant.objects.get_or_create(
            user=user, permission=permission, defaults={"granted_by": request.user}
        )
        return Response({"detail": "granted"})

    def delete(self, request, user_id, code):
        forbidden = _require_admin(request)
        if forbidden is not None:
            return forbidden
        UserPermissionGrant.objects.filter(
            user_id=user_id, permission__code=code
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
