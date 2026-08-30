import { describe, expect, it } from "vitest";
import { CASTLE_STRUCTURE_TYPES, DEFAULT_CASTLE_STRUCTURE_TYPE_ID, findCastleStructureType } from "./castleStructures";

describe("CASTLE_STRUCTURE_TYPES", () => {
  it("has a starter set of distinct, non-empty types", () => {
    expect(CASTLE_STRUCTURE_TYPES.length).toBeGreaterThanOrEqual(3);
    const ids = CASTLE_STRUCTURE_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every type positive dimensions", () => {
    for (const type of CASTLE_STRUCTURE_TYPES) {
      expect(type.dimensions.width).toBeGreaterThan(0);
      expect(type.dimensions.height).toBeGreaterThan(0);
      expect(type.dimensions.depth).toBeGreaterThan(0);
    }
  });

  it("defaults to a type that's actually in the catalog", () => {
    expect(() => findCastleStructureType(DEFAULT_CASTLE_STRUCTURE_TYPE_ID)).not.toThrow();
  });
});

describe("findCastleStructureType", () => {
  it("returns the matching catalog entry", () => {
    const found = findCastleStructureType("castle-wall");

    expect(found.id).toBe("castle-wall");
    expect(found.label).toBeTruthy();
  });

  it("throws for an unknown id rather than returning undefined", () => {
    expect(() => findCastleStructureType("does-not-exist")).toThrow();
  });
});
