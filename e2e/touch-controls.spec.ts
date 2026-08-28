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
