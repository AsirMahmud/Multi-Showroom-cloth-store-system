"use client";
import {
  ShoppingCart,
  Percent,
  Trash2,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePOSStore } from "@/store/pos-store";
import PaymentSection from "./PaymentSection";
import type { PaymentMethod } from "@/types/sales";
import { formatCurrency } from "@/lib/utils";

export default function CartAndCheckout() {
  const {
    cart,
    cartDiscount,
    selectedCustomer,
    handleUpdateQuantity,
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    if (item.discount) {
      return item.discount.type === "percentage"
        ? sum + itemTotal * (1 - item.discount.value / 100)
        : sum + itemTotal - item.discount.value;
    }
    return sum + itemTotal;
  }, 0);

  let discountedSubtotal = subtotal;

  // Apply cart-wide discount if any
  if (cartDiscount) {
    if (cartDiscount.type === "percentage") {
      discountedSubtotal = subtotal * (1 - cartDiscount.value / 100);
    } else {
      discountedSubtotal = subtotal - cartDiscount.value;
    }
  }

  const changeDue = cashAmount
    ? Number.parseFloat(cashAmount) - discountedSubtotal
    : 0;

  const handleSplitPaymentChange = (
    index: number,
    field: string,
    value: string
  ) => {
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
      const updatedPayments = splitPayments.filter((_, i) => i !== index);
      setSplitPayments(updatedPayments);
    }
  };

  const addSplitPaymentMethod = () => {
    setSplitPayments([
      ...splitPayments,
      { method: "cash" as PaymentMethod, amount: "" },
    ]);
  };

  const closeDialog = (dialogElement: HTMLElement) => {
    const closeButton = dialogElement.querySelector(
      'button[data-state="closed"]'
    ) as HTMLButtonElement;
    if (closeButton) {
      closeButton.click();
    }
  };

  return (
    <div className="w-[680px] h-full bg-white border-l flex flex-col overflow-hidden">
      <div className="p-4 h-full flex flex-col overflow-hidden">
              {/* Cart Header */}
              <div className="p-2 border-b flex justify-between items-center">
                                 <h2 className="text-sm font-semibold flex items-center">
                   <ShoppingCart className="h-4 w-4 mr-1" />
                   Cart
                   {cart.length > 0 && (
                     <Badge className="ml-1 text-xs bg-blue-500 hover:bg-blue-600">{cart.length}</Badge>
                   )}
                 </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscountModal(true)}
                    disabled={cart.length === 0}
                    className="h-7 text-xs px-2"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    Discount
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 h-7 text-xs px-2"
                    onClick={handleClearCart}
                    disabled={cart.length === 0}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Cart Body */}
              <div className="flex-1 min-h-0 pt-2">
                <div className="h-full min-h-0 flex flex-row gap-3">
                  {/* Left side: dedicated cart product showcase */}
                  <div className="basis-[56%] min-w-0 h-full min-h-0 border rounded-md bg-gray-50">
                    <ScrollArea className="h-full pr-2">
                      {cart.length > 0 ? (
                        <div className="p-2 space-y-2">
                          {cart.map((item) => (
                            <div key={item.id} className="border rounded-lg p-1.5 bg-white shadow-sm">
                              {/* Top Division: product details */}
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border">
                                  <img
                                    src={item.image || "/api/placeholder/48/48"}
                                    alt={item.name}
                                    className="h-full w-full object-cover rounded-md"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/api/placeholder/48/48";
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs truncate">{item.name}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5">
                                      Size: {item.size || "Standard"}
                                    </span>
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5">
                                      Color: {item.color || "Default"}
                                    </span>
                                    <span className="font-medium text-gray-700">
                                      Unit: {formatCurrency(item.price)}
                                    </span>
                                  </div>
                                  {(item as any).sku && (
                                    <div className="text-[10px] text-gray-400 mt-1">
                                      SKU: {(item as any).sku}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-600 shrink-0"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* Bottom Division: quantity + discount + line total */}
                              <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 rounded-md border px-1 py-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleUpdateQuantity(item.id, -1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-5 text-center text-xs font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleUpdateQuantity(item.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                <div className="flex-1 min-w-0">
                                  {item.discount ? (
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className="bg-red-50 text-red-600 text-[10px]"
                                      >
                                        {item.discount.type === "percentage"
                                          ? `${item.discount.value}% OFF`
                                          : `৳${item.discount.value} OFF`}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 text-[10px] text-red-600 p-0"
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
                                          className="h-5 text-[10px] p-0"
                                        >
                                          <Percent className="h-2 w-2 mr-1" />
                                          Add Discount
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                          <DialogTitle className="text-sm">
                                            Apply Item Discount
                                          </DialogTitle>
                                          <DialogDescription className="text-xs">
                                            Apply a discount to this specific item.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-2 py-2">
                                          <Tabs defaultValue="percentage">
                                            <TabsList className="grid w-full grid-cols-2 h-8">
                                              <TabsTrigger
                                                value="percentage"
                                                className="text-xs"
                                              >
                                                Percentage (%)
                                              </TabsTrigger>
                                              <TabsTrigger value="fixed" className="text-xs">
                                                Fixed Amount (৳)
                                              </TabsTrigger>
                                            </TabsList>
                                            <TabsContent
                                              value="percentage"
                                              className="space-y-2 mt-2"
                                            >
                                              <div className="space-y-1">
                                                <Label
                                                  htmlFor="percentage"
                                                  className="text-xs"
                                                >
                                                  Discount Percentage
                                                </Label>
                                                <div className="flex items-center">
                                                  <Input
                                                    id="percentage"
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
                                                className="w-full h-7 text-xs"
                                                onClick={(e) => {
                                                  const input = document.getElementById(
                                                    "percentage"
                                                  ) as HTMLInputElement;
                                                  handleItemDiscount(
                                                    item.id,
                                                    "percentage",
                                                    Number(input.value)
                                                  );
                                                  const dialogElement = (
                                                    e.target as HTMLElement
                                                  ).closest("dialog");
                                                  if (dialogElement) {
                                                    closeDialog(dialogElement);
                                                  }
                                                }}
                                              >
                                                Apply Percentage Discount
                                              </Button>
                                            </TabsContent>
                                            <TabsContent value="fixed" className="space-y-2 mt-2">
                                              <div className="space-y-1">
                                                <Label htmlFor="fixed" className="text-xs">
                                                  Discount Amount
                                                </Label>
                                                <div className="flex items-center">
                                                  <span className="mr-1 text-xs">৳</span>
                                                  <Input
                                                    id="fixed"
                                                    type="number"
                                                    min="0"
                                                    max={item.price * item.quantity}
                                                    defaultValue="5"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                              </div>
                                              <Button
                                                className="w-full h-7 text-xs"
                                                onClick={(e) => {
                                                  const input = document.getElementById(
                                                    "fixed"
                                                  ) as HTMLInputElement;
                                                  handleItemDiscount(
                                                    item.id,
                                                    "fixed",
                                                    Number(input.value)
                                                  );
                                                  const dialogElement = (
                                                    e.target as HTMLElement
                                                  ).closest("dialog");
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
                                <div className="text-xs font-semibold shrink-0">
                                  {formatCurrency(
                                    item.discount
                                      ? item.discount.type === "percentage"
                                        ? item.price *
                                          item.quantity *
                                          (1 - item.discount.value / 100)
                                        : item.price * item.quantity - item.discount.value
                                      : item.price * item.quantity
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                          <div className="bg-gray-100 rounded-full p-4 mb-3">
                            <ShoppingCart className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">
                            Your cart is empty
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Browse products and add items to start a new order
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Right side: customer + payment */}
                  <div className="basis-[44%] min-w-0 h-full min-h-0 border rounded-md bg-white overflow-y-auto">
                    <div className="p-2">
                    <div className="flex items-center justify-between mb-1">
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
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {selectedCustomer.first_name}{" "}
                            {selectedCustomer.last_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {selectedCustomer.email || selectedCustomer.phone}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="h-6 text-xs"
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
    </div>
  );
}
