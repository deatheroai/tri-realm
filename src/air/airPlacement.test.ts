import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createAirStructureMesh, airStructureGroundOffset } from "./airPlacement";
import { AIR_STRUCTURE_TYPES } from "./airStructures";

describe("createAirStructureMesh", () => {
  it("creates a distinctly-named box mesh", () => {
    const mesh = createAirStructureMesh();

    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(mesh.name).toBe("placed-structure");
  });

  it("returns a fresh, independent mesh instance each call", () => {
    const a = createAirStructureMesh();
    const b = createAirStructureMesh();

    expect(a).not.toBe(b);
  });

  it("shades the material with a generated texture, not just a flat color", () => {
    const mesh = createAirStructureMesh();
    const material = mesh.material as THREE.MeshStandardMaterial;

    expect(material.map).toBeInstanceOf(THREE.DataTexture);
  });

  it("builds each catalog type at its own dimensions", () => {
    for (const type of AIR_STRUCTURE_TYPES) {
      const mesh = createAirStructureMesh(type.id);
      const params = (mesh.geometry as THREE.BoxGeometry).parameters;

      expect(params.width).toBe(type.dimensions.width);
      expect(params.height).toBe(type.dimensions.height);
      expect(params.depth).toBe(type.dimensions.depth);
    }
  });
});

describe("airStructureGroundOffset", () => {
  it("matches half the mesh's own height for every catalog type", () => {
    for (const type of AIR_STRUCTURE_TYPES) {
      const mesh = createAirStructureMesh(type.id);
      const params = (mesh.geometry as THREE.BoxGeometry).parameters;

      expect(airStructureGroundOffset(type.id)).toBeCloseTo(params.height / 2);
    }
  });
});
