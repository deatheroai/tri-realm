import { describe, expect, it } from "vitest";
import { computeVerticalInput } from "./verticalInput";

describe("computeVerticalInput", () => {
  it("returns 0 when nothing is held", () => {
    expect(computeVerticalInput(new Set())).toBe(0);
  });

  it("returns 1 when Space is held", () => {
    expect(computeVerticalInput(new Set(["Space"]))).toBe(1);
  });

  it("returns -1 when a Control key is held", () => {
    expect(computeVerticalInput(new Set(["ControlLeft"]))).toBe(-1);
    expect(computeVerticalInput(new Set(["ControlRight"]))).toBe(-1);
  });

  it("cancels out to 0 when both ascend and descend keys are held", () => {
    expect(computeVerticalInput(new Set(["Space", "ControlLeft"]))).toBe(0);
  });

  it("ignores unrelated keys", () => {
    expect(computeVerticalInput(new Set(["KeyW", "ShiftLeft"]))).toBe(0);
  });
});
