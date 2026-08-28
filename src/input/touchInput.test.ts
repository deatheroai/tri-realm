import { describe, expect, it } from "vitest";
import { computeJoystickInput } from "./touchInput";

describe("computeJoystickInput", () => {
  it("returns zero input when there is no drag", () => {
    expect(computeJoystickInput(0, 0, 50)).toEqual({ moveX: 0, moveZ: 0, run: false });
  });

  it("maps an upward drag (screen dy < 0) to forward (-z), not sideways", () => {
    const input = computeJoystickInput(0, -20, 50);
    expect(input.moveZ).toBeLessThan(0);
    expect(input.moveX).toBeCloseTo(0);
  });

  it("maps a rightward drag to a positive moveX", () => {
    const input = computeJoystickInput(20, 0, 50);
    expect(input.moveX).toBeGreaterThan(0);
  });

  it("scales magnitude with drag distance", () => {
    const near = computeJoystickInput(0, -10, 50);
    const far = computeJoystickInput(0, -40, 50);

    expect(Math.hypot(far.moveX, far.moveZ)).toBeGreaterThan(Math.hypot(near.moveX, near.moveZ));
  });

  it("clamps magnitude to 1 beyond the max radius", () => {
    const input = computeJoystickInput(0, -500, 50);
    expect(Math.hypot(input.moveX, input.moveZ)).toBeCloseTo(1);
  });

  it("switches to run once the drag passes the run threshold", () => {
    const walking = computeJoystickInput(0, -20, 50); // 40% of radius
    const running = computeJoystickInput(0, -45, 50); // 90% of radius

    expect(walking.run).toBe(false);
    expect(running.run).toBe(true);
  });
});
