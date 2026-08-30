import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCastlePieceMesh, castlePieceGroundOffset } from "./placement";
import { CASTLE_STRUCTURE_TYPES } from "./castleStructures";

describe("createCastlePieceMesh", () => {
  it("creates a distinctly-named box mesh", () => {
    const mesh = createCastlePieceMesh();

    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(mesh.name).toBe("placed-structure");
  });

  it("returns a fresh, independent mesh instance each call", () => {
    const a = createCastlePieceMesh();
    const b = createCastlePieceMesh();

    expect(a).not.toBe(b);
  });

  it("builds each catalog type at its own dimensions", () => {
    for (const type of CASTLE_STRUCTURE_TYPES) {
      const mesh = createCastlePieceMesh(type.id);
      const params = (mesh.geometry as THREE.BoxGeometry).parameters;

      expect(params.width).toBe(type.dimensions.width);
      expect(params.height).toBe(type.dimensions.height);
      expect(params.depth).toBe(type.dimensions.depth);
    }
  });
});

describe("castlePieceGroundOffset", () => {
  it("matches half the mesh's own height for every catalog type", () => {
    for (const type of CASTLE_STRUCTURE_TYPES) {
      const mesh = createCastlePieceMesh(type.id);
      const params = (mesh.geometry as THREE.BoxGeometry).parameters;

      expect(castlePieceGroundOffset(type.id)).toBeCloseTo(params.height / 2);
    }
  });
});
