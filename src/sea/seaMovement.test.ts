import { describe, expect, it } from "vitest";
import { stepSeaMovement, type SeaMovementState } from "./seaMovement";
import type { MoveInput } from "../input/keyboardInput";

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };
const FLOOR_Y = -10;
const SURFACE_Y = 0;

function restingState(y = -4): SeaMovementState {
  return { position: { x: 0, y, z: 0 }, velocity: { x: 0, y: 0, z: 0 } };
}

describe("stepSeaMovement", () => {
  it("is deterministic for the same input", () => {
    const state = restingState();

    const a = stepSeaMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
    const b = stepSeaMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);

    expect(a).toEqual(b);
  });

  it("drifts passively toward the surface with zero input — buoyancy, unlike land or air", () => {
    let state = restingState(-4);
    for (let i = 0; i < 60; i++) {
      state = stepSeaMovement(state, ZERO_INPUT, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(state.position.y).toBeGreaterThan(-4);
  });

  it("active dive input overrides passive buoyancy and pushes toward the floor", () => {
    let state = restingState(-4);
    for (let i = 0; i < 60; i++) {
      state = stepSeaMovement(state, ZERO_INPUT, -1, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(state.position.y).toBeLessThan(-4);
  });

  it("active surface input rises faster than passive buoyancy alone, given the same time", () => {
    let buoyantOnly = restingState(-4);
    let activelySurfacing = restingState(-4);
    for (let i = 0; i < 60; i++) {
      buoyantOnly = stepSeaMovement(buoyantOnly, ZERO_INPUT, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
      activelySurfacing = stepSeaMovement(activelySurfacing, ZERO_INPUT, 1, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(activelySurfacing.position.y).toBeGreaterThan(buoyantOnly.position.y);
  });

  it("never sinks below the sea floor", () => {
    let state = restingState(FLOOR_Y + 0.5);
    for (let i = 0; i < 120; i++) {
      state = stepSeaMovement(state, ZERO_INPUT, -1, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(state.position.y).toBeGreaterThanOrEqual(FLOOR_Y);
    expect(state.position.y).toBeCloseTo(FLOOR_Y, 5);
  });

  it("never rises above the water surface", () => {
    let state = restingState(SURFACE_Y - 0.5);
    for (let i = 0; i < 120; i++) {
      state = stepSeaMovement(state, ZERO_INPUT, 1, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(state.position.y).toBeLessThanOrEqual(SURFACE_Y);
    expect(state.position.y).toBeCloseTo(SURFACE_Y, 5);
  });

  it("zeroes vertical velocity on hitting a bound, instead of banking a push against it", () => {
    let state = restingState(FLOOR_Y + 0.1);
    for (let i = 0; i < 30; i++) {
      state = stepSeaMovement(state, ZERO_INPUT, -1, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(state.position.y).toBeCloseTo(FLOOR_Y, 5);
    expect(state.velocity.y).toBe(0);
  });

  it("moves horizontally toward the input direction, normalizing diagonals", () => {
    let cardinal = restingState();
    let diagonal = restingState();
    for (let i = 0; i < 60; i++) {
      cardinal = stepSeaMovement(cardinal, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
      diagonal = stepSeaMovement(diagonal, { moveX: 1, moveZ: 1, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(cardinal.position.x).toBeGreaterThan(0);
    const cardinalDistance = Math.abs(cardinal.position.x);
    const diagonalDistance = Math.hypot(diagonal.position.x, diagonal.position.z);
    expect(diagonalDistance).toBeLessThanOrEqual(cardinalDistance + 1e-6);
  });

  it("reaches a higher speed with run (a stronger kick) than without, given the same time", () => {
    let normal = restingState();
    let kicked = restingState();
    for (let i = 0; i < 120; i++) {
      normal = stepSeaMovement(normal, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
      kicked = stepSeaMovement(kicked, { moveX: 1, moveZ: 0, run: true }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);
    }

    expect(kicked.position.x).toBeGreaterThan(normal.position.x);
  });

  it("accelerates sluggishly rather than snapping instantly to full speed — water resistance", () => {
    const state = restingState();

    const afterOneFrame = stepSeaMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60, FLOOR_Y, SURFACE_Y);

    expect(afterOneFrame.velocity.x).toBeGreaterThan(0);
    expect(afterOneFrame.velocity.x).toBeLessThan(2.4); // MAX_SPEED
  });
});
