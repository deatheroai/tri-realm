import type { Vec3 } from "../math/vec3";
import { terrainHeightAt as landHeightfieldAt } from "../land/terrain";

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
 * A realm's terrain, described generically enough that air/sea can add
 * their own kinds later without changing this type's consumers. Land is
 * the only realm built so far, so there's exactly one variant.
 */
export type TerrainField = { kind: "land-heightfield" };

/**
 * Samples a `TerrainField`'s height at a world (x, z) coordinate. This
 * function is the one place that dispatches "which realm's height
 * formula" — everything else (movement collision, ground-mesh
 * generation) goes through here rather than importing a realm's formula
 * directly, so a `RealmMap`'s `terrain` field is genuinely
 * realm-agnostic to its callers. Air/sea add a `case` here once they're
 * scoped (`BACKLOG.md` Phase 2/3), matching how `ARCHITECTURE.md`
 * describes systems being "written once and reused by all three realms."
 */
export function sampleTerrainHeight(terrain: TerrainField, x: number, z: number): number {
  switch (terrain.kind) {
    case "land-heightfield":
      return landHeightfieldAt(x, z);
    default: {
      const exhaustive: never = terrain.kind;
      throw new Error(`No terrain sampler for kind: ${String(exhaustive)}`);
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

/** An avatar/NPC currently occupying this map. Not yet populated for the
 * player avatar — that starts once save/load (BACKLOG.md Phase 1b) gives
 * it a consumer; keeping it empty until then avoids syncing it every
 * frame for nothing to read. */
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
