import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCastlePieceMesh, CASTLE_PIECE_GROUND_OFFSET } from "./placement";

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

  it("exposes a ground offset matching half its own height", () => {
    const mesh = createCastlePieceMesh();
    const params = (mesh.geometry as THREE.BoxGeometry).parameters;

    expect(CASTLE_PIECE_GROUND_OFFSET).toBeCloseTo(params.height / 2);
  });
});
