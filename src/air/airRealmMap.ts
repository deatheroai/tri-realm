import type { RealmMap } from "../world/realmMap";

/** Also this air map's `RealmMap.id`. */
export const AIR_MAP_ID = "air-01";

/** Square open-volume footprint — mirrors `land/landRealmMap.ts`'s
 * `LAND_MAP_SIZE`, though nothing enforces it as a hard flight boundary
 * yet (rough is fine for this first slice — see `BACKLOG.md` Phase 2). */
export const AIR_MAP_SIZE = 60;

/**
 * The hardcoded Phase 2 air map — this realm's equivalent of
 * `createLandRealmMap`'s first pass: real `RealmMap` shape, no portals or
 * structures yet (building isn't in air's Phase 2 scope; portals need a
 * scoped source/target on both ends).
 */
export function createAirRealmMap(): RealmMap {
  return {
    id: AIR_MAP_ID,
    realm: "air",
    bounds: { width: AIR_MAP_SIZE, depth: AIR_MAP_SIZE },
    terrain: { kind: "air-open-volume" },
    structures: [],
    entities: [],
    portals: [],
  };
}
