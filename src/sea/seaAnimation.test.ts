import { describe, expect, it } from "vitest";
import { moveInputToSeaAnimationState, withSwimAnimationState } from "./seaAnimation";

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

describe("withSwimAnimationState", () => {
  it("passes the generic state through unchanged for a skin without swim clips", () => {
    expect(withSwimAnimationState("idle", false)).toBe("idle");
    expect(withSwimAnimationState("walk", false)).toBe("walk");
    expect(withSwimAnimationState("run", false)).toBe("run");
  });

  it("routes idle to swimIdle for a skin with swim clips", () => {
    expect(withSwimAnimationState("idle", true)).toBe("swimIdle");
  });

  it("routes both walk and run to swimActive for a skin with swim clips — no separate swim-run clip exists", () => {
    expect(withSwimAnimationState("walk", true)).toBe("swimActive");
    expect(withSwimAnimationState("run", true)).toBe("swimActive");
  });
});
