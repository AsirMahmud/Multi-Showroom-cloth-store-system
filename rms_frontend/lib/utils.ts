import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
    const baseUrl = process.env.NEXT_PUBLIC_IMAGEURL || "http://127.0.0.1:8000";
    return `${baseUrl}${imagePath}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_IMAGEURL || "http://127.0.0.1:8000";
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${baseUrl}/media/${cleanPath}`;
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