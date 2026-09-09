import type { MoveAnimationState } from "../skins/avatarSkins";

/**
 * Air-specific animation-state mapping (Phase 2 `todo`, `BACKLOG.md`,
 * "Air-specific animation/pitch parity with Sea"): land/air both used to
 * share `moveInputToAnimationState` (`src/skins/avatarSkins.ts`), which
 * only looks at horizontal move intent — correct for land, wrong for air.
 * Ascending/descending in place (`vertical !== 0`,
 * `src/input/verticalInput.ts`) with zero horizontal input is real,
 * player-driven flight, not idle hovering — the generic mapping was
 * scoring that as "idle," so the avatar visibly stopped animating while
 * the player was actively climbing or diving straight up or down.
 *
 * Simpler than sea's equivalent (`moveInputToSeaAnimationState`): air has
 * no passive-drift exception to carve out — `stepAirMovement` never moves
 * the avatar vertically unless the player is actually holding the
 * vertical axis (no buoyancy), so `vertical !== 0` alone is always real
 * input, never a background nudge that should still read as idle.
 *
 * Still resolves to the same shared `idle`/`walk`/`run` clip names every
 * bundled skin already has — no skin has a distinct "flying" clip to map
 * a fourth state onto, so this function's own job stays purely *when* air
 * shows motion, not *which* clip plays for it. See `main.ts`'s air branch
 * for the "which clip" half: it now further routes this result through
 * sea's `withSwimAnimationState` for a skin with real swim-stroke clips
 * (limbs moving through open space reads closer to flying than air's
 * walk/run ground gait does) — reported 2026-09-09 as still looking like
 * "running in the air" even with pitch alone.
 */
export function moveInputToAirAnimationState(
  moveX: number,
  moveZ: number,
  vertical: number,
  run: boolean,
): MoveAnimationState {
  const horizontalMagnitude = Math.hypot(moveX, moveZ);
  const isFlying = horizontalMagnitude >= 0.01 || vertical !== 0;
  if (!isFlying) return "idle";
  return run ? "run" : "walk";
}
