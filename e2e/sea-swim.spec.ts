import { test, expect } from "@playwright/test";

test("starts in the land realm; the dev panel switches to sea", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("land");

  await page.getByRole("button", { name: "Sea" }).click();

  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");
});

test("holding W swims the avatar forward in the sea realm", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sea" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");

  const hud = page.locator("#hud-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(800); // sea's slower/sluggish acceleration needs more time than land/air
  await page.keyboard.up("KeyW");

  const z = Number(await hud.getAttribute("data-z"));
  // Forward is -z, same convention as land/air.
  expect(z).toBeLessThan(-0.3);
});

test("with no vertical input, buoyancy drifts the avatar upward — sea has no land/air equivalent", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sea" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");

  const startDepth = await page.evaluate(() => window.__getSeaDepth?.());
  if (startDepth === undefined) throw new Error("__getSeaDepth not available");

  await page.waitForTimeout(800);
  const driftedDepth = await page.evaluate(() => window.__getSeaDepth?.());
  expect(driftedDepth!).toBeGreaterThan(startDepth);
});

test("holding Control dives despite buoyancy, and Space surfaces faster than buoyancy alone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sea" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");

  const startDepth = await page.evaluate(() => window.__getSeaDepth?.());
  if (startDepth === undefined) throw new Error("__getSeaDepth not available");

  await page.keyboard.down("ControlLeft");
  await page.waitForTimeout(800);
  await page.keyboard.up("ControlLeft");
  const divedDepth = await page.evaluate(() => window.__getSeaDepth?.());
  expect(divedDepth!).toBeLessThan(startDepth);

  await page.keyboard.down("Space");
  await page.waitForTimeout(800);
  await page.keyboard.up("Space");
  const surfacedDepth = await page.evaluate(() => window.__getSeaDepth?.());
  expect(surfacedDepth!).toBeGreaterThan(divedDepth!);
});

test("switching back to Land keeps land's own movement working", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sea" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("sea");

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
