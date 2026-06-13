export function normalizeProductPrice(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}
