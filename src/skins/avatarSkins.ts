/**
 * "swimIdle"/"swimActive" are sea-specific (src/sea/seaAnimation.ts) — only
 * requested for a skin that actually declares them in animationClipNames
 * (currently just "mannequin"); every other skin never gets asked for them,
 * so this addition changes nothing about land/air or Fox/Robot/Princess/
 * Capsule's existing idle/walk/run behavior.
 */
export type MoveAnimationState = "idle" | "walk" | "run" | "swimIdle" | "swimActive";

export interface AvatarSkin {
  id: string;
  label: string;
  kind: "procedural" | "gltf";
  /** Required when kind is "gltf" — path under /public the model is served from. */
  modelUrl?: string;
  /** Uniform scale applied to the loaded model to match our world units. */
  scale?: number;
  /** Extra Y rotation (radians) to align the model's authored facing with our forward (-Z). */
  facingOffset?: number;
  /** Maps our three movement states to this model's actual animation clip names. */
  animationClipNames?: Partial<Record<MoveAnimationState, string>>;
}

export const AVATAR_SKINS: readonly AvatarSkin[] = [
  {
    id: "fox",
    label: "Fox",
    kind: "gltf",
    modelUrl: "/assets/models/fox.glb",
    scale: 0.03,
    animationClipNames: { idle: "Survey", walk: "Walk", run: "Run" },
  },
  {
    id: "robot",
    label: "Robot",
    kind: "gltf",
    modelUrl: "/assets/models/robot.glb",
    // At scale 1 the model measured ~4.82 world units tall (via
    // window.__getAvatarWorldHeight) — nearly 2.7x the Fox's ~2.24 and
    // 2.7x the procedural Capsule's 1.8, so tall its head sat off-screen
    // by default. 0.4 brings it to ~1.93 — in between Capsule and Fox,
    // reasonable for a bipedal/humanoid model. Guarded by an E2E check
    // (e2e/skins.spec.ts) that every gltf skin's rendered height stays
    // within a sane multiple of Capsule's, so a future skin shipping at
    // the wrong scale fails a test instead of needing a screenshot report.
    scale: 0.4,
    animationClipNames: { idle: "Idle", walk: "Walking", run: "Running" },
  },
  {
    id: "princess",
    label: "Princess",
    kind: "gltf",
    modelUrl: "/assets/models/princess.glb",
    // At scale 1 the model measured ~1.90 world units tall (via
    // window.__getAvatarWorldHeight) — already close to Capsule's ~1.8, so
    // no correction needed (unlike Robot above). No rig/animation in the
    // source model — static pose only, no idle/walk/run clips (see
    // ATTRIBUTIONS.md for why).
  },
  {
    id: "mannequin",
    label: "Mannequin",
    kind: "gltf",
    modelUrl: "/assets/models/mannequin.glb",
    // At scale 1 the model measured ~1.83 world units tall (bboxMax.y from
    // `gltf-transform inspect`, same reference points as Fox/Robot/Princess
    // above) — already close to Capsule's ~1.8, no correction needed.
    // The first reachable free source with real swim-stroke clips (see
    // ATTRIBUTIONS.md) — swimIdle/swimActive here are sea-specific, only
    // requested by src/sea/seaAnimation.ts while actively swimming; idle/
    // walk/run cover land/air exactly like every other skin.
    animationClipNames: {
      idle: "Idle_Loop",
      walk: "Walk_Loop",
      run: "Sprint_Loop",
      swimIdle: "Swim_Idle_Loop",
      swimActive: "Swim_Fwd_Loop",
    },
  },
  {
    id: "female",
    label: "Female",
    kind: "gltf",
    modelUrl: "/assets/models/female.glb",
    // At scale 1 the model measured ~1.72 world units tall (bboxMax.y from
    // `gltf-transform inspect`, same reference points as Fox/Robot/Princess/
    // Mannequin above) — already close to Capsule's ~1.8, no correction
    // needed. The requested "does the Princess flex its arms/legs like
    // Mannequin" fix: since princess.glb genuinely has no skeleton to
    // animate (see ATTRIBUTIONS.md), and no reachable princess/royal-themed
    // *rigged* source turned up, this is a separate new skin rather than a
    // princess.glb replacement — Princess itself is untouched. Source mesh
    // (Mesh2Motion's "female_8" character, CC0, no rig/animation of its own)
    // + Mesh2Motion's shared "universal human" animation rig were merged
    // into one glb offline (`@gltf-transform/core`, matching every bone by
    // name — both ship the same skeleton, confirmed with 0 unmatched
    // channels out of 990), same "trim to exactly the clips we use" spirit
    // as Mannequin's own sourcing. Clip names below are the ones this merge
    // produced, not the source library's original names.
    animationClipNames: {
      idle: "Idle_Loop",
      walk: "Walk_Loop",
      run: "Sprint_Loop",
      swimIdle: "Swim_Idle_Loop",
      swimActive: "Swim_Fwd_Loop",
    },
  },
  { id: "capsule", label: "Capsule", kind: "procedural" },
];

/** Shown on first load — reviewed and confirmed 2026-08-30 (see DECISIONS.md). */
export const DEFAULT_AVATAR_SKIN_ID = "fox";

/** Always procedural, so it can never itself fail to load — what AvatarView falls back to if a real asset does. */
export const FALLBACK_AVATAR_SKIN_ID = "capsule";

/** Pure: which animation state a given move intent maps to. */
export function moveInputToAnimationState(moveX: number, moveZ: number, run: boolean): MoveAnimationState {
  const magnitude = Math.hypot(moveX, moveZ);
  if (magnitude < 0.01) return "idle";
  return run ? "run" : "walk";
}

const BOB_PARAMS: Record<MoveAnimationState, { amplitude: number; period: number }> = {
  idle: { amplitude: 0.02, period: 2.4 }, // slow, gentle "breathing"
  walk: { amplitude: 0.05, period: 0.6 }, // faster/bigger — reads as footsteps
  run: { amplitude: 0.07, period: 0.4 },
  swimIdle: { amplitude: 0.02, period: 2.4 },
  swimActive: { amplitude: 0.05, period: 0.6 },
};

/**
 * Small vertical offset (world units) `AvatarView` applies to a skin's
 * visual — never the avatar root main.ts repositions every frame — to
 * keep a skin with no animation clip for the current state from reading
 * as visually "dead" while it stands or moves. Today that's Capsule
 * (never animated) and Princess (no clips in the source model at all,
 * see ATTRIBUTIONS.md); Fox/Robot/Mannequin always have a real clip for
 * idle/walk/run so `AvatarView` never calls this for them (only used
 * when `hasAnimation(state)` is false). Pure and deterministic given
 * (elapsedSeconds, state) so it's directly unit-testable without a mixer
 * or a real clock.
 */
export function bobOffset(elapsedSeconds: number, state: MoveAnimationState): number {
  const { amplitude, period } = BOB_PARAMS[state];
  return amplitude * Math.sin((elapsedSeconds / period) * Math.PI * 2);
}
