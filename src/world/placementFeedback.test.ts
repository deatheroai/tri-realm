import { describe, expect, it } from "vitest";
import { describePlacementRejection } from "./placementFeedback";
import type { PlacementRejectionReason } from "./placementValidation";

describe("describePlacementRejection", () => {
  const reasons: PlacementRejectionReason[] = ["out-of-bounds", "overlaps-structure", "terrain-not-suitable"];

  it("gives every rejection reason a distinct, non-empty message", () => {
    const messages = reasons.map(describePlacementRejection);
    for (const m of messages) expect(m.length).toBeGreaterThan(0);
    expect(new Set(messages).size).toBe(reasons.length);
  });
});
