/** Merges two vertical-input sources (e.g. keyboard + touch) into one, clamped to -1..1 — mirrors combineMoveInputs.ts's role for the horizontal axis. */
export function combineVerticalInputs(a: number, b: number): number {
  return Math.max(-1, Math.min(1, a + b));
}
