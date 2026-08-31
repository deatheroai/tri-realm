import { test, expect } from "@playwright/test";

test("a placed castle piece and the player's position survive a reload", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const hud = page.locator("#hud-position");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  // Walk somewhere first, so there's a real (non-spawn) position to verify
  // survives the reload too, not just the structure.
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(300);
  await page.keyboard.up("KeyW");
  const zBeforeReload = await hud.getAttribute("data-z");
  expect(Number(zBeforeReload)).toBeLessThan(0);

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  await page.mouse.click(viewport.width / 2, viewport.height * 0.75);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  const [lastX, lastY, lastZ] = await Promise.all([
    structuresHud.getAttribute("data-last-x"),
    structuresHud.getAttribute("data-last-y"),
    structuresHud.getAttribute("data-last-z"),
  ]);

  await page.reload();

  // The structure is still there without re-placing it.
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  await expect(structuresHud).toHaveAttribute("data-last-x", lastX!);
  await expect(structuresHud).toHaveAttribute("data-last-y", lastY!);
  await expect(structuresHud).toHaveAttribute("data-last-z", lastZ!);

  // The player resumed near where they were, not back at spawn.
  await expect(hud).toHaveAttribute("data-z", zBeforeReload!);
});

test("a fresh visit with nothing saved still starts clean", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const hud = page.locator("#hud-position");

  await expect(structuresHud).toHaveAttribute("data-count", "0");
  await expect(hud).toHaveAttribute("data-x", "0.000");
  await expect(hud).toHaveAttribute("data-z", "0.000");
});
