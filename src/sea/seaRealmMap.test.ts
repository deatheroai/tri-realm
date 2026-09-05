import { describe, expect, it } from "vitest";
import {
  createSeaRealmMap,
  SEA_MAP_SIZE,
  SEA_FLOOR_Y,
  SEA_SURFACE_Y,
  SEA_WRECKAGE_POSITIONS,
} from "./seaRealmMap";

describe("createSeaRealmMap", () => {
  it("returns a sea RealmMap with the expected shape", () => {
    const map = createSeaRealmMap();

    expect(map.realm).toBe("sea");
    expect(map.id).toBeTruthy();
    expect(map.terrain).toEqual({
      kind: "sea-floor",
      floorY: SEA_FLOOR_Y,
      surfaceY: SEA_SURFACE_Y,
      wreckage: SEA_WRECKAGE_POSITIONS,
    });
    expect(map.bounds).toEqual({ width: SEA_MAP_SIZE, depth: SEA_MAP_SIZE });
    expect(map.structures).toEqual([]);
    expect(map.entities).toEqual([]);
  });

  it("has a floor strictly below the surface", () => {
    expect(SEA_FLOOR_Y).toBeLessThan(SEA_SURFACE_Y);
  });

  it("has real, non-empty wreckage data, all within the swimmable band", () => {
    expect(SEA_WRECKAGE_POSITIONS.length).toBeGreaterThan(0);
    for (const position of SEA_WRECKAGE_POSITIONS) {
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
      expect(Number.isFinite(position.z)).toBe(true);
      expect(position.y).toBeGreaterThanOrEqual(SEA_FLOOR_Y);
      expect(position.y).toBeLessThanOrEqual(SEA_SURFACE_Y);
    }
  });

  it("has no portal yet — land<->sea flavor is still a pending decision", () => {
    const map = createSeaRealmMap();

    expect(map.portals).toEqual([]);
  });

  it("returns a fresh, independent map each call", () => {
    const a = createSeaRealmMap();
    const b = createSeaRealmMap();

    expect(a).not.toBe(b);
    expect(a.structures).not.toBe(b.structures);
  });
});
