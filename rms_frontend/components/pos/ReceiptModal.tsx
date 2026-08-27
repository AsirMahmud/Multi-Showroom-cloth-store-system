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
import { resolveReceiptSettings, escapeReceiptHtml } from "@/lib/receipt-settings";

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
        canvas.width = 300;
        canvas.height = 300;
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

  const generateA4PrintHtml = () => {
    if (!data) return "";
    const storeTitle = receiptSettings.headerTitle || "ফেরদৌস কালেকশন";
    const storeSubtitle = receiptSettings.headerSubtitle || "পরিবেশক : Torongox";
    const storeAddress = receiptSettings.address || "প্রোপাইটর : হাজী নুরুল ইসলাম মোঃ শফিক কাজেম, বাড়ি আদর্শ বাজার, আড়াইহাজার, নারায়ণগঞ্জ।";
    const storePhone = receiptSettings.phone || "01896-285446, 01896-285447, 01896-285448";
    const tagline = receiptSettings.returnPolicy || "";
    const footerPrayer = receiptSettings.footerMessage || "ধন্যবাদ! নিজে নামাজ পড়ুন এবং অন্যকে নামাজ পড়তে উৎসাহিত করুন।";

    const customerName = data.customer?.name || (data.customer?.first_name ? `${data.customer.first_name} ${data.customer.last_name || ""}`.trim() : "") || "নগদ বিক্রয়";
    const customerAddress = data.customer?.address || "ঢাকা";
    const customerPhone = data.customer?.phone || "-";
    const dateFormatted = new Date(data.date).toLocaleDateString("en-GB");

    const phoneList = storePhone.split(",").map(p => p.trim()).filter(Boolean);
    const addressLines = storeAddress.split("\n").map(a => a.trim()).filter(Boolean);

    const items = data.items || [];
    const minRows = 14;
    const rowsToRender = Math.max(items.length, minRows);

    let rowsHtml = "";
    for (let i = 0; i < rowsToRender; i++) {
      const item = items[i];
      if (item) {
        const itemDesc = item.name + (item.design && item.design !== "Standard" ? ` - ${item.design}` : "");
        const qtyText = `${item.quantity} পিস`;
        const priceText = Number(item.price).toLocaleString("en-BD");
        const totalText = Number(item.discountedTotal || (item.quantity * item.price)).toLocaleString("en-BD");
        rowsHtml += `
          <tr>
            <td class="col-no">${i + 1}</td>
            <td class="col-desc">${escapeReceiptHtml(itemDesc)}</td>
            <td class="col-qty">${escapeReceiptHtml(qtyText)}</td>
            <td class="col-rate">${priceText}</td>
            <td class="col-amount">${totalText}</td>
          </tr>
        `;
      } else {
        rowsHtml += `
          <tr class="empty-row">
            <td class="col-no">${i + 1}</td>
            <td class="col-desc"></td>
            <td class="col-qty"></td>
            <td class="col-rate"></td>
            <td class="col-amount"></td>
          </tr>
        `;
      }
    }

    const subtotalFormatted = Number(data.subtotal || data.total).toLocaleString("en-BD");
    const paidFormatted = Number(data.amountPaid || 0).toLocaleString("en-BD");
    const dueFormatted = Number(data.amountDue || 0).toLocaleString("en-BD");

    return `
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="utf-8" />
          <title>A4 Memo #${data.id}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm;
            }
            * {
              box-sizing: border-box;
              font-family: 'SolaimanLipi', Arial, Helvetica, sans-serif;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #0F172A;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .memo-card {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding: 18px 24px;
              background: #fff;
              border: 1px solid #E2E8F0;
              border-radius: 16px;
            }

            .header-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
              gap: 16px;
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              width: 280px;
            }

            .brand-row {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-circle {
              width: 52px;
              height: 52px;
              border-radius: 50%;
              border: 2px solid #0B1E36;
              color: #0B1E36;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: 900;
              flex-shrink: 0;
            }
            .brand-title {
              font-size: 28px;
              font-weight: 900;
              color: #0B1E36;
              line-height: 1.1;
            }
            .distributor-text {
              font-size: 15px;
              font-weight: 700;
              color: #059669;
              margin-top: 5px;
            }
            .tagline-text {
              font-size: 11px;
              color: #475569;
              margin-top: 6px;
              line-height: 1.4;
              font-weight: 500;
            }

            .proprietor-card {
              background: #F8FAFC;
              border: 1px solid #F1F5F9;
              border-radius: 12px;
              padding: 10px 14px;
            }
            .proprietor-card p {
              margin: 2px 0;
              font-size: 12px;
              color: #1E293B;
              line-height: 1.4;
            }
            .phone-badge {
              display: flex;
              align-items: center;
              gap: 6px;
              color: #059669;
              font-weight: 700;
              font-size: 12px;
              margin-top: 2px;
            }

            /* Meta Bar */
            .meta-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 12px;
            }
            .meta-item-dark {
              display: flex;
              align-items: center;
              border: 1px solid #0B1E36;
              border-radius: 8px;
              overflow: hidden;
              flex: 1;
            }
            .meta-item-light {
              display: flex;
              align-items: center;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
              overflow: hidden;
              flex: 1;
            }
            .dark-label {
              background: #0B1E36;
              color: #fff;
              padding: 6px 16px;
              font-size: 13px;
              font-weight: 700;
            }
            .dark-val {
              padding: 6px 16px;
              font-size: 16px;
              font-weight: 900;
              color: #0B1E36;
              flex: 1;
            }
            .light-label {
              background: #F1F5F9;
              color: #059669;
              padding: 6px 14px;
              font-size: 13px;
              font-weight: 700;
            }
            .light-val {
              padding: 6px 14px;
              font-size: 13px;
              font-weight: 700;
              color: #0B1E36;
              text-align: right;
              flex: 1;
            }

            /* Customer Box */
            .customer-bar {
              display: flex;
              justify-content: space-between;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
              padding: 8px 14px;
              margin-bottom: 14px;
              background: #fff;
              font-size: 13px;
            }
            .cust-col {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .cust-label {
              font-weight: 700;
              color: #475569;
            }
            .cust-val {
              font-weight: 700;
              color: #0B1E36;
            }

            /* Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
            }
            .items-table th {
              background: #0B1E36;
              color: #fff;
              padding: 8px 10px;
              font-size: 13px;
              font-weight: 700;
              border: 1px solid #0B1E36;
              text-align: center;
            }
            .items-table th.col-desc {
              text-align: left;
            }
            .items-table td {
              padding: 6px 10px;
              border: 1px solid #CBD5E1;
              font-size: 13px;
              height: 28px;
            }
            .items-table tr:nth-child(even) {
              background: #F8FAFC;
            }
            .col-no { width: 45px; text-align: center; font-weight: 700; }
            .col-desc { text-align: left; font-weight: 600; color: #1E293B; }
            .col-qty { width: 100px; text-align: center; font-weight: 600; }
            .col-rate { width: 95px; text-align: right; font-weight: 600; }
            .col-amount { width: 110px; text-align: right; font-weight: 900; color: #0B1E36; }

            /* Summary Box */
            .summary-flex {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
            }
            .summary-table {
              width: 250px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 6px 10px;
              border: 1px solid #CBD5E1;
              font-size: 14px;
              font-weight: 700;
            }
            .sum-label {
              background: #F1F5F9;
              color: #0B1E36;
              text-align: center;
              width: 85px;
            }
            .sum-val {
              text-align: right;
              color: #0B1E36;
              font-size: 15px;
              font-weight: 900;
            }
            .sum-val.paid { color: #059669; }
            .sum-val.due { color: #DC2626; }

            /* Footer */
            .footer-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 25px;
            }
            .sig-cell {
              width: 28%;
              text-align: center;
            }
            .sig-line {
              border-top: 1px dotted #475569;
              margin-top: 35px;
              padding-top: 4px;
              font-size: 12px;
              font-weight: 700;
              color: #475569;
            }
            .qr-cell {
              width: 40%;
              text-align: center;
            }
            .prayer-text {
              font-size: 12px;
              font-weight: 700;
              color: #059669;
              margin-top: 4px;
              line-height: 1.35;
            }

            .bottom-note {
              text-align: center;
              font-size: 13px;
              font-weight: 700;
              color: #059669;
              margin-top: 16px;
              padding-top: 8px;
              border-top: 1px solid #E2E8F0;
            }
          </style>
        </head>
        <body>
          <div class="memo-card">
            <!-- Header -->
            <div class="header-flex">
              <div class="header-left">
                <div class="brand-row">
                  <div class="logo-circle">FC</div>
                  <div class="brand-title">${escapeReceiptHtml(storeTitle)}</div>
                </div>
                ${storeSubtitle ? `<div class="distributor-text">${escapeReceiptHtml(storeSubtitle)}</div>` : ""}
                ${tagline ? `<div class="tagline-text">${escapeReceiptHtml(tagline)}</div>` : ""}
              </div>

              <div class="header-right">
                <div class="proprietor-card">
                  ${addressLines.map(line => `<p>${escapeReceiptHtml(line)}</p>`).join("")}
                  ${phoneList.map(phone => `<div class="phone-badge">📞 ${escapeReceiptHtml(phone)}</div>`).join("")}
                </div>
              </div>
            </div>

            <!-- Meta Bar -->
            <div class="meta-bar">
              <div class="meta-item-dark">
                <div class="dark-label">মেমো নং</div>
                <div class="dark-val">${data.id}</div>
              </div>
              <div class="meta-item-light">
                <div class="light-label">তারিখ</div>
                <div class="light-val">${dateFormatted}</div>
              </div>
            </div>

            <!-- Customer Bar -->
            <div class="customer-bar">
              <div class="cust-col">
                <span class="cust-label">👤 নাম :</span>
                <span class="cust-val">${escapeReceiptHtml(customerName)}</span>
              </div>
              <div class="cust-col">
                <span class="cust-label">📍 ঠিকানা :</span>
                <span class="cust-val">${escapeReceiptHtml(customerAddress)}</span>
              </div>
              <div class="cust-col">
                <span class="cust-label">📞 মোবাইল :</span>
                <span class="cust-val">${escapeReceiptHtml(customerPhone)}</span>
              </div>
            </div>

            <!-- Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-no">নং</th>
                  <th class="col-desc">মালের বিবরণ</th>
                  <th class="col-qty">পরিমাণ</th>
                  <th class="col-rate">দর</th>
                  <th class="col-amount">টাকা</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <!-- Summary Box -->
            <div class="summary-flex">
              <table class="summary-table">
                <tr>
                  <td class="sum-label">মোট</td>
                  <td class="sum-val">${subtotalFormatted}</td>
                </tr>
                <tr>
                  <td class="sum-label">জমা</td>
                  <td class="sum-val paid">${paidFormatted}</td>
                </tr>
                <tr>
                  <td class="sum-label">বাকি</td>
                  <td class="sum-val due">${dueFormatted}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div class="footer-flex">
              <div class="sig-cell">
                <div class="sig-line">ক্যাশিয়ার স্বাক্ষর</div>
              </div>

              <div class="qr-cell">
                ${qrCodeDataURL ? `<img src="${qrCodeDataURL}" width="150" height="150" alt="QR" style="display: block; margin: 0 auto 6px; width: 150px; height: 150px;" />` : ""}
                <div class="prayer-text">${escapeReceiptHtml(footerPrayer)}</div>
              </div>

              <div class="sig-cell">
                <div class="sig-line">অনুমোদিত স্বাক্ষর</div>
              </div>
            </div>

            <div class="bottom-note">
              ◆ ধন্যবাদ আবার আসবেন ◆
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = generateA4PrintHtml();
    printWindow.document.write(htmlContent);
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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = generateA4PrintHtml();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const storeTitle = receiptSettings.headerTitle || "ফেরদৌস কালেকশন";
  const storeSubtitle = receiptSettings.headerSubtitle || "পরিবেশক : Torongox";
  const storeAddress = receiptSettings.address || "প্রোপাইটর : হাজী নুরুল ইসলাম মোঃ শফিক কাজেম, বাড়ি আদর্শ বাজার, আড়াইহাজার, নারায়ণগঞ্জ।";
  const storePhone = receiptSettings.phone || "01896-285446, 01896-285447, 01896-285448";
  const tagline = receiptSettings.returnPolicy || "";
  const footerPrayer = receiptSettings.footerMessage || "ধন্যবাদ! নিজে নামাজ পড়ুন এবং অন্যকে নামাজ পড়তে উৎসাহিত করুন।";

  const customerName = data?.customer ? (data.customer.name || data.customer.first_name || "আয়ারিন শাকনুন") : "নগদ বিক্রয়";
  const customerAddress = data?.customer?.address || "ঢাকা - বাড্ডা, ঢাকা";
  const customerPhone = data?.customer?.phone || "-";
  const dateFormatted = data ? new Date(data.date).toLocaleDateString("en-GB") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto border-0 bg-slate-100 p-0 shadow-2xl sm:max-w-4xl lg:max-w-5xl">
        {data ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-0 min-h-[500px]">
            {/* Left side: Simulated A4 Memo Preview */}
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center border-r border-slate-200 bg-slate-200/50">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 self-start flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-600" />
                A4 Memo Invoice Preview
              </div>

              {/* A4 Paper Mockup Card */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-5 text-slate-800 text-xs w-full max-w-lg space-y-3 font-sans">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full border-2 border-[#0B1E36] text-[#0B1E36] font-black text-sm flex items-center justify-center shrink-0">
                        FC
                      </div>
                      <h2 className="text-xl font-black text-[#0B1E36] leading-tight">{storeTitle}</h2>
                    </div>
                    {storeSubtitle && (
                      <p className="text-xs font-bold text-emerald-600">{storeSubtitle}</p>
                    )}
                    {tagline && (
                      <p className="text-[10px] text-slate-500 max-w-xs">{tagline}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 border p-2 rounded-xl text-[10px] text-right space-y-0.5">
                    <p className="font-medium text-slate-700">{storeAddress}</p>
                    <p className="font-bold text-emerald-600">{storePhone}</p>
                  </div>
                </div>

                {/* Meta Bar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex border rounded-lg overflow-hidden border-[#0B1E36]">
                    <span className="bg-[#0B1E36] text-white px-2.5 py-1 font-bold text-[11px]">মেমো নং</span>
                    <span className="px-2.5 py-1 font-black text-[#0B1E36]">{data.id}</span>
                  </div>
                  <div className="flex border rounded-lg overflow-hidden border-slate-300 bg-slate-50">
                    <span className="bg-slate-100 text-emerald-700 px-2.5 py-1 font-bold text-[11px]">তারিখ</span>
                    <span className="px-2.5 py-1 font-bold text-right flex-1 text-slate-800">{dateFormatted}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border rounded-lg p-2 bg-slate-50 text-[11px] grid grid-cols-3 gap-1">
                  <div><span className="font-bold text-slate-500">নাম:</span> <span className="font-bold text-slate-800">{customerName}</span></div>
                  <div><span className="font-bold text-slate-500">ঠিকানা:</span> <span className="font-bold text-slate-800">{customerAddress}</span></div>
                  <div><span className="font-bold text-slate-500">মোবাইল:</span> <span className="font-bold text-slate-800">{customerPhone}</span></div>
                </div>

                {/* Items Table Mockup */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-[#0B1E36] text-white font-bold text-[10px]">
                      <tr>
                        <th className="p-1.5 w-8 text-center">নং</th>
                        <th className="p-1.5 text-left">মালের বিবরণ</th>
                        <th className="p-1.5 w-16 text-center">পরিমাণ</th>
                        <th className="p-1.5 w-14 text-right">দর</th>
                        <th className="p-1.5 w-16 text-right">টাকা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.slice(0, 6).map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                          <td className="p-1.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                          <td className="p-1.5 font-semibold text-slate-800">{item.name}</td>
                          <td className="p-1.5 text-center font-semibold">{item.quantity} পিস</td>
                          <td className="p-1.5 text-right font-semibold">{Number(item.price).toLocaleString("en-BD")}</td>
                          <td className="p-1.5 text-right font-bold text-[#0B1E36]">{Number(item.discountedTotal || (item.quantity * item.price)).toLocaleString("en-BD")}</td>
                        </tr>
                      ))}
                      {data.items.length < 6 && [...Array(6 - data.items.length)].map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                          <td className="p-1.5 text-center text-slate-300">{data.items.length + idx + 1}</td>
                          <td className="p-1.5"></td>
                          <td className="p-1.5"></td>
                          <td className="p-1.5"></td>
                          <td className="p-1.5"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Box */}
                <div className="flex justify-end">
                  <table className="w-48 text-[11px] border rounded-lg overflow-hidden">
                    <tbody className="divide-y">
                      <tr>
                        <td className="bg-slate-100 p-1 text-center font-bold text-slate-700">মোট</td>
                        <td className="p-1 text-right font-black text-slate-900">{Number(data.subtotal || data.total).toLocaleString("en-BD")}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-1 text-center font-bold text-slate-700">জমা</td>
                        <td className="p-1 text-right font-black text-emerald-600">{Number(data.amountPaid || 0).toLocaleString("en-BD")}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-1 text-center font-bold text-slate-700">বাকি</td>
                        <td className="p-1 text-right font-black text-rose-600">{Number(data.amountDue || 0).toLocaleString("en-BD")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="flex justify-between items-end text-[9px] pt-2 border-t">
                  <div className="text-center font-bold text-slate-400">ক্যাশিয়ার স্বাক্ষর</div>
                  <div className="text-center font-bold text-emerald-600 flex flex-col items-center">
                    <div ref={qrCodeRef} className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <QRCodeSVG value={qrCodeData || data.id} size={140} />
                    </div>
                    <span className="mt-1 text-[9px]">{footerPrayer}</span>
                  </div>
                  <div className="text-center font-bold text-slate-400">অনুমোদিত স্বাক্ষর</div>
                </div>
              </div>
            </div>

            {/* Right side: POS operator actions */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sale Completed</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">A4 Invoice Memo Created</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ready to print on standard A4 paper size. Info automatically loaded from settings.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" />
                    Customer Memo Details
                  </div>
                  <p className="text-sm font-bold text-slate-900">{customerName}</p>
                  <p className="text-xs text-slate-500">Address: {customerAddress}</p>
                  <p className="text-xs text-slate-500">Phone: {customerPhone}</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <ReceiptText className="h-3.5 w-3.5" />
                      Invoice Summary
                    </div>
                    <Badge className={data.isPaid ? "bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider text-[9px] border-0" : "bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-[9px] border-0"}>
                      {data.isPaid ? "Paid" : "Due"}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Memo Number</span>
                      <span className="font-semibold text-slate-900">{data.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Subtotal (মোট)</span>
                      <span className="font-semibold text-slate-900">৳{Number(data.subtotal || data.total).toLocaleString("en-BD")}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-bold text-slate-900">Amount Paid (জমা)</span>
                      <span className="text-lg font-black text-emerald-600">৳{Number(data.amountPaid).toLocaleString("en-BD")}</span>
                    </div>
                    {data.amountDue > 0 && (
                      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                        <span className="text-sm font-bold text-rose-700">Remaining Due (বাকি)</span>
                        <span className="text-lg font-black text-rose-700">৳{Number(data.amountDue).toLocaleString("en-BD")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all"
                    onClick={handlePrint}
                  >
                    <Printer className="mr-2 h-4 w-4 text-emerald-600" />
                    Print A4 Memo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="mr-2 h-4 w-4 text-blue-600" />
                    Download A4 PDF
                  </Button>
                </div>

                <Button
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/10 transition-all"
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
