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
 * and `withFloatAnimationState` below for the "which clip" half.
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

/**
 * 2026-09-09, second pass on the "running in the air" fix: the first pass
 * routed air through sea's `withSwimAnimationState`, which plays the
 * *active* `swimActive` stroke clip while moving — reviewed live and
 * called out as reading like a fish actively swimming, when the ask was
 * something more like a balloon: it drifts with zero regard for how it's
 * being pushed, never "paddling harder" to go faster. So unlike sea (where
 * `swimActive` vs. `swimIdle` genuinely means "kicking" vs. "floating"),
 * air always resolves to the calm `swimIdle` clip for a skin that has one
 * — regardless of speed or direction, moving or still. `genericState` is
 * accepted (same shape as `withSwimAnimationState`, so both call sites in
 * `main.ts` read the same way) but deliberately unused once a skin
 * qualifies: only its presence/absence of swim clips matters here, not
 * what it resolved to. A skin without swim clips is unaffected — still
 * `moveInputToAirAnimationState`'s own walk/run/idle result, unchanged.
 */
export function withFloatAnimationState(
  genericState: MoveAnimationState,
  skinHasSwimClips: boolean,
): MoveAnimationState {
  if (!skinHasSwimClips) return genericState;
  return "swimIdle";
}
