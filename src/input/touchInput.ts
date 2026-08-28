import type { MoveInput } from "./keyboardInput";

export const JOYSTICK_MAX_RADIUS = 50; // px
const RUN_THRESHOLD_FRACTION = 0.7; // drag past 70% of max radius = run

/**
 * Pure mapping from a joystick knob's screen-space drag delta (dx: right+,
 * dy: down+) to a move intent. Distance scales magnitude up to maxRadius;
 * dragging further out (past RUN_THRESHOLD_FRACTION) switches to running,
 * mirroring the keyboard's discrete walk/run split rather than introducing
 * continuous speed (stepLandMovement is unchanged either way).
 */
export function computeJoystickInput(
  dx: number,
  dy: number,
  maxRadius: number = JOYSTICK_MAX_RADIUS,
): MoveInput {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) {
    return { moveX: 0, moveZ: 0, run: false };
  }

  const magnitude = Math.min(distance / maxRadius, 1);
  const moveX = (dx / distance) * magnitude;
  const moveZ = (dy / distance) * magnitude;
  const run = distance / maxRadius >= RUN_THRESHOLD_FRACTION;

  return { moveX, moveZ, run };
}
