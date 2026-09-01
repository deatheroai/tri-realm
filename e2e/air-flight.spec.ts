import { test, expect } from "@playwright/test";

test("starts in the land realm; the dev panel switches to air", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("land");

  await page.getByRole("button", { name: "Air" }).click();

  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");
});

test("holding W flies the avatar forward in the air realm", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  const hud = page.locator("#hud-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");

  const z = Number(await hud.getAttribute("data-z"));
  // Forward is -z, same convention as land; momentum-based acceleration
  // (stepAirMovement) still covers real ground within half a second.
  expect(z).toBeLessThan(-0.5);
});

test("Space ascends and Control descends — vertical movement land has none of", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  const startY = await page.evaluate(() => window.__getAirAltitude?.());
  if (startY === undefined) throw new Error("__getAirAltitude not available");

  await page.keyboard.down("Space");
  await page.waitForTimeout(500);
  await page.keyboard.up("Space");
  const ascendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(ascendedY!).toBeGreaterThan(startY);

  await page.keyboard.down("ControlLeft");
  await page.waitForTimeout(800); // long enough to net back below the ascended height
  await page.keyboard.up("ControlLeft");
  const descendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(descendedY!).toBeLessThan(ascendedY!);
});

test("switching back to Land keeps land's own movement working", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  await page.getByRole("button", { name: "Land" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("land");

  const hud = page.locator("#hud-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");
  const z = Number(await hud.getAttribute("data-z"));
  expect(z).toBeLessThan(-0.5);
});
