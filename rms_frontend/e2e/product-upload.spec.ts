import { expect, Page, test } from "@playwright/test";

const image = {
  name: "product.gif",
  mimeType: "image/gif",
  buffer: Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    "base64"
  ),
};

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("e2e-admin");
  await page.getByLabel("Password").fill("e2e-password");
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login/") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === "token"))
    .toBe(true);
  await page.waitForURL(/\/$/, { timeout: 60_000 });
  await page.evaluate(() => {
    localStorage.setItem("selectedBranchId", "all");
    localStorage.setItem("branchSelectionMade", "true");
  });
}

async function fillProduct(page: Page, name: string) {
  await page.goto("/inventory/add-product");
  await page.getByLabel("Product Name").fill(name);
  await page.getByLabel("Description").fill("Playwright three-piece upload");
  await page.getByLabel("Cost Price").fill("1000");
  await page.getByLabel("Wholesale Price").fill("1300");
  await page.getByLabel("Retail Price").fill("1600");

  await page.getByTestId("product-category-select").click();
  await page.getByText("Pakistani Suits", { exact: true }).click();
  await page.getByTestId("gender-select").click();
  await page.getByRole("option", { name: "Female" }).click();

  await page.getByTestId("add-design").click();
  await page.getByTestId("design-name").fill("E2E Floral");
  await page.getByTestId("add-color").click();
  await page.getByTestId("color-stock").fill("7");
  await page
    .getByTestId("gallery-file-E2E Floral-Black-PRIMARY")
    .setInputFiles(image);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("creates a product and uploads its color image before showing success", async ({
  page,
  request,
  context,
}) => {
  await fillProduct(page, `E2E Product ${Date.now()}`);

  const productRequest = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/inventory/products/") &&
      response.request().method() === "POST"
  );
  const imageRequest = page.waitForResponse(
    (response) =>
      response.url().includes("/upload_color_images/") &&
      response.request().method() === "POST"
  );
  const successMessage = expect(
    page.getByText("Product created successfully", { exact: true })
  ).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("save-product").click();
  const productResponse = await productRequest;
  const uploadResponse = await imageRequest;

  expect(productResponse.status()).toBe(201);
  expect(uploadResponse.status()).toBe(201);
  await successMessage;
  await expect(page).toHaveURL(/\/inventory\/products$/);

  const product = await productResponse.json();
  const token = (await context.cookies()).find((cookie) => cookie.name === "token");
  expect(token?.value).toBeTruthy();

  const detailsResponse = await request.get(
    `http://127.0.0.1:8001/api/inventory/products/${product.id}/`,
    { headers: { Authorization: `Bearer ${token?.value}` } }
  );
  expect(detailsResponse.ok()).toBeTruthy();
  const details = await detailsResponse.json();
  expect(details.designs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "E2E Floral",
        colors: expect.arrayContaining([
          expect.objectContaining({ color: "Black", stock: 7 }),
        ]),
      }),
    ])
  );
  expect(details.galleries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        color: "Black",
        images: expect.arrayContaining([
          expect.objectContaining({ imageType: "PRIMARY" }),
        ]),
      }),
    ])
  );

  const imageUrl = details.galleries[0].images[0].image_url;
  const imageResponse = await request.get(imageUrl);
  expect(imageResponse.ok()).toBeTruthy();
});

test("reports partial failure and keeps the created product available", async ({
  page,
}) => {
  await page.route("**/api/inventory/products/*/upload_color_images/", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Simulated upload failure" }),
    })
  );
  await fillProduct(page, `E2E Failure ${Date.now()}`);

  const productRequest = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/inventory/products/") &&
      response.request().method() === "POST"
  );
  await page.getByTestId("save-product").click();

  expect((await productRequest).status()).toBe(201);
  await expect(
    page.getByText("Product created with image upload errors", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Product created successfully", { exact: true })
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/inventory\/add-product$/);
});
