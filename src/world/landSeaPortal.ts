import type { Vec3 } from "../math/vec3";
import { terrainHeightAt } from "../land/terrain";

/**
 * Shared coordinates/ids for the land↔sea diving-house portal pair
 * (`DECISIONS.md`, 2026-09-07 — a diving-house structure on land, dive
 * suit worn inside, actual transition through a basement pothole).
 * Defined once in this neutral module for the same circular-import
 * reason `landAirPortal.ts` is: land's and sea's `RealmMap` files would
 * otherwise need to import each other. `createLandRealmMap`/
 * `createSeaRealmMap` and `scene.ts`/`seaScene.ts`'s marker placement all
 * import from here, so a portal's logical trigger position and its
 * visual mesh can't drift apart.
 *
 * Unlike land↔air's balloon (a bare launch point, portal *is* the
 * marker), land↔sea is "a real little scene with a costume change, not
 * just a marked spot on the ground" (`DECISIONS.md`) — the diving house
 * is a fixed landmark the avatar walks up to; walking within the trigger
 * radius stands in for "entering the house and descending through the
 * basement pothole" rather than a separate multi-step interaction, same
 * mechanism-simplicity the balloon already uses (just walk up to it, no
 * boarding animation). The dive-suit skin swap itself is Skins-owned
 * (`BACKLOG.md`), not this module's concern.
 *
 * Realm map ids are literal strings here, not imported from
 * `LAND_MAP_ID`/`SEA_MAP_ID`, for the same circular-import reason
 * `landAirPortal.ts` uses — kept in sync by convention.
 */
const LAND_MAP_ID = "land-01";
const SEA_MAP_ID = "sea-01";

export const LAND_SEA_PORTAL_ID = "land-sea-portal-1";
export const SEA_LAND_PORTAL_ID = "sea-land-portal-1";
export const PORTAL_KIND = "diving-house";

// The diving house sits on a straight -x line from land's own spawn
// (opposite the land<->air balloon's +x line) — same
// single-direction-key-reachable, easily-E2E-testable reasoning
// landAirPortal.ts uses, just the other way so the two land-side portals
// can't ever sit on top of each other.
const LAND_PORTAL_X = -10;
const LAND_PORTAL_Z = 0;
/** Where the diving house sits, resting on the actual terrain. */
export const LAND_PORTAL_POSITION: Vec3 = {
  x: LAND_PORTAL_X,
  y: terrainHeightAt(LAND_PORTAL_X, LAND_PORTAL_Z),
  z: LAND_PORTAL_Z,
};
// A few units further along -x — beyond PORTAL_TRIGGER_RADIUS — so
// arriving from sea doesn't immediately re-trigger the same portal.
const LAND_ARRIVAL_X = LAND_PORTAL_X - 3;
export const LAND_ARRIVAL_POSITION: Vec3 = {
  x: LAND_ARRIVAL_X,
  y: terrainHeightAt(LAND_ARRIVAL_X, LAND_PORTAL_Z),
  z: LAND_PORTAL_Z,
};

// Where the sea-side exit sits — clear of the sea realm's own spawn
// (0, SEA_AVATAR_SPAWN_Y, 0) and every SEA_WRECKAGE_POSITIONS entry
// (src/sea/seaRealmMap.ts), reachable by holding a single forward key
// (moveZ < 0), same single-direction-key reasoning as the land side.
export const SEA_PORTAL_POSITION: Vec3 = { x: 0, y: -4, z: -12 };
// Clear of SEA_PORTAL_POSITION by more than PORTAL_TRIGGER_RADIUS, same
// anti-immediate-re-trigger reasoning as the land side.
export const SEA_ARRIVAL_POSITION: Vec3 = { x: 0, y: -4, z: -15 };

export const LAND_SEA_PORTAL = {
  id: LAND_SEA_PORTAL_ID,
  position: LAND_PORTAL_POSITION,
  targetRealmMapId: SEA_MAP_ID,
  targetSpawnPosition: SEA_ARRIVAL_POSITION,
  kind: PORTAL_KIND,
};

export const SEA_LAND_PORTAL = {
  id: SEA_LAND_PORTAL_ID,
  position: SEA_PORTAL_POSITION,
  targetRealmMapId: LAND_MAP_ID,
  targetSpawnPosition: LAND_ARRIVAL_POSITION,
  kind: PORTAL_KIND,
};
