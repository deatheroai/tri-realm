import { describe, expect, it } from "vitest";
import {
  LAND_SEA_PORTAL,
  SEA_LAND_PORTAL,
  LAND_PORTAL_POSITION,
  LAND_ARRIVAL_POSITION,
  SEA_PORTAL_POSITION,
  SEA_ARRIVAL_POSITION,
} from "./landSeaPortal";
import { PORTAL_TRIGGER_RADIUS } from "./portalTransition";

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe("LAND_SEA_PORTAL / SEA_LAND_PORTAL", () => {
  it("point at each other's realm", () => {
    expect(LAND_SEA_PORTAL.targetRealmMapId).toBe("sea-01");
    expect(SEA_LAND_PORTAL.targetRealmMapId).toBe("land-01");
  });

  it("each portal's target spawn is clear of that side's own trigger radius", () => {
    // Arriving in sea from the land portal shouldn't immediately
    // re-trigger the sea-side portal, and vice versa.
    expect(distance(LAND_SEA_PORTAL.targetSpawnPosition, SEA_PORTAL_POSITION)).toBeGreaterThan(
      PORTAL_TRIGGER_RADIUS,
    );
    expect(distance(SEA_LAND_PORTAL.targetSpawnPosition, LAND_PORTAL_POSITION)).toBeGreaterThan(
      PORTAL_TRIGGER_RADIUS,
    );
  });

  it("each side's own arrival position is clear of its own portal too", () => {
    expect(distance(LAND_ARRIVAL_POSITION, LAND_PORTAL_POSITION)).toBeGreaterThan(PORTAL_TRIGGER_RADIUS);
    expect(distance(SEA_ARRIVAL_POSITION, SEA_PORTAL_POSITION)).toBeGreaterThan(PORTAL_TRIGGER_RADIUS);
  });

  it("shares the same portal kind on both ends (one consistent landmark)", () => {
    expect(LAND_SEA_PORTAL.kind).toBe(SEA_LAND_PORTAL.kind);
  });

  it("sits clear of the land<->air portal, which uses the opposite +x direction", () => {
    // Both land-side portals share the same z=0 line, deliberately on
    // opposite sides (landAirPortal.ts's balloon is +x, this is -x) so
    // holding a single direction key can't accidentally reach both.
    expect(LAND_PORTAL_POSITION.x).toBeLessThan(0);
  });
});
