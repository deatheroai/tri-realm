import { test, expect } from "@playwright/test";

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

  // A second placement should accumulate, not replace.
  await page.mouse.click(groundX + 60, groundY);
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
});
