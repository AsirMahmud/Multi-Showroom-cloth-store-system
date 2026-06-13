"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Standardized error state with retry button.
 * Matches the dashboard AlertTriangle + retry pattern.
 */
export function PageError({
  message = "Something went wrong. Please try again.",
  onRetry,
}: PageErrorProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
      <p className="mt-3 text-sm font-medium text-rose-700">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-4 border-rose-200 text-rose-700 hover:bg-rose-100"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export default PageError;
