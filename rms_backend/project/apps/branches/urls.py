from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountAdminViewSet,
    AttendanceRecordViewSet,
    BranchViewSet,
    EmployeeViewSet,
    FinancialOverviewViewSet,
    PayrollRecordViewSet,
)

router = DefaultRouter()
router.register(r"branches", BranchViewSet, basename="branches")
router.register(r"hr/employees", EmployeeViewSet, basename="hr-employees")
router.register(r"hr/attendance", AttendanceRecordViewSet, basename="hr-attendance")
router.register(r"hr/payroll", PayrollRecordViewSet, basename="hr-payroll")
router.register(
    r"admin/financial-overview",
    FinancialOverviewViewSet,
    basename="admin-financial-overview",
)
router.register(
    r"admin/accounts",
    AccountAdminViewSet,
    basename="admin-accounts",
)

urlpatterns = [
    path("", include(router.urls)),
]
