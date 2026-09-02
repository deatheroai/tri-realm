import type { RealmMap } from "../world/realmMap";
import { AIR_LAND_PORTAL } from "../world/landAirPortal";

/** Also this air map's `RealmMap.id`. */
export const AIR_MAP_ID = "air-01";

/** Square open-volume footprint — mirrors `land/landRealmMap.ts`'s
 * `LAND_MAP_SIZE`, though nothing enforces it as a hard flight boundary
 * yet (rough is fine for this first slice — see `BACKLOG.md` Phase 2). */
export const AIR_MAP_SIZE = 60;

/**
 * The hardcoded Phase 2 air map — this realm's equivalent of
 * `createLandRealmMap`'s first pass: real `RealmMap` shape, no
 * structures yet (building isn't in air's Phase 2 scope), but a real
 * portal back to land now that both ends are scoped
 * (`src/world/landAirPortal.ts`).
 */
export function createAirRealmMap(): RealmMap {
  return {
    id: AIR_MAP_ID,
    realm: "air",
    bounds: { width: AIR_MAP_SIZE, depth: AIR_MAP_SIZE },
    terrain: { kind: "air-open-volume" },
    structures: [],
    entities: [],
    portals: [AIR_LAND_PORTAL],
  };
}
