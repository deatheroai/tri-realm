import { describe, expect, it } from "vitest";
import {
  LAND_AIR_PORTAL,
  AIR_LAND_PORTAL,
  LAND_PORTAL_POSITION,
  LAND_ARRIVAL_POSITION,
  AIR_PORTAL_POSITION,
  AIR_ARRIVAL_POSITION,
  PORTAL_TRIGGER_RADIUS,
} from "./landAirPortal";

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe("LAND_AIR_PORTAL / AIR_LAND_PORTAL", () => {
  it("point at each other's realm", () => {
    expect(LAND_AIR_PORTAL.targetRealmMapId).toBe("air-01");
    expect(AIR_LAND_PORTAL.targetRealmMapId).toBe("land-01");
  });

  it("each portal's target spawn is clear of that side's own trigger radius", () => {
    // Arriving in air from the land portal shouldn't immediately re-trigger
    // the air-side portal, and vice versa.
    expect(distance(LAND_AIR_PORTAL.targetSpawnPosition, AIR_PORTAL_POSITION)).toBeGreaterThan(
      PORTAL_TRIGGER_RADIUS,
    );
    expect(distance(AIR_LAND_PORTAL.targetSpawnPosition, LAND_PORTAL_POSITION)).toBeGreaterThan(
      PORTAL_TRIGGER_RADIUS,
    );
  });

  it("each side's own arrival position is clear of its own portal too", () => {
    expect(distance(LAND_ARRIVAL_POSITION, LAND_PORTAL_POSITION)).toBeGreaterThan(PORTAL_TRIGGER_RADIUS);
    expect(distance(AIR_ARRIVAL_POSITION, AIR_PORTAL_POSITION)).toBeGreaterThan(PORTAL_TRIGGER_RADIUS);
  });

  it("shares the same portal kind on both ends (one consistent landmark)", () => {
    expect(LAND_AIR_PORTAL.kind).toBe(AIR_LAND_PORTAL.kind);
  });
});
