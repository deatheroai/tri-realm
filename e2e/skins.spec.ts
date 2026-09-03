import { test, expect, type Page } from "@playwright/test";
import { AVATAR_SKINS } from "../src/skins/avatarSkins";

/**
 * Regression guard for the class of bug fixed in the "dev-panel overlap"
 * commit: two `position: fixed` overlays (added independently by the World
 * and Skins tracks, in the same or different cycles) can merge cleanly as
 * text yet still collide visually. Generic on purpose — every child of
 * `#dev-panels` is checked, not specific panel ids, so a *future* panel
 * added to that shared column is covered automatically without editing
 * this test. See AUTONOMY.md's "UI layout convention" for the rule this
 * enforces (new panels join `#dev-panels`, they don't claim their own
 * fixed corner).
 */
async function boundingBoxesOverlap(page: Page): Promise<Array<{ a: string; b: string }>> {
  const selectors = ["#hud-controls", "#hud-position", "#hud-structures", "#dev-panels > *", "#credits"];
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
    const panelCount = await page.locator("#dev-panels > *").count();
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

test("the dev skin panel lists both avatar skins and block materials", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#dev-skin-panel button", { hasText: "Capsule" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Fox" })).toBeVisible();
  await expect(page.locator("#dev-skin-panel button", { hasText: "Robot" })).toBeVisible();
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

// Compares texture *identity* (map.uuid), not .color: once a material's
// real photographed texture loads (realBlockTextures.ts), .color resets to
// white for every material except Gold, so .color alone can't reliably
// distinguish materials once real textures have taken over — but the map
// is always distinct per material, generated-pattern fallback or real
// photo alike, and this assertion holds the instant a piece is placed
// (no need to wait out the async real-texture load first).
test("switching block material changes the visual of newly-placed pieces", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundY = viewport.height * 0.75;
  // Widely separated screen X positions, not a small pixel delta — see
  // e2e/castle-placement.spec.ts's "defaults to the Keep structure type"
  // test for why a modest offset isn't reliably enough (a click this near
  // the camera covers less world distance per pixel than it looks, so a
  // too-close second click can overlap the first and get silently
  // rejected by validatePlacement, leaving __getLastPlaced* pointing at
  // the same, first piece).
  const leftX = viewport.width * 0.2;
  const rightX = viewport.width * 0.8;

  await page.mouse.click(leftX, groundY);
  const sandstoneMapUuid = await page.evaluate(() => window.__getLastPlacedMapUuid?.());
  expect(sandstoneMapUuid).toBeTruthy();

  await page.locator("#dev-skin-panel button", { hasText: "Slate" }).click();
  await page.mouse.click(rightX, groundY);
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
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const groundY = viewport.height * 0.75;
  // Widely separated, same reasoning as the test above.
  const leftX = viewport.width * 0.2;
  const rightX = viewport.width * 0.8;

  await page.mouse.click(leftX, groundY); // Sandstone is the default material
  await expect
    .poll(() => page.evaluate(() => window.__getLastPlacedColor?.()), { timeout: 5000 })
    .toBe(0xffffff);

  await page.locator("#dev-skin-panel button", { hasText: "Gold" }).click();
  await page.mouse.click(rightX, groundY);
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

    // A real, working link — not just text mentioning the license.
    const licenseLink = panel.getByRole("link", { name: "CC BY 4.0" });
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
