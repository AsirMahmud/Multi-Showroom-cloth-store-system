"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Grid column classes */
  columns?: string;
  /** Height of each skeleton card */
  height?: string;
}

/**
 * Standardized loading skeleton grid matching the dashboard pattern.
 * Use across all pages for consistent loading states.
 */
export function PageLoading({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  height = "h-32",
}: PageLoadingProps) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-xl`} />
      ))}
    </div>
  );
}

export default PageLoading;
