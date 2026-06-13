from decimal import Decimal, ROUND_HALF_UP


def normalize_product_price(value):
    """Round a product price to the nearest whole currency unit."""
    return Decimal(str(value or 0)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
