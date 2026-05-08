from django.urls import path
from .views import RegisterView, ProtectedView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .jwt import RoleAwareTokenObtainPairView
from .admin_views import (
    PermissionCatalogView,
    RoleDefaultsView,
    UserPermissionGrantView,
    UserPermissionsView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', RoleAwareTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    # Roles & Permissions admin
    path('permissions/', PermissionCatalogView.as_view(), name='permissions-catalog'),
    path('role-defaults/', RoleDefaultsView.as_view(), name='role-defaults'),
    path(
        'users/<int:user_id>/permissions/',
        UserPermissionsView.as_view(),
        name='user-permissions',
    ),
    path(
        'users/<int:user_id>/permissions/<str:code>/',
        UserPermissionGrantView.as_view(),
        name='user-permission-grant',
    ),
]
