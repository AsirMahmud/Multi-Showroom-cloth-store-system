import { expect, test } from "@playwright/test"
import * as path from "path"

const ARTIFACT_DIR = "C:/Users/KHAN GADGET/.gemini/antigravity-ide/brain/318ea523-fef5-497c-ac93-eadcca417a4d"
const BASE_URL = "http://localhost:3001"

test.describe("Full Ecommerce UX Flow & Form Validation", () => {
  
  test("Inside Dhaka Checkout Flow & Selection Validation", async ({ page }) => {
    // 1. Visit Product Details Page
    console.log("Navigating to product 12 (Urban Thread Casual Shirts 001)...")
    await page.goto(`${BASE_URL}/product/12/teal`)
    await expect(page.locator("h1")).toContainText(/Urban Thread Casual Shirts 001/i)
    
    // Choose Size (wait for sizes to load and select first available in stock size)
    const sizeButtons = page.locator("button:has-text('M'), button:has-text('L'), button:has-text('S'), button:has-text('XL')")
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click({ force: true })
    }
    
    // 2. Add to Cart
    console.log("Adding product to cart...")
    const addToCartBtn = page.getByRole("button", { name: /add to cart/i })
    await expect(addToCartBtn).toBeEnabled()
    await addToCartBtn.click({ force: true })
    
    // Verify toast notification is displayed
    await expect(page.locator("text=added to cart")).toBeVisible()
    
    // 3. Navigate to Cart
    console.log("Navigating to cart page...")
    await page.goto(`${BASE_URL}/cart`)
    await expect(page.locator("h1")).toContainText(/Shopping bag/i)
    
    // Click Checkout
    console.log("Clicking checkout summary button...")
    await page.getByRole("button", { name: /checkout/i }).click({ force: true })
    
    // 4. Checkout Page Validation Checks
    console.log("Checking checkout form validations...")
    await expect(page.locator("h1")).toContainText(/Checkout/i)
    
    // Fill contact info
    await page.locator("input[name='firstName']").fill("John")
    await page.locator("input[name='lastName']").fill("Doe")
    await page.locator("input[name='phone']").fill("01712") // Invalid short phone number
    await page.locator("textarea[name='address']").fill("123 Test Street, Banani")
    
    // Leave address dropdowns empty and select 'Inside Dhaka' (default)
    // Click Place Order -> should fail and show error (phone format or address selection validation)
    await page.getByRole("button", { name: /place order/i }).click({ force: true })
    
    // We expect an error to be displayed at the bottom of the form
    const errorAlert = page.locator("form div[role='alert']").first()
    await expect(errorAlert).toBeVisible()
    console.log("Validation error displayed successfully:", await errorAlert.innerText())
    
    // Correct phone number (valid Bangladeshi format)
    await page.locator("input[name='phone']").fill("01712345678")
    
    // Click Place Order again (dropdowns are still empty!)
    await page.getByRole("button", { name: /place order/i }).click({ force: true })
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText(/City Corporation is required/i)
    
    // Fill Inside Dhaka address selectors
    console.log("Selecting City Corp, Thana, and Place...")
    
    // Select City Corporation
    await page.locator("#cityCorp").click({ force: true })
    await page.locator("[role='option']").first().click({ force: true })
    
    // Select Thana
    await page.locator("#thana").click({ force: true })
    await page.locator("[role='option']").first().click({ force: true })
    
    // Select Place
    await page.locator("#place").click({ force: true })
    await page.locator("[role='option']").first().click({ force: true })
    
    // Fill order notes
    await page.locator("textarea[name='notes']").fill("Deliver before 6 PM, please.")
    
    // 5. Submit Order
    console.log("Submitting order inside Dhaka...")
    await page.getByRole("button", { name: /place order/i }).click({ force: true })
    
    // 6. Verify Order Complete Screen
    console.log("Waiting for order complete page...")
    await page.waitForURL(/order-complete/)
    await expect(page.locator("h1")).toContainText(/Order Received/i)
    
    // Take screenshot of confirmation page
    const screenshotPath = path.join(ARTIFACT_DIR, "inside_dhaka_order_complete.png")
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Screenshot saved to: ${screenshotPath}`)
    
    // Verify shipping details matches formatting
    const shippingInfoBlock = page.locator("h3:has-text('Shipping Info') + div")
    await expect(shippingInfoBlock).toContainText("123 Test Street")
    await expect(shippingInfoBlock).toContainText("Banani") // from notes or place
    await expect(shippingInfoBlock).toContainText("Deliver before 6 PM") // verify notes are visible
  })

  test("Outside Dhaka / Buy Now Flow & Address Loading Validation", async ({ page }) => {
    // 1. Visit Product Details Page
    console.log("Navigating to product 1 (Oxford Shirt)...")
    await page.goto(`${BASE_URL}/product/1/default`)
    await expect(page.locator("h1")).toContainText(/Oxford Shirt/i)
    
    // Choose Size (wait for sizes to load and select first available size)
    const sizeButtons = page.locator("button:has-text('M'), button:has-text('L'), button:has-text('S'), button:has-text('XL')")
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click({ force: true })
    }
    
    // 2. Click Buy Now ("Shop Now" button)
    console.log("Clicking 'Shop Now' (Buy Now) button...")
    const shopNowBtn = page.getByRole("button", { name: /shop now/i })
    await shopNowBtn.click({ force: true })
    
    // Verify direct redirect to checkout page
    await page.waitForURL(/checkout/)
    await expect(page.locator("h1")).toContainText(/Checkout/i)
    
    // 3. Switch Delivery Method to Outside Dhaka
    console.log("Switching delivery method to Outside Dhaka...")
    await page.getByRole("button", { name: /outside dhaka/i }).click({ force: true })
    
    // Fill contact details
    await page.locator("input[name='firstName']").fill("Jane")
    await page.locator("input[name='lastName']").fill("Doe")
    await page.locator("input[name='phone']").fill("01999999999")
    await page.locator("textarea[name='address']").fill("456 Village Road")
    
    // Click Place Order without selecting outside Dhaka dropdowns -> should fail
    await page.getByRole("button", { name: /place order/i }).click({ force: true })
    const errorAlert = page.locator("form div[role='alert']").first()
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText(/Division is required/i)
    
    // Select Division
    console.log("Selecting Division...")
    await page.locator("#division").click({ force: true })
    // Wait for options to load from external API
    await page.locator("[role='option']").first().click({ force: true })
    
    // Select District
    console.log("Selecting District...")
    await page.locator("#district").click({ force: true })
    await page.locator("[role='option']").first().click({ force: true })
    
    // Select Upazila
    console.log("Selecting Upazila...")
    await page.locator("#upazila").click({ force: true })
    await page.locator("[role='option']").first().click({ force: true })
    
    // Select Union
    console.log("Selecting Union (if available)...")
    const unionTrigger = page.locator("#union")
    if (await unionTrigger.isEnabled()) {
      await unionTrigger.click({ force: true })
      await page.locator("[role='option']").first().click({ force: true })
    }
    
    // 4. Submit Order
    console.log("Submitting order outside Dhaka...")
    await page.getByRole("button", { name: /place order/i }).click({ force: true })
    
    // 5. Verify Order Complete Screen
    console.log("Waiting for order complete page...")
    await page.waitForURL(/order-complete/)
    await expect(page.locator("h1")).toContainText(/Order Received/i)
    
    // Take screenshot of confirmation page
    const screenshotPath = path.join(ARTIFACT_DIR, "outside_dhaka_order_complete.png")
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`Screenshot saved to: ${screenshotPath}`)
  })
})
