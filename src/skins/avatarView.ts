import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import {
  AVATAR_SKINS,
  FALLBACK_AVATAR_SKIN_ID,
  bobOffset,
  type AvatarSkin,
  type MoveAnimationState,
} from "./avatarSkins";

const CAPSULE_RADIUS = 0.4;
const CAPSULE_LENGTH = 1.0;

/** Half-height of the default capsule — add this to a ground-contact y to get the avatar root's y. */
export const AVATAR_GROUND_OFFSET = CAPSULE_LENGTH / 2 + CAPSULE_RADIUS;

const ANIMATION_CROSSFADE_SECONDS = 0.2;

// Sea's own use of pitch (dive nose-down, surface nose-up) — see
// setVerticalPitch below. A vertical velocity at or beyond this magnitude
// (m/s) maps to the full MAX_PITCH_ANGLE; land/air never call this method
// at all (pure yaw via faceDirection is enough for them), so these numbers
// are tuned against sea's own vertical range (src/sea/seaMovement.ts:
// +/-2 m/s active dive/surface, +0.5 m/s idle buoyancy drift) without sea
// needing to know anything about how AvatarView turns that into an angle.
const MAX_PITCH_ANGLE = THREE.MathUtils.degToRad(30);
const PITCH_VELOCITY_FOR_MAX_ANGLE = 2;

export function createProceduralAvatarMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9822b }),
  );
}

/**
 * The "diveSuit" procedural variant (`src/skins/avatarSkins.ts`) — same
 * capsule body/footprint as the default procedural mesh above (so it lines
 * up with `AVATAR_GROUND_OFFSET` and reads as roughly the same height as
 * every other skin) plus two small primitives distinctive enough to read
 * as "a diver" at a glance: a mask on the face and a tank on the back —
 * rough-primitives language, same as `portalMarker.ts`/`divingHouseMarker.ts`.
 * Local +Z is this mesh's authored "front" — verified against a real
 * render with the avatar walking toward the camera (same "render and
 * look, don't guess" discipline as the Robot-scale/Gold-metalness/
 * Fox-pitch-sign fixes elsewhere in this codebase), since `faceDirection`'s
 * rotation puts local +Z on the leading edge when moving in world -Z
 * (forward, see `src/input/keyboardInput.ts`) with the default
 * `facingOffset` of 0.
 */
export function createDiveSuitAvatarMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "dive-suit-avatar";

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1b2a35 }), // dark neoprene wetsuit
  );
  body.name = "dive-suit-body";

  const mask = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xbfe8ef, transparent: true, opacity: 0.85 }), // pale "glass" mask
  );
  mask.position.set(0, 0.45, 0.28); // face height, front of the body
  mask.scale.set(1, 0.9, 0.6);
  mask.name = "dive-suit-mask";

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b93f }), // bright tank, reads clearly as equipment against the dark suit
  );
  tank.position.set(0, 0.05, -0.32); // strapped to the back
  tank.name = "dive-suit-tank";

  group.add(body, mask, tank);
  return group;
}

const gltfLoader = new GLTFLoader();
const gltfCache = new Map<string, Promise<GLTF>>();

function loadGltf(url: string): Promise<GLTF> {
  let cached = gltfCache.get(url);
  if (!cached) {
    cached = gltfLoader.loadAsync(url);
    gltfCache.set(url, cached);
  }
  return cached;
}

/** Test-only: the module-level cache otherwise leaks a resolved/rejected promise across tests using the same URL. */
export function __resetGltfCacheForTests(): void {
  gltfCache.clear();
}

/**
 * Owns the avatar's currently-visible representation (a procedural capsule,
 * or a loaded glTF model + its animations) inside a stable parent group
 * that main.ts positions every frame. Swapping skins is purely visual —
 * stepLandMovement and the avatar's actual world position never know or
 * care which skin is active (see ARCHITECTURE.md's "device-agnostic input"
 * note for the same principle applied one layer over).
 */
export class AvatarView {
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Partial<Record<MoveAnimationState, THREE.AnimationAction>> = {};
  private currentState: MoveAnimationState = "idle";
  private currentSkinId = "";
  private facingOffset = 0;
  private visual: THREE.Object3D | null = null;
  // Continuous, never reset on setSkin — a skin swapped in mid-oscillation
  // just picks up the same phase rather than jumping, and it's imperceptible
  // either way given the tiny amplitude (see bobOffset).
  private bobElapsed = 0;

  constructor(private readonly root: THREE.Object3D) {}

  get skinId(): string {
    return this.currentSkinId;
  }

  /** The last state requested via setMoveState — test-only visibility into which clip should be playing. */
  get moveState(): MoveAnimationState {
    return this.currentState;
  }

  async setSkin(skinId: string): Promise<void> {
    if (skinId === this.currentSkinId) return;
    const skin = AVATAR_SKINS.find((s) => s.id === skinId);
    if (!skin) return;

    const built = await this.buildVisual(skin);

    // Swap only once the new visual is fully ready, so there's never a
    // frame where the avatar is invisible while a model is loading.
    this.root.clear();
    this.root.add(built.visual);
    this.mixer = built.mixer;
    this.actions = built.actions;
    this.currentSkinId = built.resolvedSkinId;
    this.facingOffset = skin.facingOffset ?? 0;
    this.visual = built.visual;
    this.visual.position.y = 0; // fresh visual — no stale bob offset carried over
    this.playState(this.currentState, true);
  }

  private async buildVisual(skin: AvatarSkin): Promise<{
    visual: THREE.Object3D;
    mixer: THREE.AnimationMixer | null;
    actions: Partial<Record<MoveAnimationState, THREE.AnimationAction>>;
    resolvedSkinId: string;
  }> {
    if (skin.kind === "procedural") {
      const visual =
        skin.proceduralVariant === "diveSuit" ? createDiveSuitAvatarMesh() : createProceduralAvatarMesh();
      return { visual, mixer: null, actions: {}, resolvedSkinId: skin.id };
    }

    try {
      const gltf = await loadGltf(skin.modelUrl!);
      // Clone, don't reuse, the cached scene graph — loadGltf's cache can
      // now be shared by more than one AvatarView at once (land's and
      // air's, src/main.ts), and a three.js Object3D can only ever have
      // one parent: adding gltf.scene to a second view's root would
      // silently steal it out from under the first. SkeletonUtils' clone,
      // not Object3D.clone — these are skinned/animated meshes, and a
      // plain clone doesn't rebuild the skeleton's bone bindings.
      const model = cloneSkinned(gltf.scene);
      model.scale.setScalar(skin.scale ?? 1);

      let mixer: THREE.AnimationMixer | null = null;
      const actions: Partial<Record<MoveAnimationState, THREE.AnimationAction>> = {};
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        for (const [state, clipName] of Object.entries(skin.animationClipNames ?? {}) as Array<
          [MoveAnimationState, string]
        >) {
          const clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
          if (clip) actions[state] = mixer.clipAction(clip);
        }
      }

      return { visual: model, mixer, actions, resolvedSkinId: skin.id };
    } catch (err) {
      console.error(`Failed to load avatar skin "${skin.id}" — falling back to the procedural capsule.`, err);
      return {
        visual: createProceduralAvatarMesh(),
        mixer: null,
        actions: {},
        resolvedSkinId: FALLBACK_AVATAR_SKIN_ID,
      };
    }
  }

  /**
   * Whether the currently-active skin has a real clip wired for this state
   * — sea uses this to decide whether to request the dedicated "swimIdle"/
   * "swimActive" states (src/sea/seaAnimation.ts) instead of falling back
   * to the shared idle/walk/run clips every skin has.
   */
  hasAnimation(state: MoveAnimationState): boolean {
    return Boolean(this.actions[state]);
  }

  /** Sets which movement animation should be playing (no-op if unchanged and not forced). */
  setMoveState(state: MoveAnimationState): void {
    if (state === this.currentState) return;
    this.currentState = state;
    this.playState(state, false);
  }

  private playState(state: MoveAnimationState, immediate: boolean): void {
    const next = this.actions[state];
    if (!next) return;
    for (const action of Object.values(this.actions)) {
      if (action && action !== next) {
        immediate ? action.stop() : action.fadeOut(ANIMATION_CROSSFADE_SECONDS);
      }
    }
    next.reset();
    if (!immediate) next.fadeIn(ANIMATION_CROSSFADE_SECONDS);
    next.play();
  }

  /** Smoothly turns the avatar to face the given move direction; no-op when there's no input. */
  faceDirection(moveX: number, moveZ: number, dt: number, turnSpeed = 12): void {
    if (Math.hypot(moveX, moveZ) < 0.01) return;
    const targetAngle = Math.atan2(moveX, moveZ) + this.facingOffset;
    const delta = THREE.MathUtils.euclideanModulo(targetAngle - this.root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    const t = Math.min(1, turnSpeed * dt);
    this.root.rotation.y += delta * t;
  }

  /**
   * Pitches the avatar to lean into vertical movement — sea's own use
   * (diving noses the model down, surfacing/buoyancy noses it up),
   * distinct from land/air's pure yaw-only faceDirection since neither of
   * those realms has meaningful vertical velocity to react to. Purely
   * visual, same "skins never touch movement state" split faceDirection
   * keeps — callers pass their own movement's vertical velocity in, this
   * never reads it back out. No-op (smoothly returns to level) when
   * verticalVelocity is 0, so a skin switched away from sea mid-tilt still
   * settles back to neutral rather than freezing pitched.
   */
  setVerticalPitch(verticalVelocity: number, dt: number, pitchSpeed = 6): void {
    // Negated: verified against a real side-on render (not guessed) that
    // positive rotation.x noses the model *down*, not up, for this root's
    // axis convention — same discipline as the Robot-scale/Fox-camera
    // lessons elsewhere in this codebase (render and look, don't infer).
    const targetPitch =
      -THREE.MathUtils.clamp(verticalVelocity / PITCH_VELOCITY_FOR_MAX_ANGLE, -1, 1) * MAX_PITCH_ANGLE;
    const t = Math.min(1, pitchSpeed * dt);
    this.root.rotation.x += (targetPitch - this.root.rotation.x) * t;
  }

  update(dt: number): void {
    this.mixer?.update(dt);
    this.bobElapsed += dt;
    // Only skins with no real clip for the current state get the
    // procedural bob (Capsule always, Princess always — see bobOffset's
    // own comment); an animated skin's actual clip already carries its own
    // motion, so this stays exactly 0 and never fights it.
    if (this.visual) {
      this.visual.position.y = this.hasAnimation(this.currentState)
        ? 0
        : bobOffset(this.bobElapsed, this.currentState);
    }
  }
}
