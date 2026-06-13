from rest_framework import serializers
from .models import (
    Employee, 
    SalaryComponent, 
    EmployeeSalaryStructure, 
    LeaveRequest, 
    PayrollRecord, 
    PayrollItem
)

class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = "__all__"

class EmployeeSalaryStructureSerializer(serializers.ModelSerializer):
    component_name = serializers.ReadOnlyField(source="component.name")
    component_type = serializers.ReadOnlyField(source="component.component_type")

    class Meta:
        model = EmployeeSalaryStructure
        fields = ["id", "employee", "component", "component_name", "component_type", "amount"]

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source="employee.full_name")
    approved_by_name = serializers.ReadOnlyField(source="approved_by.username")

    class Meta:
        model = LeaveRequest
        fields = "__all__"

class PayrollItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollItem
        fields = "__all__"

class PayrollRecordDetailSerializer(serializers.ModelSerializer):
    items = PayrollItemSerializer(many=True, read_only=True)
    employee_name = serializers.ReadOnlyField(source="employee.full_name")

    class Meta:
        model = PayrollRecord
        fields = "__all__"

class EmployeeHRDetailSerializer(serializers.ModelSerializer):
    salary_structures = EmployeeSalaryStructureSerializer(many=True, read_only=True)
    leave_requests = LeaveRequestSerializer(many=True, read_only=True)
    payroll_records = PayrollRecordDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id", "full_name", "email", "phone", "designation", 
            "base_salary", "hire_date", "is_active", 
            "salary_structures", "leave_requests", "payroll_records"
        ]
