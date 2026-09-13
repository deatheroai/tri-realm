import { describe, expect, it } from "vitest";
import { SEA_STRUCTURE_TYPES, DEFAULT_SEA_STRUCTURE_TYPE_ID, findSeaStructureType } from "./seaStructures";

describe("SEA_STRUCTURE_TYPES", () => {
  it("has a starter set of distinct, non-empty types", () => {
    expect(SEA_STRUCTURE_TYPES.length).toBeGreaterThanOrEqual(1);
    const ids = SEA_STRUCTURE_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every type positive dimensions", () => {
    for (const type of SEA_STRUCTURE_TYPES) {
      expect(type.dimensions.width).toBeGreaterThan(0);
      expect(type.dimensions.height).toBeGreaterThan(0);
      expect(type.dimensions.depth).toBeGreaterThan(0);
    }
  });

  it("defaults to a type that's actually in the catalog", () => {
    expect(() => findSeaStructureType(DEFAULT_SEA_STRUCTURE_TYPE_ID)).not.toThrow();
  });
});

describe("findSeaStructureType", () => {
  it("returns the matching catalog entry", () => {
    const found = findSeaStructureType("reef-pillar");

    expect(found.id).toBe("reef-pillar");
    expect(found.label).toBeTruthy();
  });

  it("throws for an unknown id rather than returning undefined", () => {
    expect(() => findSeaStructureType("does-not-exist")).toThrow();
  });
});
