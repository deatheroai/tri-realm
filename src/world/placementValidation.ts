import type { Vec3 } from "../math/vec3";
import type { RealmMap } from "./realmMap";

/**
 * Structure placement validation from `ARCHITECTURE.md`'s "Construction
 * system": checks a proposed `PlacedStructure` against a `RealmMap`'s
 * bounds and existing structures, plus a realm-supplied terrain rule.
 * Written once, realm-agnostic — a realm plugs in its own catalog
 * (`footprintOf`) and rule set (`terrainRule`) rather than this file
 * knowing anything about castles or land specifically.
 */

export interface StructureFootprint {
  width: number;
  height: number;
  depth: number;
}

/** Looks up a structure type's footprint from whichever catalog the
 * calling realm supplies (e.g. `src/land/castleStructures.ts`). */
export type FootprintLookup = (type: string) => StructureFootprint;

/** A realm's own placement rule (e.g. "not on open water" for sea).
 * Land's is trivially true today — see `src/land/landRealmMap.ts`. */
export type TerrainPlacementRule = (map: RealmMap, position: Vec3) => boolean;

export type PlacementRejectionReason = "out-of-bounds" | "overlaps-structure" | "terrain-not-suitable";

export type PlacementCheck = { valid: true } | { valid: false; reason: PlacementRejectionReason };

// Placements exactly touching (e.g. one piece stacked directly on top of
// another, base flush with the top face below) must NOT count as
// overlapping — only genuine overlap should. A tiny epsilon absorbs
// floating-point noise from bounding-box math without letting real
// overlaps slip through (footprints here are on the order of ~1 unit).
const TOUCHING_EPSILON = 1e-4;

function axisOverlaps(centerA: number, sizeA: number, centerB: number, sizeB: number): boolean {
  return Math.abs(centerA - centerB) < sizeA / 2 + sizeB / 2 - TOUCHING_EPSILON;
}

function footprintsOverlap(
  positionA: Vec3,
  footprintA: StructureFootprint,
  positionB: Vec3,
  footprintB: StructureFootprint,
): boolean {
  return (
    axisOverlaps(positionA.x, footprintA.width, positionB.x, footprintB.width) &&
    axisOverlaps(positionA.y, footprintA.height, positionB.y, footprintB.height) &&
    axisOverlaps(positionA.z, footprintA.depth, positionB.z, footprintB.depth)
  );
}

/**
 * Checks whether `type` can be placed at `position` on `map`: within its
 * bounds, not overlapping an existing structure (a true 3D check, so
 * stacking one piece directly atop another is still allowed — only a
 * genuine overlap is rejected), and accepted by the realm's own terrain
 * rule. `position` is a structure's center, matching how placed meshes
 * are actually positioned (`src/land/placement.ts`).
 */
export function validatePlacement(
  map: RealmMap,
  type: string,
  position: Vec3,
  footprintOf: FootprintLookup,
  terrainRule: TerrainPlacementRule,
): PlacementCheck {
  const footprint = footprintOf(type);

  const halfWidth = map.bounds.width / 2;
  const halfDepth = map.bounds.depth / 2;
  if (position.x < -halfWidth || position.x > halfWidth || position.z < -halfDepth || position.z > halfDepth) {
    return { valid: false, reason: "out-of-bounds" };
  }

  const overlapsExisting = map.structures.some((existing) =>
    footprintsOverlap(position, footprint, existing.position, footprintOf(existing.type)),
  );
  if (overlapsExisting) {
    return { valid: false, reason: "overlaps-structure" };
  }

  if (!terrainRule(map, position)) {
    return { valid: false, reason: "terrain-not-suitable" };
  }

  return { valid: true };
}
