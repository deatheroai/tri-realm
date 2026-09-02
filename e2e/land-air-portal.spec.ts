import { test, expect } from "@playwright/test";

test("walking into the land-side portal transitions to the air realm", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("land");

  // The portal sits at (10, ~ground, 0) — straight +x from spawn — see
  // src/world/landAirPortal.ts. Holding D+Shift covers that distance well
  // within the trigger radius in under 2s.
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("air");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ShiftLeft");
});

test("flying into the air-side portal transitions back to land", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  // The air-side portal sits at (4, 5, 0) — straight +x from the air
  // spawn (0, 5, 0) — see src/world/landAirPortal.ts.
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("land");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ShiftLeft");
});

test("arriving through a portal doesn't immediately bounce back through it", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("air");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ShiftLeft");

  // Sit still for longer than the portal cooldown — should stay in air,
  // not bounce straight back to land because the arrival spot happened
  // to be within range of the very portal just used.
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("air");
});
