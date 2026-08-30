import type { RealmMap } from "../world/realmMap";

const LAND_MAP_ID = "land-01";

/** Square ground footprint — shared by the RealmMap's `bounds` and
 * scene.ts's rendered ground mesh so the two can't drift apart, the same
 * way `terrainHeightAt` already drives both the mesh and movement. */
export const LAND_MAP_SIZE = 50;

/**
 * The hardcoded Phase 1a land map, now expressed as a real `RealmMap`
 * instead of scattered constants. `structures` starts empty — pieces are
 * added at runtime via `addStructure` as the player places them.
 * `entities`/`portals` stay empty until they have a real consumer
 * (save/load for entities, a scoped air/sea realm for portals) — see
 * `src/world/realmMap.ts`.
 */
export function createLandRealmMap(): RealmMap {
  return {
    id: LAND_MAP_ID,
    realm: "land",
    bounds: { width: LAND_MAP_SIZE, depth: LAND_MAP_SIZE },
    terrain: { kind: "land-heightfield" },
    structures: [],
    entities: [],
    portals: [],
  };
}
