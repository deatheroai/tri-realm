import { describe, expect, it } from "vitest";
import { createLandRealmMap, landTerrainPlacementRule, LAND_MAP_SIZE } from "./landRealmMap";

describe("createLandRealmMap", () => {
  it("returns a land RealmMap with the expected shape", () => {
    const map = createLandRealmMap();

    expect(map.realm).toBe("land");
    expect(map.id).toBeTruthy();
    expect(map.terrain).toEqual({ kind: "land-heightfield" });
    expect(map.bounds).toEqual({ width: LAND_MAP_SIZE, depth: LAND_MAP_SIZE });
    expect(map.structures).toEqual([]);
    expect(map.entities).toEqual([]);
    expect(map.portals).toEqual([]);
  });

  it("returns a fresh, independent map each call", () => {
    const a = createLandRealmMap();
    const b = createLandRealmMap();

    expect(a).not.toBe(b);
    expect(a.structures).not.toBe(b.structures);
  });
});

describe("landTerrainPlacementRule", () => {
  it("accepts any position on today's uniformly-walkable rolling-hill terrain", () => {
    const map = createLandRealmMap();

    expect(landTerrainPlacementRule(map, { x: 0, y: 0, z: 0 })).toBe(true);
    expect(landTerrainPlacementRule(map, { x: 20, y: -3, z: -20 })).toBe(true);
  });
});
