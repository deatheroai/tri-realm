import { describe, expect, it } from "vitest";
import { stepLandMovement } from "./landMovement";
import {
  AVATAR_RADIUS,
  STEP_HEIGHT,
  movementBlocked,
  obstaclesFromStructures,
  standableTopAt,
  type StructureObstacle,
} from "./structureCollision";

const flat = () => 0;
const idle = { moveX: 0, moveZ: 0, run: false };
const walkX = { moveX: 1, moveZ: 0, run: false };
const wall = (topY: number): StructureObstacle => ({ minX: 2, maxX: 3, minZ: -5, maxZ: 5, topY });
const start = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };

describe("obstaclesFromStructures", () => {
  const footprintOf = () => ({ width: 2, height: 4, depth: 1 });
  const base = { id: "a", type: "t", realmMapId: "m", materialId: "x", position: { x: 10, y: 2, z: 20 } };

  it("builds a box from position and footprint", () => {
    const [o] = obstaclesFromStructures([{ ...base, rotation: 0 }], footprintOf);
    expect(o).toEqual({ minX: 9, maxX: 11, minZ: 19.5, maxZ: 20.5, topY: 4 });
  });

  it("swaps width/depth for a quarter turn", () => {
    const [o] = obstaclesFromStructures([{ ...base, rotation: Math.PI / 2 }], footprintOf);
    expect(o.maxX - o.minX).toBeCloseTo(1);
    expect(o.maxZ - o.minZ).toBeCloseTo(2);
  });
});

describe("obstaclesFromStructures with a passage", () => {
  const footprintOf = () => ({ width: 2, height: 4, depth: 1 });
  const passageOf = () => 0.8;
  const base = { id: "a", type: "t", realmMapId: "m", materialId: "x", position: { x: 10, y: 2, z: 20 } };

  it("splits into two jambs around the opening along X", () => {
    const boxes = obstaclesFromStructures([{ ...base, rotation: 0 }], footprintOf, passageOf);
    expect(boxes).toEqual([
      { minX: 9, maxX: 9.6, minZ: 19.5, maxZ: 20.5, topY: 4 },
      { minX: 10.4, maxX: 11, minZ: 19.5, maxZ: 20.5, topY: 4 },
    ]);
  });

  it("runs the opening along Z after a quarter turn", () => {
    const boxes = obstaclesFromStructures([{ ...base, rotation: Math.PI / 2 }], footprintOf, passageOf);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].maxZ).toBeCloseTo(19.6);
    expect(boxes[1].minZ).toBeCloseTo(20.4);
  });

  it("ignores a passage as wide as the piece", () => {
    expect(obstaclesFromStructures([{ ...base, rotation: 0 }], footprintOf, () => 2)).toHaveLength(1);
  });

  it("lets the avatar walk through the opening but not the jamb", () => {
    const boxes = obstaclesFromStructures(
      [{ ...base, position: { x: 3, y: 2, z: 0 }, rotation: Math.PI / 2 }],
      footprintOf,
      passageOf,
    );
    let through = start;
    for (let i = 0; i < 240; i++) through = stepLandMovement(through, walkX, flat, 1 / 60, false, boxes);
    expect(through.position.x).toBeGreaterThan(5);
    let blocked = { position: { x: 0, y: 0, z: 0.8 }, velocityY: 0 };
    for (let i = 0; i < 240; i++) blocked = stepLandMovement(blocked, walkX, flat, 1 / 60, false, boxes);
    expect(blocked.position.x).toBeLessThan(3);
  });
});

describe("stepLandMovement with obstacles", () => {
  it("blocks walking into a tall structure", () => {
    let s = start;
    for (let i = 0; i < 120; i++) s = stepLandMovement(s, walkX, flat, 1 / 60, false, [wall(3)]);
    expect(s.position.x).toBeLessThanOrEqual(2 - AVATAR_RADIUS + 1e-6);
    expect(s.position.x).toBeGreaterThan(1);
  });

  it("slides along a wall when moving diagonally", () => {
    let s = start;
    const diag = { moveX: 1, moveZ: 1, run: false };
    for (let i = 0; i < 60; i++) s = stepLandMovement(s, diag, flat, 1 / 60, false, [wall(3)]);
    expect(s.position.x).toBeLessThanOrEqual(2 - AVATAR_RADIUS + 1e-6);
    expect(s.position.z).toBeGreaterThan(1);
  });

  it("steps up onto a structure no taller than STEP_HEIGHT and stands on it", () => {
    let s = start;
    for (let i = 0; i < 40; i++) s = stepLandMovement(s, walkX, flat, 1 / 60, false, [wall(STEP_HEIGHT - 0.05)]);
    expect(s.position.x).toBeGreaterThan(2);
    expect(s.position.x).toBeLessThan(3);
    expect(s.position.y).toBeCloseTo(STEP_HEIGHT - 0.05);
  });

  it("lets a jump land on top of a structure a bit taller than a step", () => {
    const low = { ...wall(1), minX: 1, maxX: 5 };
    let s = { position: { x: 0.5, y: 0, z: 0 }, velocityY: 0 };
    s = stepLandMovement(s, idle, flat, 1 / 60, true, [low]);
    for (let i = 0; i < 40 && s.position.x < 2; i++) s = stepLandMovement(s, walkX, flat, 1 / 60, false, [low]);
    for (let i = 0; i < 120; i++) s = stepLandMovement(s, idle, flat, 1 / 60, false, [low]);
    expect(s.position.y).toBeCloseTo(1);
  });

  it("falls back to the terrain after walking off a structure's edge", () => {
    const low = wall(0.3);
    let s = { position: { x: 2.5, y: 0.3, z: 0 }, velocityY: 0 };
    for (let i = 0; i < 180; i++) s = stepLandMovement(s, walkX, flat, 1 / 60, false, [low]);
    expect(s.position.x).toBeGreaterThan(3.5);
    expect(s.position.y).toBe(0);
  });

  it("never traps an avatar that starts inside a structure", () => {
    let s = { position: { x: 2.5, y: 0, z: 0 }, velocityY: 0 };
    for (let i = 0; i < 120; i++) s = stepLandMovement(s, walkX, flat, 1 / 60, false, [wall(3)]);
    expect(s.position.x).toBeGreaterThan(4);
  });

  it("is unchanged with no obstacles", () => {
    const a = stepLandMovement(start, walkX, flat, 1 / 60);
    const b = stepLandMovement(start, walkX, flat, 1 / 60, false, []);
    expect(b).toEqual(a);
  });
});

describe("helpers", () => {
  it("standableTopAt ignores structures too tall to step onto", () => {
    expect(standableTopAt([wall(3)], 2.5, 0, 0)).toBeUndefined();
    expect(standableTopAt([wall(3)], 2.5, 0, 2.7)).toBe(3);
  });
  it("movementBlocked ignores moves that start inside", () => {
    expect(movementBlocked([wall(3)], 2.5, 0, 2.6, 0, 0)).toBe(false);
    expect(movementBlocked([wall(3)], 0, 0, 2.5, 0, 0)).toBe(true);
  });
});
