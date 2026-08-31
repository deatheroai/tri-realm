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
  const selectors = ["#hud-controls", "#hud-position", "#hud-structures", "#dev-panels > *"];
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
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY);
  const sandstoneMapUuid = await page.evaluate(() => window.__getLastPlacedMapUuid?.());
  expect(sandstoneMapUuid).toBeTruthy();

  await page.locator("#dev-skin-panel button", { hasText: "Slate" }).click();
  await page.mouse.click(groundX + 100, groundY);
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
  const groundX = viewport.width / 2;
  const groundY = viewport.height * 0.75;

  await page.mouse.click(groundX, groundY); // Sandstone is the default material
  await expect
    .poll(() => page.evaluate(() => window.__getLastPlacedColor?.()), { timeout: 5000 })
    .toBe(0xffffff);

  await page.locator("#dev-skin-panel button", { hasText: "Gold" }).click();
  await page.mouse.click(groundX + 100, groundY);
  await expect
    .poll(() => page.evaluate(() => window.__getLastPlacedColor?.()), { timeout: 5000 })
    .toBe(0xd4af37);

  expect(errors).toEqual([]);
});
