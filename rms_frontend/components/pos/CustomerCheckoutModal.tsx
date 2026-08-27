"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Phone, MapPin, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

interface CustomerCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomer?: {
    name?: string;
    phone?: string;
    address?: string;
  } | null;
  onConfirm: (customerData: { name: string; phone: string; address: string }) => void;
  isSubmitting?: boolean;
  markAsDue?: boolean;
}

export function CustomerCheckoutModal({
  open,
  onOpenChange,
  initialCustomer,
  onConfirm,
  isSubmitting = false,
  markAsDue = false,
}: CustomerCheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialCustomer?.name || "");
      setPhone(initialCustomer?.phone || "");
      setAddress(initialCustomer?.address || "");
    }
  }, [open, initialCustomer]);

  const handleQuickWalkIn = () => {
    setName("নগদ বিক্রয়");
    setPhone("");
    setAddress("ঢাকা");
  };

  const handleClear = () => {
    setName("");
    setPhone("");
    setAddress("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name: name.trim() || "নগদ বিক্রয়",
      phone: phone.trim(),
      address: address.trim() || "ঢাকা",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 shadow-2xl border-0 bg-white">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {markAsDue ? "Due Order Customer Info" : "Customer Invoice Details"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Enter or verify customer details before printing the A4 Memo invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Quick preset bar */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Quick Fill Options
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickWalkIn}
                className="h-7 text-[10px] font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200 rounded-lg px-2.5"
              >
                Walk-in (নগদ বিক্রয়)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-[10px] font-bold text-slate-400 hover:text-slate-600 rounded-lg px-2"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Customer Name (গ্রাহকের নাম)
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. আয়ারিন শাকনুন or নগদ বিক্রয়"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium text-slate-900 text-sm focus-visible:ring-brand-primary"
            />
          </div>

          {/* Customer Mobile */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400" />
              Mobile Number (মোবাইল নম্বর)
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01816295349"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium text-slate-900 text-sm focus-visible:ring-brand-primary"
            />
          </div>

          {/* Customer Address */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              Address (ঠিকানা)
            </Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. ঢাকা - বাড্ডা, ঢাকা"
              rows={2}
              className="min-h-[70px] rounded-xl bg-slate-50 border-slate-200 font-medium text-slate-900 text-sm focus-visible:ring-brand-primary"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 shadow-md shadow-emerald-600/10"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm & Complete Order</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
