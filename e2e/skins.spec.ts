import { test, expect, type Page } from "@playwright/test";
import { AVATAR_SKINS } from "../src/skins/avatarSkins";

/**
 * Regression guard for the class of bug fixed in the "dev-panel overlap"
 * commit: two `position: fixed` overlays (added independently by the World
 * and Skins tracks, in the same or different cycles) can merge cleanly as
 * text yet still collide visually. Generic on purpose — every child of
 * `#dev-panels-content` is checked, not specific panel ids, so a *future*
 * panel added to that shared column is covered automatically without
 * editing this test. See AUTONOMY.md's "UI layout convention" for the rule
 * this enforces (new panels join `#dev-panels-content`, they don't claim
 * their own fixed corner). `#dev-panels-content` (not `#dev-panels`
 * itself) is the actual stacked column since the 2026-09-08 collapse-on-
 * mobile fix wrapped it in a toggle button + content div — this test
 * always runs fine-pointer/desktop, where that collapse never triggers
 * (`@media (pointer: coarse)`), so `#dev-panels-content` renders exactly
 * as `#dev-panels` itself used to.
 */
async function boundingBoxesOverlap(page: Page): Promise<Array<{ a: string; b: string }>> {
  const selectors = ["#hud-controls", "#hud-position", "#hud-structures", "#dev-panels-content > *", "#credits"];
  const boxes: Array<{ label: string; box: { x: number; y: number; width: number; height: number } }> = [];

  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const box = await locator.nth(i).boundingBox();
      if (box) boxes.push({ label: `${selector}[${i}]`, box });
    }
  }

  const overlaps: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const { box: a } = boxes[i];
      const { box: b } = boxes[j];
      const intersects = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      if (intersects) overlaps.push({ a: boxes[i].label, b: boxes[j].label });
    }
  }
  return overlaps;
}

test.describe("fixed overlay layout", () => {
  // The bug this guards against only reproduces on a narrow viewport — wide
  // enough panels never collided even before the fix. Desktop Chrome's
  // default (1280px) wouldn't have caught it.
  test.use({ viewport: { width: 390, height: 700 } });

  test("no two fixed HUD/panel elements overlap on a narrow viewport", async ({ page }) => {
    await page.goto("/");
    const panelCount = await page.locator("#dev-panels-content > *").count();
    expect(panelCount).toBeGreaterThan(0); // sanity: the check actually covered something

    const overlaps = await boundingBoxesOverlap(page);
    expect(overlaps).toEqual([]);
  });
});

/**
 * Regression guard for the bug reported directly: Robot originally shipped
 * at scale 1 and rendered ~4.82 world units tall — 2.7x the procedural
 * Capsule and off the top of the screen, head included — because the
 * scale was picked by inference (bounding-box math + reading a demo's
 * camera setup) rather than measured against a real render. Generic on
 * purpose: iterates AVATAR_SKINS itself, so a *future* gltf skin is
 * covered automatically without editing this test, and checks a ratio
 * against Capsule (our one scale-independent reference) rather than an
 * absolute number, so it isn't tied to today's specific models.
 */
test("every gltf avatar skin renders within a sane height range of the procedural capsule", async ({ page }) => {
  await page.goto("/");

  await page.locator("#dev-skin-panel button", { hasText: "Capsule" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("capsule");
  const capsuleHeight = await page.evaluate(() => window.__getAvatarWorldHeight?.());
  expect(capsuleHeight).toBeGreaterThan(0);

  const gltfSkins = AVATAR_SKINS.filter((skin) => skin.kind === "gltf");
  expect(gltfSkins.length).toBeGreaterThan(0); // sanity: the check actually covered something

  for (const skin of gltfSkins) {
    await page.locator("#dev-skin-panel button", { hasText: skin.label }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe(skin.id);

    const height = await page.evaluate(() => window.__getAvatarWorldHeight?.());
    const ratio = (height ?? 0) / (capsuleHeight ?? 1);
    expect(ratio, `"${skin.label}" is ${ratio.toFixed(2)}x Capsule's height — outside the sane range`).toBeGreaterThan(0.5);
    expect(ratio, `"${skin.label}" is ${ratio.toFixed(2)}x Capsule's height — outside the sane range`).toBeLessThan(1.8);
  }
});

// Regression guard for the "a skin can never brick the app" promise
// documented throughout ARCHITECTURE.md/DECISIONS.md (AvatarView.buildVisual's
// catch, src/skins/avatarView.ts): only ever verified via a mocked
// GLTFLoader.loadAsync rejection in avatarView.test.ts, not against a real
// network failure in a real browser. This exercises the actual path a
// player would hit — e.g. a CDN hiccup or a missing asset file — by
// aborting Fox's real glTF request before the very first load, and
// confirms the app still comes up fully functional on the fallback
// procedural capsule instead of hanging or throwing.
test("a failed glTF load falls back to the procedural capsule instead of breaking the app", async ({ page }) => {
  const uncaughtErrors: string[] = [];
  page.on("pageerror", (err) => uncaughtErrors.push(err.message));

  await page.route("**/assets/models/fox.glb", (route) => route.abort());
  await page.goto("/");

  // DEFAULT_AVATAR_SKIN_ID ("fox") failed to load — AvatarView.buildVisual's
  // catch resolves to FALLBACK_AVATAR_SKIN_ID ("capsule") instead, exactly
  // as it would for any other load failure.
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("capsule");

  // The dev panel reflects the real resolved outcome too (setActiveButton
  // follows AvatarView.skinId, not the id that was originally requested).
  await expect(page.locator("#dev-skin-panel button", { hasText: "Capsule" })).toHaveClass(/active/);

  // The avatar itself still renders at a sane height — a real, working
  // fallback, not just an id string with nothing behind it.
  const height = await page.evaluate(() => window.__getAvatarWorldHeight?.());
  expect(height).toBeGreaterThan(0);

  // No *uncaught* exception — AvatarView.buildVisual logs the failure via
  // console.error (expected, not asserted against here) and recovers
  // cleanly rather than letting it propagate.
  expect(uncaughtErrors).toEqual([]);
});

test("the dev skin panel lists both avatar skins and block materials", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#dev-skin-panel button", { hasText: "Capsule" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Fox" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Robot" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Mannequin" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Dive Suit" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Sandstone" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Slate" })).toBeVisible();
});

test("Fox loads by default on first visit, without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  // Fox is a real glTF load (async), so it isn't set the instant the page
  // loads — poll until it resolves rather than asserting immediately.
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");
  expect(errors).toEqual([]);
});

test("switching back to Capsule works after Fox has loaded", async ({ page }) => {
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  await page.locator("#dev-skin-panel button", { hasText: "Capsule" }).click();

  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()))
    .toBe("capsule");
});

test("switching to Robot loads it, then switching back to Fox still works", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  await page.locator("#dev-skin-panel button", { hasText: "Robot" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("robot");

  await page.locator("#dev-skin-panel button", { hasText: "Fox" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  expect(errors).toEqual([]);
});

// Princess has no animation clips at all (see ATTRIBUTIONS.md) — unlike
// Robot/Fox, its AvatarView never creates a mixer. This guards that the
// no-animation path (buildVisual's `if (gltf.animations.length > 0)`
// branch simply not running) still loads and swaps cleanly rather than
// throwing on an absent mixer/actions.
test("switching to Princess (no animation clips) loads it, then switching back to Fox still works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  await page.locator("#dev-skin-panel button", { hasText: "Princess" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("princess");

  await page.locator("#dev-skin-panel button", { hasText: "Fox" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  expect(errors).toEqual([]);
});

// Regression guard for the procedural idle/movement "bob" (AvatarView.update,
// src/skins/avatarView.ts): a skin with no real clip for the current move
// state should still visibly move a little rather than reading as frozen,
// but a skin that *does* have a real clip (its own animation already
// supplies motion) must never get this extra offset on top of it.
test("Princess (no animation clips) bobs while an animated skin (Fox) stays exactly still", async ({ page }) => {
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  // Fox has a real clip for every move state — its own animation carries
  // the motion, so AvatarView.update must never add a bob on top of it.
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarVisualLocalY?.()), { timeout: 5000 })
    .toBe(0);

  await page.locator("#dev-skin-panel button", { hasText: "Princess" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("princess");

  // Princess has no clips at all — sampled twice a beat apart, the bob
  // should actually be oscillating rather than sitting at a fixed value.
  const first = await page.evaluate(() => window.__getAvatarVisualLocalY?.());
  await page.waitForTimeout(300);
  const second = await page.evaluate(() => window.__getAvatarVisualLocalY?.());
  expect(first).not.toBe(undefined);
  expect(second).not.toBe(undefined);
  expect(first).not.toBe(second);
  // Small — a subtle cue, not a visible jump.
  expect(Math.abs(first as number)).toBeLessThan(0.1);
  expect(Math.abs(second as number)).toBeLessThan(0.1);
});

// Female is a new skin (not a princess.glb replacement — see
// ATTRIBUTIONS.md's `models/female.glb` entry) built by merging a separate
// mesh + animation-library file offline; this guards that the merge
// actually produced a working mixer/actions setup end to end, same pattern
// as the Robot/Mannequin switch-back-and-forth tests above.
test("switching to Female loads it with working animations, then switching back to Fox still works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  await page.locator("#dev-skin-panel button", { hasText: "Female" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("female");

  await page.locator("#dev-skin-panel button", { hasText: "Fox" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
    .toBe("fox");

  expect(errors).toEqual([]);
});

// Compares texture *identity* (map.uuid), not .color: once a material's
// real photographed texture loads (realBlockTextures.ts), .color resets to
// white for every material except Gold, so .color alone can't reliably
// distinguish materials once real textures have taken over — but the map
// is always distinct per material, generated-pattern fallback or real
// photo alike, and this assertion holds the instant a piece is placed
// (no need to wait out the async real-texture load first).
test("switching block material changes the visual of newly-placed pieces", async ({ page }) => {
  await page.goto("/");

  // Click at deliberately far-apart *world* ground points (via the app's
  // own world-to-screen projection, same reasoning/pattern as
  // e2e/castle-placement.spec.ts's "defaults to the Keep structure type"
  // test) rather than guessed screen-fraction offsets — this both avoids
  // the near-camera-pixel-density trap that test's own comment documents,
  // and, unlike a screen fraction, keeps working regardless of the
  // camera's own elevation/framing (`BACKLOG.md`'s still-open "camera
  // framing" item), which a fixed vertical fraction assumes.
  const projectToScreen = (x: number, z: number) =>
    page.evaluate((p) => window.__projectToScreen?.(p.x, 0, p.z), { x, z });

  const leftPoint = await projectToScreen(-8, 4);
  if (!leftPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(leftPoint.x, leftPoint.y);
  const sandstoneMapUuid = await page.evaluate(() => window.__getLastPlacedMapUuid?.());
  expect(sandstoneMapUuid).toBeTruthy();

  await page.locator("#dev-skin-panel button", { hasText: "Slate" }).click();
  const rightPoint = await projectToScreen(8, 4);
  if (!rightPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(rightPoint.x, rightPoint.y);
  const slateMapUuid = await page.evaluate(() => window.__getLastPlacedMapUuid?.());

  expect(slateMapUuid).not.toBe(sandstoneMapUuid);
});

// Regression guard for the tint-reset rule in realBlockTextures.ts: a real
// photo is already the right hue for Sandstone/Slate/Timber, so their
// generated-fallback tint gets reset to white once the real texture loads;
// Gold is the deliberate exception (the real photo is a neutral scratched
// grey and needs the tint to read as "gold" at all). Polls for the final
// state directly rather than racing the async load.
test("a block's real photographed texture loads in and takes over from the generated pattern", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  // World-coordinate clicks, same reasoning as the material-switch test
  // above (camera-framing-agnostic, not just near-camera-pixel-density-safe).
  const projectToScreen = (x: number, z: number) =>
    page.evaluate((p) => window.__projectToScreen?.(p.x, 0, p.z), { x, z });

  const leftPoint = await projectToScreen(-8, 4);
  if (!leftPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(leftPoint.x, leftPoint.y); // Sandstone is the default material
  await expect
    .poll(() => page.evaluate(() => window.__getLastPlacedColor?.()), { timeout: 5000 })
    .toBe(0xffffff);

  await page.locator("#dev-skin-panel button", { hasText: "Gold" }).click();
  const rightPoint = await projectToScreen(8, 4);
  if (!rightPoint) throw new Error("__projectToScreen not available");
  await page.mouse.click(rightPoint.x, rightPoint.y);
  await expect
    .poll(() => page.evaluate(() => window.__getLastPlacedColor?.()), { timeout: 5000 })
    .toBe(0xd4af37);

  expect(errors).toEqual([]);
});

// The air avatar (src/air/airScene.ts, Phase 2) shares AvatarView with
// land's — one skin choice, not one per realm — see main.ts's
// airAvatarView. These live in e2e/skins.spec.ts rather than
// e2e/air-flight.spec.ts (World's file) since this is Skins-track
// behavior, just exercised through the Air realm.
test.describe("air avatar shares Skins' skin-switching with land", () => {
  test("Fox is the default in the air realm too, without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
      .toBe("air");

    await expect
      .poll(() => page.evaluate(() => window.__getAirAvatarSkinId?.()), { timeout: 5000 })
      .toBe("fox");
    expect(errors).toEqual([]);
  });

  test("switching skin while in the air realm updates the air avatar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
      .toBe("air");

    await page.locator("#dev-skin-panel button", { hasText: "Robot" }).click();

    await expect
      .poll(() => page.evaluate(() => window.__getAirAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");
  });

  test("a skin chosen in the air realm carries over to land, and vice versa", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
      .toBe("air");

    await page.locator("#dev-skin-panel button", { hasText: "Robot" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getAirAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");

    await page.getByRole("button", { name: "Land" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()), { timeout: 5000 })
      .toBe("land");
    // Land's own AvatarView already had this skin queued up from the same
    // button click above — no need to click anything again.
    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");

    await page.locator("#dev-skin-panel button", { hasText: "Capsule" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("capsule");

    await page.getByRole("button", { name: "Air" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getAirAvatarSkinId?.()), { timeout: 5000 })
      .toBe("capsule");
  });
});

// Regression guard for the compliance gap this closes: the Fox's CC BY 4.0
// rigging/animation (public/assets/ATTRIBUTIONS.md) legally requires
// attribution wherever the asset ships — that credit needs to actually
// reach a real player in the deployed app, not just live in a repo file.
test.describe("in-app credits", () => {
  test("is collapsed by default and reveals the required Fox rig credit on click", async ({ page }) => {
    await page.goto("/");

    const panel = page.locator("#credits-panel");
    await expect(panel).not.toHaveClass(/open/);

    await page.locator("#credits-toggle").click();
    await expect(panel).toHaveClass(/open/);
    await expect(panel).toContainText("tomkranis");
    await expect(panel).toContainText("CC BY 4.0");

    // A real, working link — not just text mentioning the license. Scoped to
    // the Fox rig's own credit line: other CC-BY-4.0 assets (e.g. Princess)
    // render their own "CC BY 4.0" link too, so an unscoped lookup by name
    // is ambiguous once more than one CC-BY entry exists.
    const foxLine = panel.locator("div", { hasText: "tomkranis" });
    const licenseLink = foxLine.getByRole("link", { name: "CC BY 4.0" });
    await expect(licenseLink).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  });

  test("toggles closed again on a second click", async ({ page }) => {
    await page.goto("/");

    const toggle = page.locator("#credits-toggle");
    const panel = page.locator("#credits-panel");

    await toggle.click();
    await expect(panel).toHaveClass(/open/);

    await toggle.click();
    await expect(panel).not.toHaveClass(/open/);
  });
});

// Regression guard: the dev panels used to give no visual feedback about
// which skin/material was actually selected — reviewing the deployed
// preview meant trusting your own memory of the last click. main.ts's
// setActiveButton fixes that for the Avatar/Blocks rows.
test.describe("dev panel active-state highlighting", () => {
  test("Fox is marked active on first load, without needing a click", async ({ page }) => {
    await page.goto("/");

    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("fox");
    await expect(page.locator("#dev-skin-panel button", { hasText: "Fox" })).toHaveClass(/active/);
    await expect(page.locator("#dev-skin-panel button", { hasText: "Robot" })).not.toHaveClass(/active/);
  });

  test("clicking a skin marks it active and un-marks the previous one", async ({ page }) => {
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("fox");

    const robotButton = page.locator("#dev-skin-panel button", { hasText: "Robot" });
    await robotButton.click();

    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");
    await expect(robotButton).toHaveClass(/active/);
    await expect(page.locator("#dev-skin-panel button", { hasText: "Fox" })).not.toHaveClass(/active/);
  });

  test("Sandstone is marked active on first load, and clicking Gold moves it there", async ({ page }) => {
    await page.goto("/");

    const sandstoneButton = page.locator("#dev-skin-panel button", { hasText: "Sandstone" });
    await expect(sandstoneButton).toHaveClass(/active/);

    const goldButton = page.locator("#dev-skin-panel button", { hasText: "Gold" });
    await goldButton.click();

    await expect(goldButton).toHaveClass(/active/);
    await expect(sandstoneButton).not.toHaveClass(/active/);
  });
});

// Sea's own visual, distinct from land/air: AvatarView.setVerticalPitch
// leans the model into its actual vertical velocity (dive nose-down,
// surface nose-up) instead of staying perfectly level like land/air's
// yaw-only faceDirection. Exercised through the Sea realm since that's
// the only realm with meaningful vertical velocity, same as the
// AvatarView-in-Air tests above are exercised through the Air realm.
test.describe("sea avatar vertical pitch", () => {
  test("diving and surfacing tilt the avatar in opposite directions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sea" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("sea");

    await page.keyboard.down("ControlLeft");
    await page.waitForTimeout(500);
    await page.keyboard.up("ControlLeft");
    const divePitch = await page.evaluate(() => window.__getSeaAvatarPitch?.());
    if (divePitch === undefined) throw new Error("__getSeaAvatarPitch not available");
    expect(divePitch).not.toBeCloseTo(0, 2);

    await page.keyboard.down("Space");
    await page.waitForTimeout(1000); // cross back through level and settle pitched the other way
    await page.keyboard.up("Space");
    const surfacePitch = await page.evaluate(() => window.__getSeaAvatarPitch?.());

    // Opposite sign, not just "different" — diving and surfacing are
    // opposite vertical directions and should read as opposite tilts.
    expect(Math.sign(surfacePitch!)).not.toBe(Math.sign(divePitch));
  });

  test("pitch settles back toward level once vertical input is released and buoyancy takes over", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sea" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("sea");

    await page.keyboard.down("ControlLeft");
    await page.waitForTimeout(500);
    await page.keyboard.up("ControlLeft");
    const divePitch = await page.evaluate(() => window.__getSeaAvatarPitch?.());
    if (divePitch === undefined) throw new Error("__getSeaAvatarPitch not available");
    // Diving noses the model down — positive rotation.x for this model's
    // axis convention (verified against a real side-on render, see
    // setVerticalPitch's own comment in src/skins/avatarView.ts).
    expect(divePitch).toBeGreaterThan(0);

    // No input held now — buoyancy alone drifts velocity positive again
    // (surfacing direction), which should ease the pitch back down toward
    // — and past — level rather than leaving it pinned at the diving angle.
    await page.waitForTimeout(1500);
    const settledPitch = await page.evaluate(() => window.__getSeaAvatarPitch?.());
    expect(settledPitch!).toBeLessThan(divePitch);
  });
});

// The long-open "sea-specific swim-stroke animation" backlog item, now that
// a skin with real swim clips exists ("mannequin", see ATTRIBUTIONS.md):
// withSwimAnimationState (src/sea/seaAnimation.ts) should route sea to the
// dedicated swimIdle/swimActive states only for a skin that actually has
// them, leaving every other skin's shared walk/run behavior untouched.
test.describe("sea avatar swim animation", () => {
  test("switching to Mannequin (the swim-capable skin) requests the dedicated swim clips while swimming in sea, not the shared walk/run clips", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sea" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("sea");

    await page.locator("#dev-skin-panel button", { hasText: "Mannequin" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()))
      .toBe("mannequin");

    // No input yet — floating idle should already be the swim-specific
    // idle clip, not the shared land "idle".
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarMoveState?.()))
      .toBe("swimIdle");

    await page.keyboard.down("KeyW");
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarMoveState?.()))
      .toBe("swimActive");
    await page.keyboard.up("KeyW");
  });

  test("switching to Female (also swim-capable, via the merged Mesh2Motion animation library) requests the dedicated swim clips too", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sea" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("sea");

    await page.locator("#dev-skin-panel button", { hasText: "Female" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()))
      .toBe("female");

    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarMoveState?.()))
      .toBe("swimIdle");

    await page.keyboard.down("KeyW");
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarMoveState?.()))
      .toBe("swimActive");
    await page.keyboard.up("KeyW");
  });

  test("Fox (no swim clips) keeps using the shared walk state while swimming in sea, unaffected by Mannequin's swim clips existing", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sea" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getActiveRealm?.()))
      .toBe("sea");
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()))
      .toBe("fox"); // Fox is still the default on first load

    await page.keyboard.down("KeyW");
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarMoveState?.()))
      .toBe("walk");
    await page.keyboard.up("KeyW");
  });
});

// Land<->sea diving-house portal's "costume change" (DECISIONS.md,
// 2026-09-07, BACKLOG.md's dive-suit item): the actual realm-switch
// mechanism is World's (e2e/land-sea-portal.spec.ts), this covers the
// Skins-owned half — the automatic dive-suit swap on the way in and the
// revert on the way out — same split as the AvatarView-in-Air/pitch-in-Sea
// tests above (Skins behavior, exercised through a realm transition).
test.describe("land<->sea diving-house portal: dive-suit costume change", () => {
  // Real timing gotcha found while writing this (not guessed): the diving
  // house sits at x: -10 (straight -x from land spawn), so reaching it
  // means holding KeyA — and Node-side `expect.poll` detecting the realm
  // flip to "sea" costs a few extra real frames of round-trip time, during
  // which KeyA is technically still held and sea's own horizontal movement
  // (it reuses land's MoveInput) drifts the avatar sideways in x before the
  // test can call keyboard.up. `page.waitForFunction` polls its predicate
  // inside the page on every animation frame instead of round-tripping
  // through Node each time, cutting that lag enough that the arrival stays
  // close to SEA_ARRIVAL_POSITION's true x: 0 — verified directly (logged
  // the live x while debugging) that swapping expect.poll for this here is
  // what fixed an otherwise-consistent failure to reach the sea-side arch.
  async function waitForRealm(page: Page, realm: "land" | "air" | "sea"): Promise<void> {
    await page.waitForFunction((r) => window.__getActiveRealm?.() === r, realm, { timeout: 8000 });
  }

  test("walking into the diving house auto-equips the dive suit; swimming back out through the sea-side arch reverts to the skin worn before", async ({
    page,
  }) => {
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("fox"); // Fox is still the default on first load

    // The diving house sits at (-10, ~ground, 0) — straight -x from spawn
    // (src/world/landSeaPortal.ts).
    await page.keyboard.down("KeyA");
    await page.keyboard.down("ShiftLeft");
    await waitForRealm(page, "sea");
    await page.keyboard.up("KeyA");
    await page.keyboard.up("ShiftLeft");

    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()), { timeout: 5000 })
      .toBe("diveSuit");

    // Arriving via the portal (SEA_ARRIVAL_POSITION, z: -15,
    // src/world/landSeaPortal.ts) sits only 3 units short of the arch's
    // own trigger position (z: -12) — well within main.ts's 1.5s
    // anti-bounce-back portal cooldown from the land->sea trigger just
    // above, so swimming there immediately can race straight through the
    // arch's trigger radius before the (global, not per-portal) cooldown
    // clears, overshooting into sea's unbounded open water with nothing
    // left to swim back to. Outwait the cooldown first — same real
    // mechanism e2e/land-sea-portal.spec.ts's own "doesn't immediately
    // bounce back" test exercises, just from the other side of it.
    await page.waitForTimeout(1700);

    // Swim back out through the sea-side arch. Short of the arch at z: -12
    // — the *opposite* side from World's own land-sea-portal.spec.ts test,
    // which starts from the dev panel's direct "Sea" spawn (z: 0) and so
    // swims forward (KeyW) to reach it; from -15, reaching -12 means
    // swimming backward (KeyS). Sea's horizontal speed is sluggish (water
    // resistance), same generous timeout e2e/land-sea-portal.spec.ts uses
    // for this trip.
    await page.keyboard.down("KeyS");
    await page.keyboard.down("ShiftLeft");
    await waitForRealm(page, "land");
    await page.keyboard.up("KeyS");
    await page.keyboard.up("ShiftLeft");

    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("fox");
  });

  test("choosing a skin explicitly while auto-equipped clears the pending revert — returning to land keeps the explicit choice, not the pre-dive skin", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.down("KeyA");
    await page.keyboard.down("ShiftLeft");
    await waitForRealm(page, "sea");
    await page.keyboard.up("KeyA");
    await page.keyboard.up("ShiftLeft");
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()), { timeout: 5000 })
      .toBe("diveSuit");

    // A deliberate choice made while the dive suit is auto-equipped should
    // win over main.ts's pending "revert to Fox on return" — see
    // applyAvatarSkin's click-handler comment.
    await page.locator("#dev-skin-panel button", { hasText: "Robot" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__getSeaAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");

    // Outwait main.ts's 1.5s anti-bounce-back portal cooldown before
    // approaching the arch — see the previous test's comment for why,
    // same real mechanism either way.
    await page.waitForTimeout(1700);

    // Swim back toward the arch — see the previous test's comment for why
    // this is KeyS (backward), not KeyW, from the portal's arrival spot.
    await page.keyboard.down("KeyS");
    await page.keyboard.down("ShiftLeft");
    await waitForRealm(page, "land");
    await page.keyboard.up("KeyS");
    await page.keyboard.up("ShiftLeft");

    await expect
      .poll(() => page.evaluate(() => window.__getAvatarSkinId?.()), { timeout: 5000 })
      .toBe("robot");
  });
});
