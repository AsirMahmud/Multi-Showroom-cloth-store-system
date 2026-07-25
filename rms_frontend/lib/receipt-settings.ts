import type { Branch } from "@/types/hr";

export interface ReceiptSettings {
  headerTitle: string;
  headerSubtitle: string;
  address: string;
  phone: string;
  footerMessage: string;
  returnPolicy: string;
}

const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  headerTitle: "Receipt",
  headerSubtitle: "",
  address: "সুরুজ মনোয়ারা শপিং কমপ্লেক্সের দোতালায়, বান্টি বাজার, আড়াইহাজার, নারায়ণগঞ্জ",
  phone: "01896285447",
  footerMessage: "Thanks for your purchase",
  returnPolicy: "Return policy applies with receipt.",
};

export function resolveReceiptSettings(branch?: Branch | null): ReceiptSettings {
  return {
    headerTitle:
      branch?.receipt_header_title?.trim() || branch?.name?.trim() || DEFAULT_RECEIPT_SETTINGS.headerTitle,
    headerSubtitle:
      branch?.receipt_header_subtitle?.trim() || "",
    address:
      branch?.receipt_address?.trim() || branch?.address?.trim() || DEFAULT_RECEIPT_SETTINGS.address,
    phone:
      branch?.receipt_phone?.trim() || branch?.phone?.trim() || DEFAULT_RECEIPT_SETTINGS.phone,
    footerMessage:
      branch?.receipt_footer_message?.trim() || DEFAULT_RECEIPT_SETTINGS.footerMessage,
    returnPolicy:
      branch?.receipt_return_policy?.trim() || DEFAULT_RECEIPT_SETTINGS.returnPolicy,
  };
}

export function escapeReceiptHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatReceiptMultiline(value: string) {
  return escapeReceiptHtml(value).replace(/\n/g, "<br/>");
}
