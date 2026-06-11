import { describe, expect, it } from "vitest"
import { formatCurrency, getMediaUrl, normalizeCartLine, parseProductId } from "../../lib/utils"

describe("commerce utilities", () => {
  it("normalizes legacy product/color identifiers", () => {
    expect(normalizeCartLine({
      productId: "141/deep-blue",
      quantity: 2.8,
      variations: { size: "M" },
    })).toEqual({
      productId: 141,
      quantity: 2,
      variations: { size: "M", color: "deep-blue" },
    })
  })

  it("parses numeric product identifiers safely", () => {
    expect(parseProductId("88/black")).toBe(88)
    expect(parseProductId("not-a-product")).toBe(0)
  })

  it("formats authoritative prices as Bangladeshi taka", () => {
    expect(formatCurrency(2450)).toContain("2,450")
  })

  it("keeps absolute media URLs unchanged", () => {
    expect(getMediaUrl("https://cdn.example.com/item.jpg")).toBe("https://cdn.example.com/item.jpg")
  })
})
