import { describe, expect, it } from "vitest";
import {
  createAirRealmMap,
  AIR_MAP_SIZE,
  AIR_FLOATING_PLATFORM_POSITIONS,
  airTerrainPlacementRule,
} from "./airRealmMap";
import { AIR_LAND_PORTAL_ID } from "../world/landAirPortal";

describe("createAirRealmMap", () => {
  it("returns an air RealmMap with the expected shape", () => {
    const map = createAirRealmMap();

    expect(map.realm).toBe("air");
    expect(map.id).toBeTruthy();
    expect(map.terrain).toEqual({ kind: "air-open-volume", platforms: AIR_FLOATING_PLATFORM_POSITIONS });
    expect(map.bounds).toEqual({ width: AIR_MAP_SIZE, depth: AIR_MAP_SIZE });
    expect(map.structures).toEqual([]);
    expect(map.entities).toEqual([]);
  });

  it("has real, non-empty floating-platform data", () => {
    expect(AIR_FLOATING_PLATFORM_POSITIONS.length).toBeGreaterThan(0);
    for (const position of AIR_FLOATING_PLATFORM_POSITIONS) {
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
      expect(Number.isFinite(position.z)).toBe(true);
    }
  });

  it("includes the air-land portal", () => {
    const map = createAirRealmMap();

    expect(map.portals).toHaveLength(1);
    expect(map.portals[0]?.id).toBe(AIR_LAND_PORTAL_ID);
    expect(map.portals[0]?.targetRealmMapId).toBe("land-01");
  });

  it("returns a fresh, independent map each call", () => {
    const a = createAirRealmMap();
    const b = createAirRealmMap();

    expect(a).not.toBe(b);
    expect(a.structures).not.toBe(b.structures);
  });
});

describe("airTerrainPlacementRule", () => {
  it("accepts any position, same as land's — open volume has no bound to reject against", () => {
    const map = createAirRealmMap();

    expect(airTerrainPlacementRule(map, { x: 0, y: 0, z: 0 })).toBe(true);
    expect(airTerrainPlacementRule(map, { x: 20, y: 50, z: -20 })).toBe(true);
    expect(airTerrainPlacementRule(map, { x: 0, y: -50, z: 0 })).toBe(true);
  });
});
