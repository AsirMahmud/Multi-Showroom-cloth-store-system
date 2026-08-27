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
  headerTitle: "ফেরদৌস কালেকশন",
  headerSubtitle: "পরিবেশক : Torongox",
  address: "প্রোপাইটর : হাজী নুরুল ইসলাম মোঃ শফিক কাজেম, বাড়ি আদর্শ বাজার, আড়াইহাজার, নারায়ণগঞ্জ।",
  phone: "01896-285446, 01896-285447, 01896-285448",
  footerMessage: "ধন্যবাদ! নিজে নামাজ পড়ুন এবং অন্যকে নামাজ পড়তে উৎসাহিত করুন।",
  returnPolicy: "",
};

export function resolveReceiptSettings(branch?: Branch | null): ReceiptSettings {
  return {
    headerTitle:
      branch?.receipt_header_title?.trim() || DEFAULT_RECEIPT_SETTINGS.headerTitle,
    headerSubtitle:
      branch?.receipt_header_subtitle?.trim() || DEFAULT_RECEIPT_SETTINGS.headerSubtitle,
    address:
      branch?.receipt_address?.trim() || DEFAULT_RECEIPT_SETTINGS.address,
    phone:
      branch?.receipt_phone?.trim() || DEFAULT_RECEIPT_SETTINGS.phone,
    footerMessage:
      branch?.receipt_footer_message?.trim() || DEFAULT_RECEIPT_SETTINGS.footerMessage,
    returnPolicy:
      branch?.receipt_return_policy?.trim() || DEFAULT_RECEIPT_SETTINGS.returnPolicy,
  };
}

export function escapeReceiptHtml(value: string) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatReceiptMultiline(value: string) {
  return escapeReceiptHtml(value).replace(/\n/g, "<br/>");
}
