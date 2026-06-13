import { expect, test } from "@playwright/test"

const productNames = [
  "Noor Emerald Embroidered Three Piece",
  "Meher Ivory Maroon Formal Three Piece",
  "Sahar Powder Blue Printed Three Piece",
]

test("Pakistani three-piece products render with images and open correctly", async ({
  page,
}) => {
  await page.goto("/products")

  for (const name of productNames) {
    const card = page.locator("article").filter({ hasText: name })
    await expect(card).toBeVisible()
    await expect(card.locator("img")).toHaveJSProperty("complete", true)
    const naturalWidth = await card.locator("img").evaluate(
      (image: HTMLImageElement) => image.naturalWidth,
    )
    expect(naturalWidth).toBeGreaterThan(0)
  }

  await page
    .locator("article")
    .filter({ hasText: productNames[0] })
    .getByRole("link")
    .first()
    .click()

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Noor Emerald Embroidered Three Piece/i,
  )
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeEnabled()
})
