# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout-flow.spec.ts >> Full Ecommerce UX Flow & Form Validation >> Outside Dhaka / Buy Now Flow & Address Loading Validation
- Location: tests\e2e\checkout-flow.spec.ts:105:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /Oxford Shirt/i
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  9   |   test("Inside Dhaka Checkout Flow & Selection Validation", async ({ page }) => {
  10  |     // 1. Visit Product Details Page
  11  |     console.log("Navigating to product 12 (Urban Thread Casual Shirts 001)...")
  12  |     await page.goto(`${BASE_URL}/product/12/teal`)
  13  |     await expect(page.locator("h1")).toContainText(/Urban Thread Casual Shirts 001/i)
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
> 109 |     await expect(page.locator("h1")).toContainText(/Oxford Shirt/i)
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  110 |     
  111 |     // Choose Size (wait for sizes to load and select first available size)
  112 |     const sizeButtons = page.locator("button:has-text('M'), button:has-text('L'), button:has-text('S'), button:has-text('XL')")
  113 |     if (await sizeButtons.count() > 0) {
  114 |       await sizeButtons.first().click({ force: true })
  115 |     }
  116 |     
  117 |     // 2. Click Buy Now ("Shop Now" button)
  118 |     console.log("Clicking 'Shop Now' (Buy Now) button...")
  119 |     const shopNowBtn = page.getByRole("button", { name: /shop now/i })
  120 |     await shopNowBtn.click({ force: true })
  121 |     
  122 |     // Verify direct redirect to checkout page
  123 |     await page.waitForURL(/checkout/)
  124 |     await expect(page.locator("h1")).toContainText(/Checkout/i)
  125 |     
  126 |     // 3. Switch Delivery Method to Outside Dhaka
  127 |     console.log("Switching delivery method to Outside Dhaka...")
  128 |     await page.getByRole("button", { name: /outside dhaka/i }).click({ force: true })
  129 |     
  130 |     // Fill contact details
  131 |     await page.locator("input[name='firstName']").fill("Jane")
  132 |     await page.locator("input[name='lastName']").fill("Doe")
  133 |     await page.locator("input[name='phone']").fill("01999999999")
  134 |     await page.locator("textarea[name='address']").fill("456 Village Road")
  135 |     
  136 |     // Click Place Order without selecting outside Dhaka dropdowns -> should fail
  137 |     await page.getByRole("button", { name: /place order/i }).click({ force: true })
  138 |     const errorAlert = page.locator("form div[role='alert']").first()
  139 |     await expect(errorAlert).toBeVisible()
  140 |     await expect(errorAlert).toContainText(/Division is required/i)
  141 |     
  142 |     // Select Division
  143 |     console.log("Selecting Division...")
  144 |     await page.locator("#division").click({ force: true })
  145 |     // Wait for options to load from external API
  146 |     await page.locator("[role='option']").first().click({ force: true })
  147 |     
  148 |     // Select District
  149 |     console.log("Selecting District...")
  150 |     await page.locator("#district").click({ force: true })
  151 |     await page.locator("[role='option']").first().click({ force: true })
  152 |     
  153 |     // Select Upazila
  154 |     console.log("Selecting Upazila...")
  155 |     await page.locator("#upazila").click({ force: true })
  156 |     await page.locator("[role='option']").first().click({ force: true })
  157 |     
  158 |     // Select Union
  159 |     console.log("Selecting Union (if available)...")
  160 |     const unionTrigger = page.locator("#union")
  161 |     if (await unionTrigger.isEnabled()) {
  162 |       await unionTrigger.click({ force: true })
  163 |       await page.locator("[role='option']").first().click({ force: true })
  164 |     }
  165 |     
  166 |     // 4. Submit Order
  167 |     console.log("Submitting order outside Dhaka...")
  168 |     await page.getByRole("button", { name: /place order/i }).click({ force: true })
  169 |     
  170 |     // 5. Verify Order Complete Screen
  171 |     console.log("Waiting for order complete page...")
  172 |     await page.waitForURL(/order-complete/)
  173 |     await expect(page.locator("h1")).toContainText(/Order Received/i)
  174 |     
  175 |     // Take screenshot of confirmation page
  176 |     const screenshotPath = path.join(ARTIFACT_DIR, "outside_dhaka_order_complete.png")
  177 |     await page.screenshot({ path: screenshotPath, fullPage: true })
  178 |     console.log(`Screenshot saved to: ${screenshotPath}`)
  179 |   })
  180 | })
  181 | 
```