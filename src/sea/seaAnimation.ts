import type { MoveAnimationState } from "../skins/avatarSkins";

/**
 * Sea-specific animation-state mapping (Phase 3 `todo`, `BACKLOG.md`):
 * land/air both derive `MoveAnimationState` purely from horizontal move
 * intent (`moveInputToAnimationState`, `src/skins/avatarSkins.ts`), which
 * is correct for them — neither has meaningful vertical *input* driving
 * real motion. Sea does: an active dive/surface hold (`vertical !== 0`,
 * `src/input/verticalInput.ts`) is real, player-driven swimming even with
 * zero horizontal input, but the generic mapping would score that as
 * "idle" — the avatar would visibly stop swimming despite the player
 * actively climbing or diving. This restores that signal.
 *
 * Deliberately *not* triggered by passive buoyancy drift
 * (`BUOYANCY_DRIFT_SPEED` in `seaMovement.ts`, which keeps `vertical`
 * itself at 0 — it's a background velocity nudge, not player input) — a
 * player holding no keys should still read as idle/floating, not
 * perpetually swimming, even though they drift slowly toward the surface.
 *
 * Still reuses the shared `idle`/`walk`/`run` enum and every current
 * skin's existing clip names (`Survey`/`Walk`/`Run`, `Idle`/`Walking`/
 * `Running`) — this function's own job is purely *when* sea shows motion,
 * independent of *which* clip eventually plays for it. See
 * `withSwimAnimationState` below for the "which clip" half, now that a
 * skin with real swim-stroke clips exists (`mannequin`, `BACKLOG.md`).
 */
export function moveInputToSeaAnimationState(
  moveX: number,
  moveZ: number,
  vertical: number,
  run: boolean,
): MoveAnimationState {
  const horizontalMagnitude = Math.hypot(moveX, moveZ);
  const isSwimming = horizontalMagnitude >= 0.01 || vertical !== 0;
  if (!isSwimming) return "idle";
  return run ? "run" : "walk";
}

/**
 * Routes a generic idle/walk/run result to the dedicated `swimIdle`/
 * `swimActive` states when the active skin actually has them
 * (`AvatarView.hasAnimation`, checked by the caller against its own
 * `swimIdle` clip as the stand-in for "this skin supports swimming") —
 * every other skin keeps exactly today's walk/run behavior, unchanged.
 * Deliberately collapses run vs. walk into one "active" state once a skin
 * does have swim clips: the bundled `mannequin`/`female` skins' source
 * library only has a single swim-stroke clip (`Swim_Fwd_Loop`, no separate
 * sprint variant) to map either speed onto, so there's no real run/walk
 * distinction to preserve here — a future skin with two distinct swim
 * clips would need this reworked, not a limitation worth solving
 * speculatively now.
 *
 * Genuinely realm-agnostic despite living in `sea/` (its original caller)
 * — pure state-in/state-out plus a boolean, nothing sea-specific — so
 * `main.ts`'s air branch reuses this directly too (see its own comment):
 * limbs paddling through open space reads far closer to "flying" than
 * air's walk/run ground gait does, for a skin that has swim clips to
 * paddle with.
 */
export function withSwimAnimationState(
  genericState: MoveAnimationState,
  skinHasSwimClips: boolean,
): MoveAnimationState {
  if (!skinHasSwimClips) return genericState;
  return genericState === "idle" ? "swimIdle" : "swimActive";
}
