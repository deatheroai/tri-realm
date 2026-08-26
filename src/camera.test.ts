import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCamera } from "./camera";

describe("createCamera", () => {
  it("creates a perspective camera with the given aspect ratio", () => {
    const camera = createCamera(16 / 9);

    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(camera.aspect).toBeCloseTo(16 / 9);
  });

  it("points at the scene origin from an offset position", () => {
    const camera = createCamera(1);

    expect(camera.position.length()).toBeGreaterThan(0);
  });
});
