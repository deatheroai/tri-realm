import type { RealmMap } from "../world/realmMap";
import type { TerrainPlacementRule } from "../world/placementValidation";

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

/**
 * Land's placement terrain rule (`src/world/placementValidation.ts`) —
 * trivially true today, since the current rolling-hill terrain is
 * uniformly walkable with no water/cliffs to exclude (the same gap
 * `DECISIONS.md` deferred for movement: no "too steep to build/climb"
 * concept yet). Kept as a real function, not inlined at the call site, so
 * a future terrain feature only changes this, and sea's real rule (e.g.
 * "not on open water") plugs into the exact same `validatePlacement` call
 * shape land's does.
 */
export const landTerrainPlacementRule: TerrainPlacementRule = () => true;
