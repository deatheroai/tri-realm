import type { Vec3 } from "../math/vec3";
import type { MoveInput } from "../input/keyboardInput";

export interface SeaMovementState {
  position: Vec3;
  velocity: Vec3;
}

const MAX_SPEED = 2.4; // m/s, horizontal — slower than land/air: water resistance
const KICK_MAX_SPEED = 4; // m/s, horizontal while running/"kicking" harder
const HORIZONTAL_RESPONSIVENESS = 1.4; // lower than air's — water drag makes accel sluggish

const VERTICAL_SWIM_SPEED = 2; // m/s, active dive/surface speed from vertical input
const BUOYANCY_DRIFT_SPEED = 0.5; // m/s, passive drift toward the surface with no vertical input
const VERTICAL_RESPONSIVENESS = 1.8;

/**
 * Advances swimming by one frame. Reuses the same `MoveInput`/vertical-axis
 * shapes air does (`moveX`/`moveZ`, `run` as a stronger "kick",
 * `src/input/verticalInput.ts`'s dive/surface axis), but sea's actual feel
 * is its own — "resistance and vertical drift distinct from both land and
 * air" (`ARCHITECTURE.md`):
 *
 * - Horizontal accelerates toward a target speed more sluggishly than
 *   flight does (`HORIZONTAL_RESPONSIVENESS` < air's) and tops out lower —
 *   reads as water resistance, not just "air with smaller numbers."
 * - Vertical isn't purely input-driven like air's: with no vertical input
 *   held, buoyancy passively drifts the swimmer toward the surface
 *   (`BUOYANCY_DRIFT_SPEED`) rather than holding position — genuine
 *   "vertical drift" air has none of. Active dive/surface input overrides
 *   that drift outright rather than adding to it.
 * - Bounded, unlike air's free volume: position clamps to the swimmable
 *   band between `floorY` (the sea floor) and `surfaceY` (the water
 *   surface), and vertical velocity zeroes out on hitting either bound
 *   instead of accumulating into a wasted push against it.
 */
export function stepSeaMovement(
  state: SeaMovementState,
  input: MoveInput,
  vertical: number,
  dt: number,
  floorY: number,
  surfaceY: number,
): SeaMovementState {
  const maxSpeed = input.run ? KICK_MAX_SPEED : MAX_SPEED;

  // Normalize so diagonal input isn't faster than a single cardinal direction.
  const inputLength = Math.hypot(input.moveX, input.moveZ);
  const moveMagnitude = Math.min(inputLength, 1);
  const dirX = inputLength > 0 ? input.moveX / inputLength : 0;
  const dirZ = inputLength > 0 ? input.moveZ / inputLength : 0;

  const targetVelocityX = dirX * maxSpeed * moveMagnitude;
  const targetVelocityZ = dirZ * maxSpeed * moveMagnitude;
  const targetVelocityY = vertical !== 0 ? vertical * VERTICAL_SWIM_SPEED : BUOYANCY_DRIFT_SPEED;

  const horizontalT = 1 - Math.exp(-HORIZONTAL_RESPONSIVENESS * dt);
  const verticalT = 1 - Math.exp(-VERTICAL_RESPONSIVENESS * dt);

  const velocity: Vec3 = {
    x: state.velocity.x + (targetVelocityX - state.velocity.x) * horizontalT,
    y: state.velocity.y + (targetVelocityY - state.velocity.y) * verticalT,
    z: state.velocity.z + (targetVelocityZ - state.velocity.z) * horizontalT,
  };

  const uncappedY = state.position.y + velocity.y * dt;
  const cappedY = Math.min(Math.max(uncappedY, floorY), surfaceY);
  // Hitting a bound stops further push against it, rather than banking
  // velocity that'd otherwise cause a delayed, unintuitive "un-clamp" jump
  // the next frame vertical/buoyancy pressure eases off.
  const hitBound = cappedY !== uncappedY;

  return {
    position: {
      x: state.position.x + velocity.x * dt,
      y: cappedY,
      z: state.position.z + velocity.z * dt,
    },
    velocity: hitBound ? { ...velocity, y: 0 } : velocity,
  };
}
