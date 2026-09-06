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
 * `Running`) rather than inventing a fourth "swim" state — no bundled
 * skin has a distinct swim-stroke clip to map it to yet (still `todo`,
 * genuinely gated on sourcing that content, same shape as the
 * princess-figure asset search). This is the real, buildable half of
 * that backlog item: correct *when* sea shows motion, independent of
 * *which* clip eventually plays for it.
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
