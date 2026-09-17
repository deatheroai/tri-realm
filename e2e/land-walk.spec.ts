import { test, expect } from "@playwright/test";

test("holding W moves the avatar forward", async ({ page }) => {
  await page.goto("/");

  const hud = page.locator("#hud-position");
  await expect(hud).toBeVisible();
  await expect.poll(async () => hud.getAttribute("data-z")).toBe("0.000");

  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");

  const z = Number(await hud.getAttribute("data-z"));
  // Forward is -z; half a second of walking should cover real ground.
  expect(z).toBeLessThan(-0.5);
});

test("holding Shift+W covers more ground than W alone in the same time", async ({ page }) => {
  await page.goto("/");
  const hud = page.locator("#hud-position");

  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  const walkedZ = Number(await hud.getAttribute("data-z"));

  await page.reload();
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  await page.keyboard.up("ShiftLeft");
  const ranZ = Number(await hud.getAttribute("data-z"));

  expect(Math.abs(ranZ)).toBeGreaterThan(Math.abs(walkedZ));
});

test("pressing Space jumps the avatar up off the ground and back down", async ({ page }) => {
  await page.goto("/");

  // Spawn altitude follows the rolling-hill terrain, not necessarily 0 —
  // read the real baseline rather than assuming flat ground.
  const base = (await page.evaluate(() => window.__getLandAltitude?.())) as number;

  await page.keyboard.press("Space");

  // Rises well above spawn shortly after the press...
  await expect
    .poll(() => page.evaluate(() => window.__getLandAltitude?.()))
    .toBeGreaterThan(base + 0.3);

  // ...then settles back to exactly the ground height once the jump arc
  // finishes (no residual vertical drift, unlike sea's buoyancy).
  await expect
    .poll(() => page.evaluate(() => window.__getLandAltitude?.()), { timeout: 3000 })
    .toBeCloseTo(base, 1);
});

test("holding Space doesn't repeatedly jump — settles back to the ground, not keeps climbing", async ({
  page,
}) => {
  await page.goto("/");
  const base = (await page.evaluate(() => window.__getLandAltitude?.())) as number;

  await page.keyboard.down("Space");
  // Long enough for one full jump arc (well under 1s, per the single-jump
  // test above) to complete several times over if Space were wrongly
  // retriggering it every frame while held instead of only on the initial
  // press.
  await page.waitForTimeout(1500);
  const heldAltitude = await page.evaluate(() => window.__getLandAltitude?.());
  await page.keyboard.up("Space");

  expect(heldAltitude).toBeCloseTo(base, 1);
});
