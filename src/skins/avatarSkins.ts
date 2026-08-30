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
  { id: "capsule", label: "Capsule", kind: "procedural" },
  {
    id: "fox",
    label: "Fox",
    kind: "gltf",
    modelUrl: "/assets/models/fox.glb",
    scale: 0.03,
    animationClipNames: { idle: "Survey", walk: "Walk", run: "Run" },
  },
];

export const DEFAULT_AVATAR_SKIN_ID = AVATAR_SKINS[0]!.id;

/** Pure: which animation state a given move intent maps to. */
export function moveInputToAnimationState(moveX: number, moveZ: number, run: boolean): MoveAnimationState {
  const magnitude = Math.hypot(moveX, moveZ);
  if (magnitude < 0.01) return "idle";
  return run ? "run" : "walk";
}
