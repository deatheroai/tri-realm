import { describe, expect, it } from "vitest";
import { AIR_STRUCTURE_TYPES, DEFAULT_AIR_STRUCTURE_TYPE_ID, findAirStructureType } from "./airStructures";

describe("AIR_STRUCTURE_TYPES", () => {
  it("has a starter set of distinct, non-empty types", () => {
    expect(AIR_STRUCTURE_TYPES.length).toBeGreaterThanOrEqual(1);
    const ids = AIR_STRUCTURE_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every type positive dimensions", () => {
    for (const type of AIR_STRUCTURE_TYPES) {
      expect(type.dimensions.width).toBeGreaterThan(0);
      expect(type.dimensions.height).toBeGreaterThan(0);
      expect(type.dimensions.depth).toBeGreaterThan(0);
    }
  });

  it("defaults to a type that's actually in the catalog", () => {
    expect(() => findAirStructureType(DEFAULT_AIR_STRUCTURE_TYPE_ID)).not.toThrow();
  });
});

describe("findAirStructureType", () => {
  it("returns the matching catalog entry", () => {
    const found = findAirStructureType("sky-platform");

    expect(found.id).toBe("sky-platform");
    expect(found.label).toBeTruthy();
  });

  it("throws for an unknown id rather than returning undefined", () => {
    expect(() => findAirStructureType("does-not-exist")).toThrow();
  });
});
