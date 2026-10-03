import type { Vec3 } from "../math/vec3";
import type { PlacedStructure } from "./realmMap";
import { rotatedFootprint, type FootprintLookup } from "./placementValidation";

/**
 * Axis-aligned world-space box of one placed structure, as a swimming or
 * flying avatar collides with it. Air and sea have no ground to stand on, so
 * unlike land's `StructureObstacle` (a top face to step onto) this is a full
 * solid volume the avatar is simply kept out of.
 */
export interface VolumeObstacle {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/** Radius of the avatar's collision volume (a box around its position). */
export const VOLUME_AVATAR_RADIUS = 0.3;

export function volumeObstaclesFromStructures(
  structures: readonly PlacedStructure[],
  footprintOf: FootprintLookup,
): VolumeObstacle[] {
  return structures.map((s) => {
    const f = rotatedFootprint(footprintOf(s.type), s.rotation);
    return {
      minX: s.position.x - f.width / 2,
      maxX: s.position.x + f.width / 2,
      minY: s.position.y - f.height / 2,
      maxY: s.position.y + f.height / 2,
      minZ: s.position.z - f.depth / 2,
      maxZ: s.position.z + f.depth / 2,
    };
  });
}

function insideObstacle(o: VolumeObstacle, p: Vec3): boolean {
  const r = VOLUME_AVATAR_RADIUS;
  return (
    p.x > o.minX - r &&
    p.x < o.maxX + r &&
    p.y > o.minY - r &&
    p.y < o.maxY + r &&
    p.z > o.minZ - r &&
    p.z < o.maxZ + r
  );
}

export interface VolumeMoveResult {
  position: Vec3;
  /** Per axis: true if that axis's move was rejected by an obstacle. */
  blocked: { x: boolean; y: boolean; z: boolean };
}

/**
 * Moves from `from` to `to` one axis at a time, rejecting any axis step that
 * would enter an obstacle — so the avatar slides along a face instead of
 * stopping dead. A step that starts already inside an obstacle (a piece placed
 * on top of the avatar) is never blocked, so the avatar can always leave.
 */
export function resolveVolumeMove(
  obstacles: readonly VolumeObstacle[],
  from: Vec3,
  to: Vec3,
): VolumeMoveResult {
  const position: Vec3 = { ...from };
  const blocked = { x: false, y: false, z: false };
  for (const axis of ["x", "y", "z"] as const) {
    if (to[axis] === from[axis]) continue;
    const candidate: Vec3 = { ...position, [axis]: to[axis] };
    const hit = obstacles.some((o) => insideObstacle(o, candidate) && !insideObstacle(o, position));
    if (hit) blocked[axis] = true;
    else position[axis] = to[axis];
  }
  return { position, blocked };
}
