import type { Vec3 } from "../math/vec3";
import type { RealmMap } from "../world/realmMap";
import type { TerrainPlacementRule } from "../world/placementValidation";
import { AIR_LAND_PORTAL, AIR_LAND_STAIRWAY_PORTAL } from "../world/landAirPortal";

/** Also this air map's `RealmMap.id`. */
export const AIR_MAP_ID = "air-01";

/** Square open-volume footprint — mirrors `land/landRealmMap.ts`'s
 * `LAND_MAP_SIZE`, though nothing enforces it as a hard flight boundary
 * yet (rough is fine for this first slice — see `BACKLOG.md` Phase 2). */
export const AIR_MAP_SIZE = 60;

/**
 * Real positional data for air's floating platforms — matches the
 * `RealmMap` schema's own documented intent for air's terrain ("mostly
 * open volume + floating terrain"). Previously a hardcoded array local
 * to `airScene.ts`; both that file's meshes and `createAirRealmMap`'s
 * `terrain.platforms` below now read from this one array, so the visual
 * and the map data can't drift apart (same "one source of truth" pattern
 * as `terrainHeightAt` or `landAirPortal.ts`'s shared positions).
 */
export const AIR_FLOATING_PLATFORM_POSITIONS: Vec3[] = [
  { x: 6, y: 2, z: -8 },
  { x: -8, y: 6, z: -4 },
  { x: 10, y: -3, z: 6 },
  { x: -6, y: 8, z: 8 },
  { x: 3, y: 12, z: 14 },
  { x: -12, y: -2, z: -10 },
];

/**
 * The hardcoded Phase 2 air map — this realm's equivalent of
 * `createLandRealmMap`'s first pass: real `RealmMap` shape, real portals
 * back to land now that both ends are scoped (`src/world/landAirPortal.ts`
 * — the original balloon plus its stairway second flavor, `DECISIONS.md`
 * 2026-09-02), and real floating-platform data instead of the visual-only
 * hardcoded array this replaced. `structures`/`entities` start empty,
 * same as every other realm's map before anything's been saved — air now
 * plugs into the same `addStructure`/`realmMapStorage.ts` pipeline
 * land/sea already use (`BACKLOG.md`, "air construction/placement").
 */
export function createAirRealmMap(): RealmMap {
  return {
    id: AIR_MAP_ID,
    realm: "air",
    bounds: { width: AIR_MAP_SIZE, depth: AIR_MAP_SIZE },
    terrain: { kind: "air-open-volume", platforms: AIR_FLOATING_PLATFORM_POSITIONS },
    structures: [],
    entities: [],
    portals: [AIR_LAND_PORTAL, AIR_LAND_STAIRWAY_PORTAL],
  };
}

/**
 * Air's placement terrain rule (`src/world/placementValidation.ts`) —
 * trivially true, same as land's (`landTerrainPlacementRule`): air's
 * "mostly open volume" terrain (`ARCHITECTURE.md`) has no natural bound to
 * reject a placement against, unlike sea's real swimmable-band check
 * (`seaTerrainPlacementRule`). Kept as a real function rather than inlined,
 * so a future bounded-volume feature only changes this, and air plugs into
 * the exact same `validatePlacement` call shape land/sea already do.
 */
export const airTerrainPlacementRule: TerrainPlacementRule = () => true;
