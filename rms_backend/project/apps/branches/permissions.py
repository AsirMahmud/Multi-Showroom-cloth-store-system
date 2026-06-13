from apps.authentication.models import UserRole


def get_allowed_branch_ids(user):
    if not user or not user.is_authenticated:
        return []
    return user.get_accessible_branch_ids()


def get_requested_branch_id(request):
    branch_id = request.query_params.get("branch_id") or request.headers.get("X-Branch-Id")
    if not branch_id:
        return None
    try:
        return int(branch_id)
    except (TypeError, ValueError):
        return None


def is_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role == UserRole.ADMIN))
