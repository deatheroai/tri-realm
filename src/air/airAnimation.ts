import type { MoveAnimationState } from "../skins/avatarSkins";

/**
 * Air-specific animation-state mapping — the "real air-specific animation
 * mapping" flagged as future refinement when air first reused land's
 * `moveInputToAnimationState` wholesale (`BACKLOG.md` Phase 2). Reusing
 * land's walk/run legs while airborne reads as literally running through
 * the sky rather than floating/flying, since no bundled skin has a
 * dedicated flight clip to map onto instead (same gap sea had before its
 * `mannequin` swim clips landed — see `src/sea/seaAnimation.ts`).
 *
 * Until a real flight clip exists, always resolving to `idle` is the
 * closer visual: it stops the leg-cycling that reads as "running on
 * nothing" and leaves `AvatarView.setVerticalPitch` (already reused here
 * against `AirMovementState.velocity.y`, same generic method sea uses for
 * its own dive/surface lean) to carry the actual sense of motion via
 * nose-up/nose-down tilt instead. Deliberately ignores `moveX`/`moveZ`/
 * `run` — unlike sea's mapping (which restores a *when* signal the
 * generic one missed), air's whole problem is *which* clip plays, not
 * when — so this intentionally has no branches to test beyond "always
 * idle" for now; a future flight-specific clip would replace this
 * function's body, not its call site in `main.ts`.
 */
export function moveInputToAirAnimationState(): MoveAnimationState {
  return "idle";
}
