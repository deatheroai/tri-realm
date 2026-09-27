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
    const result = validatePlacement(emptyMap(), "cube", { x: 0, y: 0, z: 0 }, 0, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("rejects a placement outside the map's bounds", () => {
    const map = emptyMap(); // bounds: 10x10, so half-extent is 5

    expect(validatePlacement(map, "cube", { x: 6, y: 0, z: 0 }, 0, footprintOf, alwaysWalkable)).toEqual({
      valid: false,
      reason: "out-of-bounds",
    });
    expect(validatePlacement(map, "cube", { x: 0, y: 0, z: -6 }, 0, footprintOf, alwaysWalkable)).toEqual({
      valid: false,
      reason: "out-of-bounds",
    });
  });

  it("rejects a placement that genuinely overlaps an existing structure", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: 0, y: 0, z: 0 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }] };

    const result = validatePlacement(map, "cube", { x: 0.2, y: 0, z: 0.2 }, 0, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: false, reason: "overlaps-structure" });
  });

  it("allows stacking directly on top of an existing structure (touching, not overlapping)", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: 0, y: 0.5, z: 0 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }] };

    // Same x/z footprint, but sitting exactly on top: centers 1 unit apart
    // for two 1-unit-tall cubes — flush, not overlapping.
    const result = validatePlacement(map, "cube", { x: 0, y: 1.5, z: 0 }, 0, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("does not reject a placement far away from any existing structure", () => {
    const map: RealmMap = { ...emptyMap(), structures: [{ id: "s1", type: "cube", position: { x: -4, y: 0, z: -4 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }] };

    const result = validatePlacement(map, "cube", { x: 4, y: 0, z: 4 }, 0, footprintOf, alwaysWalkable);

    expect(result).toEqual({ valid: true });
  });

  it("rejects a placement the realm's own terrain rule refuses", () => {
    const result = validatePlacement(emptyMap(), "cube", { x: 0, y: 0, z: 0 }, 0, footprintOf, neverWalkable);

    expect(result).toEqual({ valid: false, reason: "terrain-not-suitable" });
  });

  describe("rotation", () => {
    // A non-square footprint (twice as wide as it is deep) so a quarter
    // turn actually changes which world axis each dimension runs along.
    const PLANK: StructureFootprint = { width: 2, height: 1, depth: 1 };
    const plankFootprintOf: FootprintLookup = () => PLANK;

    it("an unrotated candidate overlaps a neighbor along its wide (width) axis", () => {
      const map: RealmMap = {
        ...emptyMap(),
        structures: [{ id: "s1", type: "plank", position: { x: 1.5, y: 0, z: 0 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }],
      };
      // Centers 1.5 apart on X; unrotated width-2 footprints need >= 2 apart.
      const result = validatePlacement(map, "plank", { x: 0, y: 0, z: 0 }, 0, plankFootprintOf, alwaysWalkable);
      expect(result).toEqual({ valid: false, reason: "overlaps-structure" });
    });

    it("rotating the candidate a quarter turn clears that same overlap (width/depth swap)", () => {
      const map: RealmMap = {
        ...emptyMap(),
        structures: [{ id: "s1", type: "plank", position: { x: 1.5, y: 0, z: 0 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }],
      };
      // Same positions as above, but the candidate is rotated 90°: its
      // effective width along X becomes the authored depth (1) instead of
      // the authored width (2), shrinking the required X separation from
      // (2 + 2) / 2 = 2 down to (1 + 2) / 2 = 1.5 — exactly the 1.5 these
      // two centers are apart, so the overlap clears.
      const result = validatePlacement(map, "plank", { x: 0, y: 0, z: 0 }, Math.PI / 2, plankFootprintOf, alwaysWalkable);
      expect(result).toEqual({ valid: true });
    });

    it("rotating a full turn (2π) behaves identically to no rotation", () => {
      const map: RealmMap = {
        ...emptyMap(),
        structures: [{ id: "s1", type: "plank", position: { x: 1.5, y: 0, z: 0 }, rotation: 0, realmMapId: "land-01", materialId: "stone" }],
      };
      const result = validatePlacement(map, "plank", { x: 0, y: 0, z: 0 }, Math.PI * 2, plankFootprintOf, alwaysWalkable);
      expect(result).toEqual({ valid: false, reason: "overlaps-structure" });
    });

    it("also honors an existing structure's own rotation, not just the candidate's", () => {
      // Same geometry as the "clears that same overlap" case above, but the
      // rotation is on the already-placed neighbor instead of the candidate
      // — the effective-footprint swap must apply per-structure, not just
      // to whichever one happens to be the new placement.
      const map: RealmMap = {
        ...emptyMap(),
        structures: [{ id: "s1", type: "plank", position: { x: 1.5, y: 0, z: 0 }, rotation: Math.PI / 2, realmMapId: "land-01", materialId: "stone" }],
      };
      const result = validatePlacement(map, "plank", { x: 0, y: 0, z: 0 }, 0, plankFootprintOf, alwaysWalkable);
      expect(result).toEqual({ valid: true });
    });
  });
});
