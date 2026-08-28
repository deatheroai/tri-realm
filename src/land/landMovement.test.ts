import { describe, expect, it } from "vitest";
import { stepLandMovement, type LandMovementState } from "./landMovement";

const flatGround = () => 0;
const noInput = { moveX: 0, moveZ: 0, run: false };

function simulate(
  state: LandMovementState,
  input: Parameters<typeof stepLandMovement>[1],
  groundHeightAt: (x: number, z: number) => number,
  dt: number,
  steps: number,
): LandMovementState {
  let s = state;
  for (let i = 0; i < steps; i++) {
    s = stepLandMovement(s, input, groundHeightAt, dt);
  }
  return s;
}

describe("stepLandMovement", () => {
  it("stays put on flat ground with no input", () => {
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const end = simulate(start, noInput, flatGround, 1 / 60, 30);

    expect(end.position.x).toBeCloseTo(0);
    expect(end.position.z).toBeCloseTo(0);
    expect(end.position.y).toBeCloseTo(0);
    expect(end.velocityY).toBe(0);
  });

  it("moves forward (-z) at walk speed when moveZ is negative", () => {
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const end = simulate(start, { moveX: 0, moveZ: -1, run: false }, flatGround, 1 / 60, 60);

    // ~1 second of walking at 4 m/s
    expect(-end.position.z).toBeGreaterThan(3.5);
    expect(-end.position.z).toBeLessThan(4.5);
    expect(end.position.x).toBeCloseTo(0);
  });

  it("running covers more ground than walking in the same time", () => {
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const walked = simulate(start, { moveX: 0, moveZ: -1, run: false }, flatGround, 1 / 60, 60);
    const ran = simulate(start, { moveX: 0, moveZ: -1, run: true }, flatGround, 1 / 60, 60);

    expect(-ran.position.z).toBeGreaterThan(-walked.position.z);
  });

  it("normalizes diagonal input instead of moving faster", () => {
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const straight = simulate(start, { moveX: 0, moveZ: -1, run: false }, flatGround, 1 / 60, 60);
    const diagonal = simulate(
      start,
      { moveX: 1, moveZ: -1, run: false },
      flatGround,
      1 / 60,
      60,
    );

    const straightDist = Math.hypot(straight.position.x, straight.position.z);
    const diagonalDist = Math.hypot(diagonal.position.x, diagonal.position.z);

    expect(diagonalDist).toBeCloseTo(straightDist, 1);
  });

  it("falls under gravity and settles on the ground instead of passing through it", () => {
    const start: LandMovementState = { position: { x: 0, y: 5, z: 0 }, velocityY: 0 };
    const end = simulate(start, noInput, flatGround, 1 / 60, 180);

    expect(end.position.y).toBeCloseTo(0);
    expect(end.velocityY).toBe(0);
  });
});
