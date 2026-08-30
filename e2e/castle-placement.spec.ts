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

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-keep");

  await page.getByRole("button", { name: "Wall" }).click();
  await page.mouse.click(groundX + 100, groundY);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-wall");

  await page.getByRole("button", { name: "Gate" }).click();
  await page.mouse.click(groundX - 100, groundY);
  expect(await page.evaluate(() => window.__getLastPlacedType?.())).toBe("castle-gate");
});
