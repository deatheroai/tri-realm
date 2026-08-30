import { test, expect } from "@playwright/test";

test("the dev skin panel lists both avatar skins and block materials", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#dev-skin-panel button", { hasText: "Capsule" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Fox" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Sandstone" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Slate" })).toBeVisible();
});

test("Fox loads by default on first visit, without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  // Fox is a real glTF load (async), so it isn't set the instant the page
  // loads — poll until it resolves rather than asserting immediately.
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");
  expect(errors).toEqual([]);
});

test("switching back to Capsule works after Fox has loaded", async ({ page }) => {
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  await page.locator("#dev-skin-panel button", { hasText: "Capsule" }).click();

  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()))
    .toBe("capsule");
});

test("switching block material changes the color of newly-placed pieces", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  const sandstoneColor = await page.evaluate(() => window.__getLastPlacedColor?.());

  await page.locator("#dev-skin-panel button", { hasText: "Slate" }).click();
  await page.mouse.click(groundX + 100, groundY);
  const slateColor = await page.evaluate(() => window.__getLastPlacedColor?.());

  expect(slateColor).not.toBe(sandstoneColor);
});
