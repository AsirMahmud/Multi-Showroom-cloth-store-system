import { expect, test } from "@playwright/test"

test("design-color combinations remain distinct through cart", async ({ page }) => {
  await page.goto("/products")

  await expect(page.getByText("E2E Combination Shirt", { exact: false })).toHaveCount(3)

  const floralBlack = page.locator(
    'a[href*="/product/1/black?design=floral&combination_id=1"]',
  ).first()
  const stripedBlack = page.locator(
    'a[href*="/product/1/black?design=striped&combination_id=3"]',
  ).first()

  await expect(floralBlack).toBeVisible()
  await expect(stripedBlack).toBeVisible()

  await floralBlack.click()
  await expect(page).toHaveURL(/design=floral&combination_id=1/)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /E2E Combination Shirt/i,
  )
  await expect(page.getByRole("link", { name: "Floral" })).toHaveAttribute(
    "href",
    "/product/1/black?design=floral&combination_id=1",
  )

  await page.goto("/product/1/black?design=striped&combination_id=3")
  await expect(page.getByRole("link", { name: "Striped" })).toHaveAttribute(
    "href",
    "/product/1/black?design=striped&combination_id=3",
  )
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeEnabled()
  await page.getByRole("button", { name: "Add to Cart" }).click()

  const storedCart = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rms.cart.v1") || '{"items":[]}'),
  )
  expect(storedCart.items).toHaveLength(1)
  expect(storedCart.items[0].variations).toMatchObject({
    combination_id: "3",
    color: "Black",
    design_name: "Striped",
  })
})
