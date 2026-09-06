import { describe, expect, it } from "vitest";
import { moveInputToSeaAnimationState } from "./seaAnimation";

describe("moveInputToSeaAnimationState", () => {
  it("is idle with no horizontal input and no active vertical input", () => {
    expect(moveInputToSeaAnimationState(0, 0, 0, false)).toBe("idle");
  });

  it("is NOT idle while diving with zero horizontal input — active vertical input is real swimming", () => {
    expect(moveInputToSeaAnimationState(0, 0, -1, false)).toBe("walk");
  });

  it("is NOT idle while surfacing with zero horizontal input", () => {
    expect(moveInputToSeaAnimationState(0, 0, 1, false)).toBe("walk");
  });

  it("walks on horizontal input alone, same as the generic land/air mapping", () => {
    expect(moveInputToSeaAnimationState(1, 0, 0, false)).toBe("walk");
  });

  it("runs when kicking (run=true) while actively diving/surfacing", () => {
    expect(moveInputToSeaAnimationState(0, 0, -1, true)).toBe("run");
  });

  it("runs when kicking horizontally, same as the generic mapping", () => {
    expect(moveInputToSeaAnimationState(1, 0, 0, true)).toBe("run");
  });

  it("is idle regardless of the run flag if truly stationary (no horizontal, no active vertical)", () => {
    expect(moveInputToSeaAnimationState(0, 0, 0, true)).toBe("idle");
  });

  it("treats diagonal horizontal input the same as the generic mapping's magnitude check", () => {
    expect(moveInputToSeaAnimationState(0.005, 0.005, 0, false)).toBe("idle");
    expect(moveInputToSeaAnimationState(0.1, 0.1, 0, false)).toBe("walk");
  });
});
