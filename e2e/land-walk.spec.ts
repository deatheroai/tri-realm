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
