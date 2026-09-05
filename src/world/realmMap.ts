import type { Vec3 } from "../math/vec3";
import { terrainHeightAt as landHeightfieldAt } from "../land/terrain";

// Nominal reference altitude for the air realm's terrain — flight
// (src/air/airMovement.ts) has no gravity or ground collision, so
// nothing reads this for physics; kept so every TerrainField kind still
// has a real sampler, the same way land's does, rather than silently
// having none once a second realm exists.
const AIR_OPEN_VOLUME_BASELINE = 0;

/**
 * The shared `RealmMap` schema from `ARCHITECTURE.md` — the shape every
 * realm's (land/air/sea) map data conforms to, regardless of which realm
 * it is. Phase 1a proved the vertical slice with hardcoded values (a bare
 * `terrainHeightAt` call, an ad hoc `placedPieces` array in `main.ts`);
 * Phase 1b's first item is wiring the prototype to be backed by this
 * instead, so the map loader / save-load / placement-validation systems
 * described in `ARCHITECTURE.md` have one real shape to operate on.
 */

/**
 * A realm's terrain, described generically enough that a new realm can
 * add its own kind later without changing this type's consumers. Air's
 * carries `platforms` — real positional data for its floating content,
 * matching this schema's own documented intent ("air -> mostly open
 * volume + floating terrain") — replacing what was a hardcoded array
 * local to `airScene.ts` (`BACKLOG.md` Phase 2 hardening). Sea's carries
 * `floorY`/`surfaceY` — the swimmable band's vertical bounds, matching
 * this schema's own documented intent ("sea -> sea-floor depth + water
 * surface") — plus `wreckage`, real positional data for its floating
 * docks/wreckage content, same "one source of truth" pattern as air's
 * `platforms` (`BACKLOG.md` Phase 3).
 */
export type TerrainField =
  | { kind: "land-heightfield" }
  | { kind: "air-open-volume"; platforms: Vec3[] }
  | { kind: "sea-floor"; floorY: number; surfaceY: number; wreckage: Vec3[] };

/**
 * Samples a `TerrainField`'s height at a world (x, z) coordinate. This
 * function is the one place that dispatches "which realm's height
 * formula" — everything else (movement collision, ground-mesh
 * generation) goes through here rather than importing a realm's formula
 * directly, so a `RealmMap`'s `terrain` field is genuinely
 * realm-agnostic to its callers. Sea's case returns `floorY` — the sea
 * floor is the one surface a swimmer can rest on, land's closest
 * equivalent — even though `stepSeaMovement` itself takes `floorY`/
 * `surfaceY` directly rather than going through this (same as air's
 * movement never calling this for its baseline).
 */
export function sampleTerrainHeight(terrain: TerrainField, x: number, z: number): number {
  switch (terrain.kind) {
    case "land-heightfield":
      return landHeightfieldAt(x, z);
    case "air-open-volume":
      return AIR_OPEN_VOLUME_BASELINE;
    case "sea-floor":
      return terrain.floorY;
    default: {
      const exhaustive: never = terrain;
      throw new Error(`No terrain sampler for kind: ${String((exhaustive as TerrainField).kind)}`);
    }
  }
}

export interface Portal {
  id: string;
  position: Vec3;
  targetRealmMapId: string;
  targetSpawnPosition: Vec3;
  /** Flavor, not structural — e.g. "stairway", "dive-spot". See DECISIONS.md. */
  kind: string;
}

export interface PlacedStructure {
  id: string;
  type: string;
  position: Vec3;
  rotation: number;
  realmMapId: string;
  /** Which block material (`src/skins/blockMaterials.ts`) this piece was
   * built with — stored per-instance, not just picked at creation time, so
   * a reload (`src/world/realmMapStorage.ts`) can rebuild the same-looking
   * piece instead of every restored piece reverting to a default look. */
  materialId: string;
}

/** An avatar/NPC currently occupying this map. Populated at save time
 * (`src/world/realmMapStorage.ts` + `main.ts`), not synced continuously —
 * kept empty between saves rather than updated every frame for nothing
 * to read in the meantime. */
export interface EntityRef {
  id: string;
  position: Vec3;
}

export interface RealmMap {
  id: string;
  realm: "land" | "air" | "sea";
  bounds: { width: number; depth: number };
  terrain: TerrainField;
  structures: PlacedStructure[];
  entities: EntityRef[];
  portals: Portal[];
}

/**
 * Places a new structure onto a map, immutably (matches `stepLandMovement`'s
 * style: callers reassign their local binding rather than this mutating in
 * place). Generates the structure's `id`/`realmMapId` so callers only supply
 * what's actually decided at placement time (type/position/rotation).
 * Returns the placed structure alongside the updated map so a caller (e.g.
 * `main.ts`) can key a rendered mesh to it without re-deriving the id.
 */
export function addStructure(
  map: RealmMap,
  structure: Omit<PlacedStructure, "id" | "realmMapId">,
): { map: RealmMap; structure: PlacedStructure } {
  const placed: PlacedStructure = {
    ...structure,
    id: `${map.id}-structure-${map.structures.length + 1}`,
    realmMapId: map.id,
  };
  return {
    map: { ...map, structures: [...map.structures, placed] },
    structure: placed,
  };
}
