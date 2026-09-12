import type { Vec3 } from "../math/vec3";
import type { MoveInput } from "../input/keyboardInput";

export interface LandMovementState {
  /** Ground-contact position: y is the avatar's feet height, not a mesh offset. */
  position: Vec3;
  velocityY: number;
}

const WALK_SPEED = 4; // m/s
const RUN_SPEED = 7.5; // m/s
const GRAVITY = -18; // m/s^2

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
 */
export function stepLandMovement(
  state: LandMovementState,
  input: MoveInput,
  groundHeightAt: (x: number, z: number) => number,
  dt: number,
): LandMovementState {
  const speed = input.run ? RUN_SPEED : WALK_SPEED;

  // Normalize so diagonal input isn't faster than a single cardinal direction.
  const inputLength = Math.hypot(input.moveX, input.moveZ);
  const moveMagnitude = Math.min(inputLength, 1);
  const dirX = inputLength > 0 ? input.moveX / inputLength : 0;
  const dirZ = inputLength > 0 ? input.moveZ / inputLength : 0;

  const candidateX = state.position.x + dirX * speed * moveMagnitude * dt;
  const candidateZ = state.position.z + dirZ * speed * moveMagnitude * dt;

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
  const groundY = blocked ? currentGroundY : candidateGroundY;

  let velocityY = state.velocityY + GRAVITY * dt;
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
