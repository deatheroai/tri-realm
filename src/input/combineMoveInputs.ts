import type { MoveInput } from "./keyboardInput";

/** Merges two move-input sources (e.g. keyboard + touch) into one, clamping combined magnitude to 1. */
export function combineMoveInputs(a: MoveInput, b: MoveInput): MoveInput {
  const x = a.moveX + b.moveX;
  const z = a.moveZ + b.moveZ;
  const length = Math.hypot(x, z);
  const scale = length > 1 ? 1 / length : 1;

  return {
    moveX: x * scale,
    moveZ: z * scale,
    run: a.run || b.run,
  };
}
