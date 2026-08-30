export type MoveAnimationState = "idle" | "walk" | "run";

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
