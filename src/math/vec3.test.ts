import { describe, expect, it } from "vitest";
import { lerpVec3 } from "./vec3";

describe("lerpVec3", () => {
  it("returns the start point at t=0 and the end point at t=1", () => {
    const from = { x: 0, y: 0, z: 0 };
    const to = { x: 10, y: -4, z: 6 };

    expect(lerpVec3(from, to, 0)).toEqual(from);
    expect(lerpVec3(from, to, 1)).toEqual(to);
  });

  it("interpolates proportionally at intermediate t", () => {
    const from = { x: 0, y: 0, z: 0 };
    const to = { x: 10, y: 10, z: 10 };

    expect(lerpVec3(from, to, 0.25)).toEqual({ x: 2.5, y: 2.5, z: 2.5 });
  });
});
