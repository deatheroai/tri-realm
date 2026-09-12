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

  it("climbs a gentle slope (well under the max climbable grade) without being blocked", () => {
    // Rises 1 unit over 20 (a 5% grade) — far gentler than terrainHeightAt's
    // own worst case, let alone MAX_CLIMB_GRADE.
    const gentleSlope = (x: number) => Math.min(x, 20) * 0.05;
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const end = simulate(start, { moveX: 1, moveZ: 0, run: false }, gentleSlope, 1 / 60, 300);

    expect(end.position.x).toBeGreaterThan(15);
    expect(end.position.y).toBeCloseTo(gentleSlope(end.position.x));
  });

  it("blocks climbing a literal wall (grade over the max climbable grade) like a collision", () => {
    // A vertical face at x=5: flat at 0 before it, then a sheer 50-unit
    // jump — nothing this shallow terrain has ever produced, but exactly
    // the "literal cliff or wall" case this check exists to stop.
    const wallAt5 = (x: number) => (x < 5 ? 0 : 50);
    const start: LandMovementState = { position: { x: 0, y: 0, z: 0 }, velocityY: 0 };
    const end = simulate(start, { moveX: 1, moveZ: 0, run: false }, wallAt5, 1 / 60, 300);

    // Never climbs the wall — stops at/near its base instead of snapping
    // up to the far side's height.
    expect(end.position.x).toBeLessThan(5);
    expect(end.position.y).toBeCloseTo(0);
  });

  it("does not block walking off a ledge into a steep drop — gravity handles the fall", () => {
    // The mirror image of the wall case: flat, then a sheer drop. Approaching
    // from the high side should walk right up to the edge (and, once past
    // it, fall — not teleport down or get stopped by an invisible wall).
    const ledgeAt5 = (x: number) => (x < 5 ? 50 : 0);
    const start: LandMovementState = { position: { x: 0, y: 50, z: 0 }, velocityY: 0 };
    const end = simulate(start, { moveX: 1, moveZ: 0, run: false }, ledgeAt5, 1 / 60, 300);

    expect(end.position.x).toBeGreaterThan(5);
  });
});
