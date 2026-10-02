import type { Vec3 } from "../math/vec3";
import type { MoveInput } from "../input/keyboardInput";
import {
  movementBlocked,
  standableTopAt,
  type StructureObstacle,
} from "./structureCollision";

export interface LandMovementState {
  /** Ground-contact position: y is the avatar's feet height, not a mesh offset. */
  position: Vec3;
  velocityY: number;
}

const WALK_SPEED = 4; // m/s
const RUN_SPEED = 7.5; // m/s
const GRAVITY = -18; // m/s^2
const JUMP_SPEED = 7; // m/s upward impulse — peaks ~1.36 units, a modest hop

/**
 * Max climbable grade (rise/run) before a slope reads as "a wall," not
 * terrain — 1.0 is a 45° face. Comfortably above `terrainHeightAt`'s own
 * worst-case local grade (well under 0.5 by construction, per its own
 * "stays within a walkable range" test) so today's rolling hills are
 * completely unaffected; exists to stop a *literal* cliff or wall (a
 * heightfield with a near-vertical face) from being climbed for free, per
 * the gap this was deliberately deferred against (`ARCHITECTURE.md`,
 * `DECISIONS.md`). Only gates climbing (moving toward higher ground) —
 * walking off a ledge into a steep drop is left alone, since that's
 * already handled correctly by gravity below (the avatar falls instead of
 * snapping down to the new, lower ground instantly).
 */
const MAX_CLIMB_GRADE = 1.0;

/**
 * Advances land movement by one frame: horizontal walk/run driven by input,
 * vertical motion driven by gravity and clamped to the ground height at the
 * avatar's new position. `groundHeightAt` is intentionally a callback rather
 * than a flat constant — Phase 1a's next item swaps a real heightfield in
 * here without this function changing.
 *
 * `jumpPressed` (defaults to false so every pre-existing caller/test is
 * unaffected) only takes effect while grounded (`velocityY === 0`, the exact
 * value the ground clamp below always leaves it at) — holding the key does
 * nothing further mid-air, no double-jump or hover, matching
 * `ARCHITECTURE.md`'s "walk/run, gravity, ground collision, jump" summary
 * for the land module, which this closes (that line predated any actual
 * jump implementation).
 *
 * `obstacles` (placed structures, see `structureCollision.ts`) default to none.
 * A structure taller than `STEP_HEIGHT` above the avatar's feet blocks
 * horizontal movement into it (sliding along it on one axis if possible); a
 * lower one is stepped or jumped onto and stood on.
 */
export function stepLandMovement(
  state: LandMovementState,
  input: MoveInput,
  groundHeightAt: (x: number, z: number) => number,
  dt: number,
  jumpPressed: boolean = false,
  obstacles: readonly StructureObstacle[] = [],
): LandMovementState {
  const speed = input.run ? RUN_SPEED : WALK_SPEED;

  // Normalize so diagonal input isn't faster than a single cardinal direction.
  const inputLength = Math.hypot(input.moveX, input.moveZ);
  const moveMagnitude = Math.min(inputLength, 1);
  const dirX = inputLength > 0 ? input.moveX / inputLength : 0;
  const dirZ = inputLength > 0 ? input.moveZ / inputLength : 0;

  const stepX = dirX * speed * moveMagnitude * dt;
  const stepZ = dirZ * speed * moveMagnitude * dt;
  const feetY = state.position.y;
  const { x: fromX, z: fromZ } = state.position;
  let candidateX = fromX + stepX;
  let candidateZ = fromZ + stepZ;
  if (movementBlocked(obstacles, fromX, fromZ, candidateX, candidateZ, feetY)) {
    // Slide along the obstacle: keep whichever single axis is still free.
    if (!movementBlocked(obstacles, fromX, fromZ, candidateX, fromZ, feetY)) {
      candidateZ = fromZ;
    } else if (!movementBlocked(obstacles, fromX, fromZ, fromX, candidateZ, feetY)) {
      candidateX = fromX;
    } else {
      candidateX = fromX;
      candidateZ = fromZ;
    }
  }

  const currentGroundY = groundHeightAt(state.position.x, state.position.z);
  const candidateGroundY = groundHeightAt(candidateX, candidateZ);
  const horizontalDistance = Math.hypot(candidateX - state.position.x, candidateZ - state.position.z);
  const climbGrade =
    horizontalDistance > 0 ? (candidateGroundY - currentGroundY) / horizontalDistance : 0;

  // Terrain-face collision: a climb steeper than MAX_CLIMB_GRADE blocks the
  // horizontal move entirely (like hitting a wall) instead of snapping the
  // avatar up to the new height, which is what let a literal cliff be
  // climbed for free before this check existed.
  const blocked = climbGrade > MAX_CLIMB_GRADE;
  const nextX = blocked ? state.position.x : candidateX;
  const nextZ = blocked ? state.position.z : candidateZ;
  // Standing on a structure's top face raises the ground under the avatar.
  const structureTop = standableTopAt(obstacles, nextX, nextZ, feetY);
  const terrainY = blocked ? currentGroundY : candidateGroundY;
  const groundY = structureTop === undefined ? terrainY : Math.max(terrainY, structureTop);

  const isGrounded = state.velocityY === 0;
  let velocityY =
    jumpPressed && isGrounded ? JUMP_SPEED : state.velocityY + GRAVITY * dt;
  let nextY = state.position.y + velocityY * dt;

  if (nextY <= groundY) {
    nextY = groundY;
    velocityY = 0;
  }

  return {
    position: { x: nextX, y: nextY, z: nextZ },
    velocityY,
  };
}
