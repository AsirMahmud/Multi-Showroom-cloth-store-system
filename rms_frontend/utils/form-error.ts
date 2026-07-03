export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;

  const responseData = (error as { response?: { data?: unknown } }).response?.data;
  const findMessage = (value: unknown, field?: string): string | null => {
    if (typeof value === "string" && value.trim()) {
      return field ? `${field}: ${value}` : value;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const message = findMessage(item, field);
        if (message) return message;
      }
    }
    if (typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      for (const key of ["detail", "message", "error", "non_field_errors"]) {
        const message = findMessage(record[key]);
        if (message) return message;
      }
      for (const [key, nestedValue] of Object.entries(record)) {
        const label = key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
        const message = findMessage(nestedValue, label);
        if (message) return message;
      }
    }
    return null;
  };

  return findMessage(responseData) || (error as Error).message || fallback;
}

export function getFirstFormError(errors: unknown): string {
  if (typeof errors !== "object" || errors === null) return "Please check the required fields.";

  const record = errors as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message;

  for (const value of Object.values(record)) {
    const message = getFirstFormError(value);
    if (message !== "Please check the required fields.") return message;
  }
  return "Please check the required fields.";
}