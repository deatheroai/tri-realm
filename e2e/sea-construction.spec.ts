import { test, expect } from "@playwright/test";

// The sea floor sits at a fixed, known depth (`src/sea/seaRealmMap.ts`'s
// `SEA_FLOOR_Y`) — hardcoded here the same way other specs hardcode e.g.
// map ids, since it's a stable constant this file doesn't need to import to
// know.
const SEA_FLOOR_Y = -10;

async function switchToSea(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Sea", exact: true }).click();
  await expect.poll(async () => page.evaluate(() => window.__getActiveRealm?.())).toBe("sea");
  // Let the follow camera settle onto the sea avatar (exponential lerp,
  // src/land/followCamera.ts) before projecting a world point to screen —
  // same reasoning castle-placement.spec.ts's stacking test gives for using
  // __projectToScreen instead of a guessed offset in the first place.
  await page.waitForTimeout(600);
}

test("clicking the sea floor places a sea structure", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getSeaStructureCount?.())).toBe(0);

  await switchToSea(page);

  const floorPoint = await page.evaluate(
    (y) => window.__projectToScreen?.(0, y, -3),
    SEA_FLOOR_Y,
  );
  if (!floorPoint) throw new Error("__projectToScreen not available");

  await page.mouse.click(floorPoint.x, floorPoint.y);

  await expect
    .poll(async () => page.evaluate(() => window.__getSeaStructureCount?.()))
    .toBe(1);
  expect(await page.evaluate(() => window.__getLastPlacedSeaType?.())).toBe("reef-pillar");
});

test("placing in sea doesn't affect land's own structure count", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  await switchToSea(page);
  const floorPoint = await page.evaluate(
    (y) => window.__projectToScreen?.(0, y, -3),
    SEA_FLOOR_Y,
  );
  if (!floorPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(floorPoint.x, floorPoint.y);

  await expect
    .poll(async () => page.evaluate(() => window.__getSeaStructureCount?.()))
    .toBe(1);
  // Land's own HUD-backed count is untouched — the two realms' structures
  // are genuinely separate RealmMaps, not one shared array.
  await expect(structuresHud).toHaveAttribute("data-count", "0");
});

test("a placed sea structure and the player's sea position survive a reload", async ({ page }) => {
  await page.goto("/");
  await switchToSea(page);

  // Swim somewhere first, so there's a real (non-spawn) depth to verify
  // survives the reload too, not just the structure.
  await page.keyboard.down("ControlLeft");
  await page.waitForTimeout(800);
  await page.keyboard.up("ControlLeft");

  const floorPoint = await page.evaluate(
    (y) => window.__projectToScreen?.(0, y, -3),
    SEA_FLOOR_Y,
  );
  if (!floorPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(floorPoint.x, floorPoint.y);
  await expect
    .poll(async () => page.evaluate(() => window.__getSeaStructureCount?.()))
    .toBe(1);

  await page.reload();

  // The structure survived without re-placing it, and the player's sea
  // position resumed near the depth dived to rather than back at the
  // spawn depth (-4) — both readable immediately via the debug hooks,
  // without needing to switch back into the sea realm first (seaMovement/
  // seaMap are restored from the save at module init, independent of
  // which realm happens to be active). Not an exact-equality check against
  // a captured pre-reload value: passive buoyancy keeps drifting the
  // avatar upward every frame (`e2e/sea-swim.spec.ts`'s own drift test),
  // including in the gap between placing and reading depth here, so any
  // captured "before" value would itself already be stale by a small,
  // real amount — a meaningfully-deeper-than-spawn check is the robust
  // form of "resumed near where they were."
  expect(await page.evaluate(() => window.__getSeaStructureCount?.())).toBe(1);
  const depthAfterReload = await page.evaluate(() => window.__getSeaDepth?.());
  expect(depthAfterReload).toBeLessThan(-4.3);
});

test("a fresh visit with nothing saved in sea still starts clean", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getSeaStructureCount?.())).toBe(0);
});
