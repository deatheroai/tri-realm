import { describe, expect, it } from "vitest";
import { BLOCK_MATERIALS, DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "./blockMaterials";

describe("BLOCK_MATERIALS catalog", () => {
  it("has more than one option, so the switcher has something to switch between", () => {
    expect(BLOCK_MATERIALS.length).toBeGreaterThan(1);
  });

  it("has unique ids", () => {
    const ids = BLOCK_MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry names a textureKind for createCastlePieceMesh to shade with", () => {
    for (const material of BLOCK_MATERIALS) {
      expect(material.textureKind).toBeTruthy();
    }
  });
});

describe("findBlockMaterial", () => {
  it("returns the matching material by id", () => {
    expect(findBlockMaterial("slate").id).toBe("slate");
  });

  it("falls back to the default for an unknown id", () => {
    expect(findBlockMaterial("does-not-exist").id).toBe(DEFAULT_BLOCK_MATERIAL_ID);
  });
});
