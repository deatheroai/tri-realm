import { describe, expect, it } from "vitest";
import { desiredCameraPosition, smoothingFactor } from "./followCamera";
import { lerpVec3 } from "../math/vec3";

describe("desiredCameraPosition", () => {
  it("adds the offset to the target position", () => {
    const target = { x: 1, y: 0, z: -2 };
    const offset = { x: 0, y: 4, z: 7 };

    expect(desiredCameraPosition(target, offset)).toEqual({ x: 1, y: 4, z: 5 });
  });
});

describe("smoothingFactor", () => {
  it("is between 0 and 1 for a normal frame delta", () => {
    const t = smoothingFactor(0.1, 1 / 60);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });

  it("converges the camera toward a stationary target over repeated frames", () => {
    let camera = { x: 0, y: 0, z: 0 };
    const target = { x: 10, y: 0, z: 0 };
    const dt = 1 / 60;

    for (let i = 0; i < 300; i++) {
      const t = smoothingFactor(0.1, dt);
      camera = lerpVec3(camera, target, t);
    }

    expect(camera.x).toBeCloseTo(target.x, 1);
  });
});
