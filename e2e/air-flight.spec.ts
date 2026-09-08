import { test, expect } from "@playwright/test";

test("starts in the land realm; the dev panel switches to air", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.__getActiveRealm?.())).toBe("land");

  await page.getByRole("button", { name: "Air" }).click();

  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");
});

test("holding W flies the avatar forward in the air realm", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  const hud = page.locator("#hud-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");

  const z = Number(await hud.getAttribute("data-z"));
  // Forward is -z, same convention as land; momentum-based acceleration
  // (stepAirMovement) still covers real ground within half a second.
  expect(z).toBeLessThan(-0.5);
});

test("Space ascends and Control descends — vertical movement land has none of", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

  const startY = await page.evaluate(() => window.__getAirAltitude?.());
  if (startY === undefined) throw new Error("__getAirAltitude not available");

  await page.keyboard.down("Space");
  await page.waitForTimeout(500);
  await page.keyboard.up("Space");
  const ascendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(ascendedY!).toBeGreaterThan(startY);

  await page.keyboard.down("ControlLeft");
  await page.waitForTimeout(800); // long enough to net back below the ascended height
  await page.keyboard.up("ControlLeft");
  const descendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(descendedY!).toBeLessThan(ascendedY!);
});

test("switching back to Land keeps land's own movement working", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Air" }).click();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe("air");

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

// Air-specific animation/pitch parity with sea (BACKLOG.md Phase 2): before
// this fix, flying always read as "walking on land" — no animation-state
// response to vertical-only flight, and no pitch lean at all. Mirrors the
// pattern sea's own pitch/animation E2E coverage already established
// (e2e/skins.spec.ts's "sea avatar vertical pitch" / "sea avatar swim
// animation" suites), exercised through the Air realm instead.
test.describe("air avatar vertical pitch and animation parity", () => {
  test("ascending and descending in place are NOT idle — vertical-only input counts as real flight", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("air");

    await expect
      .poll(async () => page.evaluate(() => window.__getAirAvatarMoveState?.()))
      .toBe("idle");

    await page.keyboard.down("Space");
    await expect
      .poll(async () => page.evaluate(() => window.__getAirAvatarMoveState?.()))
      .toBe("walk");
    await page.keyboard.up("Space");
  });

  test("ascending and descending tilt the avatar in opposite directions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("air");

    await page.keyboard.down("Space");
    await page.waitForTimeout(500);
    await page.keyboard.up("Space");
    const ascendPitch = await page.evaluate(() => window.__getAirAvatarPitch?.());
    if (ascendPitch === undefined) throw new Error("__getAirAvatarPitch not available");
    expect(ascendPitch).not.toBeCloseTo(0, 2);

    await page.keyboard.down("ControlLeft");
    await page.waitForTimeout(1000); // cross back through level and settle pitched the other way
    await page.keyboard.up("ControlLeft");
    const descendPitch = await page.evaluate(() => window.__getAirAvatarPitch?.());

    // Opposite sign, not just "different" — ascending and descending are
    // opposite vertical directions and should read as opposite tilts.
    expect(Math.sign(descendPitch!)).not.toBe(Math.sign(ascendPitch));
  });

  test("pitch settles back toward level once vertical input is released — air has no buoyancy to keep drifting it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("air");

    await page.keyboard.down("Space");
    await page.waitForTimeout(500);
    await page.keyboard.up("Space");
    const ascendPitch = await page.evaluate(() => window.__getAirAvatarPitch?.());
    if (ascendPitch === undefined) throw new Error("__getAirAvatarPitch not available");
    // Ascending noses the model up — negative rotation.x for this model's
    // axis convention (same setVerticalPitch sign already verified against
    // a real render for sea, src/skins/avatarView.ts).
    expect(ascendPitch).toBeLessThan(0);

    // No vertical input held now — air's exponential velocity decay
    // (stepAirMovement) brings vertical velocity back toward 0, which
    // should ease the pitch back toward level too.
    await page.waitForTimeout(1500);
    const settledPitch = await page.evaluate(() => window.__getAirAvatarPitch?.());
    expect(settledPitch!).toBeGreaterThan(ascendPitch);
    expect(settledPitch!).toBeCloseTo(0, 1);
  });
});
