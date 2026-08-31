import { describe, expect, it } from "vitest";
import { terrainHeightAt } from "../land/terrain";
import { addStructure, sampleTerrainHeight, type RealmMap } from "./realmMap";

function emptyLandMap(): RealmMap {
  return {
    id: "land-01",
    realm: "land",
    bounds: { width: 50, depth: 50 },
    terrain: { kind: "land-heightfield" },
    structures: [],
    entities: [],
    portals: [],
  };
}

describe("sampleTerrainHeight", () => {
  it("delegates a land-heightfield terrain to the land heightfield formula", () => {
    const terrain = { kind: "land-heightfield" as const };

    expect(sampleTerrainHeight(terrain, 3, -7)).toBe(terrainHeightAt(3, -7));
    expect(sampleTerrainHeight(terrain, 12, 4)).toBe(terrainHeightAt(12, 4));
  });
});

describe("addStructure", () => {
  it("returns a new map with the structure appended, not mutating the input", () => {
    const map = emptyLandMap();

    const { map: nextMap, structure } = addStructure(map, {
      type: "castle-piece-placeholder",
      position: { x: 1, y: 2, z: 3 },
      rotation: 0,
      materialId: "stone",
    });

    expect(map.structures).toHaveLength(0); // original untouched
    expect(nextMap.structures).toHaveLength(1);
    expect(nextMap.structures[0]).toBe(structure);
  });

  it("fills in id and realmMapId, keeping the caller-supplied fields", () => {
    const map = emptyLandMap();

    const { structure } = addStructure(map, {
      type: "castle-piece-placeholder",
      position: { x: 1, y: 2, z: 3 },
      rotation: 0.5,
      materialId: "stone",
    });

    expect(structure.id).toBeTruthy();
    expect(structure.realmMapId).toBe(map.id);
    expect(structure.type).toBe("castle-piece-placeholder");
    expect(structure.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(structure.rotation).toBe(0.5);
    expect(structure.materialId).toBe("stone");
  });

  it("generates distinct ids for successive structures on the same map", () => {
    const map = emptyLandMap();

    const first = addStructure(map, { type: "a", position: { x: 0, y: 0, z: 0 }, rotation: 0, materialId: "stone" });
    const second = addStructure(first.map, { type: "b", position: { x: 1, y: 0, z: 1 }, rotation: 0, materialId: "wood" });

    expect(second.structure.id).not.toBe(first.structure.id);
    expect(second.map.structures.map((s) => s.id)).toEqual([first.structure.id, second.structure.id]);
  });
});
