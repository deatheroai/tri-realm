import { test, expect, type Page } from "@playwright/test";

// Playwright's page.touchscreen only supports tap(), not a held drag, so we
// dispatch synthetic Touch/TouchEvent objects directly — the same events a
// real finger drag produces, which is what TouchJoystick actually listens for.
async function dragJoystick(page: Page, dx: number, dy: number): Promise<void> {
  await page.evaluate(
    ({ dx, dy }) => {
      const zone = document.getElementById("touch-zone");
      if (!zone) throw new Error("touch zone not found");
      const rect = zone.getBoundingClientRect();
      const startX = rect.x + rect.width / 2;
      const startY = rect.y + rect.height / 2;
      const id = 1;

      const start = new Touch({ identifier: id, target: zone, clientX: startX, clientY: startY });
      zone.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [start],
          changedTouches: [start],
          targetTouches: [start],
          bubbles: true,
          cancelable: true,
        }),
      );

      const move = new Touch({
        identifier: id,
        target: zone,
        clientX: startX + dx,
        clientY: startY + dy,
      });
      zone.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [move],
          changedTouches: [move],
          targetTouches: [move],
          bubbles: true,
          cancelable: true,
        }),
      );

      window.__lastTouch = move;
    },
    { dx, dy },
  );
}

async function releaseJoystick(page: Page): Promise<void> {
  await page.evaluate(() => {
    const zone = document.getElementById("touch-zone");
    const last = window.__lastTouch;
    if (!zone || !last) return;
    zone.dispatchEvent(
      new TouchEvent("touchend", {
        touches: [],
        changedTouches: [last],
        targetTouches: [],
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

// A genuine tap: touchstart then touchend at (essentially) the same point,
// no touchmove at all — this is what TouchJoystick treats as "place", not
// "move" (see TAP_MAX_DRAG_PX in touchJoystick.ts).
async function tapInsideZone(page: Page): Promise<void> {
  await page.evaluate(() => {
    const zone = document.getElementById("touch-zone");
    if (!zone) throw new Error("touch zone not found");
    const rect = zone.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const id = 2;

    const touch = new Touch({ identifier: id, target: zone, clientX: x, clientY: y });
    zone.dispatchEvent(
      new TouchEvent("touchstart", {
        touches: [touch],
        changedTouches: [touch],
        targetTouches: [touch],
        bubbles: true,
        cancelable: true,
      }),
    );
    zone.dispatchEvent(
      new TouchEvent("touchend", {
        touches: [],
        changedTouches: [touch],
        targetTouches: [],
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

// Ascend/descend touch buttons (#vertical-controls) have no drag geometry —
// just held/not-held, like a key held down — so a plain touchstart/touchend
// pair at the button's own center is enough, unlike the joystick's drag.
async function pressVerticalButton(page: Page, elementId: string): Promise<void> {
  await page.evaluate((elementId) => {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`${elementId} not found`);
    const rect = el.getBoundingClientRect();
    const touch = new Touch({
      identifier: 3,
      target: el,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    });
    el.dispatchEvent(
      new TouchEvent("touchstart", {
        touches: [touch],
        changedTouches: [touch],
        targetTouches: [touch],
        bubbles: true,
        cancelable: true,
      }),
    );
  }, elementId);
}

async function releaseVerticalButton(page: Page, elementId: string): Promise<void> {
  await page.evaluate((elementId) => {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`${elementId} not found`);
    const rect = el.getBoundingClientRect();
    const touch = new Touch({
      identifier: 3,
      target: el,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    });
    el.dispatchEvent(
      new TouchEvent("touchend", {
        touches: [],
        changedTouches: [touch],
        targetTouches: [],
        bubbles: true,
        cancelable: true,
      }),
    );
  }, elementId);
}

// The dev-panels column starts collapsed on a real touch device (see the
// "dev panels stay collapsed..." test below) — switching realm via
// #dev-realm-panel on this project needs the toggle opened first.
async function switchToRealm(page: Page, label: "Air" | "Sea"): Promise<void> {
  await page.locator("#dev-panels-toggle").tap();
  await page.getByRole("button", { name: label, exact: true }).tap();
  await expect
    .poll(async () => page.evaluate(() => window.__getActiveRealm?.()))
    .toBe(label.toLowerCase());
}

test("dragging the touch joystick up moves the avatar forward", async ({ page }) => {
  await page.goto("/");
  const hud = page.locator("#hud-position");
  await expect(hud).toBeVisible();

  await dragJoystick(page, 0, -40);
  await page.waitForTimeout(500);
  await releaseJoystick(page);

  const z = Number(await hud.getAttribute("data-z"));
  expect(z).toBeLessThan(-0.3);
});

test("releasing the joystick stops movement", async ({ page }) => {
  await page.goto("/");
  const hud = page.locator("#hud-position");

  await dragJoystick(page, 0, -40);
  await page.waitForTimeout(300);
  await releaseJoystick(page);
  const zAfterRelease = Number(await hud.getAttribute("data-z"));

  await page.waitForTimeout(300);
  const zLater = Number(await hud.getAttribute("data-z"));

  expect(zLater).toBeCloseTo(zAfterRelease, 1);
});

test("the joystick knob becomes visible while dragging", async ({ page }) => {
  await page.goto("/");
  const base = page.locator("#joystick-base");
  await expect(base).toBeHidden();

  await dragJoystick(page, 10, -10);
  await expect(base).toBeVisible();

  await releaseJoystick(page);
  await expect(base).toBeHidden();
});

test("tapping outside the joystick zone places a castle piece instead of moving", async ({
  page,
}) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const positionHud = page.locator("#hud-position");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  // The touch-zone occupies the bottom-left 55%x60% of the viewport (see
  // index.html), and the camera looks down at the ground, so the right
  // 20% of the screen at mid-height is reliably both outside the zone and
  // aimed at ground, not sky.
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  const tapX = viewport.width * 0.9;
  const tapY = viewport.height * 0.55;

  await page.touchscreen.tap(tapX, tapY);

  await expect(structuresHud).toHaveAttribute("data-count", "1");
  // A plain tap (no drag) shouldn't have moved the avatar at all.
  await expect(positionHud).toHaveAttribute("data-x", "0.000");
  await expect(positionHud).toHaveAttribute("data-z", "0.000");
});

test("a quick tap inside the joystick zone also places a castle piece, not just moves", async ({
  page,
}) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const positionHud = page.locator("#hud-position");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  await tapInsideZone(page);

  await expect(structuresHud).toHaveAttribute("data-count", "1");
  await expect(positionHud).toHaveAttribute("data-x", "0.000");
  await expect(positionHud).toHaveAttribute("data-z", "0.000");
});

test("a real drag inside the joystick zone still moves, without placing", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  const positionHud = page.locator("#hud-position");

  await dragJoystick(page, 0, -40);
  await page.waitForTimeout(400);
  await releaseJoystick(page);

  await expect(structuresHud).toHaveAttribute("data-count", "0");
  const z = Number(await positionHud.getAttribute("data-z"));
  expect(z).toBeLessThan(-0.3);
});

// Reported 2026-09-08: on a real phone, the dev-panels column (six avatar
// skins, four materials, three structures, three realms — grown well past
// what it was when the shared-column fix in skins.spec.ts's overlap test
// was written) had grown tall enough to cover most of the visible game
// view. Fixed with a collapse-by-default toggle scoped to `@media
// (pointer: coarse)` (index.html) — this project (Pixel 5, real
// `hasTouch`) is the one place in the suite that actually renders under
// that media query, so this is the only file that can verify it for real
// rather than by inspecting the stylesheet.
test("dev panels stay collapsed by default on a touch device, expand on tap", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator("#dev-panels-toggle");
  const content = page.locator("#dev-panels-content");

  await expect(toggle).toBeVisible();
  await expect(content).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.tap();
  await expect(content).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await toggle.tap();
  await expect(content).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

// A real phone has no keyboard, so KeyboardInput's Space/Control vertical
// axis (air/sea flight, land's jump) was completely unreachable on touch
// before #vertical-controls existed — these tests are this project's only
// coverage of that, mirroring land-walk.spec.ts's/air-flight.spec.ts's/
// sea-swim.spec.ts's own keyboard-driven equivalents.
test("tapping the ascend button jumps the avatar on land", async ({ page }) => {
  await page.goto("/");

  const base = (await page.evaluate(() => window.__getLandAltitude?.())) as number;

  await pressVerticalButton(page, "vertical-up");
  await releaseVerticalButton(page, "vertical-up");

  await expect
    .poll(() => page.evaluate(() => window.__getLandAltitude?.()))
    .toBeGreaterThan(base + 0.3);

  await expect
    .poll(() => page.evaluate(() => window.__getLandAltitude?.()), { timeout: 3000 })
    .toBeCloseTo(base, 1);
});

test("holding the ascend button ascends, and the descend button descends, in the air realm", async ({
  page,
}) => {
  await page.goto("/");
  await switchToRealm(page, "Air");

  const startY = await page.evaluate(() => window.__getAirAltitude?.());
  if (startY === undefined) throw new Error("__getAirAltitude not available");

  await pressVerticalButton(page, "vertical-up");
  await page.waitForTimeout(500);
  await releaseVerticalButton(page, "vertical-up");
  const ascendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(ascendedY!).toBeGreaterThan(startY);

  await pressVerticalButton(page, "vertical-down");
  await page.waitForTimeout(800); // long enough to net back below the ascended height
  await releaseVerticalButton(page, "vertical-down");
  const descendedY = await page.evaluate(() => window.__getAirAltitude?.());
  expect(descendedY!).toBeLessThan(ascendedY!);
});

test("holding the descend button dives despite buoyancy, in the sea realm", async ({ page }) => {
  await page.goto("/");
  await switchToRealm(page, "Sea");

  const startDepth = await page.evaluate(() => window.__getSeaDepth?.());
  if (startDepth === undefined) throw new Error("__getSeaDepth not available");

  await pressVerticalButton(page, "vertical-down");
  await page.waitForTimeout(500);
  await releaseVerticalButton(page, "vertical-down");
  const divedDepth = await page.evaluate(() => window.__getSeaDepth?.());

  expect(divedDepth!).toBeLessThan(startDepth);
});

// The undo button (#undo-button, third button in #vertical-controls) is
// KeyX's touch equivalent — castle-placement.spec.ts's "pressing X undoes
// the most recently placed piece" is this project's keyboard coverage,
// this is the touch-only equivalent, same relationship the jump/vertical
// tests above already have with land-walk.spec.ts/air-flight.spec.ts/
// sea-swim.spec.ts's own keyboard tests.
test("tapping the undo button removes the most recently placed piece", async ({ page }) => {
  await page.goto("/");
  const structuresHud = page.locator("#hud-structures");
  await expect(structuresHud).toHaveAttribute("data-count", "0");

  // Same reliably-outside-the-joystick-zone tap spot as the "tapping
  // outside the joystick zone places a castle piece" test above.
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport size");
  await page.touchscreen.tap(viewport.width * 0.9, viewport.height * 0.55);
  await expect(structuresHud).toHaveAttribute("data-count", "1");

  await pressVerticalButton(page, "undo-button");
  await releaseVerticalButton(page, "undo-button");

  await expect(structuresHud).toHaveAttribute("data-count", "0");
});
