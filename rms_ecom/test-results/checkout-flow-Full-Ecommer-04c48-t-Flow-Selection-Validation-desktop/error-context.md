# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout-flow.spec.ts >> Full Ecommerce UX Flow & Form Validation >> Inside Dhaka Checkout Flow & Selection Validation
- Location: tests\e2e\checkout-flow.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /Urban Thread Casual Shirts 001/i
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- region "Notifications alt+T"
- link "Chat on WhatsApp":
  - /url: https://wa.me/8801338869901
  - img
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test"
  2   | import * as path from "path"
  3   | 
  4   | const ARTIFACT_DIR = "C:/Users/KHAN GADGET/.gemini/antigravity-ide/brain/318ea523-fef5-497c-ac93-eadcca417a4d"
  5   | const BASE_URL = "http://localhost:3001"
  6   | 
  7   | test.describe("Full Ecommerce UX Flow & Form Validation", () => {
  8   |   
  9   |   test("Inside Dhaka Checkout Flow & Selection Validation", async ({ page }) => {
  10  |     // 1. Visit Product Details Page
  11  |     console.log("Navigating to product 12 (Urban Thread Casual Shirts 001)...")
  12  |     await page.goto(`${BASE_URL}/product/12/teal`)
> 13  |     await expect(page.locator("h1")).toContainText(/Urban Thread Casual Shirts 001/i)
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  14  |     
  15  |     // Choose Size (wait for sizes to load and select first available in stock size)
  16  |     const sizeButtons = page.locator("button:has-text('M'), button:has-text('L'), button:has-text('S'), button:has-text('XL')")
  17  |     if (await sizeButtons.count() > 0) {
  18  |       await sizeButtons.first().click({ force: true })
  19  |     }
  20  |     
  21  |     // 2. Add to Cart
  22  |     console.log("Adding product to cart...")
  23  |     const addToCartBtn = page.getByRole("button", { name: /add to cart/i })
  24  |     await expect(addToCartBtn).toBeEnabled()
  25  |     await addToCartBtn.click({ force: true })
  26  |     
  27  |     // Verify toast notification is displayed
  28  |     await expect(page.locator("text=added to cart")).toBeVisible()
  29  |     
  30  |     // 3. Navigate to Cart
  31  |     console.log("Navigating to cart page...")
  32  |     await page.goto(`${BASE_URL}/cart`)
  33  |     await expect(page.locator("h1")).toContainText(/Shopping bag/i)
  34  |     
  35  |     // Click Checkout
  36  |     console.log("Clicking checkout summary button...")
  37  |     await page.getByRole("button", { name: /checkout/i }).click({ force: true })
  38  |     
  39  |     // 4. Checkout Page Validation Checks
  40  |     console.log("Checking checkout form validations...")
  41  |     await expect(page.locator("h1")).toContainText(/Checkout/i)
  42  |     
  43  |     // Fill contact info
  44  |     await page.locator("input[name='firstName']").fill("John")
  45  |     await page.locator("input[name='lastName']").fill("Doe")
  46  |     await page.locator("input[name='phone']").fill("01712") // Invalid short phone number
  47  |     await page.locator("textarea[name='address']").fill("123 Test Street, Banani")
  48  |     
  49  |     // Leave address dropdowns empty and select 'Inside Dhaka' (default)
  50  |     // Click Place Order -> should fail and show error (phone format or address selection validation)
  51  |     await page.getByRole("button", { name: /place order/i }).click({ force: true })
  52  |     
  53  |     // We expect an error to be displayed at the bottom of the form
  54  |     const errorAlert = page.locator("form div[role='alert']").first()
  55  |     await expect(errorAlert).toBeVisible()
  56  |     console.log("Validation error displayed successfully:", await errorAlert.innerText())
  57  |     
  58  |     // Correct phone number (valid Bangladeshi format)
  59  |     await page.locator("input[name='phone']").fill("01712345678")
  60  |     
  61  |     // Click Place Order again (dropdowns are still empty!)
  62  |     await page.getByRole("button", { name: /place order/i }).click({ force: true })
  63  |     await expect(errorAlert).toBeVisible()
  64  |     await expect(errorAlert).toContainText(/City Corporation is required/i)
  65  |     
  66  |     // Fill Inside Dhaka address selectors
  67  |     console.log("Selecting City Corp, Thana, and Place...")
  68  |     
  69  |     // Select City Corporation
  70  |     await page.locator("#cityCorp").click({ force: true })
  71  |     await page.locator("[role='option']").first().click({ force: true })
  72  |     
  73  |     // Select Thana
  74  |     await page.locator("#thana").click({ force: true })
  75  |     await page.locator("[role='option']").first().click({ force: true })
  76  |     
  77  |     // Select Place
  78  |     await page.locator("#place").click({ force: true })
  79  |     await page.locator("[role='option']").first().click({ force: true })
  80  |     
  81  |     // Fill order notes
  82  |     await page.locator("textarea[name='notes']").fill("Deliver before 6 PM, please.")
  83  |     
  84  |     // 5. Submit Order
  85  |     console.log("Submitting order inside Dhaka...")
  86  |     await page.getByRole("button", { name: /place order/i }).click({ force: true })
  87  |     
  88  |     // 6. Verify Order Complete Screen
  89  |     console.log("Waiting for order complete page...")
  90  |     await page.waitForURL(/order-complete/)
  91  |     await expect(page.locator("h1")).toContainText(/Order Received/i)
  92  |     
  93  |     // Take screenshot of confirmation page
  94  |     const screenshotPath = path.join(ARTIFACT_DIR, "inside_dhaka_order_complete.png")
  95  |     await page.screenshot({ path: screenshotPath, fullPage: true })
  96  |     console.log(`Screenshot saved to: ${screenshotPath}`)
  97  |     
  98  |     // Verify shipping details matches formatting
  99  |     const shippingInfoBlock = page.locator("h3:has-text('Shipping Info') + div")
  100 |     await expect(shippingInfoBlock).toContainText("123 Test Street")
  101 |     await expect(shippingInfoBlock).toContainText("Banani") // from notes or place
  102 |     await expect(shippingInfoBlock).toContainText("Deliver before 6 PM") // verify notes are visible
  103 |   })
  104 | 
  105 |   test("Outside Dhaka / Buy Now Flow & Address Loading Validation", async ({ page }) => {
  106 |     // 1. Visit Product Details Page
  107 |     console.log("Navigating to product 1 (Oxford Shirt)...")
  108 |     await page.goto(`${BASE_URL}/product/1/default`)
  109 |     await expect(page.locator("h1")).toContainText(/Oxford Shirt/i)
  110 |     
  111 |     // Choose Size (wait for sizes to load and select first available size)
  112 |     const sizeButtons = page.locator("button:has-text('M'), button:has-text('L'), button:has-text('S'), button:has-text('XL')")
  113 |     if (await sizeButtons.count() > 0) {
```