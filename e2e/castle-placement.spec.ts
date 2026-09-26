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
