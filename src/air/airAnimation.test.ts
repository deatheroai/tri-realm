import { describe, it, expect } from "vitest";
import { moveInputToAirAnimationState } from "./airAnimation";

describe("moveInputToAirAnimationState", () => {
  it("always resolves to idle — no bundled skin has a flight clip to run/walk into", () => {
    expect(moveInputToAirAnimationState()).toBe("idle");
  });
});
