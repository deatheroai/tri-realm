import { describe, expect, it } from "vitest";
import { combineMoveInputs } from "./combineMoveInputs";

const zero = { moveX: 0, moveZ: 0, run: false };

describe("combineMoveInputs", () => {
  it("passes a single active source through unchanged", () => {
    const a = { moveX: 1, moveZ: 0, run: false };
    expect(combineMoveInputs(a, zero)).toEqual(a);
    expect(combineMoveInputs(zero, a)).toEqual(a);
  });

  it("ORs the run flag from either source", () => {
    expect(combineMoveInputs({ ...zero, run: true }, zero).run).toBe(true);
    expect(combineMoveInputs(zero, { ...zero, run: true }).run).toBe(true);
  });

  it("clamps combined magnitude to at most 1", () => {
    const a = { moveX: 1, moveZ: 0, run: false };
    const combined = combineMoveInputs(a, a);
    expect(Math.hypot(combined.moveX, combined.moveZ)).toBeCloseTo(1);
  });
});
