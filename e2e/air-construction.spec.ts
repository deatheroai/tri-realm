import { test, expect } from "@playwright/test";

// The avatar's air spawn altitude (`src/air/airScene.ts`'s
// `AVATAR_SPAWN_HEIGHT`) — hardcoded here the same way
// `sea-construction.spec.ts` hardcodes `SEA_FLOOR_Y`, since it's a stable
// constant this file doesn't need to import to know.
const AIR_SPAWN_Y = 5;

async function switchToAir(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Air" }).click();
  await expect.poll(async () => page.evaluate(() => window.__getActiveRealm?.())).toBe("air");
  // Let the follow camera settle onto the air avatar (exponential lerp,
  // src/land/followCamera.ts) before projecting a world point to screen —
  // same reasoning sea-construction.spec.ts gives for using
  // __projectToScreen instead of a guessed offset in the first place.
  await page.waitForTimeout(600);
}

test("clicking in open air places an air structure on the plane at the avatar's altitude", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getAirStructureCount?.())).toBe(0);

  await switchToAir(page);

  const airPoint = await page.evaluate((y) => window.__projectToScreen?.(0, y, -3), AIR_SPAWN_Y);
  if (!airPoint) throw new Error("__projectToScreen not available");

  await page.mouse.click(airPoint.x, airPoint.y);

  await expect
    .poll(async () => page.evaluate(() => window.__getAirStructureCount?.()))
    .toBe(1);
  expect(await page.evaluate(() => window.__getLastPlacedAirType?.())).toBe("sky-platform");
});

test("placing in air doesn't affect land's own structure count", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  await switchToAir(page);
  const airPoint = await page.evaluate((y) => window.__projectToScreen?.(0, y, -3), AIR_SPAWN_Y);
  if (!airPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(airPoint.x, airPoint.y);

  await expect
    .poll(async () => page.evaluate(() => window.__getAirStructureCount?.()))
    .toBe(1);
  // Land's own HUD-backed count is untouched — the two realms' structures
  // are genuinely separate RealmMaps, not one shared array.
  await expect(structuresHud).toHaveAttribute("data-count", "0");
});

test("a placed air structure and the player's air position survive a reload", async ({ page }) => {
  await page.goto("/");
  await switchToAir(page);

  // Ascend first, so there's a real (non-spawn) altitude to verify survives
  // the reload too, not just the structure.
  await page.keyboard.down("Space");
  await page.waitForTimeout(500);
  await page.keyboard.up("Space");
  // Let momentum settle back toward zero so the position read below isn't
  // still drifting from residual velocity at the moment it's captured.
  await page.waitForTimeout(300);

  const altitudeBeforeReload = await page.evaluate(() => window.__getAirAltitude?.());
  if (altitudeBeforeReload === undefined) throw new Error("__getAirAltitude not available");
  expect(altitudeBeforeReload).toBeGreaterThan(AIR_SPAWN_Y + 0.5);

  const airPoint = await page.evaluate((y) => window.__projectToScreen?.(0, y, -3), altitudeBeforeReload);
  if (!airPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(airPoint.x, airPoint.y);
  await expect
    .poll(async () => page.evaluate(() => window.__getAirStructureCount?.()))
    .toBe(1);

  await page.reload();

  // The structure survived without re-placing it, and the player's air
  // position resumed near the altitude ascended to rather than back at the
  // spawn height — both readable immediately via the debug hooks, without
  // needing to switch back into the air realm first (airMovement/airMap are
  // restored from the save at module init, independent of which realm
  // happens to be active).
  expect(await page.evaluate(() => window.__getAirStructureCount?.())).toBe(1);
  const altitudeAfterReload = await page.evaluate(() => window.__getAirAltitude?.());
  expect(altitudeAfterReload).toBeGreaterThan(AIR_SPAWN_Y + 0.5);
});

test("a fresh visit with nothing saved in air still starts clean", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getAirStructureCount?.())).toBe(0);
});

test("defaults to the Platform structure type, and switching type changes new placements", async ({ page }) => {
  await page.goto("/");
  await switchToAir(page);

  // Separated *world* X coordinates (via the app's own world-to-screen
  // projection, same reasoning castle-placement.spec.ts's/
  // sea-construction.spec.ts's own type-switching tests give) — clears
  // both catalog types' widths regardless of height. Air's own points stay
  // closer together than those two files' wide (8-16 unit) spreads: at
  // this realm's higher, positive spawn altitude a wide spread projects
  // into the top-right dev panel's own screen region (confirmed directly
  // — (8, AIR_SPAWN_Y, -3) lands inside `#dev-panels`' bounding box, which
  // the shared click listener deliberately excludes, so that click would
  // silently do nothing rather than place anything). 3 units still clears
  // Platform's 2.4 width plus Spire's 0.7 one with margin.
  const projectToScreen = (x: number) =>
    page.evaluate((p) => window.__projectToScreen?.(p.x, p.y, -3), { x, y: AIR_SPAWN_Y });

  const platformPoint = await projectToScreen(0);
  if (!platformPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(platformPoint.x, platformPoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedAirType?.())).toBe("sky-platform");

  await page.getByRole("button", { name: "Sky Spire", exact: true }).click();
  const spirePoint = await projectToScreen(3);
  if (!spirePoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(spirePoint.x, spirePoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedAirType?.())).toBe("sky-spire");
});
