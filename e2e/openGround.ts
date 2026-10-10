import type { Page } from "@playwright/test";

/**
 * Screen position of an open patch of land ground near spawn, clear of the
 * scenery (trees, fountain) that placement now refuses to build inside.
 * Replaces the old fixed "75% down the viewport" click, which lands on the
 * fountain (z=5) from the follow camera's default framing.
 */
export async function openGroundScreenPoint(page: Page): Promise<{ x: number; y: number }> {
  const point = await page.evaluate(() => window.__projectToScreen?.(2, 0, -2));
  if (!point) throw new Error("__projectToScreen not available");
  return point;
}
