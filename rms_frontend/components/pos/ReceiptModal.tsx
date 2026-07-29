"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Download,
  Printer,
  ReceiptText,
  User,
  Store
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { useBranch } from "@/contexts/branch-context";
import { branchesApi } from "@/lib/api/branches";
import { resolveReceiptSettings } from "@/lib/receipt-settings";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: string;
    date: string;
    items: any[];
    subtotal: number;
    discount?: { type: "percentage" | "fixed"; value: number } | null;
    discountedSubtotal?: number;
    tax: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    paymentMethod: string;
    cashAmount: number | null;
    changeDue: number | null;
    customer: any;
    splitPayments?: { method: any; amount: string }[] | null;
    storeCredit?: number;
    isPaid: boolean;
    itemDiscounts?: number;
    globalDiscount?: number;
    isDue?: boolean;
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

  const { selectedBranchId } = useBranch();
  const { data: branch } = useQuery({
    queryKey: ["branch-receipt-settings", selectedBranchId],
    queryFn: () => branchesApi.getBranch(selectedBranchId as number),
    enabled: selectedBranchId !== null && open,
  });

  const receiptSettings = useMemo(() => resolveReceiptSettings(branch), [branch]);

  const storeName = useMemo(() => {
    return receiptSettings.headerTitle && receiptSettings.headerTitle !== "Receipt"
      ? receiptSettings.headerTitle
      : "FERDOUS TEXTILE";
  }, [receiptSettings]);

  const branchName = branch?.name || "Unassigned branch";

  const qrCodeData = useMemo(() => {
    if (!data) return "";
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
      if (!qrCodeRef.current) return;
      const svgElement = qrCodeRef.current.querySelector("svg");
      if (!svgElement) return;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 160;
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
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const storeSubtitle = receiptSettings.headerSubtitle || "";
    const storeAddress = receiptSettings.address || "Kapasia, Gazipur";
    const storePhone = receiptSettings.phone || "01338869901";
    const footerMessage = receiptSettings.footerMessage || "Thanks for your purchase";
    const returnPolicy = receiptSettings.returnPolicy || "Return policy: 3 days with receipt before wash";

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${storeName} Receipt</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; }
            body {
              width: 58mm;
              padding: 3.5mm 3.2mm 4mm;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              line-height: 1.35;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .top-rule { height: 3px; margin-bottom: 9px; background: #0f172a; }
            .header { text-align: center; margin-bottom: 9px; }
            .brand { font-size: 15px; line-height: 1.1; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
            .receipt-type { display: inline-block; margin: 5px 0 4px; padding: 2px 8px; border: 1px solid #0f172a; border-radius: 999px; font-size: 7px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
            .subtitle, .info { font-size: 8px; line-height: 1.35; color: #475569; }
            .divider { border-top: 1px dashed #94a3b8; margin: 7px 0; }
            .section-label { margin: 0 0 5px; font-size: 7px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; color: #64748b; }
            .metadata { padding: 6px; border: 1px solid #cbd5e1; border-radius: 5px; background: #f8fafc; }
            .meta-row, .total-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
            .meta-row:last-child, .total-row:last-child { margin-bottom: 0; }
            .meta-row span:first-child, .total-row span:first-child { color: #475569; }
            .meta-row span:last-child, .total-row span:last-child { text-align: right; font-weight: 700; }
            .items-head { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 0 0 4px; border-bottom: 1px solid #cbd5e1; font-size: 7px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: #64748b; }
            .items { margin-top: 1px; }
            .item { padding: 6px 0; border-bottom: 1px dotted #cbd5e1; break-inside: avoid; }
            .item:last-child { border-bottom: 0; }
            .item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-size: 10px; font-weight: 800; }
            .item-header span:first-child { max-width: 34mm; }
            .item-header span:last-child { white-space: nowrap; }
            .item-details { display: flex; justify-content: space-between; gap: 8px; margin-top: 2px; font-size: 8px; color: #64748b; }
            .totals-section { padding: 7px; border: 1px solid #cbd5e1; border-radius: 5px; background: #f8fafc; }
            .grand-total { margin-top: 5px; padding-top: 6px; border-top: 2px solid #0f172a; font-size: 13px; font-weight: 900; }
            .grand-total span { color: #0f172a !important; }
            .payment-section { padding: 0 1px; }
            .status-badge { margin: 9px 0 7px; padding: 5px; border: 1.5px solid currentColor; border-radius: 5px; text-align: center; font-size: 10px; font-weight: 900; letter-spacing: .2em; }
            .qr-code { margin: 8px 0 4px; text-align: center; break-inside: avoid; }
            .qr-code img { display: block; width: 62px; height: 62px; margin: 0 auto 4px; }
            .qr-caption { font-size: 7px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #64748b; }
            .footer { margin-top: 7px; text-align: center; font-size: 8px; line-height: 1.45; color: #475569; }
            .footer strong { display: block; margin-bottom: 2px; color: #0f172a; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">${storeName}</div>
            <div class="receipt-type">Sales receipt</div>
            <div class="info" style="font-weight: 700;">Branch: ${branchName}</div>
            ${storeSubtitle ? `<div class="subtitle">${storeSubtitle}</div>` : ""}
            ${storeAddress ? `<div class="info">${storeAddress}</div>` : ""}
            ${storePhone ? `<div class="info">Tel: ${storePhone}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div class="section-label">Transaction</div>
          <div class="metadata">
            <div class="meta-row"><span>Receipt #:</span><span>${data.id}</span></div>
            <div class="meta-row"><span>Date:</span><span>${new Date(data.date).toLocaleString()}</span></div>
            ${
              data.customer
                ? `
              <div class="meta-row"><span>Customer:</span><span>${data.customer.name || data.customer.first_name || "N/A"}</span></div>
              ${data.customer.phone ? `<div class="meta-row"><span>Phone:</span><span>${data.customer.phone}</span></div>` : ""}
            `
                : ""
            }
          </div>

          <div class="divider"></div>

          <div class="section-label">Purchased items</div>
          <div class="items-head"><span>Description</span><span>Amount</span></div>
          <div class="items">
            ${data.items
              .map(
                (item) => `
              <div class="item">
                <div class="item-header">
                  <span>${item.name}</span>
                  <span>${formatCurrency(item.discountedTotal)}</span>
                </div>
                <div class="item-details">
                  <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                  <span>${item.design || "Standard"} / ${item.color || "Default"}</span>
                </div>
                ${
                  item.itemDiscount > 0
                    ? `<div class="item-details" style="color: #059669;">Item discount: -${formatCurrency(item.itemDiscount)}</div>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>

          <div class="divider"></div>

          <div class="section-label">Order summary</div>
          <div class="totals-section">
            <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>
            ${
              (data.itemDiscounts || 0) > 0
                ? `<div class="total-row" style="color: #059669;"><span>Item discounts:</span><span>-${formatCurrency(data.itemDiscounts || 0)}</span></div>`
                : ""
            }
            ${
              (data.globalDiscount || 0) > 0
                ? `<div class="total-row" style="color: #059669;"><span>Global discount:</span><span>-${formatCurrency(data.globalDiscount || 0)}</span></div>`
                : ""
            }
            ${data.tax > 0 ? `<div class="total-row"><span>Tax:</span><span>${formatCurrency(data.tax)}</span></div>` : ""}
            ${
              (data.storeCredit || 0) > 0
                ? `<div class="total-row" style="color: #059669;"><span>Store credit:</span><span>-${formatCurrency(data.storeCredit || 0)}</span></div>`
                : ""
            }
            <div class="total-row grand-total"><span>TOTAL:</span><span>${formatCurrency(data.total)}</span></div>
            <div class="total-row"><span>Amount Paid:</span><span>${formatCurrency(data.amountPaid)}</span></div>
            ${data.amountDue > 0 ? `<div class="total-row" style="margin-top: 4px; font-size: 12px; color: #dc2626;"><span>REMAINING DUE:</span><span>${formatCurrency(data.amountDue)}</span></div>` : ""}
          </div>

          <div class="divider"></div>

          <div class="section-label">Payment</div>
          <div class="payment-section">
            <div class="total-row"><span>Method:</span><span style="text-transform: capitalize;">${data.paymentMethod}</span></div>
            ${
              data.paymentMethod === "cash" && data.cashAmount
                ? `
              <div class="total-row"><span>Cash Tendered:</span><span>${formatCurrency(data.cashAmount)}</span></div>
              <div class="total-row"><span>Change Due:</span><span>${formatCurrency(data.changeDue || 0)}</span></div>
            `
                : ""
            }
            ${
              data.splitPayments
                ? `
              <div style="font-size: 8px; color: #4b5563; font-weight: bold; margin-top: 4px; text-transform: uppercase;">Split Payments</div>
              ${data.splitPayments
                .map(
                  (payment) => `
                  <div class="total-row" style="font-size: 9px;"><span>${payment.method}:</span><span>${formatCurrency(Number(payment.amount))}</span></div>
                `
                )
                .join("")}
            `
                : ""
            }
          </div>

          <div class="status-badge" style="color: ${data.isPaid ? "#059669" : "#dc2626"};">
            ${data.isPaid ? "PAID" : "PAYMENT DUE"}
          </div>

          ${
            qrCodeDataURL
              ? `
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR" style="width: 80px; height: 80px;" />
              <div class="qr-caption">Scan to reorder</div>
            </div>
            `
              : ""
          }

          <div class="divider"></div>

          <div class="footer">
            <strong>${footerMessage}</strong>
            ${returnPolicy ? `<div style="font-size: 8px; margin-top: 2px;">${returnPolicy}</div>` : ""}
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


  const handleDownloadPdf = () => {
    if (!data) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const money = (amount: number) =>
      `BDT ${Number(amount || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const customerName = data.customer
      ? data.customer.name || data.customer.first_name || "N/A"
      : "Walk-in customer";

    const storeAddress = receiptSettings.address || "Kapasia, Gazipur";
    const storePhone = receiptSettings.phone || "01338869901";
    const storeSubtitle = receiptSettings.headerSubtitle || "Sales Receipt";

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(storeName, 14, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${storeSubtitle} | Branch: ${branchName}`, 14, 24);
    doc.text(`${storeAddress} | ${storePhone}`, 14, 31);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Receipt #${data.id}`, 14, 48);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(data.date).toLocaleString(), 14, 55);
    doc.text(`Customer: ${customerName}`, 110, 48);
    if (data.customer?.phone) doc.text(`Phone: ${data.customer.phone}`, 110, 55);

    let y = 68;
    const writeLine = (left: string, right = "", bold = false) => {
      if (y > 275) {
        doc.addPage();
        y = 18;
      }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(left, 14, y, { maxWidth: 135 });
      if (right) doc.text(right, 196, y, { align: "right" });
      y += 6;
    };

    writeLine("ITEMS", "", true);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y - 3, 196, y - 3);
    data.items.forEach((item) => {
      writeLine(`${item.quantity} x ${item.name}`, money(item.discountedTotal), true);
      writeLine(`${item.design || "Standard"} / ${item.color || "Default"} @ ${money(item.price)}`);
      if (item.itemDiscount > 0) writeLine(`Item discount: -${money(item.itemDiscount)}`);
      y += 2;
    });

    doc.line(120, y - 2, 196, y - 2);
    y += 3;
    writeLine("Subtotal", money(data.subtotal));
    if ((data.itemDiscounts || 0) > 0) writeLine("Item discounts", `-${money(data.itemDiscounts || 0)}`);
    if ((data.globalDiscount || 0) > 0) writeLine("Global discount", `-${money(data.globalDiscount || 0)}`);
    writeLine("Tax", money(data.tax));
    if ((data.storeCredit || 0) > 0) writeLine("Store credit", `-${money(data.storeCredit || 0)}`);
    writeLine("TOTAL", money(data.total), true);
    writeLine("Amount paid", money(data.amountPaid));
    if (data.amountDue > 0) writeLine("REMAINING DUE", money(data.amountDue), true);
    y += 3;
    writeLine(`Payment: ${data.paymentMethod}`, data.isPaid ? "PAID" : "DUE", true);
    if (data.cashAmount !== null) writeLine("Cash tendered", money(data.cashAmount));
    if (data.changeDue !== null) writeLine("Change due", money(data.changeDue));
    data.splitPayments?.forEach((payment) => writeLine(payment.method, money(Number(payment.amount))));

    if (qrCodeDataURL && y < 245) {
      doc.addImage(qrCodeDataURL, "PNG", 14, y + 3, 28, 28);
      doc.setFontSize(8);
      doc.text("Scan to reorder", 28, y + 35, { align: "center" });
    }

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(receiptSettings.footerMessage || "Thanks for your purchase", 105, 282, { align: "center" });
    doc.text(receiptSettings.returnPolicy || "Return policy: 3 days with receipt before wash", 105, 288, { align: "center" });

    const safeReceiptId = String(data.id).replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`receipt_${safeReceiptId}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-0 bg-slate-50/70 p-0 shadow-2xl sm:max-w-4xl lg:max-w-5xl">
        {data ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-0 min-h-[500px]">
            {/* Left side: simulated paper receipt preview */}
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center border-r border-slate-200/60 bg-slate-100/35">
              <div className="w-full max-w-sm">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3 text-center sm:text-left">
                  Receipt Preview
                </div>

                {/* Physical Receipt Container */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 font-mono text-slate-800 text-xs w-full relative">
                  {/* Subtle paper cut style gradient line at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

                  {/* Store Header */}
                  <div className="text-center space-y-1 mb-5 mt-2">
                    <div className="flex items-center justify-center gap-1.5 text-slate-900">
                      <Store className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <h2 className="font-sans font-black text-base uppercase tracking-tight">{storeName}</h2>
                    </div>
                    <p className="font-sans text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                      Branch: {branchName}
                    </p>
                    {receiptSettings.headerSubtitle && (
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed font-sans">{receiptSettings.headerSubtitle}</p>
                    )}
                    {receiptSettings.address && (
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed font-sans mt-1">{receiptSettings.address}</p>
                    )}
                    {receiptSettings.phone && (
                      <p className="text-[10px] text-slate-500 font-sans">Tel: {receiptSettings.phone}</p>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-4" />

                  {/* Metadata */}
                  <div className="space-y-1.5 text-[11px] font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt ID:</span>
                      <span className="font-semibold text-slate-900">{data.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-semibold text-slate-900">{new Date(data.date).toLocaleString()}</span>
                    </div>
                    {data.customer && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Customer:</span>
                          <span className="font-semibold text-slate-900">{data.customer.name || data.customer.first_name || "N/A"}</span>
                        </div>
                        {data.customer.phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phone:</span>
                            <span className="font-semibold text-slate-900">{data.customer.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-4" />

                  {/* Items list */}
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr] text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                      <span>Item</span>
                      <span className="text-center">Qty x Price</span>
                      <span className="text-right">Total</span>
                    </div>

                    <div className="space-y-3.5">
                      {data.items.map((item, index) => (
                        <div key={`${item.productId || index}-${index}`} className="grid grid-cols-[1.5fr_1fr_1fr] items-start gap-1 text-[11px]">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate leading-snug">{item.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.design || "Standard"} • {item.color || "Default"}
                            </p>
                          </div>
                          <div className="text-center text-slate-500 self-center font-mono">
                            {item.quantity} x {formatCurrency(item.price)}
                          </div>
                          <div className="text-right font-semibold text-slate-900 self-center font-mono">
                            {formatCurrency(item.discountedTotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-4" />

                  {/* Pricing summary */}
                  <div className="space-y-2 text-[11px] font-sans">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-900 font-mono">{formatCurrency(data.subtotal)}</span>
                    </div>

                    {(data.itemDiscounts || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Item Discounts</span>
                        <span className="font-mono">-{formatCurrency(data.itemDiscounts || 0)}</span>
                      </div>
                    )}

                    {(data.globalDiscount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Global Discount</span>
                        <span className="font-mono">-{formatCurrency(data.globalDiscount || 0)}</span>
                      </div>
                    )}

                    {data.tax > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tax</span>
                        <span className="font-medium text-slate-900 font-mono">{formatCurrency(data.tax)}</span>
                      </div>
                    )}

                    {(data.storeCredit || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Store Credit</span>
                        <span className="font-mono">-{formatCurrency(data.storeCredit || 0)}</span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-2 flex justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
                      <span>Total Amount</span>
                      <span className="text-sm font-black font-mono">{formatCurrency(data.total)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Amount Paid</span>
                      <span className="font-semibold text-slate-900 font-mono">{formatCurrency(data.amountPaid)}</span>
                    </div>
                    {data.amountDue > 0 && (
                      <div className="mt-2 flex justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                        <span>Remaining Due</span>
                        <span className="font-mono">{formatCurrency(data.amountDue)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-4" />

                  {/* Payment Info */}
                  <div className="space-y-1.5 text-[11px] font-sans text-slate-500">
                    <div className="flex justify-between">
                      <span>Payment Method</span>
                      <span className="font-semibold text-slate-900 capitalize">{data.paymentMethod}</span>
                    </div>
                    {data.paymentMethod === "cash" && data.cashAmount && (
                      <>
                        <div className="flex justify-between">
                          <span>Cash Tendered</span>
                          <span className="font-semibold text-slate-900 font-mono">{formatCurrency(data.cashAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Change Due</span>
                          <span className="font-semibold text-emerald-600 font-bold font-mono">{formatCurrency(data.changeDue || 0)}</span>
                        </div>
                      </>
                    )}
                    {data.splitPayments && (
                      <div className="pt-1.5 space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Split Payment Details</p>
                        {data.splitPayments.map((payment, idx) => (
                          <div key={idx} className="flex justify-between text-[10px]">
                            <span className="capitalize">{payment.method}</span>
                            <span className="font-semibold text-slate-900 font-mono">{formatCurrency(Number(payment.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-4" />

                  {/* Receipt Footer */}
                  <div className="text-center space-y-1.5 text-[10px] text-slate-400 leading-relaxed font-sans">
                    <p className="font-semibold text-slate-600">{receiptSettings.footerMessage || "Thank you for shopping with us!"}</p>
                    {receiptSettings.returnPolicy && (
                      <p className="italic text-[9px]">{receiptSettings.returnPolicy}</p>
                    )}
                  </div>

                  {/* Minimal QR Code */}
                  <div className="mt-5 flex flex-col items-center justify-center space-y-1.5">
                    <div ref={qrCodeRef} className="bg-slate-50 p-2 rounded-2xl border border-slate-100/80">
                      <QRCodeSVG value={qrCodeData || data.id} size={70} level="M" />
                    </div>
                    <span className="text-[8px] font-sans font-bold text-slate-400 tracking-widest uppercase">Scan to reorder</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: details and POS operator actions */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div className="space-y-6">
                {/* Header state */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sale Complete</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Checkout Success</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Invoice created successfully. You can print the receipt or export it as PDF for the customer.
                  </p>
                </div>

                {/* Customer card */}
                <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2.5">
                    <User className="h-3.5 w-3.5" />
                    Customer Details
                  </div>
                  {data.customer ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{data.customer.name || data.customer.first_name || "N/A"}</p>
                      {data.customer.phone && (
                        <p className="text-xs text-slate-500">{data.customer.phone}</p>
                      )}
                      {data.customer.email && (
                        <p className="text-xs text-slate-500">{data.customer.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Walk-in Customer (No details registered)</p>
                  )}
                </div>

                {/* Billing Summary Overview */}
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <ReceiptText className="h-3.5 w-3.5" />
                      Summary
                    </div>
                    <Badge className={data.isPaid ? "bg-emerald-100 hover:bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider text-[9px] rounded-full border-0 px-2.5 py-0.5" : "bg-amber-100 hover:bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-[9px] rounded-full border-0 px-2.5 py-0.5"}>
                      {data.isPaid ? "Paid" : "Due"}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Invoice Ref</span>
                      <span className="font-semibold text-slate-900">{data.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Method</span>
                      <span className="font-semibold text-slate-900 capitalize">{data.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-900">Amount Paid</span>
                      <span className="text-lg font-black text-slate-900">{formatCurrency(data.amountPaid)}</span>
                    </div>
                    {data.amountDue > 0 && (
                      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                        <span className="text-sm font-bold text-rose-700">Remaining Due</span>
                        <span className="text-lg font-black text-rose-700">{formatCurrency(data.amountDue)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6 sm:mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all duration-200"
                    onClick={handlePrint}
                  >
                    <Printer className="mr-2 h-4 w-4 text-slate-500" />
                    Print Receipt
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all duration-200"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="mr-2 h-4 w-4 text-slate-500" />
                    Download PDF
                  </Button>
                </div>

                <Button
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-200"
                  onClick={onNewSale}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Start New Sale
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
