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

  const nextX = state.position.x + dirX * speed * moveMagnitude * dt;
  const nextZ = state.position.z + dirZ * speed * moveMagnitude * dt;

  const groundY = groundHeightAt(nextX, nextZ);
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
