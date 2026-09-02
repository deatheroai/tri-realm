import { describe, expect, it } from "vitest";
import { findNearbyPortal } from "./portalTransition";
import type { RealmMap } from "./realmMap";

function mapWithPortal(portalPosition: { x: number; y: number; z: number }): RealmMap {
  return {
    id: "land-01",
    realm: "land",
    bounds: { width: 50, depth: 50 },
    terrain: { kind: "land-heightfield" },
    structures: [],
    entities: [],
    portals: [
      {
        id: "land-air-portal",
        position: portalPosition,
        targetRealmMapId: "air-01",
        targetSpawnPosition: { x: 0, y: 5, z: 0 },
        kind: "hot-air-balloon",
      },
    ],
  };
}

describe("findNearbyPortal", () => {
  it("returns the portal when within the trigger radius", () => {
    const map = mapWithPortal({ x: 10, y: 0, z: 2 });

    const found = findNearbyPortal(map, { x: 10.5, y: 0, z: 2.5 }, 2);

    expect(found?.id).toBe("land-air-portal");
  });

  it("returns undefined when outside the trigger radius", () => {
    const map = mapWithPortal({ x: 10, y: 0, z: 2 });

    const found = findNearbyPortal(map, { x: 20, y: 0, z: 20 }, 2);

    expect(found).toBeUndefined();
  });

  it("returns undefined for a map with no portals", () => {
    const empty: RealmMap = { ...mapWithPortal({ x: 0, y: 0, z: 0 }), portals: [] };

    expect(findNearbyPortal(empty, { x: 0, y: 0, z: 0 }, 100)).toBeUndefined();
  });

  it("considers all three axes, not just the horizontal plane", () => {
    const map = mapWithPortal({ x: 0, y: 0, z: 0 });

    // Horizontally right on top of it, but far away vertically.
    expect(findNearbyPortal(map, { x: 0, y: 50, z: 0 }, 2)).toBeUndefined();
  });

  it("triggers exactly at the boundary (inclusive)", () => {
    const map = mapWithPortal({ x: 0, y: 0, z: 0 });

    expect(findNearbyPortal(map, { x: 2, y: 0, z: 0 }, 2)?.id).toBe("land-air-portal");
  });
});
