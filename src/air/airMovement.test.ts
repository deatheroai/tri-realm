import { describe, expect, it } from "vitest";
import { stepAirMovement, type AirMovementState } from "./airMovement";
import type { MoveInput } from "../input/keyboardInput";

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

function restingState(y = 5): AirMovementState {
  return { position: { x: 0, y, z: 0 }, velocity: { x: 0, y: 0, z: 0 } };
}

describe("stepAirMovement", () => {
  it("is deterministic for the same input", () => {
    const state = restingState();

    const a = stepAirMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60);
    const b = stepAirMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60);

    expect(a).toEqual(b);
  });

  it("hovers in place with zero input — no gravity, unlike land", () => {
    const state = restingState(5);

    const next = stepAirMovement(state, ZERO_INPUT, 0, 1);

    expect(next.position).toEqual({ x: 0, y: 5, z: 0 });
    expect(next.velocity).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("ascends when vertical input is positive", () => {
    let state = restingState(5);
    for (let i = 0; i < 60; i++) {
      state = stepAirMovement(state, ZERO_INPUT, 1, 1 / 60);
    }

    expect(state.position.y).toBeGreaterThan(5);
  });

  it("descends when vertical input is negative", () => {
    let state = restingState(5);
    for (let i = 0; i < 60; i++) {
      state = stepAirMovement(state, ZERO_INPUT, -1, 1 / 60);
    }

    expect(state.position.y).toBeLessThan(5);
  });

  it("moves horizontally toward the input direction, normalizing diagonals", () => {
    let cardinal = restingState();
    let diagonal = restingState();
    for (let i = 0; i < 60; i++) {
      cardinal = stepAirMovement(cardinal, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60);
      diagonal = stepAirMovement(diagonal, { moveX: 1, moveZ: 1, run: false }, 0, 1 / 60);
    }

    expect(cardinal.position.x).toBeGreaterThan(0);
    // Diagonal input shouldn't cover more ground than a single cardinal direction.
    const cardinalDistance = Math.abs(cardinal.position.x);
    const diagonalDistance = Math.hypot(diagonal.position.x, diagonal.position.z);
    expect(diagonalDistance).toBeLessThanOrEqual(cardinalDistance + 1e-6);
  });

  it("reaches a higher speed with run (boost) than without, given the same time", () => {
    let normal = restingState();
    let boosted = restingState();
    for (let i = 0; i < 120; i++) {
      normal = stepAirMovement(normal, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60);
      boosted = stepAirMovement(boosted, { moveX: 1, moveZ: 0, run: true }, 0, 1 / 60);
    }

    expect(boosted.position.x).toBeGreaterThan(normal.position.x);
  });

  it("accelerates smoothly rather than snapping instantly to full speed", () => {
    const state = restingState();

    const afterOneFrame = stepAirMovement(state, { moveX: 1, moveZ: 0, run: false }, 0, 1 / 60);

    // One frame in, velocity should have moved toward the target but not
    // reached it — that's the "momentum" feel, distinct from land.
    expect(afterOneFrame.velocity.x).toBeGreaterThan(0);
    expect(afterOneFrame.velocity.x).toBeLessThan(5); // MAX_SPEED
  });
});
