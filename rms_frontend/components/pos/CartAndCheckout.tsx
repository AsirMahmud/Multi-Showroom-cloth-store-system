"use client";

import { useMemo } from "react";
import { Percent, ShoppingCart, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePOSStore } from "@/store/pos-store";
import type { PaymentMethod } from "@/types/sales";
import { formatCurrency } from "@/lib/utils";
import PaymentSection from "./PaymentSection";
import { calculateCartTotals } from "@/lib/pos-calculations";

type CartRow = ReturnType<typeof usePOSStore.getState>["cart"][number];

export default function CartAndCheckout() {
  const {
    cart,
    cartDiscount,
    selectedCustomer,
    handleSetQuantity,
    handleRemoveItem,
    handleClearCart,
    handleItemDiscount,
    handleRemoveItemDiscount,
    setShowNewCustomerForm,
    setShowCustomerSearch,
    setShowDiscountModal,
    paymentMethod,
    setPaymentMethod,
    showSplitPayment,
    setShowSplitPayment,
    splitPayments,
    setSplitPayments,
    cashAmount,
    setCashAmount,
  } = usePOSStore();

  const cartGroups = useMemo(() => groupCartItems(cart), [cart]);

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, cartDiscount),
    [cart, cartDiscount]
  );
  const discountedSubtotal = cartTotals.total;

  const changeDue = cashAmount ? Number.parseFloat(cashAmount) - discountedSubtotal : 0;

  const handleSplitPaymentChange = (index: number, field: string, value: string) => {
    const updatedPayments = [...splitPayments];
    if (field === "method") {
      updatedPayments[index] = {
        ...updatedPayments[index],
        method: value as PaymentMethod,
      };
    } else {
      updatedPayments[index] = { ...updatedPayments[index], amount: value };
    }
    setSplitPayments(updatedPayments);
  };

  const removeSplitPaymentMethod = (index: number) => {
    if (splitPayments.length > 2) {
      setSplitPayments(splitPayments.filter((_, paymentIndex) => paymentIndex !== index));
    }
  };

  const addSplitPaymentMethod = () => {
    setSplitPayments([...splitPayments, { method: "cash" as PaymentMethod, amount: "" }]);
  };

  const closeDialog = (dialogElement: HTMLElement) => {
    const closeButton = dialogElement.querySelector(
      'button[data-state="closed"]'
    ) as HTMLButtonElement | null;
    closeButton?.click();
  };

  const removeProductGroup = (items: CartRow[]) => {
    items.forEach((item) => handleRemoveItem(item.id));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-brand-primary/5 bg-white/90 backdrop-blur-md shadow-premium transition-all duration-300">
      <div className="flex h-full flex-col overflow-hidden p-4">
        <div className="flex items-center justify-between border-b px-2 pb-3">
          <h2 className="flex items-center text-sm font-semibold text-slate-900">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart
            {cartGroups.length > 0 ? (
              <Badge className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white hover:bg-slate-900">
                {cartGroups.length}
              </Badge>
            ) : null}
          </h2>

          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscountModal(true)}
              disabled={cart.length === 0}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              <Percent className="mr-1 h-3 w-3" />
              Discount
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2.5 text-xs text-red-600"
              onClick={handleClearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-row gap-3 pt-3">
          <div className="min-w-0 basis-[58%] rounded-2xl border bg-slate-50">
            <ScrollArea className="h-full">
              {cartGroups.length > 0 ? (
                <div className="space-y-3 p-3">
                  {cartGroups.map((group) => (
                    <section
                      key={group.productId}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="border-b border-brand-primary/5 bg-slate-900 px-4 py-4 text-white">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-slate-200">
                            <img
                              src={group.image || "/api/placeholder/56/56"}
                              alt={group.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/api/placeholder/56/56";
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">{group.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                                  {group.sku ? <span>{group.sku}</span> : null}
                                  <span>{group.totalQuantity} units</span>
                                  <span>{group.designs.length} design{group.designs.length > 1 ? "s" : ""}</span>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-red-200 hover:bg-white/10 hover:text-white"
                                onClick={() => removeProductGroup(group.items)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-400/15">
                                {group.hasWholesale && group.hasRetail
                                  ? "Mixed pricing"
                                  : group.hasWholesale
                                  ? "Wholesale"
                                  : "Retail"}
                              </Badge>
                              <div className="text-xs text-slate-300">Subtotal</div>
                              <div className="text-sm font-black text-white">
                                {formatCurrency(group.total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-3">
                        {group.designs.map((design) => (
                          <div
                            key={`${group.productId}-${design.name}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-800">
                                  {design.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Manage colors and quantity directly here.
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-300 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500"
                              >
                                {design.items.length} color{design.items.length > 1 ? "s" : ""}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {design.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="grid grid-cols-[minmax(0,1.4fr)_92px_88px_110px_32px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="h-4 w-4 rounded-full border border-slate-300"
                                        style={{
                                          backgroundColor:
                                            item.colorHex && item.colorHex !== "null"
                                              ? item.colorHex
                                              : "#cbd5e1",
                                        }}
                                      />
                                      <span className="truncate text-sm font-semibold text-slate-900">
                                        {item.color || "Default"}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                      <span>Stock {item.availableStock}</span>
                                      <span>Unit {formatCurrency(item.price)}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                      Qty
                                    </div>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={item.availableStock}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleSetQuantity(
                                          item.id,
                                          Number.parseInt(e.target.value || "1", 10)
                                        )
                                      }
                                      className="h-9 rounded-xl border-slate-200 px-2 text-center text-sm font-black"
                                    />
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                      Mode
                                    </div>
                                    <Badge
                                      className={
                                        item.priceType === "wholesale"
                                          ? "rounded-full bg-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-700"
                                          : "rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600"
                                      }
                                    >
                                      {item.priceType === "wholesale" ? "Wholesale" : "Retail"}
                                    </Badge>
                                  </div>

                                  <div className="min-w-0 text-right">
                                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                      Subtotal
                                    </div>
                                    <div className="truncate text-sm font-black text-slate-900">
                                      {formatCurrency(getLineTotal(item))}
                                    </div>
                                    {item.discount ? (
                                      <div className="mt-1 flex items-center justify-end gap-1">
                                        <Badge
                                          variant="outline"
                                          className="rounded-full border-red-200 bg-red-50 text-[10px] text-red-600"
                                        >
                                          {item.discount.type === "percentage"
                                            ? `${item.discount.value}% OFF`
                                            : `${formatCurrency(item.discount.value)} OFF`}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 px-0 text-[10px] text-red-600"
                                          onClick={() => handleRemoveItemDiscount(item.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    ) : (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1 h-5 px-0 text-[10px] text-slate-500"
                                          >
                                            <Percent className="mr-1 h-2.5 w-2.5" />
                                            Add discount
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                          <DialogHeader>
                                            <DialogTitle className="text-sm">
                                              Apply Item Discount
                                            </DialogTitle>
                                            <DialogDescription className="text-xs">
                                              Apply a discount to this color row.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="grid gap-2 py-2">
                                            <Tabs defaultValue="percentage">
                                              <TabsList className="grid h-8 w-full grid-cols-2">
                                                <TabsTrigger value="percentage" className="text-xs">
                                                  Percentage (%)
                                                </TabsTrigger>
                                                <TabsTrigger value="fixed" className="text-xs">
                                                  Fixed Amount
                                                </TabsTrigger>
                                              </TabsList>
                                              <TabsContent value="percentage" className="mt-2 space-y-2">
                                                <div className="space-y-1">
                                                  <Label
                                                    htmlFor={`percentage-${item.id}`}
                                                    className="text-xs"
                                                  >
                                                    Discount Percentage
                                                  </Label>
                                                  <div className="flex items-center">
                                                    <Input
                                                      id={`percentage-${item.id}`}
                                                      type="number"
                                                      min="0"
                                                      max="100"
                                                      defaultValue="10"
                                                      className="h-7 text-xs"
                                                    />
                                                    <span className="ml-1 text-xs">%</span>
                                                  </div>
                                                </div>
                                                <Button
                                                  className="h-7 w-full text-xs"
                                                  onClick={(e) => {
                                                    const input = document.getElementById(
                                                      `percentage-${item.id}`
                                                    ) as HTMLInputElement | null;
                                                    handleItemDiscount(
                                                      item.id,
                                                      "percentage",
                                                      Number(input?.value || 0)
                                                    );
                                                    const dialogElement = (e.target as HTMLElement).closest("dialog");
                                                    if (dialogElement) {
                                                      closeDialog(dialogElement);
                                                    }
                                                  }}
                                                >
                                                  Apply Percentage Discount
                                                </Button>
                                              </TabsContent>
                                              <TabsContent value="fixed" className="mt-2 space-y-2">
                                                <div className="space-y-1">
                                                  <Label htmlFor={`fixed-${item.id}`} className="text-xs">
                                                    Discount Amount
                                                  </Label>
                                                  <Input
                                                    id={`fixed-${item.id}`}
                                                    type="number"
                                                    min="0"
                                                    max={item.price * item.quantity}
                                                    defaultValue="5"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <Button
                                                  className="h-7 w-full text-xs"
                                                  onClick={(e) => {
                                                    const input = document.getElementById(
                                                      `fixed-${item.id}`
                                                    ) as HTMLInputElement | null;
                                                    handleItemDiscount(
                                                      item.id,
                                                      "fixed",
                                                      Number(input?.value || 0)
                                                    );
                                                    const dialogElement = (e.target as HTMLElement).closest("dialog");
                                                    if (dialogElement) {
                                                      closeDialog(dialogElement);
                                                    }
                                                  }}
                                                >
                                                  Apply Fixed Discount
                                                </Button>
                                              </TabsContent>
                                            </Tabs>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 rounded-full bg-slate-100 p-4">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-800">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a product, choose its design and colors, then the grouped card will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="min-w-0 basis-[42%] overflow-y-auto rounded-2xl border bg-white">
            <div className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <Label htmlFor="customer" className="text-xs">
                  Customer
                </Label>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowCustomerSearch(true)}
                  className="h-6 text-xs"
                >
                  {selectedCustomer ? "Change" : "Select Customer"}
                </Button>
              </div>

              {selectedCustomer ? (
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {selectedCustomer.email || selectedCustomer.phone}
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="h-7 text-xs"
                >
                  Add New Customer
                </Button>
              )}
            </div>

            <div className="border-t p-2">
              <PaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showSplitPayment={showSplitPayment}
                setShowSplitPayment={setShowSplitPayment}
                splitPayments={splitPayments}
                handleSplitPaymentChange={handleSplitPaymentChange}
                removeSplitPaymentMethod={removeSplitPaymentMethod}
                addSplitPaymentMethod={addSplitPaymentMethod}
                cashAmount={cashAmount}
                setCashAmount={setCashAmount}
                total={discountedSubtotal}
                changeDue={changeDue}
                cart={cart}
                formatCurrency={formatCurrency}
                allowPartialPayment={false}
                setAllowPartialPayment={undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLineTotal(item: CartRow) {
  const baseTotal = item.price * item.quantity;
  if (!item.discount) {
    return baseTotal;
  }

  return item.discount.type === "percentage"
    ? baseTotal * (1 - item.discount.value / 100)
    : baseTotal - item.discount.value;
}

function groupCartItems(cart: CartRow[]) {
  const productMap = new Map<
    number,
    {
      productId: number;
      name: string;
      image?: string;
      sku?: string;
      items: CartRow[];
    }
  >();

  cart.forEach((item) => {
    const existing = productMap.get(item.productId);
    if (existing) {
      existing.items.push(item);
      return;
    }

    productMap.set(item.productId, {
      productId: item.productId,
      name: item.name,
      image: item.image,
      sku: item.sku,
      items: [item],
    });
  });

  return Array.from(productMap.values()).map((group) => {
    const designMap = new Map<string, CartRow[]>();

    group.items.forEach((item) => {
      const designName = item.design || "Standard";
      const existing = designMap.get(designName) || [];
      existing.push(item);
      designMap.set(designName, existing);
    });

    const designs = Array.from(designMap.entries()).map(([name, items]) => ({
      name,
      items,
    }));

    return {
      ...group,
      designs,
      totalQuantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
      total: group.items.reduce((sum, item) => sum + getLineTotal(item), 0),
      hasWholesale: group.items.some((item) => item.priceType === "wholesale"),
      hasRetail: group.items.some((item) => item.priceType === "retail"),
    };
  });
}
