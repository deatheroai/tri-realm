import type { Vec3 } from "../math/vec3";
import type { MoveInput } from "../input/keyboardInput";
import { resolveVolumeMove, type VolumeObstacle } from "../world/volumeCollision";

export interface AirMovementState {
  position: Vec3;
  velocity: Vec3;
}

const MAX_SPEED = 5; // m/s, horizontal
const BOOST_MAX_SPEED = 9; // m/s, horizontal while running/boosting
const MAX_VERTICAL_SPEED = 4; // m/s
const ACCEL_RESPONSIVENESS = 3; // higher = snappier response to input changes

/**
 * Advances flight by one frame. Free 3D movement — no gravity, no ground
 * collision (air is "mostly open volume", ARCHITECTURE.md) — driven by
 * the same `MoveInput` land uses for its horizontal axes (`moveX`/`moveZ`,
 * `run` doubling as "boost" here) plus a separate vertical axis
 * (`src/input/verticalInput.ts`) land has no equivalent of.
 *
 * Unlike `stepLandMovement`'s directly-controlled walk/run, velocity here
 * exponentially approaches a target velocity derived from input rather
 * than snapping to it — air's distinct "lift/momentum" feel
 * (ARCHITECTURE.md) instead of land's snappier movement. The exponential
 * form is frame-rate independent, same technique as `smoothingFactor`
 * (followCamera.ts).
 *
 * `obstacles` (placed structures, `src/world/volumeCollision.ts`) are solid:
 * a blocked axis is rejected (sliding along the face) and its velocity zeroed.
 */
export function stepAirMovement(
  state: AirMovementState,
  input: MoveInput,
  vertical: number,
  dt: number,
  obstacles: readonly VolumeObstacle[] = [],
): AirMovementState {
  const maxSpeed = input.run ? BOOST_MAX_SPEED : MAX_SPEED;

  // Normalize so diagonal input isn't faster than a single cardinal direction.
  const inputLength = Math.hypot(input.moveX, input.moveZ);
  const moveMagnitude = Math.min(inputLength, 1);
  const dirX = inputLength > 0 ? input.moveX / inputLength : 0;
  const dirZ = inputLength > 0 ? input.moveZ / inputLength : 0;

  const targetVelocity: Vec3 = {
    x: dirX * maxSpeed * moveMagnitude,
    y: vertical * MAX_VERTICAL_SPEED,
    z: dirZ * maxSpeed * moveMagnitude,
  };

  const t = 1 - Math.exp(-ACCEL_RESPONSIVENESS * dt);
  const velocity: Vec3 = {
    x: state.velocity.x + (targetVelocity.x - state.velocity.x) * t,
    y: state.velocity.y + (targetVelocity.y - state.velocity.y) * t,
    z: state.velocity.z + (targetVelocity.z - state.velocity.z) * t,
  };

  const moved = resolveVolumeMove(obstacles, state.position, {
    x: state.position.x + velocity.x * dt,
    y: state.position.y + velocity.y * dt,
    z: state.position.z + velocity.z * dt,
  });

  return {
    position: moved.position,
    velocity: {
      x: moved.blocked.x ? 0 : velocity.x,
      y: moved.blocked.y ? 0 : velocity.y,
      z: moved.blocked.z ? 0 : velocity.z,
    },
  };
}
