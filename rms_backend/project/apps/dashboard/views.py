from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from apps.sales.models import Sale, SaleItem
from apps.expenses.models import Expense, ExpenseCategory
from apps.customer.models import Customer
from apps.inventory.models import Product, StockMovement, InventoryAlert
from apps.supplier.models import Supplier
from apps.branches.permissions import (
    get_allowed_branch_ids,
    get_requested_branch_id,
    is_admin,
)


def _branch_scope(request, queryset, field='branch_id'):
    """Filter a queryset by the branch context on the request."""
    requested = get_requested_branch_id(request)
    if requested:
        if not request.user.can_access_branch(requested):
            return queryset.none()
        return queryset.filter(**{field: requested})
    if is_admin(request.user):
        return queryset
    allowed = get_allowed_branch_ids(request.user)
    return queryset.filter(**{f'{field}__in': allowed})


class DashboardStatsView(APIView):
    """Aggregate dashboard metrics scoped to the active branch (or All Branches)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        start_of_month = today.replace(day=1)

        sales_scope = _branch_scope(request, Sale.objects.all())
        expense_scope = _branch_scope(request, Expense.objects.all())
        movements_scope = _branch_scope(
            request,
            StockMovement.objects.all(),
        )

        today_sales = sales_scope.filter(
            date__date=today,
            status='completed',
        ).aggregate(
            total=Sum('total'),
            total_profit=Sum('total_profit'),
            total_loss=Sum('total_loss'),
        )

        today_expenses = expense_scope.filter(date=today).aggregate(
            total=Sum('amount')
        )['total'] or 0

        monthly_sales = sales_scope.filter(
            date__date__gte=start_of_month,
            date__date__lte=today,
            status='completed',
        ).aggregate(
            total=Sum('total'),
            total_profit=Sum('total_profit'),
            total_loss=Sum('total_loss'),
        )

        monthly_expenses = expense_scope.filter(
            date__gte=start_of_month,
            date__lte=today,
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Customer + Product + Supplier counts
        # (Customers/Products/Suppliers stay GLOBAL per the architecture decision.
        # In Phase 3 stock counts will switch to per-branch via BranchProduct.)
        total_customers = Customer.objects.count()
        total_products = Product.objects.count()
        total_suppliers = Supplier.objects.count()

        sales_trend = sales_scope.filter(
            date__date__gte=start_of_month,
            date__date__lte=today,
            status='completed',
        ).values('date__date').annotate(
            total=Sum('total'),
            profit=Sum('total_profit'),
            loss=Sum('total_loss'),
        ).order_by('date__date')

        expense_trend = expense_scope.filter(
            date__gte=start_of_month,
            date__lte=today,
        ).values('date').annotate(amount=Sum('amount')).order_by('date')

        # Top selling products in the active branch.
        top_products = SaleItem.objects.filter(
            sale__in=sales_scope.filter(status='completed'),
        ).values('product__name').annotate(
            total_sales=Sum('quantity'),
            total_revenue=Sum('total'),
            total_profit=Sum('profit'),
        ).order_by('-total_sales')[:5]

        # Expense categories aggregated only over the in-scope expenses.
        expense_categories = ExpenseCategory.objects.annotate(
            amount=Sum(
                'expenses__amount',
                filter=Q(expenses__in=expense_scope),
            )
        ).values('name', 'amount').order_by('-amount')

        # Low stock items remain product-global until Phase 3 introduces BranchProduct.
        low_stock_items = Product.objects.filter(
            Q(stock_quantity__lte=F('minimum_stock'))
        ).values('name', 'stock_quantity', 'minimum_stock')[:5]

        recent_suppliers = Supplier.objects.filter(is_active=True)[:6]

        # Movement summary for the active branch.
        stock_in = movements_scope.filter(movement_type='IN').aggregate(
            total=Sum('quantity')
        )['total'] or 0
        stock_out = movements_scope.filter(movement_type='OUT').aggregate(
            total=Sum('quantity')
        )['total'] or 0

        return Response({
            'today': {
                'sales': today_sales['total'] or 0,
                'expenses': today_expenses,
                'profit': today_sales['total_profit'] or 0,
            },
            'monthly': {
                'sales': monthly_sales['total'] or 0,
                'expenses': monthly_expenses,
                'profit': monthly_sales['total_profit'] or 0,
            },
            'counts': {
                'customers': total_customers,
                'products': total_products,
                'suppliers': total_suppliers,
            },
            'stock_movements': {
                'in': stock_in,
                'out': stock_out,
            },
            'sales_trend': list(sales_trend),
            'expense_trend': list(expense_trend),
            'top_products': [
                {
                    'name': product['product__name'],
                    'total_sales': product['total_sales'] or 0,
                    'total_revenue': product['total_revenue'] or 0,
                    'total_profit': product['total_profit'] or 0,
                }
                for product in top_products
            ],
            'expense_categories': list(expense_categories),
            'low_stock_items': list(low_stock_items),
            'recent_suppliers': [
                {
                    'name': supplier.company_name,
                    'phone': supplier.phone,
                    'email': supplier.email,
                    'address': supplier.address,
                }
                for supplier in recent_suppliers
            ],
        })
