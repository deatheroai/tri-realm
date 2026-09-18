import { describe, expect, it } from "vitest";
import { combineVerticalInputs } from "./combineVerticalInputs";

describe("combineVerticalInputs", () => {
  it("passes a single active source through unchanged", () => {
    expect(combineVerticalInputs(1, 0)).toBe(1);
    expect(combineVerticalInputs(0, -1)).toBe(-1);
  });

  it("returns zero when neither source is active", () => {
    expect(combineVerticalInputs(0, 0)).toBe(0);
  });

  it("cancels opposing sources held at once", () => {
    expect(combineVerticalInputs(1, -1)).toBe(0);
  });

  it("clamps combined magnitude to at most 1 in either direction", () => {
    expect(combineVerticalInputs(1, 1)).toBe(1);
    expect(combineVerticalInputs(-1, -1)).toBe(-1);
  });
});
