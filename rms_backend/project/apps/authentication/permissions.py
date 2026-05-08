"""DRF permission helpers driven by the Permission catalog.

Usage:
    class CategoryViewSet(viewsets.ModelViewSet):
        permission_classes = [HasPermission("manage_categories")]

    # Different codes for read vs write:
    class BrandViewSet(viewsets.ModelViewSet):
        permission_classes = [HasReadWritePermission(read=None, write="manage_brands")]

The classes below short-circuit to True for admins so admins always pass.
"""

from rest_framework import permissions


SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def _user_has(user, code):
    if not user or not user.is_authenticated:
        return False
    if hasattr(user, "has_permission_code"):
        return user.has_permission_code(code)
    # Fallback for non-CustomUser users (shouldn't happen in this project).
    return user.is_superuser


class HasPermission(permissions.BasePermission):
    """Require a single permission code."""

    code = ""

    def __init__(self, code=None):
        if code is not None:
            self.code = code

    def __call__(self, *args, **kwargs):
        # Allow `permission_classes = [HasPermission("foo")]`.
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return _user_has(request.user, self.code)


def make_permission(code):
    """Factory for use in `permission_classes = [make_permission('x')]`."""

    class _P(HasPermission):
        pass

    _P.code = code
    _P.__name__ = f"HasPermission_{code}"
    return _P


class HasReadWritePermission(permissions.BasePermission):
    """Different codes for read vs write methods.

    Pass `read=None` to allow any authenticated user to read.
    Pass `write=None` to forbid writes outright.
    """

    read = None
    write = None

    def __init__(self, read=None, write=None):
        self.read = read
        self.write = write

    def __call__(self, *args, **kwargs):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return self.read is None or _user_has(request.user, self.read)
        if self.write is None:
            return False
        return _user_has(request.user, self.write)
