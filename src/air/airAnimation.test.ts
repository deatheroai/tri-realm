import { describe, expect, it } from "vitest";
import { moveInputToAirAnimationState, withFloatAnimationState } from "./airAnimation";

describe("moveInputToAirAnimationState", () => {
  it("is idle with no horizontal input and no vertical input", () => {
    expect(moveInputToAirAnimationState(0, 0, 0, false)).toBe("idle");
  });

  it("is NOT idle while ascending with zero horizontal input — active vertical input is real flight", () => {
    expect(moveInputToAirAnimationState(0, 0, 1, false)).toBe("walk");
  });

  it("is NOT idle while descending with zero horizontal input", () => {
    expect(moveInputToAirAnimationState(0, 0, -1, false)).toBe("walk");
  });

  it("walks on horizontal input alone, same as the generic land mapping", () => {
    expect(moveInputToAirAnimationState(1, 0, 0, false)).toBe("walk");
  });

  it("runs (boosts) when holding run while actively ascending/descending", () => {
    expect(moveInputToAirAnimationState(0, 0, 1, true)).toBe("run");
    expect(moveInputToAirAnimationState(0, 0, -1, true)).toBe("run");
  });

  it("runs (boosts) when holding run while flying horizontally, same as the generic mapping", () => {
    expect(moveInputToAirAnimationState(1, 0, 0, true)).toBe("run");
  });

  it("is idle regardless of the run flag if truly stationary (no horizontal, no vertical)", () => {
    expect(moveInputToAirAnimationState(0, 0, 0, true)).toBe("idle");
  });

  it("treats diagonal horizontal input the same as the generic mapping's magnitude check", () => {
    expect(moveInputToAirAnimationState(0.005, 0.005, 0, false)).toBe("idle");
    expect(moveInputToAirAnimationState(0.1, 0.1, 0, false)).toBe("walk");
  });
});

describe("withFloatAnimationState", () => {
  it("passes the generic state through unchanged for a skin without swim clips", () => {
    expect(withFloatAnimationState("idle", false)).toBe("idle");
    expect(withFloatAnimationState("walk", false)).toBe("walk");
    expect(withFloatAnimationState("run", false)).toBe("run");
  });

  it("always resolves to the calm swimIdle clip for a skin with swim clips, even while moving — the 'balloon, not fish' fix", () => {
    expect(withFloatAnimationState("idle", true)).toBe("swimIdle");
    expect(withFloatAnimationState("walk", true)).toBe("swimIdle");
    expect(withFloatAnimationState("run", true)).toBe("swimIdle");
  });

  it("never resolves to swimActive, unlike sea's own withSwimAnimationState — that's the entire point of the distinct function", () => {
    expect(withFloatAnimationState("walk", true)).not.toBe("swimActive");
    expect(withFloatAnimationState("run", true)).not.toBe("swimActive");
  });
});
