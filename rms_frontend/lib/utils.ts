import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const configuredBackendUrl =
  process.env.NEXT_PUBLIC_IMAGE_URL?.trim() ||
  process.env.NEXT_PUBLIC_IMAGEURL?.trim() ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/api\/?$/, "") ||
  process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/api\/?$/, "") ||
  process.env.NEXT_PUBLIC_BASEURL?.trim().replace(/\/api\/?$/, "");

const isLocalUrl = (value: string): boolean => {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
};

if (
  process.env.NODE_ENV === "production" &&
  configuredBackendUrl &&
  isLocalUrl(configuredBackendUrl)
) {
  throw new Error(
    `Invalid production media URL "${configuredBackendUrl}". Set it to the public backend URL.`
  );
}

const BACKEND_URL = (
  configuredBackendUrl || "http://localhost:8000"
).replace(/\/+$/, "");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Bangladeshi Taka (BDT). Single source of truth for
 * currency rendering across POS, dashboards, reports, and receipts.
 */
export function formatCurrency(amount: number, currency: string = "BDT") {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

/**
 * Get the full image URL by combining the base URL with the image path
 * @param imagePath - The relative image path from the backend (e.g., "/media/gallery/97/navy/fourth.png")
 * @returns The full URL for the image
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/placeholder.svg";

  // If the path already starts with http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If the path is a known local placeholder, return as is
  if (imagePath === '/placeholder.svg' || imagePath === '/placeholder.jpg') {
    return imagePath;
  }

  if (imagePath.startsWith('/media/')) {
    return `${BACKEND_URL}${imagePath}`;
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${BACKEND_URL}/media/${cleanPath}`;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}
