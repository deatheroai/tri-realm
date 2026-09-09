import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { LAND_DECORATION_POSITIONS, createLandDecorationMesh } from "./landDecorations";

describe("LAND_DECORATION_POSITIONS", () => {
  it("includes every decoration kind at least once", () => {
    const kinds = new Set(LAND_DECORATION_POSITIONS.map((d) => d.kind));

    expect(kinds).toEqual(new Set(["tree", "flowerbed", "path", "fountain"]));
  });

  it("has exactly one fountain, the centerpiece near spawn", () => {
    const fountains = LAND_DECORATION_POSITIONS.filter((d) => d.kind === "fountain");

    expect(fountains).toHaveLength(1);
    // "Near spawn" — well within the map bounds' near half, not off at the edges.
    expect(Math.hypot(fountains[0].x, fountains[0].z)).toBeLessThan(10);
  });
});

describe("createLandDecorationMesh", () => {
  it("builds a named, renderable object for every decoration kind", () => {
    const expectedNames: Record<string, string> = {
      tree: "tree",
      flowerbed: "flowerbed",
      path: "path",
      fountain: "fountain",
    };

    for (const decoration of LAND_DECORATION_POSITIONS) {
      const mesh = createLandDecorationMesh(decoration);

      expect(mesh).toBeInstanceOf(THREE.Object3D);
      expect(mesh.name).toBe(expectedNames[decoration.kind]);
    }
  });

  it("gives each tree a trunk and foliage child", () => {
    const tree = createLandDecorationMesh({ x: 0, z: 0, kind: "tree" }) as THREE.Group;

    expect(tree.getObjectByName("tree-trunk")).toBeInstanceOf(THREE.Mesh);
    expect(tree.getObjectByName("tree-foliage")).toBeInstanceOf(THREE.Mesh);
  });

  it("gives the fountain a basin and water", () => {
    const fountain = createLandDecorationMesh({ x: 0, z: 0, kind: "fountain" }) as THREE.Group;

    expect(fountain.getObjectByName("fountain-basin")).toBeInstanceOf(THREE.Mesh);
    expect(fountain.getObjectByName("fountain-water")).toBeInstanceOf(THREE.Mesh);
  });

  it("returns a distinct object instance each call, not a shared singleton", () => {
    const a = createLandDecorationMesh({ x: 0, z: 0, kind: "flowerbed" });
    const b = createLandDecorationMesh({ x: 0, z: 0, kind: "flowerbed" });

    expect(a).not.toBe(b);
  });
});
