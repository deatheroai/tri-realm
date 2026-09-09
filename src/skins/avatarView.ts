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

// Sea's and (as of the Phase 2 pitch-parity fix) air's use of pitch (dive/
// descend nose-down, surface/ascend nose-up) — see setVerticalPitch below.
// Land never calls this method at all (pure yaw via faceDirection is
// enough for it — it has no meaningful vertical velocity). A vertical
// velocity at or beyond this magnitude (m/s) maps to the full
// MAX_PITCH_ANGLE; tuned against sea's own vertical range
// (src/sea/seaMovement.ts: +/-2 m/s active dive/surface, +0.5 m/s idle
// buoyancy drift). Air's own vertical range is wider (+/-4 m/s,
// src/air/airMovement.ts) so it reaches the same max pitch partway into
// full ascend/descend speed rather than only at the very top — still
// reads as a sensible "nose tilts into the climb/dive" cue, not
// distinctly wrong, so this shares the one constant rather than adding a
// second knob neither realm's caller needs to reach in from outside.
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
 * every other skin) plus primitives distinctive enough to read as "a
 * diver" at a glance — rough-primitives language, same as
 * `portalMarker.ts`/`divingHouseMarker.ts`.
 *
 * **Fixed 2026-09-08, reported with a real screenshot**: the original
 * version (just a front-facing mask + a back-facing tank) read as a
 * plain, undecorated capsule from any angle other than dead-on front or
 * back. That first fix (bigger/brighter mask+tank, plus a waist belt)
 * turned out to still be insufficient — **reported again 2026-09-09 with
 * another real screenshot**, taken from the actual follow camera: even
 * with that fix in, the whole thing still read as "a plain capsule with
 * a small dot and a rubber band," not recognizably a diver. Confirmed by
 * reproducing the exact same view locally (Playwright against a real dev
 * server, not guessed) before touching anything. Root cause this time:
 * one small sphere and one thin ring just aren't enough silhouette to
 * beat a big plain capsule, no matter how bright — the fix needed more
 * *shape*, not just brighter color on the same two tiny appendages.
 * Rebuilt with: (1) a bigger, boxy mask/visor plus a head strap ring
 * (the same "ring reads from every angle" trick as the belt, now framing
 * the head too, so the head silhouette itself changes, not just its
 * front face); (2) a second, higher chest-strap ring in addition to the
 * waist belt, reading as a harness even head-on where the tank itself is
 * hidden behind the body; (3) a wide flipper plate at the feet — divers'
 * most recognizable silhouette cue, and (being flat and centered) reads
 * from every heading same as the belt/straps. Verified by re-
 * screenshotting the real follow camera from idle, facing-camera, and
 * side-on angles — same "render and look, don't guess" discipline as the
 * Robot-scale/Gold-metalness/Fox-pitch-sign fixes elsewhere in this
 * codebase.
 *
 * Local +Z is still this mesh's authored "front" (mask side) —
 * `faceDirection`'s rotation puts local +Z on the leading edge when
 * moving in world -Z (forward, see `src/input/keyboardInput.ts`) with
 * the default `facingOffset` of 0.
 */
export function createDiveSuitAvatarMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "dive-suit-avatar";

  // Shared "bright equipment" look for every non-suit, non-mask part
  // (straps, tank, fins) — one consistent gold reads as "gear" at a
  // glance no matter which primitive it's attached to.
  const gearMaterial = () =>
    new THREE.MeshStandardMaterial({ color: 0xe8b93f, emissive: 0x6b4f10, emissiveIntensity: 0.4 });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1b2a35 }), // dark neoprene wetsuit
  );
  body.name = "dive-suit-body";

  // Mask/visor — a flat-fronted box instead of a sphere so it reads as a
  // face plate (a dive mask's actual silhouette) rather than an ambiguous
  // dot, sized to clearly dominate the head rather than sit lost on it.
  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.14),
    new THREE.MeshStandardMaterial({
      color: 0x8fd8e8,
      emissive: 0x2a5560,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.94,
    }),
  );
  mask.position.set(0, 0.45, 0.34); // face height, pushed out so it clearly protrudes past the body surface
  mask.name = "dive-suit-mask";

  // Head strap — same "ring reads from every angle" trick as the waist
  // belt below, but around the head: changes the head's silhouette from
  // every heading, not just the one the mask happens to be facing.
  const headStrap = new THREE.Mesh(new THREE.TorusGeometry(CAPSULE_RADIUS + 0.02, 0.04, 8, 16), gearMaterial());
  headStrap.rotation.x = Math.PI / 2;
  headStrap.position.set(0, 0.45, 0);
  headStrap.name = "dive-suit-head-strap";

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.95, 10),
    gearMaterial(), // bright tank, reads clearly as equipment against the dark suit
  );
  tank.position.set(0, 0.05, -0.38); // strapped to the back, pushed further out to clear the body surface
  tank.name = "dive-suit-tank";

  // Waist belt — a ring around the whole capsule reads as equipment from
  // every angle, not just the one or two the mask/tank happen to face.
  // Sits at the capsule's equator, wide enough to clearly stand proud of
  // the body.
  const belt = new THREE.Mesh(new THREE.TorusGeometry(CAPSULE_RADIUS + 0.03, 0.06, 8, 16), gearMaterial());
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, -0.1, 0);
  belt.name = "dive-suit-belt";

  // Chest strap — a second, higher ring reading as a harness crossing the
  // front of the body even from a head-on view, where the tank itself is
  // hidden behind the torso and the waist belt alone reads as "just a
  // belt" rather than full gear.
  const chestStrap = new THREE.Mesh(new THREE.TorusGeometry(CAPSULE_RADIUS + 0.02, 0.035, 8, 16), gearMaterial());
  chestStrap.rotation.x = Math.PI / 2;
  chestStrap.position.set(0, 0.2, 0);
  chestStrap.name = "dive-suit-chest-strap";

  // Fins — a wide, flat plate at the feet. Divers' single most
  // recognizable silhouette cue, and (being flat, centered, and wider
  // than the body) reads from every heading the same way the belt does,
  // not just front/back.
  const fins = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.07, 0.3), gearMaterial());
  fins.position.set(0, -0.82, 0.03);
  fins.name = "dive-suit-fins";

  group.add(body, mask, headStrap, tank, belt, chestStrap, fins);
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
