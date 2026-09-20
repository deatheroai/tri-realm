import type { Vec3 } from "../math/vec3";
import { terrainHeightAt } from "../land/terrain";
import { PORTAL_TRIGGER_RADIUS } from "./portalTransition";

// Re-exported for existing consumers (this module's own test file) —
// PORTAL_TRIGGER_RADIUS itself now lives in the realm-agnostic
// portalTransition.ts, since landSeaPortal.ts needs the same constant
// without importing a land-air-specific module for it.
export { PORTAL_TRIGGER_RADIUS };

/**
 * Shared coordinates/ids for both land↔air portal pairs — the hot-air-
 * balloon (built first) and the stairway (`DECISIONS.md`, 2026-09-02:
 * both flavors wanted eventually, balloon prioritized for being the more
 * visually distinctive of the two; the stairway pair below closes that
 * out as "a second catalog entry, not new plumbing," per that same
 * decision). Defined once in this neutral module, not in
 * `land/landRealmMap.ts` or `air/airRealmMap.ts` directly: each side's
 * portal needs to know the OTHER realm's map id and arrival spot, and
 * having land import from air's module while air imports from land's
 * would be a circular import. `createLandRealmMap`/`createAirRealmMap`
 * and `scene.ts`/`airScene.ts`'s marker placement all import from here
 * instead, so a portal's logical trigger position and its visual mesh
 * can't drift apart — same "one source of truth" pattern as
 * `terrainHeightAt` already keeping land's ground mesh and movement
 * collision in sync.
 *
 * Realm map ids are literal strings here, not imported from
 * `LAND_MAP_ID`/`AIR_MAP_ID`, for the same circular-import reason —
 * kept in sync by convention (both are effectively permanent identifiers
 * for their realm's one map).
 */
const LAND_MAP_ID = "land-01";
const AIR_MAP_ID = "air-01";

export const LAND_AIR_PORTAL_ID = "land-air-portal-1";
export const AIR_LAND_PORTAL_ID = "air-land-portal-1";
export const PORTAL_KIND = "hot-air-balloon";

export const LAND_AIR_STAIRWAY_PORTAL_ID = "land-air-stairway-portal-1";
export const AIR_LAND_STAIRWAY_PORTAL_ID = "air-land-stairway-portal-1";
export const STAIRWAY_PORTAL_KIND = "stairway";

// Both portals sit on a straight +x line from their realm's own spawn
// point (land spawns at x=0,z=0; air spawns at x=0,z=0 too) — deliberately
// reachable by holding a single direction key, not a precise diagonal,
// which also makes this reliably E2E-testable (e2e/air-flight.spec.ts /
// a land↔air portal spec) without hand-tuning a two-axis approach.
const LAND_PORTAL_X = 10;
const LAND_PORTAL_Z = 0;
/** Where the land-side balloon sits, resting on the actual terrain. */
export const LAND_PORTAL_POSITION: Vec3 = {
  x: LAND_PORTAL_X,
  y: terrainHeightAt(LAND_PORTAL_X, LAND_PORTAL_Z),
  z: LAND_PORTAL_Z,
};
// A few units further along +x — beyond PORTAL_TRIGGER_RADIUS — so
// arriving from air doesn't immediately re-trigger the same portal.
const LAND_ARRIVAL_X = LAND_PORTAL_X + 3;
export const LAND_ARRIVAL_POSITION: Vec3 = {
  x: LAND_ARRIVAL_X,
  y: terrainHeightAt(LAND_ARRIVAL_X, LAND_PORTAL_Z),
  z: LAND_PORTAL_Z,
};

/** Where the air-side balloon floats — clear of the air scene's own
 * spawn point and the existing floating platforms. */
export const AIR_PORTAL_POSITION: Vec3 = { x: 4, y: 5, z: 0 };
// Clear of AIR_PORTAL_POSITION by more than PORTAL_TRIGGER_RADIUS, same
// anti-immediate-re-trigger reasoning as the land side.
export const AIR_ARRIVAL_POSITION: Vec3 = { x: 8, y: 5, z: 0 };

export const LAND_AIR_PORTAL = {
  id: LAND_AIR_PORTAL_ID,
  position: LAND_PORTAL_POSITION,
  targetRealmMapId: AIR_MAP_ID,
  targetSpawnPosition: AIR_ARRIVAL_POSITION,
  kind: PORTAL_KIND,
};

export const AIR_LAND_PORTAL = {
  id: AIR_LAND_PORTAL_ID,
  position: AIR_PORTAL_POSITION,
  targetRealmMapId: LAND_MAP_ID,
  targetSpawnPosition: LAND_ARRIVAL_POSITION,
  kind: PORTAL_KIND,
};

// The stairway pair sits on a straight -z line from each realm's own
// spawn (the shared "forward" key, W) — clear of the balloon's +x line,
// land-sea's -x line, and land's parkland dressing (trees/path/fountain
// all sit within |z| <= 10, this pair starts at z=-14) and air's floating
// platforms (`air/airRealmMap.ts`'s AIR_FLOATING_PLATFORM_POSITIONS, none
// within PORTAL_TRIGGER_RADIUS of either point below).
const STAIRWAY_LAND_PORTAL_X = 0;
const STAIRWAY_LAND_PORTAL_Z = -14;
/** Where the land-side stairway's base sits, resting on the actual terrain. */
export const STAIRWAY_LAND_PORTAL_POSITION: Vec3 = {
  x: STAIRWAY_LAND_PORTAL_X,
  y: terrainHeightAt(STAIRWAY_LAND_PORTAL_X, STAIRWAY_LAND_PORTAL_Z),
  z: STAIRWAY_LAND_PORTAL_Z,
};
// A few units further along -z — beyond PORTAL_TRIGGER_RADIUS — so
// arriving from air doesn't immediately re-trigger the same portal.
const STAIRWAY_LAND_ARRIVAL_Z = STAIRWAY_LAND_PORTAL_Z - 3;
export const STAIRWAY_LAND_ARRIVAL_POSITION: Vec3 = {
  x: STAIRWAY_LAND_PORTAL_X,
  y: terrainHeightAt(STAIRWAY_LAND_PORTAL_X, STAIRWAY_LAND_ARRIVAL_Z),
  z: STAIRWAY_LAND_ARRIVAL_Z,
};

/** Where the air-side stairway's top lands — clear of the balloon's own
 * air-side spot and every AIR_FLOATING_PLATFORM_POSITIONS entry. */
export const STAIRWAY_AIR_PORTAL_POSITION: Vec3 = { x: 0, y: 5, z: -8 };
// Clear of STAIRWAY_AIR_PORTAL_POSITION by more than PORTAL_TRIGGER_RADIUS,
// same anti-immediate-re-trigger reasoning as the land side.
export const STAIRWAY_AIR_ARRIVAL_POSITION: Vec3 = { x: 0, y: 5, z: -11 };

export const LAND_AIR_STAIRWAY_PORTAL = {
  id: LAND_AIR_STAIRWAY_PORTAL_ID,
  position: STAIRWAY_LAND_PORTAL_POSITION,
  targetRealmMapId: AIR_MAP_ID,
  targetSpawnPosition: STAIRWAY_AIR_ARRIVAL_POSITION,
  kind: STAIRWAY_PORTAL_KIND,
};

export const AIR_LAND_STAIRWAY_PORTAL = {
  id: AIR_LAND_STAIRWAY_PORTAL_ID,
  position: STAIRWAY_AIR_PORTAL_POSITION,
  targetRealmMapId: LAND_MAP_ID,
  targetSpawnPosition: STAIRWAY_LAND_ARRIVAL_POSITION,
  kind: STAIRWAY_PORTAL_KIND,
};
