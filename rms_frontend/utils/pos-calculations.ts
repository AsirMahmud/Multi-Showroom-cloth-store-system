import type { CartItem } from "@/store/pos-store";
import { normalizeProductPrice } from "@/utils/product-price";

type Discount = { type: "percentage" | "fixed"; value: number } | null | undefined;

export interface CalculatedCartItem extends CartItem {
  itemTotal: number;
  itemDiscount: number;
  discountedTotal: number;
}

export interface CartCalculationResult {
  itemsWithDiscounts: CalculatedCartItem[];
  subtotalBeforeDiscount: number;
  discountedSubtotal: number;
  totalItemDiscounts: number;
  globalDiscount: number;
  subtotal: number;
  tax: number;
  total: number;
}

const roundCurrency = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

const clampFixed = (value: number, max: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(value, max));
};

export const sanitizeDiscount = (discount: Discount, maxAmount: number) => {
  if (!discount) {
    return null;
  }

  if (discount.type === "percentage") {
    return {
      type: "percentage" as const,
      value: clampPercentage(discount.value),
    };
  }

  return {
    type: "fixed" as const,
    value: roundCurrency(clampFixed(discount.value, maxAmount)),
  };
};

const resolveDiscountAmount = (discount: Discount, baseAmount: number) => {
  const safeDiscount = sanitizeDiscount(discount, baseAmount);
  if (!safeDiscount || baseAmount <= 0) {
    return 0;
  }

  if (safeDiscount.type === "percentage") {
    return roundCurrency(baseAmount * (safeDiscount.value / 100));
  }

  return roundCurrency(safeDiscount.value);
};

export const calculateCartTotals = (
  cart: CartItem[],
  cartDiscount: Discount
): CartCalculationResult => {
  const itemsWithDiscounts = cart.map((item) => {
    const unitPrice = normalizeProductPrice(item.price);
    const itemTotal = unitPrice * item.quantity;
    const requestedDiscount = resolveDiscountAmount(item.discount, itemTotal);
    const discountedUnitPrice = normalizeProductPrice(
      Math.max(0, itemTotal - requestedDiscount) / item.quantity
    );
    const discountedTotal = discountedUnitPrice * item.quantity;
    const itemDiscount = itemTotal - discountedTotal;

    return {
      ...item,
      price: unitPrice,
      discount: sanitizeDiscount(item.discount, itemTotal) ?? undefined,
      itemTotal,
      itemDiscount,
      discountedTotal,
    };
  });

  const subtotalBeforeDiscount = roundCurrency(
    itemsWithDiscounts.reduce((sum, item) => sum + item.itemTotal, 0)
  );
  const discountedSubtotal = roundCurrency(
    itemsWithDiscounts.reduce((sum, item) => sum + item.discountedTotal, 0)
  );
  const totalItemDiscounts = roundCurrency(
    itemsWithDiscounts.reduce((sum, item) => sum + item.itemDiscount, 0)
  );
  const globalDiscount = resolveDiscountAmount(cartDiscount, discountedSubtotal);
  const subtotal = roundCurrency(Math.max(0, discountedSubtotal - globalDiscount));
  const tax = 0;
  const total = subtotal;

  return {
    itemsWithDiscounts,
    subtotalBeforeDiscount,
    discountedSubtotal,
    totalItemDiscounts,
    globalDiscount,
    subtotal,
    tax,
    total,
  };
};
