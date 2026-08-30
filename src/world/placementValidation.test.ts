import { describe, expect, it } from "vitest";
import { validatePlacement, type FootprintLookup, type StructureFootprint } from "./placementValidation";
import type { RealmMap } from "./realmMap";

const CUBE: StructureFootprint = { width: 1, height: 1, depth: 1 };
const footprintOf: FootprintLookup = () => CUBE;
const alwaysWalkable = () => true;
const neverWalkable = () => false;

function emptyMap(): RealmMap {
  return {
    id: "land-01",
    realm: "land",
    bounds: { width: 10, depth: 10 },
    terrain: { kind: "land-heightfield" },
    structures: [],
    entities: [],
    portals: [],
  };
}

describe("validatePlacement", () => {
  it("accepts a placement inside bounds, clear of other structures, on suitable terrain", () => {
    const result = validatePlacement(emptyMap(), "cube", { x: 0, y: 0, z: 0 }, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("rejects a placement outside the map's bounds", () => {
    const map = emptyMap(); // bounds: 10x10, so half-extent is 5

    expect(validatePlacement(map, "cube", { x: 6, y: 0, z: 0 }, footprintOf, alwaysWalkable)).toEqual({
      valid: false,
      reason: "out-of-bounds",
    });
    expect(validatePlacement(map, "cube", { x: 0, y: 0, z: -6 }, footprintOf, alwaysWalkable)).toEqual({
      valid: false,
      reason: "out-of-bounds",
    });
  });

  it("rejects a placement that genuinely overlaps an existing structure", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: 0, y: 0, z: 0 }, rotation: 0, realmMapId: "land-01" }] };

    const result = validatePlacement(map, "cube", { x: 0.2, y: 0, z: 0.2 }, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: false, reason: "overlaps-structure" });
  });

  it("allows stacking directly on top of an existing structure (touching, not overlapping)", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: 0, y: 0.5, z: 0 }, rotation: 0, realmMapId: "land-01" }] };

    // Same x/z footprint, but sitting exactly on top: centers 1 unit apart
    // for two 1-unit-tall cubes — flush, not overlapping.
    const result = validatePlacement(map, "cube", { x: 0, y: 1.5, z: 0 }, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("does not reject a placement far away from any existing structure", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: -4, y: 0, z: -4 }, rotation: 0, realmMapId: "land-01" }] };

    const result = validatePlacement(map, "cube", { x: 4, y: 0, z: 4 }, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("rejects a placement the realm's own terrain rule refuses", () => {
    const result = validatePlacement(emptyMap(), "cube", { x: 0, y: 0, z: 0 }, footprintOf, neverWalkable);

    expect(result).toEqual({ valid: false, reason: "terrain-not-suitable" });
  });
});
