import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { usePOSStore } from "@/store/pos-store";
import { calculateCartTotals } from "@/utils/pos-calculations";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Gift,
  Zap,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Calculator,
  Receipt,
  Clock,
} from "lucide-react";
import { PaymentMethod } from "@/types/sales";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface PaymentData {
  method: PaymentMethod;
  amount: string;
  notes?: string;
  transaction_id?: string;
}

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  showSplitPayment: boolean;
  setShowSplitPayment: (show: boolean) => void;
  splitPayments: PaymentData[];
  handleSplitPaymentChange: (
    index: number,
    field: string,
    value: string
  ) => void;
  removeSplitPaymentMethod: (index: number) => void;
  addSplitPaymentMethod: () => void;
  cashAmount: string;
  setCashAmount: (amount: string) => void;
  total: number;
  changeDue: number;
  cart: any[];

  formatCurrency: (amount: number) => string;
  allowPartialPayment?: boolean;
  setAllowPartialPayment?: (allow: boolean) => void;
}

export default function PaymentSection({
  paymentMethod,
  setPaymentMethod,
  showSplitPayment,
  setShowSplitPayment,
  splitPayments,
  handleSplitPaymentChange,
  removeSplitPaymentMethod,
  addSplitPaymentMethod,
  cashAmount,
  setCashAmount,
  total,
  changeDue,
  cart,
  formatCurrency,
  allowPartialPayment = false,
  setAllowPartialPayment,
}: PaymentSectionProps) {
  const { toast } = useToast();
  const { openCustomerCheckoutModal, cartDiscount } = usePOSStore();
  const totals = React.useMemo(() => calculateCartTotals(cart, cartDiscount), [cart, cartDiscount]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    remaining: 0,
    isFullPayment: true,
  });

  const [giftCardWarning, setGiftCardWarning] = useState(false);

  // Calculate payment summary whenever split payments change
  useEffect(() => {
    if (showSplitPayment && splitPayments.length > 0) {
      const totalPaid = splitPayments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount) || 0;
        return sum + amount;
      }, 0);
      
      const remaining = Math.max(0, total - totalPaid);
      const isFullPayment = totalPaid >= total;
      
      setPaymentSummary({
        totalPaid,
        remaining,
        isFullPayment,
      });

      // Check for gift card payments
      const hasGiftPayment = splitPayments.some(p => p.method === 'gift' && parseFloat(p.amount) > 0);
      setGiftCardWarning(hasGiftPayment);
    } else {
      // Single payment method
      const currentAmount = paymentMethod === 'cash' ? parseFloat(cashAmount) || 0 : total;
      setPaymentSummary({
        totalPaid: currentAmount,
        remaining: Math.max(0, total - currentAmount),
        isFullPayment: currentAmount >= total,
      });

      setGiftCardWarning(paymentMethod === 'gift');
    }
  }, [splitPayments, showSplitPayment, cashAmount, paymentMethod, total]);
  const handlePaymentMethodChange = (value: PaymentMethod) => {
    if (value === "split") {
      setShowSplitPayment(true);
      // Initialize with cash payment if split payments is empty
      if (splitPayments.length === 0) {
        addSplitPaymentMethod();
      }
    } else {
      setShowSplitPayment(false);
    }
    setPaymentMethod(value);
  };

  const calculateQuickAmount = (percentage: number) => {
    const amount = (total * percentage / 100).toFixed(2);
    setCashAmount(amount);
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-3 w-3" />;
      case 'card':
        return <CreditCard className="h-3 w-3" />;
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'gift':
        return <Gift className="h-3 w-3" />;
      default:
        return <Zap className="h-3 w-3" />;
    }
  };

  const canCompletePayment = () => {
    if (cart.length === 0) return false;
    
    if (allowPartialPayment) {
      return paymentSummary.totalPaid > 0;
    }
    
    return paymentSummary.isFullPayment;
  };

  const getPaymentButtonText = () => {
    if (cart.length === 0) return "No items in cart";
    
    if (showSplitPayment || allowPartialPayment) {
      if (paymentSummary.isFullPayment) {
        return "Complete Payment";
      } else if (paymentSummary.totalPaid > 0) {
        return `Pay ${formatCurrency(paymentSummary.totalPaid)} (${formatCurrency(paymentSummary.remaining)} due)`;
      } else {
        return "Enter payment amount";
      }
    }
    
    return "Complete Payment";
  };

  return (
    <div className="flex flex-col h-full min-h-0 justify-between overflow-hidden">
      {/* Scrollable Config Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 pb-2 scrollbar-thin">
        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(["cash", "card", "mobile"] as const).map((method) => {
            const isActive = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => handlePaymentMethodChange(method)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all duration-200 gap-1.5 ${
                  isActive
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={`p-1 rounded-lg ${isActive ? "bg-white/10 text-white" : "bg-slate-50 text-slate-500"}`}>
                  {getPaymentMethodIcon(method)}
                </span>
                <span className="capitalize text-[10px]">{method}</span>
              </button>
            );
          })}
          
          {/* Gift Card */}
          <button
            type="button"
            onClick={() => handlePaymentMethodChange("gift")}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all duration-200 gap-1.5 ${
              paymentMethod === "gift"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className={`p-1 rounded-lg ${paymentMethod === "gift" ? "bg-white/10 text-white" : "bg-slate-50 text-slate-500"}`}>
              <Gift className="h-3 w-3" />
            </span>
            <span className="text-[10px]">Gift Card</span>
          </button>

          {/* Split Payment */}
          <button
            type="button"
            onClick={() => handlePaymentMethodChange("split")}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all duration-200 gap-1.5 col-span-2 ${
              paymentMethod === "split"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className={`p-1 rounded-lg flex items-center justify-center ${paymentMethod === "split" ? "bg-white/10 text-white" : "bg-slate-50 text-slate-500"}`}>
              <Zap className="h-3.5 w-3.5 mr-1" />
            </span>
            <span className="text-[10px]">Split Payment</span>
          </button>
        </div>

        {/* Gift Card Warning */}
        {giftCardWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            <div className="flex items-center text-amber-800 text-xs">
              <Gift className="h-4 w-4 mr-2 text-amber-500 shrink-0" />
              <span>Gift card payments will be recorded as expenses, not revenue.</span>
            </div>
          </div>
        )}

        {/* Split Payment Section */}
        {showSplitPayment && (
          <div className="space-y-2.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Split Payment Methods</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addSplitPaymentMethod}
                className="h-6 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/30 p-0"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Payment
              </Button>
            </div>
            
            <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400">{getPaymentMethodIcon(payment.method)}</span>
                    <Select
                      value={payment.method}
                      onValueChange={(value: PaymentMethod) =>
                        handleSplitPaymentChange(index, "method", value)
                      }
                    >
                      <SelectTrigger className="w-[85px] h-7 text-xs border-0 bg-slate-50 rounded focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="gift">Gift Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Input
                    type="number"
                    value={payment.amount}
                    onChange={(e) =>
                      handleSplitPaymentChange(index, "amount", e.target.value)
                    }
                    placeholder="0.00"
                    className="flex-1 h-7 text-xs rounded border-slate-200"
                    step="0.01"
                    min="0"
                  />
                  
                  {splitPayments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSplitPaymentMethod(index)}
                      className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-900 text-white rounded-lg p-2.5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className={`font-bold ${paymentSummary.isFullPayment ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatCurrency(paymentSummary.totalPaid)}
                </span>
              </div>
              {!paymentSummary.isFullPayment && (
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-slate-400">Remaining:</span>
                  <span className="font-black text-rose-400 font-mono">
                    {formatCurrency(paymentSummary.remaining)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Single Payment Method Sections */}
        {paymentMethod === "cash" && !showSplitPayment && (
          <div className="space-y-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Cash Received</Label>
              <span className="text-[9px] text-slate-400 font-medium">Customer cash payment</span>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <span className="text-[10px] font-bold">BDT</span>
              </div>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Enter cash amount"
                className="h-8 pl-10 pr-2.5 rounded-lg border-slate-200 text-xs font-black focus-visible:ring-slate-400 focus-visible:ring-1"
                step="0.01"
                min="0"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCashAmount(total.toString())}
                className="h-7 rounded border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                Exact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => calculateQuickAmount(50)}
                className="h-7 rounded border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => calculateQuickAmount(75)}
                className="h-7 rounded border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCashAmount((Math.ceil(total / 10) * 10).toString())}
                className="h-7 rounded border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700"
              >
                Round
              </Button>
            </div>

            {changeDue > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex justify-between items-center transition-all duration-200">
                <span className="text-[10px] font-bold text-emerald-800">Change to return:</span>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Partial Payment Option */}
        {setAllowPartialPayment && (
          <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            <Checkbox
              id="partial-payment"
              checked={allowPartialPayment}
              onCheckedChange={setAllowPartialPayment}
            />
            <Label htmlFor="partial-payment" className="text-[10px] text-slate-600 font-medium">
              Allow partial payment (remaining amount will be due later)
            </Label>
          </div>
        )}

        {/* Payment Status Indicator */}
        {!paymentSummary.isFullPayment && paymentSummary.totalPaid > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            <div className="text-[10px] text-amber-800 flex items-center gap-1.5 font-bold">
              <Calculator className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Partial Payment: {formatCurrency(paymentSummary.remaining)} will be marked as due</span>
            </div>
          </div>
        )}

        {/* Payment Method Info */}
        {paymentMethod === "gift" && !showSplitPayment && (
          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Gift card payments are recorded as expenses and do not count toward revenue.</span>
            </div>
          </div>
        )}
      </div>

      {/* Pinned Bottom Area */}
      <div className="border-t border-slate-200 pt-3.5 mt-auto space-y-3 bg-white shrink-0">
        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Order Summary</h4>
              <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-[70px] overflow-y-auto pr-1 mb-2 border-b border-slate-100 pb-2">
              {totals.itemsWithDiscounts.map((item: any, idx: number) => (
                <div key={`${item.id || idx}-${idx}`} className="flex justify-between items-start text-xs gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 block truncate leading-snug">{item.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                      {item.design || "Standard"} • {item.color || "Default"} × {item.quantity}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-850 font-mono">{formatCurrency(item.price * item.quantity)}</span>
                    {item.itemDiscount > 0 && (
                      <span className="text-[9px] text-emerald-600 block font-medium">
                        -{formatCurrency(item.itemDiscount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-[11px] text-slate-500 border-b border-slate-100 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800 font-mono">{formatCurrency(totals.subtotalBeforeDiscount)}</span>
              </div>
              
              {totals.totalItemDiscounts > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Item Discounts:</span>
                  <span className="font-mono">-{formatCurrency(totals.totalItemDiscounts)}</span>
                </div>
              )}
              
              {totals.globalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Cart Discount:</span>
                  <span className="font-mono">-{formatCurrency(totals.globalDiscount)}</span>
                </div>
              )}
              
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatCurrency(totals.tax)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">Total:</span>
              <span className="text-base font-black text-slate-900 font-mono">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        )}

        {/* Payment Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={() => openCustomerCheckoutModal(toast, false)}
            className={`w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
              canCompletePayment()
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg"
                : "bg-slate-100 text-slate-400"
            }`}
            disabled={!canCompletePayment()}
          >
            <Receipt className="mr-2 h-4 w-4" />
            {getPaymentButtonText()}
          </Button>
          
          <Button
            onClick={() => openCustomerCheckoutModal(toast, true)}
            className="w-full h-8.5 text-xs font-bold uppercase tracking-wider rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all duration-200"
            variant="outline"
            disabled={cart.length === 0}
          >
            <Clock className="mr-2 h-3.5 w-3.5 text-slate-400" />
            Mark as Due (No Payment)
          </Button>
        </div>
      </div>
    </div>
  );
}
