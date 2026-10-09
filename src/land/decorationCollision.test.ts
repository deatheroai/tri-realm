import { describe, expect, it } from "vitest";
import { decorationObstacles } from "./decorationCollision";
import { LAND_DECORATION_POSITIONS } from "./landDecorations";
import { STEP_HEIGHT } from "./structureCollision";

describe("decorationObstacles", () => {
  it("makes trees and the fountain solid, but not flat dressing", () => {
    const solidCount = LAND_DECORATION_POSITIONS.filter((d) => d.kind === "tree" || d.kind === "fountain").length;
    expect(decorationObstacles()).toHaveLength(solidCount);
  });

  it("centers each box on its decoration, with its top above local terrain", () => {
    const [o] = decorationObstacles([{ x: 4, z: -6, kind: "tree" }], () => 2);
    expect((o.minX + o.maxX) / 2).toBeCloseTo(4);
    expect((o.minZ + o.maxZ) / 2).toBeCloseTo(-6);
    expect(o.topY).toBeGreaterThan(2);
  });

  it("keeps the fountain taller than a step so it blocks rather than being stepped onto", () => {
    const [o] = decorationObstacles([{ x: 0, z: 5, kind: "fountain" }], () => 0);
    expect(o.topY).toBeGreaterThan(STEP_HEIGHT);
  });

  it("leaves the spawn point and the path to the fountain clear", () => {
    for (const o of decorationObstacles()) {
      // spawn at origin; stepping stones at z = 1..4 along x = 0
      expect(0 > o.minX - 0.3 && 0 < o.maxX + 0.3 && 0 > o.minZ - 0.3 && 0 < o.maxZ + 0.3).toBe(false);
    }
  });
});
