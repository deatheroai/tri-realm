import { describe, expect, it } from "vitest";
import { computeMoveInput } from "./keyboardInput";

describe("computeMoveInput", () => {
  it("returns zero input when nothing is pressed", () => {
    expect(computeMoveInput(new Set())).toEqual({ moveX: 0, moveZ: 0, run: false });
  });

  it("maps WASD to move axes", () => {
    expect(computeMoveInput(new Set(["KeyW"]))).toMatchObject({ moveZ: -1 });
    expect(computeMoveInput(new Set(["KeyS"]))).toMatchObject({ moveZ: 1 });
    expect(computeMoveInput(new Set(["KeyA"]))).toMatchObject({ moveX: -1 });
    expect(computeMoveInput(new Set(["KeyD"]))).toMatchObject({ moveX: 1 });
  });

  it("maps arrow keys the same way as WASD", () => {
    expect(computeMoveInput(new Set(["ArrowUp"]))).toMatchObject({ moveZ: -1 });
    expect(computeMoveInput(new Set(["ArrowRight"]))).toMatchObject({ moveX: 1 });
  });

  it("combines simultaneous keys for diagonal movement", () => {
    expect(computeMoveInput(new Set(["KeyW", "KeyD"]))).toEqual({
      moveX: 1,
      moveZ: -1,
      run: false,
    });
  });

  it("cancels opposing keys held at once", () => {
    expect(computeMoveInput(new Set(["KeyW", "KeyS"]))).toMatchObject({ moveZ: 0 });
  });

  it("sets run from either shift key", () => {
    expect(computeMoveInput(new Set(["KeyW", "ShiftLeft"]))).toMatchObject({ run: true });
    expect(computeMoveInput(new Set(["KeyW", "ShiftRight"]))).toMatchObject({ run: true });
  });
});
