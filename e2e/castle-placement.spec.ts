import { test, expect } from "@playwright/test";
import { LAND_PORTAL_POSITION } from "../src/world/landAirPortal";

test("clicking the ground places a castle piece", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  // The camera looks down at the ground from behind/above the avatar, so
  // a point well below vertical-center is reliably ground, not sky.
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  const firstPos = {
    x: Number(await structuresHud.getAttribute("data-last-x")),
    y: Number(await structuresHud.getAttribute("data-last-y")),
    z: Number(await structuresHud.getAttribute("data-last-z")),
  };

  // A second placement should accumulate, not replace. Click a
  // well-separated *world* ground point (via the app's own world-to-screen
  // projection) rather than a fixed pixel offset from the first click —
  // over rolling-hill terrain a small fixed screen-space offset doesn't
  // reliably land back on the ground (confirmed flaky: reproduced a miss
  // directly with the old `groundX + 60` offset).
  const secondPoint = await page.evaluate(
    (p) => window.__projectToScreen?.(p.x + 8, p.y, p.z),
    firstPos,
  );
  if (!secondPoint) throw new Error("__projectToScreen not available");

  await page.mouse.click(secondPoint.x, secondPoint.y);
  await expect(structuresHud).toHaveAttribute("data-count", "2");
});

test("clicking an existing piece stacks a new one on top of it", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  const firstPos = {
    x: Number(await structuresHud.getAttribute("data-last-x")),
    y: Number(await structuresHud.getAttribute("data-last-y")),
    z: Number(await structuresHud.getAttribute("data-last-z")),
  };

  // Click the piece's actual rendered position (via the app's own
  // world-to-screen projection, exposed for tests) rather than guessing a
  // screen offset — this camera's shallow angle means the piece's
  // silhouette is nowhere near directly above the ground point it was
  // placed at, so a guessed offset is fragile.
  const screenPoint = await page.evaluate(
    (p) => window.__projectToScreen?.(p.x, p.y, p.z),
    firstPos,
  );
  if (!screenPoint) throw new Error("__projectToScreen not available");

  await page.mouse.click(screenPoint.x, screenPoint.y);
  await expect(structuresHud).toHaveAttribute("data-count", "2");
  const secondY = Number(await structuresHud.getAttribute("data-last-y"));

  expect(secondY).toBeGreaterThan(firstPos.y + 1); // a full piece height higher, not just a fraction
});

test("defaults to the Keep structure type, and switching type changes new placements", async ({ page }) => {
  await page.goto("/");

  // Click at deliberately far-apart *world* ground points (via the app's
  // own world-to-screen projection, same reasoning as the "stacking" test
  // above) rather than guessed screen-fraction offsets — this camera's
  // shallow angle means a wide screen-space spread doesn't reliably
  // become a wide world-space one (bitten by this for real: `castle-wall`
  // and `castle-gate`'s real-model dimensions, BACKLOG.md's "real
  // Quaternius castle-piece models" item, are tall enough that the old
  // 0.2/0.5/0.8-of-viewport spread let two placements' 3D footprints
  // still Y-overlap despite looking "widely separated" on screen). 16
  // world units of X separation clears every current catalog type's
  // width by a wide margin regardless of height.
  const projectToScreen = (x: number, z: number) =>
    page.evaluate((p) => window.__projectToScreen?.(p.x, 0, p.z), { x, z });

  const keepPoint = await projectToScreen(0, -4);
  if (!keepPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(keepPoint.x, keepPoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-keep");

  await page.getByRole("button", { name: "Wall" }).click();
  const wallPoint = await projectToScreen(8, -4);
  if (!wallPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(wallPoint.x, wallPoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-wall");

  await page.getByRole("button", { name: "Gate" }).click();
  const gatePoint = await projectToScreen(-8, -4);
  if (!gatePoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(gatePoint.x, gatePoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-gate");

  await page.getByRole("button", { name: "Tower" }).click();
  const towerPoint = await projectToScreen(16, -4);
  if (!towerPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(towerPoint.x, towerPoint.y);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-tower");
});

test("structure-type dev panel marks Keep active on load, and the clicked type active on switch", async ({ page }) => {
  await page.goto("/");
  const keepButton = page.getByRole("button", { name: "Keep" });
  const wallButton = page.getByRole("button", { name: "Wall" });
  await expect(keepButton).toHaveClass(/active/);
  await expect(wallButton).not.toHaveClass(/active/);

  await wallButton.click();

  await expect(wallButton).toHaveClass(/active/);
  await expect(keepButton).not.toHaveClass(/active/);
});

test("pressing X undoes the most recently placed piece", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  const firstPos = {
    x: Number(await structuresHud.getAttribute("data-last-x")),
    y: Number(await structuresHud.getAttribute("data-last-y")),
    z: Number(await structuresHud.getAttribute("data-last-z")),
  };

  // Same fixed-pixel-offset flakiness as the "accumulate" test above
  // (confirmed by reproducing an intermittent miss) — click a well-separated
  // *world* ground point instead, via the app's own world-to-screen
  // projection.
  const secondPoint = await page.evaluate(
    (p) => window.__projectToScreen?.(p.x + 8, p.y, p.z),
    firstPos,
  );
  if (!secondPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(secondPoint.x, secondPoint.y);
  await expect(structuresHud).toHaveAttribute("data-count", "2");

  await page.keyboard.press("KeyX");
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  // The HUD's "last placed" position reverts to the first piece's, not the
  // undone second one's — confirms the actual structure removed was the
  // most recent, not an arbitrary one.
  expect(Number(await structuresHud.getAttribute("data-last-x"))).toBeCloseTo(firstPos.x, 5);
  expect(Number(await structuresHud.getAttribute("data-last-y"))).toBeCloseTo(firstPos.y, 5);
  expect(Number(await structuresHud.getAttribute("data-last-z"))).toBeCloseTo(firstPos.z, 5);
});

test("pressing X with nothing placed does nothing (no error, count stays 0)", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  await page.keyboard.press("KeyX");

  await expect(structuresHud).toHaveAttribute("data-count", "0");
});

test("pressing R rotates the next placed piece by a quarter turn", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  // Placed with no rotation yet — the schema's default/starting yaw.
  await page.mouse.click(groundX, groundY);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  expect(await page.evaluate(() => window.__getLastPlacedRotation?.())).toBeCloseTo(0, 5);

  await page.keyboard.press("KeyR");

  // A well-separated *world* ground point, same reasoning as the
  // "accumulate" test above (a fixed screen-space offset doesn't reliably
  // re-hit the ground over rolling-hill terrain).
  const firstPos = {
    x: Number(await structuresHud.getAttribute("data-last-x")),
    y: Number(await structuresHud.getAttribute("data-last-y")),
    z: Number(await structuresHud.getAttribute("data-last-z")),
  };
  const secondPoint = await page.evaluate(
    (p) => window.__projectToScreen?.(p.x + 8, p.y, p.z),
    firstPos,
  );
  if (!secondPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(secondPoint.x, secondPoint.y);
  await expect(structuresHud).toHaveAttribute("data-count", "2");

  expect(await page.evaluate(() => window.__getLastPlacedRotation?.())).toBeCloseTo(Math.PI / 2, 5);
});

test("rotation wraps back to zero after four quarter turns", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");

  await expect(structuresHud).toHaveAttribute("data-facing", "0");
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("KeyR");
    // The HUD previews the yaw the next placement will use.
    await expect(structuresHud).toHaveAttribute("data-facing", String(((i + 1) * 90) % 360));
  }
  await expect(structuresHud).toHaveText("Structures: 0 · 0°");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  await page.mouse.click(viewport.width / 2, viewport.height * 0.75);
  await expect(structuresHud).toHaveAttribute("data-count", "1");

  expect(await page.evaluate(() => window.__getLastPlacedRotation?.())).toBeCloseTo(0, 5);
});

test("a rejected placement shows the reason on the HUD, then clears", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const x = viewport.width / 2;
  const y = viewport.height * 0.75;

  await page.mouse.click(x, y);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  await expect(structuresHud).not.toHaveAttribute("data-reject", /.+/);

  // A ground point just in front of the piece (nearer the camera, so not
  // occluded by it) whose footprint still overlaps the piece's (y - 0.7: the Keep's half-height, back down to ground level): must be
  // rejected, not silently ignored. Projected from world coordinates, not
  // a fixed pixel offset, for the same reason the tests above do.
  const pos = {
    x: Number(await structuresHud.getAttribute("data-last-x")),
    y: Number(await structuresHud.getAttribute("data-last-y")),
    z: Number(await structuresHud.getAttribute("data-last-z")),
  };
  const near = await page.evaluate((p) => window.__projectToScreen?.(p.x, p.y - 0.7, p.z + 0.8), pos);
  if (!near) throw new Error("no projection hook");
  await page.mouse.click(near.x, near.y);
  await expect(structuresHud).toHaveAttribute("data-reject", "overlaps-structure");
  await expect(structuresHud).toContainText("Can't place here");
  await expect(structuresHud).toHaveAttribute("data-count", "1");

  await expect(structuresHud).not.toHaveAttribute("data-reject", /.+/, { timeout: 5000 });
  await expect(structuresHud).toHaveText("Structures: 1 · 0°");
});

test("a placed structure is solid: the avatar can't walk through it", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const positionHud = page.locator("#hud-position");

  // A Keep (the default type) is far taller than a step. Place one a few
  // units behind spawn (+z) — the other directions run into the land<->air/
  // sea portals within a few seconds, which would swap realms mid-test.
  const target = await page.evaluate(() => window.__projectToScreen?.(0, 0, 5));
  if (!target) throw new Error("__projectToScreen not available");
  await page.mouse.click(target.x, target.y);
  await expect(structuresHud).toHaveAttribute("data-count", "1");
  const wallX = Number(await structuresHud.getAttribute("data-last-x"));
  const wallZ = Number(await structuresHud.getAttribute("data-last-z"));
  expect(wallZ).toBeGreaterThan(2);

  // Line up with the piece's x first (the click's ground hit isn't exactly
  // where the projected point was), then walk straight into it. Without
  // collision the avatar would pass right through; with it, it stops short.
  const sideKey = wallX > 0 ? "KeyD" : "KeyA";
  await page.keyboard.down(sideKey);
  await page.waitForFunction(
    (x) => Math.abs(Number(document.getElementById("hud-position")?.dataset.x) - x) < 0.3,
    wallX,
    { polling: "raf", timeout: 15000 },
  );
  await page.keyboard.up(sideKey);

  await page.keyboard.down("KeyS");
  await page.waitForTimeout(2500); // ~15 units unobstructed
  await page.keyboard.up("KeyS");
  const z = Number(await positionHud.getAttribute("data-z"));
  expect(z).toBeGreaterThan(1); // it did walk
  expect(z).toBeLessThan(wallZ); // ...but never reached the piece's centre
});

test("a piece can't be placed on a portal: rejected as blocks-portal", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");

  // The land-side balloon — projected at its real terrain height, since the
  // rolling hills put it well off the y=0 plane the other tests project onto.
  const onPortal = await page.evaluate((p) => window.__projectToScreen?.(p.x, p.y, p.z), LAND_PORTAL_POSITION);
  if (!onPortal) throw new Error("__projectToScreen not available");
  await page.mouse.click(onPortal.x, onPortal.y);
  await expect(structuresHud).toHaveAttribute("data-reject", "blocks-portal");
  await expect(structuresHud).toContainText("blocks a portal");
  await expect(structuresHud).toHaveAttribute("data-count", "0");
});

test("a piece can't be placed on top of the avatar: rejected as blocks-avatar", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const positionHud = page.locator("#hud-position");

  // Project the avatar's own feet, so the click's ground hit lands under them.
  const x = Number(await positionHud.getAttribute("data-x"));
  const y = Number(await positionHud.getAttribute("data-y"));
  const z = Number(await positionHud.getAttribute("data-z"));
  const atFeet = await page.evaluate((p) => window.__projectToScreen?.(p.x, p.y, p.z), { x, y, z });
  if (!atFeet) throw new Error("__projectToScreen not available");
  await page.mouse.click(atFeet.x, atFeet.y);
  await expect(structuresHud).toHaveAttribute("data-reject", "blocks-avatar");
  await expect(structuresHud).toHaveAttribute("data-count", "0");
});
