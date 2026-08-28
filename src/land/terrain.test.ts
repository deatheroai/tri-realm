import { describe, expect, it } from "vitest";
import { terrainHeightAt } from "./terrain";

describe("terrainHeightAt", () => {
  it("is deterministic for the same input", () => {
    expect(terrainHeightAt(3, -7)).toBe(terrainHeightAt(3, -7));
  });

  it("varies across the map instead of being flat", () => {
    const heights = [
      terrainHeightAt(0, 0),
      terrainHeightAt(10, 0),
      terrainHeightAt(0, 10),
      terrainHeightAt(-10, -10),
      terrainHeightAt(15, -8),
    ];
    const distinctHeights = new Set(heights.map((h) => h.toFixed(3)));

    expect(distinctHeights.size).toBeGreaterThan(1);
  });

  it("stays within a walkable range across the map (no cliffs/spikes)", () => {
    for (let x = -25; x <= 25; x += 5) {
      for (let z = -25; z <= 25; z += 5) {
        const height = terrainHeightAt(x, z);
        expect(height).toBeGreaterThan(-5);
        expect(height).toBeLessThan(5);
      }
    }
  });
});
