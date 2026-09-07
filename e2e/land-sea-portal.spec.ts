import { test, expect } from "@playwright/test";

test("walking into the diving house transitions to the sea realm", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("land");

  // The diving house sits at (-10, ~ground, 0) — straight -x from spawn —
  // see src/world/landSeaPortal.ts. Holding A+Shift covers that distance
  // well within the trigger radius in under 2s.
  await page.keyboard.down("KeyA");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("sea");
  await page.keyboard.up("KeyA");
  await page.keyboard.up("ShiftLeft");
});

test("swimming into the sea-side arch transitions back to land", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sea" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");

  // The sea-side arch sits at (0, -4, -12) — straight -z (forward) from
  // the sea spawn (0, -4, 0) — see src/world/landSeaPortal.ts. Sea's
  // horizontal speed is slower/sluggish than land/air (water resistance),
  // so this needs a longer hold and a more generous poll timeout.
  await page.keyboard.down("KeyW");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 10000 })
    .toBe("land");
  await page.keyboard.up("KeyW");
  await page.keyboard.up("ShiftLeft");
});

test("arriving through the diving house doesn't immediately bounce back through it", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.down("KeyA");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("sea");
  await page.keyboard.up("KeyA");
  await page.keyboard.up("ShiftLeft");

  // Sit still for longer than the portal cooldown — should stay in sea,
  // not bounce straight back to land because the arrival spot happened
  // to be within range of the very portal just used.
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("sea");
});

test("the land<->air and land<->sea portals don't interfere with each other", async ({ page }) => {
  await page.goto("/");

  // Walking +x (toward the balloon) from spawn should still reach air,
  // unaffected by the new -x diving-house portal existing on the map too.
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
    .toBe("air");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ShiftLeft");
});
