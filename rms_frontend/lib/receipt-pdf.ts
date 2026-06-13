/**
 * Receipt PDF generation using browser print API.
 * Generates a printable receipt window with branch-specific branding.
 */

export interface ReceiptPrintData {
  // Branch info
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  branchLogoUrl?: string;
  receiptHeaderTitle?: string;
  receiptHeaderSubtitle?: string;
  receiptFooterMessage?: string;
  receiptReturnPolicy?: string;

  // Receipt info
  invoiceNumber: string;
  date: string;
  cashier?: string;

  // Items
  items: {
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  // Totals
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;

  // Payment
  paymentMethod: string;
  cashTendered?: number;
  changeDue?: number;

  // Customer
  customerName?: string;
  customerPhone?: string;

  // Due / store credit
  isPaid?: boolean;
  dueAmount?: number;
}

/**
 * Format currency in BDT
 */
function bdt(amount: number): string {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Open a print window with a styled receipt.
 */
export function printReceipt(data: ReceiptPrintData) {
  const win = window.open("", "_blank", "width=400,height=700");
  if (!win) return;
  const headerTitle = data.receiptHeaderTitle || data.branchName;
  const headerSubtitle = data.receiptHeaderSubtitle || "";
  const footerMessage = data.receiptFooterMessage || "Thank you for your purchase!";
  const returnPolicy = data.receiptReturnPolicy || "Return within 30 days with receipt.";

  const logoHtml = data.branchLogoUrl
    ? `<img src="${data.branchLogoUrl}" alt="${headerTitle}" style="max-width:120px;max-height:60px;object-fit:contain;margin-bottom:8px;" />`
    : "";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="text-align:left;padding:3px 0;">
          ${item.name}${item.size ? ` (${item.size})` : ""}${item.color ? ` / ${item.color}` : ""}
          <br/><small style="color:#666;">${item.quantity} x ${bdt(item.unitPrice)}</small>
        </td>
        <td style="text-align:right;padding:3px 0;">${bdt(item.total)}</td>
      </tr>
    `
    )
    .join("");

  const customerHtml = data.customerName
    ? `<p style="margin:4px 0;font-size:12px;">Customer: <strong>${data.customerName}</strong>${data.customerPhone ? ` (${data.customerPhone})` : ""}</p>`
    : "";

  const dueHtml =
    data.isPaid === false
      ? `<p style="margin:6px 0;color:#c00;font-weight:bold;font-size:13px;">DUE: ${bdt(data.dueAmount ?? data.total)}</p>`
      : "";

  const cashHtml =
    data.paymentMethod === "cash" && data.cashTendered
      ? `
      <p style="margin:2px 0;font-size:12px;">Cash Tendered: ${bdt(data.cashTendered)}</p>
      <p style="margin:2px 0;font-size:12px;">Change: ${bdt(data.changeDue ?? 0)}</p>
      `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${data.invoiceNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; width: 300px; margin: 0 auto; padding: 20px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        .wrap { white-space: pre-line; word-break: break-word; overflow-wrap: anywhere; }
        @media print {
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        ${logoHtml}
        <h2 style="margin:4px 0;font-size:16px;">${headerTitle}</h2>
        ${headerSubtitle ? `<p class="wrap" style="margin:2px 0;font-size:11px;color:#555;">${headerSubtitle}</p>` : ""}
        ${data.branchAddress ? `<p class="wrap" style="margin:2px 0;font-size:11px;color:#555;">${data.branchAddress}</p>` : ""}
        ${data.branchPhone ? `<p style="margin:2px 0;font-size:11px;color:#555;">Tel: ${data.branchPhone}</p>` : ""}
      </div>

      <div class="divider"></div>

      <p style="margin:2px 0;font-size:11px;">
        <strong>Receipt #${data.invoiceNumber}</strong><br/>
        Date: ${data.date}<br/>
        ${data.cashier ? `Cashier: ${data.cashier}` : ""}
      </p>
      ${customerHtml}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:3px 0;border-bottom:1px solid #ccc;">Item</th>
            <th style="text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <table>
        <tr>
          <td>Subtotal</td>
          <td style="text-align:right;">${bdt(data.subtotal)}</td>
        </tr>
        ${data.discount ? `<tr><td style="color:green;">Discount</td><td style="text-align:right;color:green;">-${bdt(data.discount)}</td></tr>` : ""}
        ${data.tax ? `<tr><td>Tax</td><td style="text-align:right;">${bdt(data.tax)}</td></tr>` : ""}
        <tr style="font-weight:bold;font-size:15px;border-top:1px solid #333;">
          <td>TOTAL</td>
          <td style="text-align:right;">${bdt(data.total)}</td>
        </tr>
      </table>

      <div class="divider"></div>

      <p style="margin:4px 0;font-size:12px;">Payment: <strong>${data.paymentMethod.toUpperCase()}</strong></p>
      ${cashHtml}
      ${dueHtml}

      <div class="divider"></div>

      <div class="center" style="margin-top:12px;">
        <p class="wrap" style="font-size:11px;color:#555;">${footerMessage}</p>
        <p class="wrap" style="font-size:10px;color:#888;">${returnPolicy}</p>
      </div>
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/**
 * Generate a per-branch invoice number.
 * Format: {prefix}-INV-{zero-padded counter}
 * e.g. BR1-INV-000123
 */
export function generateInvoiceNumber(
  prefix: string,
  counter: number
): string {
  const paddedCounter = String(counter).padStart(6, "0");
  const cleanPrefix = prefix || "INV";
  return `${cleanPrefix}-INV-${paddedCounter}`;
}
