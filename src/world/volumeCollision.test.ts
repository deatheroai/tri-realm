import { describe, expect, it } from "vitest";
import {
  VOLUME_AVATAR_RADIUS,
  resolveVolumeMove,
  volumeObstaclesFromStructures,
  type VolumeObstacle,
} from "./volumeCollision";
import { stepAirMovement } from "../air/airMovement";
import { stepSeaMovement } from "../sea/seaMovement";
import type { PlacedStructure } from "./realmMap";

const box: VolumeObstacle = { minX: -1, maxX: 1, minY: -1, maxY: 1, minZ: -1, maxZ: 1 };
const R = VOLUME_AVATAR_RADIUS;

describe("volumeObstaclesFromStructures", () => {
  const footprintOf = () => ({ width: 2, height: 4, depth: 1 });
  const s = (rotation: number): PlacedStructure => ({
    id: "a",
    type: "t",
    realmMapId: "m",
    materialId: "x",
    position: { x: 10, y: 5, z: 20 },
    rotation,
  });

  it("builds a box centred on the structure", () => {
    expect(volumeObstaclesFromStructures([s(0)], footprintOf)[0]).toEqual({
      minX: 9, maxX: 11, minY: 3, maxY: 7, minZ: 19.5, maxZ: 20.5,
    });
  });

  it("swaps width/depth for a quarter turn", () => {
    const o = volumeObstaclesFromStructures([s(Math.PI / 2)], footprintOf)[0];
    expect(o.maxX - o.minX).toBeCloseTo(1);
    expect(o.maxZ - o.minZ).toBeCloseTo(2);
  });
});

describe("resolveVolumeMove", () => {
  it("passes through when nothing is in the way", () => {
    const r = resolveVolumeMove([box], { x: 5, y: 0, z: 0 }, { x: 4, y: 0, z: 0 });
    expect(r.position).toEqual({ x: 4, y: 0, z: 0 });
    expect(r.blocked).toEqual({ x: false, y: false, z: false });
  });

  it("blocks entering a box and slides along the face", () => {
    const from = { x: 1 + R + 0.01, y: 0, z: 0 };
    const r = resolveVolumeMove([box], from, { x: 0, y: 0, z: 0.5 });
    expect(r.blocked.x).toBe(true);
    expect(r.position.x).toBe(from.x);
    expect(r.position.z).toBe(0.5);
  });

  it("blocks vertical entry from above and below", () => {
    expect(resolveVolumeMove([box], { x: 0, y: 3, z: 0 }, { x: 0, y: 0, z: 0 }).blocked.y).toBe(true);
    expect(resolveVolumeMove([box], { x: 0, y: -3, z: 0 }, { x: 0, y: 0, z: 0 }).blocked.y).toBe(true);
  });

  it("never traps an avatar already inside", () => {
    const r = resolveVolumeMove([box], { x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 });
    expect(r.position.x).toBe(3);
    expect(r.blocked.x).toBe(false);
  });
});

describe("air/sea movement with obstacles", () => {
  const still = { position: { x: 3, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } };
  const west = { moveX: -1, moveZ: 0, run: true };

  it("air: flying into a structure stops short with zero x velocity", () => {
    let s = still;
    for (let i = 0; i < 300; i++) s = stepAirMovement(s, west, 0, 1 / 60, [box]);
    expect(s.position.x).toBeGreaterThanOrEqual(1 + R - 1e-9);
    expect(s.velocity.x).toBe(0);
  });

  it("air: without obstacles the same flight passes through", () => {
    let s = still;
    for (let i = 0; i < 300; i++) s = stepAirMovement(s, west, 0, 1 / 60);
    expect(s.position.x).toBeLessThan(-1);
  });

  it("sea: swimming into a structure stops short", () => {
    // Tall box: buoyancy would otherwise drift the swimmer over a short one.
    const tall = { ...box, minY: -40, maxY: 40 };
    let s = still;
    for (let i = 0; i < 600; i++) s = stepSeaMovement(s, west, 0, 1 / 60, -50, 50, [tall]);
    expect(s.position.x).toBeGreaterThanOrEqual(1 + R - 1e-9);
  });

  it("sea: buoyancy drift into the underside of a structure is blocked", () => {
    let s = { position: { x: 0, y: -1 - R - 0.05, z: 0 }, velocity: { x: 0, y: 0, z: 0 } };
    for (let i = 0; i < 300; i++) s = stepSeaMovement(s, { moveX: 0, moveZ: 0, run: false }, 0, 1 / 60, -50, 50, [box]);
    expect(s.position.y).toBeLessThanOrEqual(-1 - R + 1e-9);
  });
});
