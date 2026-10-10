import { test, expect } from "@playwright/test";
import { openGroundScreenPoint } from "./openGround";

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

  const open = await openGroundScreenPoint(page);
  await page.mouse.click(open.x, open.y);
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

test("a placed piece's rotation survives a reload too", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  await page.keyboard.press("KeyR"); // rotate a quarter turn before placing

  const open = await openGroundScreenPoint(page);
  await page.mouse.click(open.x, open.y);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  expect(await page.evaluate(() => window.__getLastPlacedRotation?.())).toBeCloseTo(Math.PI / 2, 5);

  await page.reload();

  await expect(structuresHud).toHaveAttribute("data-count", "1");
  expect(await page.evaluate(() => window.__getLastPlacedRotation?.())).toBeCloseTo(Math.PI / 2, 5);
});

test("a fresh visit with nothing saved still starts clean", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const hud = page.locator("#hud-position");

  await expect(structuresHud).toHaveAttribute("data-count", "0");
  await expect(hud).toHaveAttribute("data-x", "0.000");
  await expect(hud).toHaveAttribute("data-z", "0.000");
});

test("a save holding a piece on a portal loads without it (older saves predate the keep-out rule)", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const open = await openGroundScreenPoint(page);
  await page.mouse.click(open.x, open.y);
  await expect(structuresHud).toHaveAttribute("data-count", "1");

  // Inject a second piece right on the first portal into the saved map.
  await page.evaluate(() => {
    const key = "tri-realm:map:land-01";
    const map = JSON.parse(window.localStorage.getItem(key)!);
    const portal = map.portals[0];
    map.structures.push({ ...map.structures[0], id: "on-portal", position: { ...portal.position } });
    window.localStorage.setItem(key, JSON.stringify(map));
  });

  await page.reload();
  await expect(structuresHud).toHaveAttribute("data-count", "1");
});
