from decimal import Decimal
from django.contrib.auth import get_user_model

from rest_framework import serializers
from apps.authentication.models import UserRole

from .models import AttendanceRecord, Branch, Employee, PayrollRecord


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "is_active", "created_at", "updated_at"]


class EmployeeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "branch",
            "branch_name",
            "full_name",
            "email",
            "phone",
            "designation",
            "base_salary",
            "hire_date",
            "is_active",
            "user",
            "created_at",
            "updated_at",
        ]


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    branch = serializers.IntegerField(source="employee.branch_id", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "employee",
            "employee_name",
            "branch",
            "date",
            "check_in",
            "check_out",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]


class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    branch = serializers.IntegerField(source="employee.branch_id", read_only=True)

    class Meta:
        model = PayrollRecord
        fields = [
            "id",
            "employee",
            "employee_name",
            "branch",
            "period_start",
            "gross_amount",
            "deductions",
            "net_amount",
            "is_paid",
            "paid_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["paid_at", "created_at", "updated_at"]

    def validate(self, attrs):
        gross = attrs.get("gross_amount", Decimal("0.00"))
        deductions = attrs.get("deductions", Decimal("0.00"))
        if deductions > gross:
            raise serializers.ValidationError("Deductions cannot exceed gross amount.")
        attrs["net_amount"] = gross - deductions
        return attrs


class StaffAccountCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserRole.choices)
    managed_branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), required=False, allow_null=True
    )
    hr_branch_ids = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), many=True, required=False
    )

    def validate(self, attrs):
        role = attrs.get("role")
        managed_branch = attrs.get("managed_branch")
        if role == UserRole.BRANCH_MANAGER and not managed_branch:
            raise serializers.ValidationError(
                {"managed_branch": "Branch manager must have a managed branch."}
            )
        return attrs

    def create(self, validated_data):
        User = get_user_model()
        hr_branch_ids = validated_data.pop("hr_branch_ids", [])
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        if user.role == UserRole.HR:
            user.hr_branches.set(hr_branch_ids)
        return user


class AccountSerializer(serializers.ModelSerializer):
    """Account read + edit serializer used by the Account Center admin UI."""

    managed_branch_name = serializers.CharField(
        source="managed_branch.name", read_only=True, default=None
    )
    hr_branch_ids = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        many=True,
        required=False,
        source="hr_branches",
    )
    hr_branch_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "managed_branch",
            "managed_branch_name",
            "hr_branch_ids",
            "hr_branch_names",
            "is_active",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "is_superuser", "last_login", "date_joined"]

    def get_hr_branch_names(self, obj) -> list[str]:
        return list(obj.hr_branches.values_list("name", flat=True))

    def validate(self, attrs):
        role = attrs.get("role", getattr(self.instance, "role", None))
        managed_branch = attrs.get(
            "managed_branch", getattr(self.instance, "managed_branch", None)
        )
        if role == UserRole.BRANCH_MANAGER and not managed_branch:
            raise serializers.ValidationError(
                {"managed_branch": "Branch manager must have a managed branch."}
            )
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=6)
