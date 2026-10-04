import { describe, expect, it } from "vitest";
import { describeFacing, describePlacementRejection, facingDegrees } from "./placementFeedback";
import type { PlacementRejectionReason } from "./placementValidation";

describe("describePlacementRejection", () => {
  const reasons: PlacementRejectionReason[] = ["out-of-bounds", "overlaps-structure", "blocks-portal", "terrain-not-suitable"];

  it("gives every rejection reason a distinct, non-empty message", () => {
    const messages = reasons.map(describePlacementRejection);
    for (const m of messages) expect(m.length).toBeGreaterThan(0);
    expect(new Set(messages).size).toBe(reasons.length);
  });
});

describe("facing readout", () => {
  it("reports quarter turns in degrees and wraps negatives/full turns", () => {
    expect(facingDegrees(0)).toBe(0);
    expect(facingDegrees(Math.PI / 2)).toBe(90);
    expect(facingDegrees(Math.PI * 1.5)).toBe(270);
    expect(facingDegrees(Math.PI * 2)).toBe(0);
    expect(facingDegrees(-Math.PI / 2)).toBe(270);
    expect(describeFacing(Math.PI)).toBe("180°");
  });
});
