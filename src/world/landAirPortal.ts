import type { Vec3 } from "../math/vec3";
import { terrainHeightAt } from "../land/terrain";

/**
 * Shared coordinates/ids for the land↔air hot-air-balloon portal pair
 * (`DECISIONS.md`, 2026-09-02 — balloon first, stairway as a second
 * flavor later). Defined once in this neutral module, not in
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

/** How close (world units, all 3 axes) triggers a transition — generous
 * on purpose (rough is fine, see `AUTONOMY.md`), not pixel-precise. */
export const PORTAL_TRIGGER_RADIUS = 2;

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
