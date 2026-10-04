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

export type PlacementRejectionReason =
  | "out-of-bounds"
  | "overlaps-structure"
  | "blocks-portal"
  | "terrain-not-suitable";

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

// A `PlacedStructure.rotation` is a yaw around Y, but every catalog entry's
// `dimensions` are authored axis-aligned (unrotated) — so an overlap check
// against a rotated piece needs its *effective* (world-axis) footprint, not
// its authored one. Only quarter turns are supported (main.ts's own rotate
// control only ever cycles in 90° steps), which keeps this exact rather
// than needing a real oriented-bounding-box check: a quarter turn simply
// swaps which authored axis (width vs. depth) now runs along world X vs. Z.
export function rotatedFootprint(footprint: StructureFootprint, rotation: number): StructureFootprint {
  const TAU = Math.PI * 2;
  const normalized = ((rotation % TAU) + TAU) % TAU;
  const quarterTurns = Math.round(normalized / (Math.PI / 2));
  const swapped = quarterTurns % 2 === 1;
  return swapped ? { width: footprint.depth, height: footprint.height, depth: footprint.width } : footprint;
}

// How close (world units) a piece's box may come to a portal's center.
// Deliberately tighter than the avatar's trigger radius (2): the point is
// to stop a piece landing *on* the portal, not to exclude everything the
// avatar could trigger it from — a wider keep-out would reject ordinary
// clicks on the open ground around a portal for no gameplay benefit.
export const PORTAL_KEEP_OUT_RADIUS = 1;

// True when any part of the candidate's box is within `PORTAL_KEEP_OUT_RADIUS`
// of a portal. Placed structures are solid to every realm's avatar now (see
// `src/land/structureCollision.ts`, `src/world/volumeCollision.ts`), so a
// piece dropped on a portal would wall it off with no way to undo short of
// KeyX — and a whole ring of them could permanently strand the avatar.
function blocksPortal(map: RealmMap, position: Vec3, footprint: StructureFootprint): boolean {
  return map.portals.some((portal) => {
    const dx = Math.max(Math.abs(portal.position.x - position.x) - footprint.width / 2, 0);
    const dy = Math.max(Math.abs(portal.position.y - position.y) - footprint.height / 2, 0);
    const dz = Math.max(Math.abs(portal.position.z - position.z) - footprint.depth / 2, 0);
    return Math.hypot(dx, dy, dz) <= PORTAL_KEEP_OUT_RADIUS;
  });
}

/**
 * Checks whether `type` can be placed at `position`, rotated `rotation`
 * radians around Y, on `map`: within its bounds, not overlapping an
 * existing structure (a true 3D check against each structure's own
 * *effective*, rotation-adjusted footprint, so stacking one piece directly
 * atop another is still allowed — only a genuine overlap is rejected), and
 * accepted by the realm's own terrain rule. `position` is a structure's
 * center, matching how placed meshes are actually positioned
 * (`src/land/placement.ts`).
 */
export function validatePlacement(
  map: RealmMap,
  type: string,
  position: Vec3,
  rotation: number,
  footprintOf: FootprintLookup,
  terrainRule: TerrainPlacementRule,
): PlacementCheck {
  const footprint = rotatedFootprint(footprintOf(type), rotation);

  const halfWidth = map.bounds.width / 2;
  const halfDepth = map.bounds.depth / 2;
  if (position.x < -halfWidth || position.x > halfWidth || position.z < -halfDepth || position.z > halfDepth) {
    return { valid: false, reason: "out-of-bounds" };
  }

  const overlapsExisting = map.structures.some((existing) =>
    footprintsOverlap(
      position,
      footprint,
      existing.position,
      rotatedFootprint(footprintOf(existing.type), existing.rotation),
    ),
  );
  if (overlapsExisting) {
    return { valid: false, reason: "overlaps-structure" };
  }

  if (blocksPortal(map, position, footprint)) {
    return { valid: false, reason: "blocks-portal" };
  }

  if (!terrainRule(map, position)) {
    return { valid: false, reason: "terrain-not-suitable" };
  }

  return { valid: true };
}
