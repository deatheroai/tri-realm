import type { PlacedStructure } from "../world/realmMap";
import {
  rotatedFootprint,
  type FootprintLookup,
} from "../world/placementValidation";

/**
 * Axis-aligned world-space box of one placed structure, as the land avatar
 * collides with it. Built from `PlacedStructure`s plus a realm's own
 * footprint catalog, so any catalog entry (and its rotation) is covered
 * without per-type code.
 */
export interface StructureObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** World height of the top face — what the avatar can stand on. */
  topY: number;
}

/** Horizontal radius of the avatar's own footprint. */
export const AVATAR_RADIUS = 0.3;

/** Max rise the avatar steps up onto without jumping (like a curb). */
export const STEP_HEIGHT = 0.4;

export function obstaclesFromStructures(
  structures: readonly PlacedStructure[],
  footprintOf: FootprintLookup,
): StructureObstacle[] {
  return structures.map((s) => {
    const f = rotatedFootprint(footprintOf(s.type), s.rotation);
    return {
      minX: s.position.x - f.width / 2,
      maxX: s.position.x + f.width / 2,
      minZ: s.position.z - f.depth / 2,
      maxZ: s.position.z + f.depth / 2,
      topY: s.position.y + f.height / 2,
    };
  });
}

/** True if a point (inflated by the avatar's radius) lies over the obstacle. */
export function overlapsObstacle(o: StructureObstacle, x: number, z: number): boolean {
  return (
    x > o.minX - AVATAR_RADIUS &&
    x < o.maxX + AVATAR_RADIUS &&
    z > o.minZ - AVATAR_RADIUS &&
    z < o.maxZ + AVATAR_RADIUS
  );
}

/**
 * Highest top face at (x, z) the avatar can stand on given its feet height —
 * i.e. low enough to step up onto, or already below the avatar. Undefined if none.
 */
export function standableTopAt(
  obstacles: readonly StructureObstacle[],
  x: number,
  z: number,
  feetY: number,
): number | undefined {
  let best: number | undefined;
  for (const o of obstacles) {
    if (o.topY <= feetY + STEP_HEIGHT && overlapsObstacle(o, x, z)) {
      if (best === undefined || o.topY > best) best = o.topY;
    }
  }
  return best;
}

/**
 * True if moving from (fromX, fromZ) to (toX, toZ) at this feet height would
 * enter an obstacle too tall to step onto. A move that starts already inside
 * one (e.g. a piece placed on top of the avatar) is never blocked, so the
 * avatar can always walk out.
 */
export function movementBlocked(
  obstacles: readonly StructureObstacle[],
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  feetY: number,
): boolean {
  return obstacles.some(
    (o) =>
      o.topY > feetY + STEP_HEIGHT &&
      overlapsObstacle(o, toX, toZ) &&
      !overlapsObstacle(o, fromX, fromZ),
  );
}
