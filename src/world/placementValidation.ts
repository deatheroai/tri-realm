import type { Vec3 } from "../math/vec3";
import type { RealmMap } from "./realmMap";
import { arrivalPointsFor } from "./portalArrivals";

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
  | "blocks-avatar"
  | "blocks-scenery"
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

// Rough avatar body used to keep a new piece from materializing around the
// player: a vertical capsule-ish box from the feet up. Horizontal radius
// matches the land collision radius (`AVATAR_RADIUS`, kept literal here so
// this realm-agnostic file doesn't import from `src/land/`).
export const AVATAR_KEEP_OUT_RADIUS = 0.3;
export const AVATAR_KEEP_OUT_HEIGHT = 1.8;

// True when the avatar's body would intersect the candidate's box. A piece
// the avatar is standing exactly on top of (feet flush with its top face)
// does not intersect — only one that would swallow part of the body does.
function blocksAvatar(avatarPosition: Vec3, position: Vec3, footprint: StructureFootprint): boolean {
  return (
    axisOverlaps(position.x, footprint.width, avatarPosition.x, AVATAR_KEEP_OUT_RADIUS * 2) &&
    axisOverlaps(position.z, footprint.depth, avatarPosition.z, AVATAR_KEEP_OUT_RADIUS * 2) &&
    avatarPosition.y < position.y + footprint.height / 2 - TOUCHING_EPSILON &&
    avatarPosition.y + AVATAR_KEEP_OUT_HEIGHT > position.y - footprint.height / 2 + TOUCHING_EPSILON
  );
}

/** A solid piece of non-placed scenery (a tree trunk, a fountain basin) as
 * an axis-aligned column from the ground up to `topY`. Structurally the same
 * as `src/land/structureCollision.ts`'s `StructureObstacle`, restated here so
 * this realm-agnostic file doesn't import from `src/land/`. */
export interface SceneryBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  topY: number;
}

// True when the candidate's box overlaps a scenery column. Scenery has no
// underside (it rises from the ground), so a piece resting exactly on a
// column's top face (its base flush with `topY`) does not count.
function blocksScenery(scenery: readonly SceneryBox[], position: Vec3, footprint: StructureFootprint): boolean {
  return scenery.some(
    (box) =>
      axisOverlaps(position.x, footprint.width, (box.minX + box.maxX) / 2, box.maxX - box.minX) &&
      axisOverlaps(position.z, footprint.depth, (box.minZ + box.maxZ) / 2, box.maxZ - box.minZ) &&
      position.y - footprint.height / 2 < box.topY - TOUCHING_EPSILON,
  );
}

// Portal arrival spots count as "blocks-portal" too: a piece on one would
// entomb whoever next walks through the portal.
function blocksPortalOrArrival(map: RealmMap, position: Vec3, footprint: StructureFootprint): boolean {
  return (
    blocksPortal(map, position, footprint) ||
    arrivalPointsFor(map.id).some((arrival) => blocksAvatar(arrival, position, footprint))
  );
}

/**
 * Drops any placed structure that sits on a portal or one of its arrival
 * spots. Saves made before those placement rules existed (or hand-edited
 * ones) can hold such pieces; since every realm's avatar now collides with
 * placed structures, loading one would wall off a portal or entomb the next
 * traveller. Returns `map` itself (same identity) when nothing needs to go.
 */
export function withoutPortalBlockingStructures(map: RealmMap, footprintOf: FootprintLookup): RealmMap {
  const kept = map.structures.filter(
    (s) => !blocksPortalOrArrival(map, s.position, rotatedFootprint(footprintOf(s.type), s.rotation)),
  );
  return kept.length === map.structures.length ? map : { ...map, structures: kept };
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
  avatarPosition?: Vec3,
  scenery: readonly SceneryBox[] = [],
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

  if (blocksPortalOrArrival(map, position, footprint)) {
    return { valid: false, reason: "blocks-portal" };
  }

  if (avatarPosition && blocksAvatar(avatarPosition, position, footprint)) {
    return { valid: false, reason: "blocks-avatar" };
  }

  if (blocksScenery(scenery, position, footprint)) {
    return { valid: false, reason: "blocks-scenery" };
  }

  if (!terrainRule(map, position)) {
    return { valid: false, reason: "terrain-not-suitable" };
  }

  return { valid: true };
}
