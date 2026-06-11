import { expect, test } from "@playwright/test"

test("storefront shell and catalogue navigation are accessible", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("banner")).toBeVisible()
  await expect(page.getByRole("link", { name: /ferdous textile home/i })).toBeVisible()

  await page.goto("/products")
  await expect(page.getByRole("heading", { name: /shop all/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /search products/i })).toBeVisible()
})
