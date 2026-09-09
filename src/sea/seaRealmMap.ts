import type { Vec3 } from "../math/vec3";
import type { RealmMap } from "../world/realmMap";
import { SEA_LAND_PORTAL } from "../world/landSeaPortal";

/** Also this sea map's `RealmMap.id`. */
export const SEA_MAP_ID = "sea-01";

/** Square footprint — mirrors `land/landRealmMap.ts`'s `LAND_MAP_SIZE` and
 * `air/airRealmMap.ts`'s `AIR_MAP_SIZE`, though nothing enforces it as a
 * hard swim boundary yet (rough is fine for this first slice — see
 * `BACKLOG.md` Phase 3). */
export const SEA_MAP_SIZE = 60;

/** The sea floor's height and the water surface's height — the swimmable
 * band `stepSeaMovement` clamps position between. Matches the `RealmMap`
 * schema's own documented intent for sea's terrain ("sea-floor depth +
 * water surface"). */
export const SEA_FLOOR_Y = -10;
export const SEA_SURFACE_Y = 0;

/** Where the avatar first appears — mid-water, clear of both bounds, so
 * buoyancy/dive movement is visible either direction right away. */
export const SEA_AVATAR_SPAWN_Y = -4;

/**
 * Real positional data for sea's floating docks/wreckage — matches the
 * `RealmMap` schema's own documented intent for a realm-appropriate
 * floating element (`ARCHITECTURE.md`: "floating docks or wreckage in
 * sea"), same "one source of truth" pattern as air's
 * `AIR_FLOATING_PLATFORM_POSITIONS`: both `createSeaRealmMap`'s
 * `terrain.wreckage` and `seaScene.ts`'s meshes read from this one array,
 * so the visual and the map data can't drift apart. Scattered between the
 * floor and the surface for movement parallax while swimming.
 */
export const SEA_WRECKAGE_POSITIONS: Vec3[] = [
  { x: 6, y: -8, z: -6 },
  { x: -7, y: -3, z: -9 },
  { x: 9, y: -6, z: 5 },
  { x: -5, y: -2, z: 8 },
  { x: 3, y: -9, z: 12 },
  { x: -10, y: -5, z: -3 },
];

/**
 * The centerpiece shipwreck landmark (`BACKLOG.md`, 2026-09-08 design
 * review, supersedes the old "sea-floating-docks" item) — one large,
 * dramatic broken-ship hull + mast (`shipwreckMesh.ts`), resting on the
 * sea floor, distinct from the smaller `SEA_WRECKAGE_POSITIONS` debris
 * above (which stay untouched around it for scale/parallax). Not part of
 * `RealmMap.terrain.wreckage` — that field models the *scattered debris
 * field* the schema's own comments describe, while this is a single fixed
 * landmark, same "outside the schema, shared constant" treatment
 * `landAirPortal.ts`/`landSeaPortal.ts`'s marker positions already get.
 * Placed off to the side of the diving-house portal's straight approach
 * (`world/landSeaPortal.ts`'s `SEA_ARRIVAL_POSITION`, `{x:0, y:-4,
 * z:-15}`) so arriving from land finds it nearby without the two meshes
 * overlapping, resting directly on `SEA_FLOOR_Y`.
 */
export const SEA_SHIPWRECK_POSITION: Vec3 = { x: 8, y: SEA_FLOOR_Y, z: -17 };

/**
 * The hardcoded Phase 3 sea map — this realm's equivalent of
 * `createAirRealmMap`'s first pass: real `RealmMap` shape, no structures
 * yet (building isn't in sea's Phase 3 scope), and real floating-wreckage
 * data instead of a hardcoded array local to the scene file. `portals`
 * now has a real one — the land<->sea diving house's sea-side exit
 * (`src/world/landSeaPortal.ts`), the flavor decided in `DECISIONS.md`
 * 2026-09-07, same as land's own map before this cycle.
 */
export function createSeaRealmMap(): RealmMap {
  return {
    id: SEA_MAP_ID,
    realm: "sea",
    bounds: { width: SEA_MAP_SIZE, depth: SEA_MAP_SIZE },
    terrain: { kind: "sea-floor", floorY: SEA_FLOOR_Y, surfaceY: SEA_SURFACE_Y, wreckage: SEA_WRECKAGE_POSITIONS },
    structures: [],
    entities: [],
    portals: [SEA_LAND_PORTAL],
  };
}
