import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from apps.sales.models import Sale, SaleItem
from apps.expenses.models import Expense
from django.db.models import Sum

def test_profit_calculations():
    print("--- Testing Profit Calculations ---")
    
    # Get all completed sales
    sales = Sale.objects.filter(status='completed')
    total_revenue = sales.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
    total_gross_profit = sales.aggregate(total=Sum('total_profit'))['total'] or Decimal('0.00')
    
    print(f"Total Revenue (Sales Total): {total_revenue}")
    print(f"Total Gross Profit (Sum of total_profit in Sales): {total_gross_profit}")
    
    # Get all approved expenses
    expenses = Expense.objects.filter(status='APPROVED')
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    print(f"Total Operational Expenses: {total_expenses}")
    
    # The problematic calculation in ReportViewSet.profit_loss:
    # net_profit = total_revenue - total_expenses
    reported_net_profit = total_revenue - total_expenses
    
    # The correct calculation for Net Profit:
    # Net Profit = Gross Profit - Operational Expenses
    correct_net_profit = total_gross_profit - total_expenses
    
    print(f"Reported Net Profit (Revenue - Expenses): {reported_net_profit}")
    print(f"Correct Net Profit (Gross Profit - Expenses): {correct_net_profit}")
    
    if reported_net_profit != correct_net_profit:
        print("ALERT: Discrepancy found in Net Profit calculation!")
        print(f"Difference: {reported_net_profit - correct_net_profit}")
        print("This is because Reported Net Profit does not account for COGS (Cost of Goods Sold).")
    else:
        print("Net Profit calculation matches (maybe COGS is zero or no sales?).")

    # Inventory test
    from apps.inventory.models import Product
    products = Product.objects.all()
    total_stock_value_retail = products.aggregate(
        total=Sum(django.db.models.F('stock_quantity') * django.db.models.F('retail_price'))
    )['total'] or Decimal('0.00')
    
    total_stock_value_cost = products.aggregate(
        total=Sum(django.db.models.F('stock_quantity') * django.db.models.F('cost_price'))
    )['total'] or Decimal('0.00')
    
    print(f"\n--- Inventory Values ---")
    print(f"Total Stock Value (Retail): {total_stock_value_retail}")
    print(f"Total Stock Value (Cost): {total_stock_value_cost}")
    print(f"Potential Profit in Stock: {total_stock_value_retail - total_stock_value_cost}")

if __name__ == "__main__":
    test_profit_calculations()
