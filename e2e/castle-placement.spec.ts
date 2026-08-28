import { test, expect } from "@playwright/test";

test("clicking the ground places a castle piece", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  // The camera looks down at the ground from behind/above the avatar, so
  // a point well below vertical-center is reliably ground, not sky.
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "1");

  // A second placement should accumulate, not replace.
  await page.mouse.click(groundX + 60, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "2");
});
