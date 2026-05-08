from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    BRANCH_MANAGER = "branch_manager", "Branch Manager"
    HR = "hr", "HR"


# Default permissions granted to a role at JWT-issue time. Admin gets ALL.
ROLE_DEFAULT_PERMISSIONS = {
    UserRole.BRANCH_MANAGER: [
        "view_sales", "create_sale", "view_expenses", "create_expense",
        "view_inventory", "add_stock", "view_employees", "manage_attendance",
        "view_preorders", "manage_preorders", "view_reports",
        "view_customers", "manage_due_payments",
    ],
    UserRole.HR: [
        "view_employees", "manage_employees", "manage_attendance",
        "manage_payroll", "view_reports",
    ],
}


class Permission(models.Model):
    """Catalog of permission codes used by HasPermission DRF class."""

    CATEGORY_CHOICES = [
        ("global", "Global resources"),
        ("branch", "Branch operations"),
        ("system", "System"),
    ]

    code = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=16, choices=CATEGORY_CHOICES, default="branch"
    )

    class Meta:
        ordering = ["category", "code"]

    def __str__(self):
        return self.code


class UserPermissionGrant(models.Model):
    """Association of a Permission to a User, with provenance for audit."""

    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.CASCADE,
        related_name="permission_grants",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="grants",
    )
    granted_by = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="permissions_granted",
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "permission")
        ordering = ["-granted_at"]

    def __str__(self):
        return f"{self.user.username} -> {self.permission.code}"


class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ADMIN,
        db_index=True,
    )
    managed_branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managers",
    )
    hr_branches = models.ManyToManyField(
        "branches.Branch",
        blank=True,
        related_name="hr_users",
        help_text="If empty for HR role, all branches are accessible.",
    )

    def get_accessible_branch_ids(self):
        from apps.branches.models import Branch

        if self.is_superuser or self.role == UserRole.ADMIN:
            return list(
                Branch.objects.filter(is_active=True).values_list("id", flat=True)
            )
        if self.role == UserRole.BRANCH_MANAGER and self.managed_branch_id:
            return [self.managed_branch_id]
        if self.role == UserRole.HR:
            ids = list(self.hr_branches.values_list("id", flat=True))
            if ids:
                return ids
            return list(
                Branch.objects.filter(is_active=True).values_list("id", flat=True)
            )
        return list(
            Branch.objects.filter(is_active=True).values_list("id", flat=True)
        )

    def can_access_branch(self, branch_id) -> bool:
        if branch_id is None:
            return False
        return int(branch_id) in self.get_accessible_branch_ids()

    # ---- Permission helpers ---------------------------------------------------
    def is_admin_user(self) -> bool:
        return self.is_superuser or self.role == UserRole.ADMIN

    def get_permission_codes(self) -> list[str]:
        """Return the union of role defaults + explicit grants for this user."""
        if self.is_admin_user():
            # Admin implicitly has every permission in the catalog.
            return list(Permission.objects.values_list("code", flat=True))
        codes = set(ROLE_DEFAULT_PERMISSIONS.get(self.role, []))
        codes.update(
            self.permission_grants.values_list("permission__code", flat=True)
        )
        return sorted(codes)

    def has_permission_code(self, code: str) -> bool:
        if self.is_admin_user():
            return True
        if code in ROLE_DEFAULT_PERMISSIONS.get(self.role, []):
            return True
        return self.permission_grants.filter(permission__code=code).exists()
