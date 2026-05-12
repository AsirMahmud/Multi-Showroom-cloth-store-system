"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, PenLine, Printer, ReceiptText, ScanLine, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: string;
    date: string;
    items: any[];
    subtotal: number;
    discount?: { type: "percentage" | "fixed"; value: number } | null;
    discountedSubtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    cashAmount: number | null;
    changeDue: number | null;
    customer: any;
    splitPayments: { method: string; amount: string }[] | null;
    storeCredit: number;
    isPaid: boolean;
    itemDiscounts: number;
    globalDiscount: number;
  } | null;
  onNewSale: () => void;
  formatCurrency: (amount: number) => string;
}

export default function ReceiptModal({
  open,
  onOpenChange,
  data,
  onNewSale,
  formatCurrency,
}: ReceiptModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [receiptLabel, setReceiptLabel] = useState("Receipt");

  useEffect(() => {
    if (!open || !data) {
      setQrCodeDataURL("");
      return;
    }

    setReceiptLabel("Receipt");
  }, [open, data]);

  const qrCodeData = useMemo(() => {
    if (!data) {
      return "";
    }

    const cartData = {
      items: data.items.map((item) => ({
        productId: String(item.productId),
        quantity: item.quantity,
        variations: {
          color: item.color || "",
          design: item.design || "",
        },
      })),
    };

    return btoa(JSON.stringify(cartData));
  }, [data]);

  useEffect(() => {
    if (!open || !data) {
      setQrCodeDataURL("");
      return;
    }

    const timer = setTimeout(() => {
      if (!qrCodeRef.current) {
        return;
      }

      const svgElement = qrCodeRef.current.querySelector("svg");
      if (!svgElement) {
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setQrCodeDataURL(canvas.toDataURL("image/png"));
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    }, 180);

    return () => clearTimeout(timer);
  }, [qrCodeData, open, data]);

  const handlePrint = () => {
    if (!data) {
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${receiptLabel}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              width: 58mm;
              margin: 0;
              padding: 4.5mm;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.35;
              color: #111827;
              background: #fff;
            }
            .topbar {
              height: 4px;
              border-radius: 999px;
              background: linear-gradient(90deg, #111827, #34d399);
              margin-bottom: 8px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .brand {
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 0.12em;
            }
            .label {
              margin-top: 2px;
              font-size: 10px;
              color: #6b7280;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
            .meta {
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 7px;
              margin-bottom: 8px;
              background: #f9fafb;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              gap: 6px;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .meta-row:last-child {
              margin-bottom: 0;
            }
            .section-title {
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #6b7280;
              margin: 8px 0 5px;
            }
            .items {
              margin-bottom: 8px;
            }
            .item {
              border-bottom: 1px dashed #e5e7eb;
              padding: 6px 0;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-name {
              display: flex;
              justify-content: space-between;
              gap: 6px;
              font-size: 12px;
              font-weight: 800;
            }
            .item-sub {
              margin-top: 2px;
              color: #4b5563;
              font-size: 10px;
            }
            .item-badge {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #065f46;
              background: #d1fae5;
              border-radius: 999px;
              padding: 2px 6px;
              white-space: nowrap;
            }
            .item-total {
              margin-top: 4px;
              text-align: right;
              font-size: 12px;
              font-weight: 900;
            }
            .totals {
              border-top: 1px solid #e5e7eb;
              padding-top: 7px;
              margin-bottom: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              gap: 6px;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .total-row strong {
              font-size: 12px;
            }
            .total-amount {
              padding-top: 4px;
              margin-top: 4px;
              border-top: 1px solid #e5e7eb;
              font-weight: 900;
            }
            .payment {
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 7px;
              background: #f9fafb;
              margin-bottom: 8px;
            }
            .status {
              text-align: center;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.18em;
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              margin-top: 8px;
            }
            .qr {
              text-align: center;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="topbar"></div>
          <div class="header">
            <div class="brand">RAW STITCH</div>
            <div class="label">${receiptLabel}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">Kapasia, Gazipur</div>
            <div style="font-size:10px;color:#6b7280;">Phone: 01338869901</div>
          </div>

          <div class="meta">
            <div class="meta-row"><span>Receipt #</span><strong>${data.id}</strong></div>
            <div class="meta-row"><span>Date</span><strong>${new Date(data.date).toLocaleString()}</strong></div>
            ${
              data.customer
                ? `
              <div class="meta-row"><span>Customer</span><strong>${data.customer.name || data.customer.first_name || "N/A"}</strong></div>
              <div class="meta-row"><span>Phone</span><strong>${data.customer.phone || "N/A"}</strong></div>
            `
                : ""
            }
          </div>

          <div class="section-title">Items</div>
          <div class="items">
            ${data.items
              .map(
                (item) => `
              <div class="item">
                <div class="item-name">
                  <span>${item.name}</span>
                  <span class="item-badge">${item.priceType === "wholesale" ? "WS" : "RT"}</span>
                </div>
                <div class="item-sub">
                  ${item.quantity} x ${formatCurrency(item.price)} • ${item.design || ""} • ${item.color || ""}
                </div>
                ${
                  item.itemDiscount > 0
                    ? `<div class="item-sub">Item discount: -${formatCurrency(item.itemDiscount)}</div>`
                    : ""
                }
                <div class="item-total">${formatCurrency(item.discountedTotal)}</div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="totals">
            <div class="total-row"><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
            ${
              data.itemDiscounts > 0
                ? `<div class="total-row"><span>Item discounts</span><span>-${formatCurrency(data.itemDiscounts)}</span></div>`
                : ""
            }
            ${
              data.globalDiscount > 0
                ? `<div class="total-row"><span>Global discount</span><span>-${formatCurrency(data.globalDiscount)}</span></div>`
                : ""
            }
            <div class="total-row"><span>Tax</span><span>${formatCurrency(data.tax)}</span></div>
            ${
              data.storeCredit > 0
                ? `<div class="total-row"><span>Store credit</span><span>-${formatCurrency(data.storeCredit)}</span></div>`
                : ""
            }
            <div class="total-row total-amount"><span>Total</span><span>${formatCurrency(data.total)}</span></div>
          </div>

          <div class="payment">
            <div class="total-row"><span>Payment</span><span>${data.paymentMethod}</span></div>
            ${
              data.paymentMethod === "cash" && data.cashAmount
                ? `
              <div class="total-row"><span>Cash tendered</span><span>${formatCurrency(data.cashAmount)}</span></div>
              <div class="total-row"><span>Change due</span><span>${formatCurrency(data.changeDue || 0)}</span></div>
            `
                : ""
            }
            ${
              data.splitPayments
                ? `
              <div class="section-title" style="margin-top:8px;">Split payments</div>
              ${data.splitPayments
                .map(
                  (payment) => `
                  <div class="total-row"><span>${payment.method}</span><span>${formatCurrency(Number(payment.amount))}</span></div>
                `
                )
                .join("")}
            `
                : ""
            }
          </div>

          <div class="status">${data.isPaid ? "PAID" : "DUE"}</div>

          <div class="qr">
            <div class="section-title" style="margin-top:0;">Scan to reorder</div>
            ${
              qrCodeDataURL
                ? `<img src="${qrCodeDataURL}" alt="QR Code" style="width: 110px; height: 110px; display:block; margin: 0 auto;" />`
                : ""
            }
          </div>

          <div class="footer">
            Thanks for your purchase
            <div>Return policy: 3 days with receipt before wash</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 800);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border-0 bg-white p-0 shadow-2xl sm:max-w-5xl">
        {data ? (
          <div className="grid max-h-[90vh] grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
            <div className="flex min-h-0 flex-col">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Sale complete
                      </div>
                      <DialogTitle className="text-2xl font-black tracking-tight">Receipt preview</DialogTitle>
                      <p className="mt-2 max-w-xl text-sm text-slate-300">
                        Edit the receipt label before printing, then review the sale summary in a cleaner, operator-friendly layout.
                      </p>
                    </div>
                    <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/10">
                      <ReceiptText className="mr-1 h-3 w-3" />
                      {data.isPaid ? "Paid" : "Due"}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                      Receipt name
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={receiptLabel}
                        onChange={(e) => setReceiptLabel(e.target.value)}
                        className="h-10 border-white/10 bg-white/10 text-white placeholder:text-slate-400"
                        placeholder="Receipt"
                      />
                      <PenLine className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <SummaryCard label="Items" value={String(data.items.length)} helper="sale lines" />
                  <SummaryCard label="Total" value={formatCurrency(data.total)} helper={data.paymentMethod} />
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1 bg-slate-50 px-4 py-4">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoPill label="Receipt #" value={data.id} />
                      <InfoPill label="Date" value={new Date(data.date).toLocaleString()} />
                      {data.customer ? (
                        <>
                          <InfoPill label="Customer" value={data.customer.name || data.customer.first_name || "N/A"} />
                          <InfoPill label="Phone" value={data.customer.phone || "N/A"} />
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Items
                        </div>
                        <h3 className="mt-1 text-lg font-black text-slate-900">Purchased products</h3>
                      </div>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {data.items.length} lines
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {data.items.map((item, index) => (
                        <div
                          key={`${item.productId || index}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-sm font-black text-slate-900">{item.name}</h4>
                                <Badge className={item.priceType === "wholesale" ? "rounded-full bg-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-700" : "rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600"}>
                                  {item.priceType === "wholesale" ? "Wholesale" : "Retail"}
                                </Badge>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                <span>•</span>
                                <span>{item.design || "Standard"}</span>
                                <span>•</span>
                                <span>{item.color || "Default"}</span>
                              </div>
                              {item.itemDiscount > 0 ? (
                                <div className="mt-1 text-xs text-red-600">
                                  Item discount: -{formatCurrency(item.itemDiscount)}
                                </div>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Subtotal
                              </div>
                              <div className="mt-1 text-sm font-black text-slate-900">
                                {formatCurrency(item.discountedTotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <div className="flex min-h-0 flex-col border-t border-slate-100 bg-slate-950 text-white md:border-l md:border-t-0">
              <div className="space-y-4 p-5">
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg">
                  <div className="grid grid-cols-2">
                    <RightMetric label="Subtotal" value={formatCurrency(data.subtotal)} />
                    <RightMetric label="Discounted" value={formatCurrency(data.discountedSubtotal)} />
                    <RightMetric label="Discounts" value={formatCurrency(data.itemDiscounts + data.globalDiscount)} />
                    <RightMetric label="Tax" value={formatCurrency(data.tax)} />
                  </div>
                  <div className="border-t border-slate-800 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                          Total
                        </div>
                        <div className="mt-1 text-3xl font-black text-white">
                          {formatCurrency(data.total)}
                        </div>
                      </div>
                      <Badge className={data.isPaid ? "rounded-full bg-emerald-100 text-emerald-700" : "rounded-full bg-amber-100 text-amber-700"}>
                        {data.isPaid ? "PAID" : "DUE"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Payment
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <SideLine label="Method" value={data.paymentMethod} />
                    {data.paymentMethod === "cash" && data.cashAmount ? (
                      <>
                        <SideLine label="Cash tendered" value={formatCurrency(data.cashAmount)} />
                        <SideLine label="Change due" value={formatCurrency(data.changeDue || 0)} accent />
                      </>
                    ) : null}
                    {data.splitPayments ? (
                      <div className="pt-2">
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Split payments
                        </div>
                        <div className="space-y-2">
                          {data.splitPayments.map((payment, index) => (
                            <div key={`${payment.method}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                              <span className="capitalize text-slate-300">{payment.method}</span>
                              <span className="font-semibold text-white">{formatCurrency(Number(payment.amount))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <ScanLine className="h-4 w-4 text-emerald-400" />
                    Scan to reorder
                  </div>
                  <div ref={qrCodeRef} className="mt-3 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <QRCodeSVG value={qrCodeData || data.id} size={120} level="M" />
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">
                    QR captures the product mix for quick repeat sales.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-700 bg-slate-900 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800 hover:text-white"
                    onClick={handlePrint}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    className="h-11 rounded-2xl bg-emerald-500 text-xs font-black uppercase tracking-[0.18em] text-slate-950 hover:bg-emerald-400"
                    onClick={onNewSale}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    New Sale
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-400">{helper}</div> : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function RightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-slate-800 px-4 py-4 last:border-b-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function SideLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={accent ? "font-semibold text-emerald-300" : "font-semibold text-white"}>
        {value}
      </span>
    </div>
  );
}
