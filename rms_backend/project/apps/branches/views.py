from datetime import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.expenses.models import Expense
from apps.inventory.models import Product
from apps.sales.models import DuePayment, Sale

from .models import AttendanceRecord, Branch, Employee, PayrollRecord, SalaryComponent, EmployeeSalaryStructure, LeaveRequest, PayrollItem
from .permissions import get_allowed_branch_ids, get_requested_branch_id, is_admin
from .serializers import (
    AccountSerializer,
    AttendanceRecordSerializer,
    BranchSerializer,
    EmployeeSerializer,
    PasswordResetSerializer,
    PayrollRecordSerializer,
    StaffAccountCreateSerializer,
)
from .hr_serializers import (
    SalaryComponentSerializer,
    EmployeeSalaryStructureSerializer,
    LeaveRequestSerializer,
    EmployeeHRDetailSerializer,
    PayrollRecordDetailSerializer,
)

User = get_user_model()


def _kpi_for_branch(branch_id):
    """Aggregate the KPI strip values for a single branch (or None == all)."""
    today = timezone.now().date()

    sales_qs = Sale.objects.all()
    expenses_qs = Expense.objects.all()
    dues_qs = DuePayment.objects.filter(status='pending')

    if branch_id:
        sales_qs = sales_qs.filter(branch_id=branch_id)
        expenses_qs = expenses_qs.filter(branch_id=branch_id)
        dues_qs = dues_qs.filter(sale__branch_id=branch_id)

    today_sales = sales_qs.filter(
        date__date=today,
        status='completed',
    ).aggregate(total=Sum('total'))['total'] or Decimal('0.00')

    today_expenses = expenses_qs.filter(date=today).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')

    open_dues = dues_qs.aggregate(
        total=Sum('amount_due') - Sum('amount_paid')
    )['total'] or Decimal('0.00')

    # Catalog/stock figures stay global until Phase 3 introduces BranchProduct;
    # we still surface a meaningful number so the cards aren't blank.
    products_in_stock = Product.objects.filter(stock_quantity__gt=0).count()
    low_stock_count = Product.objects.filter(
        stock_quantity__lte=F('minimum_stock')
    ).count()

    if branch_id:
        staff_count = User.objects.filter(
            is_active=True,
            managed_branch_id=branch_id,
        ).count()
    else:
        staff_count = User.objects.filter(is_active=True).count()

    return {
        'branch_id': branch_id,
        'today_sales': today_sales,
        'today_expenses': today_expenses,
        'open_dues': open_dues,
        'products_in_stock': products_in_stock,
        'low_stock_count': low_stock_count,
        'staff_count': staff_count,
    }


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Branch.objects.filter(is_active=True)
        if is_admin(self.request.user):
            return qs
        return qs.filter(id__in=get_allowed_branch_ids(self.request.user))

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": "Only admin can add branches."}, status=403)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """KPI strip for a single branch shown on the selector card."""
        branch = self.get_object()
        if not request.user.can_access_branch(branch.id):
            return Response({"detail": "Not allowed for this branch."}, status=403)
        return Response(_kpi_for_branch(branch.id))

    @action(detail=False, methods=['get'], url_path='summary')
    def all_summary(self, request):
        """KPI strip for the 'All Branches' card. Admin only."""
        if not is_admin(request.user):
            return Response(
                {"detail": "Only admin can view the All-Branches summary."},
                status=403,
            )
        return Response(_kpi_for_branch(None))


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Employee.objects.select_related("branch").all()
        if is_admin(self.request.user):
            return qs
        return qs.filter(branch_id__in=get_allowed_branch_ids(self.request.user))

    @action(detail=True, methods=['get'], url_path='hr-profile')
    def hr_profile(self, request, pk=None):
        employee = self.get_object()
        serializer = EmployeeHRDetailSerializer(employee)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='run-payroll')
    def run_payroll(self, request, pk=None):
        employee = self.get_object()
        period = request.data.get("period")
        
        if not period:
            period_start = timezone.now().date().replace(day=1)
        else:
            period_start = datetime.strptime(period, "%Y-%m-%d").date().replace(day=1)

        # Check if already exists
        if PayrollRecord.objects.filter(employee=employee, period_start=period_start).exists():
            return Response({"detail": "Payroll already exists for this period."}, status=400)

        # Calculate Breakdown
        structures = employee.salary_structures.all()
        gross = employee.base_salary
        deductions = Decimal("0.00")
        
        items_to_create = []
        # Add base salary as an item
        items_to_create.append({
            "name": "Base Salary",
            "type": "earning",
            "amount": employee.base_salary
        })

        for struct in structures:
            if struct.component.component_type == "earning":
                gross += struct.amount
            else:
                deductions += struct.amount
            
            items_to_create.append({
                "name": struct.component.name,
                "type": struct.component.component_type,
                "amount": struct.amount
            })

        net = gross - deductions
        
        payroll = PayrollRecord.objects.create(
            employee=employee,
            period_start=period_start,
            gross_amount=gross,
            deductions=deductions,
            net_amount=net
        )

        for item in items_to_create:
            PayrollItem.objects.create(
                payroll_record=payroll,
                component_name=item["name"],
                component_type=item["type"],
                amount=item["amount"]
            )

        return Response(PayrollRecordDetailSerializer(payroll).data)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related("employee", "employee__branch").all()
        if is_admin(self.request.user):
            return qs
        return qs.filter(employee__branch_id__in=get_allowed_branch_ids(self.request.user))

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get("employee")
        date_str = request.data.get("date")
        
        if not employee_id or not date_str:
            return super().create(request, *args, **kwargs)

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_admin(request.user) and employee.branch_id not in get_allowed_branch_ids(request.user):
            return Response({"detail": "Not allowed for this branch."}, status=status.HTTP_403_FORBIDDEN)

        record, created = AttendanceRecord.objects.update_or_create(
            employee=employee,
            date=date_str,
            defaults={"status": request.data.get("status", "present")}
        )

        serializer = self.get_serializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PayrollRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = PayrollRecord.objects.select_related("employee", "employee__branch").all()
        if is_admin(self.request.user):
            return qs
        return qs.filter(employee__branch_id__in=get_allowed_branch_ids(self.request.user))

    @action(detail=False, methods=["post"], url_path="run-monthly")
    def run_monthly(self, request):
        period = request.data.get("period")
        if not period:
            period_start = timezone.now().date().replace(day=1)
        else:
            period_start = datetime.strptime(period, "%Y-%m-%d").date().replace(day=1)

        employees = Employee.objects.filter(is_active=True)
        if not is_admin(request.user):
            employees = employees.filter(branch_id__in=get_allowed_branch_ids(request.user))

        created = 0
        for emp in employees:
            _, was_created = PayrollRecord.objects.get_or_create(
                employee=emp,
                period_start=period_start,
                defaults={
                    "gross_amount": emp.base_salary,
                    "deductions": Decimal("0.00"),
                    "net_amount": emp.base_salary,
                },
            )
            if was_created:
                created += 1
        return Response({"period_start": str(period_start), "created_records": created})


class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmployeeSalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSalaryStructure.objects.all()
    serializer_class = EmployeeSalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        emp_id = self.request.query_params.get("employee")
        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        return qs

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not is_admin(self.request.user):
            qs = qs.filter(employee__branch_id__in=get_allowed_branch_ids(self.request.user))
        return qs

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = "approved"
        leave.approved_by = request.user
        leave.save()
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = "rejected"
        leave.save()
        return Response({"status": "rejected"})


class FinancialOverviewViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        branch_id = get_requested_branch_id(request)
        if branch_id and not request.user.can_access_branch(branch_id):
            return Response({"detail": "Not allowed for this branch."}, status=403)

        sales_qs = Sale.objects.all()
        expense_qs = Expense.objects.all()
        if not is_admin(request.user):
            allowed = get_allowed_branch_ids(request.user)
            sales_qs = sales_qs.filter(branch_id__in=allowed)
            expense_qs = expense_qs.filter(branch_id__in=allowed)
        elif branch_id:
            sales_qs = sales_qs.filter(branch_id=branch_id)
            expense_qs = expense_qs.filter(branch_id=branch_id)

        total_sales = sales_qs.aggregate(v=Sum("total"))["v"] or Decimal("0.00")
        total_expenses = expense_qs.aggregate(v=Sum("amount"))["v"] or Decimal("0.00")
        return Response(
            {
                "total_sales": total_sales,
                "total_expenses": total_expenses,
                "net_profit": total_sales - total_expenses,
                "branch_id": branch_id,
            }
        )


class AccountAdminViewSet(viewsets.ModelViewSet):
    """Admin-only Account Center.

    Provides full CRUD for staff accounts plus deactivate / reset-password
    actions. Listing is filtered by branch context so a non-admin auditor only
    sees managers/HR scoped to branches they can access.
    """

    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = User.objects.all().select_related("managed_branch").prefetch_related(
            "hr_branches"
        )
        if not is_admin(self.request.user):
            allowed = get_allowed_branch_ids(self.request.user)
            qs = qs.filter(managed_branch_id__in=allowed)
        return qs.order_by("username")

    def _require_admin(self, request):
        if not is_admin(request.user):
            return Response(
                {"detail": "Only admin can manage accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def create(self, request, *args, **kwargs):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        serializer = StaffAccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            AccountSerializer(user).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"detail": "You cannot delete the currently signed-in account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Soft-delete: deactivate instead of dropping rows so audit history
        # and historical sales links stay valid.
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(AccountSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(AccountSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        forbidden = self._require_admin(request)
        if forbidden is not None:
            return forbidden
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})
