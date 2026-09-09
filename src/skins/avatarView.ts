import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import {
  AVATAR_SKINS,
  DIVE_SUIT_AVATAR_SKIN_ID,
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
 * The dive-suit "costume" (`src/skins/avatarSkins.ts`'s `diveSuit` entry)
 * — mask, one weight belt, tank, and flippers, laid out proportionally to
 * whatever character is *actually being worn underneath* (its own
 * bounding box), so the dive suit reads as gear on top of the current
 * character (Fox/Robot/Princess/Mannequin/Female/Capsule alike) instead
 * of replacing it with an unrelated generic body — see
 * `AvatarView.buildVisual`'s `DIVE_SUIT_AVATAR_SKIN_ID` branch for how
 * the underlying character is chosen and kept.
 *
 * **History**: originally its own procedural body (a plain capsule with
 * a couple of accessories) — reported twice with real screenshots
 * (2026-09-08, then again 2026-09-09) as reading like an undecorated
 * capsule no matter how bright/big the accessories got, since one small
 * sphere and a thin ring just aren't enough silhouette to beat a full
 * body's worth of plain color. **Rebuilt 2026-09-09, same day, after you
 * asked directly for it to be "a skin on a character"**: instead of
 * inventing its own body, this now decorates whichever real skin was
 * active before the dive suit was equipped (tracked as `AvatarView`'s
 * `underlyingSkinId`) — Female stays recognizably Female, Fox stays
 * recognizably Fox, just wearing gear, and Capsule (the default when no
 * real character was active yet) gets exactly the previous look. `box` is
 * that character's own local bounding box (`THREE.Box3`, computed before
 * this overlay is attached), so every measurement below is a *fraction*
 * of that character's actual height/width rather than a hardcoded number
 * tuned to the capsule alone — the same gear this function builds now
 * scales to fit Robot, Fox, or anything else without a per-skin special
 * case. Assumes local +Z is that character's own authored "front" (every
 * current skin's `facingOffset` is 0, i.e. already aligned with the
 * engine's forward convention — see `AvatarSkin.facingOffset`), same
 * assumption `faceDirection` already relies on elsewhere.
 *
 * **Trimmed 2026-09-09, same day again**: the first pass at this (still
 * carrying over the belt/chest-strap/head-strap rings from the
 * capsule-only version's own "ring reads from every angle" fix) put
 * three same-colored torus rings stacked up the body — reported as
 * looking like a stack of yellow hula hoops. Now that the gear decorates
 * a real, already-distinctive character instead of a blank capsule, it
 * doesn't need three redundant rings to read as "equipped" — cut down to
 * one (the waist/weight belt, the single most recognizable diver-gear
 * ring) plus the mask and tank, which read as gear on their own without
 * needing a ring escort.
 */
function createDiveGearOverlay(box: THREE.Box3): THREE.Group {
  const gear = new THREE.Group();
  gear.name = "dive-gear-overlay";

  // Shared "bright equipment" look for every non-mask part (belt, tank,
  // flippers) — one consistent gold reads as "gear" at a glance no matter
  // which primitive it's attached to.
  const gearMaterial = () =>
    new THREE.MeshStandardMaterial({ color: 0xe8b93f, emissive: 0x6b4f10, emissiveIntensity: 0.4 });

  // Floors guard against a degenerate/empty box (e.g. a not-yet-loaded
  // model) producing zero- or negative-sized geometry.
  const height = Math.max(box.max.y - box.min.y, 0.4);
  const width = Math.max(box.max.x - box.min.x, 0.3);
  const centerX = (box.max.x + box.min.x) / 2;
  const centerZ = (box.max.z + box.min.z) / 2;
  const torsoRadius = width / 2 + 0.04; // stands proud of the actual body surface
  const headRadius = torsoRadius * 0.68; // heads read narrower than chests/waists

  const headY = box.min.y + height * 0.75;
  const tankY = box.min.y + height * 0.53;
  const waistY = box.min.y + height * 0.44;
  const footY = box.min.y + height * 0.03;

  // Mask — three parts instead of one flat box, so it reads as an actual
  // mask worn on the face instead of a floating colored rectangle
  // (reported directly: "why is there a blue box in front of each
  // avatar"). A dark rubber skirt/frame sits flush against the face; a
  // smaller, lighter lens is inset within it and protrudes slightly
  // further forward (glass sitting inside the frame, not level with it);
  // a thin strap wraps the head to visually anchor the frame in place.
  // The strap is dark, not the gold "equipment" color the belt/tank use
  // — it's a functional part of the mask itself, not another bright
  // accessory ring (see the 2026-09-09 "too many yellow rings" trim
  // above for why that distinction matters here).
  const maskFrame = new THREE.Mesh(
    new THREE.BoxGeometry(headRadius * 1.7, height * 0.16, headRadius * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c }), // dark rubber skirt
  );
  maskFrame.position.set(centerX, headY, box.max.z + headRadius * 0.2);
  maskFrame.name = "dive-suit-mask-frame";

  const maskLens = new THREE.Mesh(
    new THREE.BoxGeometry(headRadius * 1.3, height * 0.11, headRadius * 0.25),
    new THREE.MeshStandardMaterial({
      color: 0x8fd8e8,
      emissive: 0x2a5560,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    }),
  );
  maskLens.position.set(centerX, headY, box.max.z + headRadius * 0.4); // inset in the frame, protrudes a touch further
  maskLens.name = "dive-suit-mask-lens";

  const maskStrap = new THREE.Mesh(
    new THREE.TorusGeometry(headRadius * 0.95, 0.022, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c }),
  );
  maskStrap.rotation.x = Math.PI / 2;
  maskStrap.position.set(centerX, headY, centerZ);
  maskStrap.name = "dive-suit-mask-strap";

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoRadius * 0.4, torsoRadius * 0.4, height * 0.4, 10),
    gearMaterial(), // bright tank, reads clearly as equipment against the character underneath
  );
  tank.position.set(centerX, tankY, box.min.z - torsoRadius * 0.25); // strapped to the back
  tank.name = "dive-suit-tank";

  // Waist belt — the one ring, at the equator; reads as equipment from
  // every angle, including dead-on front/back and side-on.
  const belt = new THREE.Mesh(new THREE.TorusGeometry(torsoRadius, 0.05, 8, 16), gearMaterial());
  belt.rotation.x = Math.PI / 2;
  belt.position.set(centerX, waistY, centerZ);
  belt.name = "dive-suit-belt";

  // Flippers — two actual paddle-shaped blades at the feet, not just a
  // flat plate (a plate reads as a skirt/base, not swim fins). Each is a
  // flattened, elongated sphere (a paddle silhouette) splayed outward and
  // forward past the character's own front, unmistakably fin-shaped from
  // front, side, and back alike.
  const finGeometry = new THREE.SphereGeometry(Math.max(width * 0.22, 0.12), 10, 6);
  function createFlipper(xSign: 1 | -1): THREE.Mesh {
    const flipper = new THREE.Mesh(finGeometry, gearMaterial());
    flipper.scale.set(0.9, 0.3, 2.4); // flattened + elongated into a paddle blade
    flipper.position.set(centerX + xSign * width * 0.28, footY, box.max.z + width * 0.15);
    flipper.rotation.y = xSign * 0.3; // toes-out splay, distinct from a single centered plate
    flipper.name = xSign === -1 ? "dive-suit-flipper-left" : "dive-suit-flipper-right";
    return flipper;
  }

  gear.add(maskFrame, maskLens, maskStrap, tank, belt, createFlipper(-1), createFlipper(1));
  return gear;
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
  // The last real (non-dive-suit) skin worn — what the dive suit's gear
  // overlay decorates, and what setSkin(DIVE_SUIT_AVATAR_SKIN_ID) rebuilds
  // from instead of inventing its own body. Never itself the dive suit.
  private underlyingSkinId = "";
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

    // Remember which real character was worn before this swap — if it's
    // the dive suit being equipped next, buildVisual needs this to know
    // whose body to decorate rather than inventing its own.
    if (this.currentSkinId && this.currentSkinId !== DIVE_SUIT_AVATAR_SKIN_ID) {
      this.underlyingSkinId = this.currentSkinId;
    }

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
    if (skin.id === DIVE_SUIT_AVATAR_SKIN_ID) {
      // Dress whoever was actually worn last (Fox/Female/Robot/…), not a
      // separate invented body — falls back to the default procedural
      // capsule if the dive suit is somehow the very first skin ever set
      // (see createDiveGearOverlay's own comment for the full history).
      const baseSkin =
        AVATAR_SKINS.find((s) => s.id === this.underlyingSkinId) ??
        AVATAR_SKINS.find((s) => s.id === FALLBACK_AVATAR_SKIN_ID)!;
      const base = await this.buildVisual(baseSkin);

      const wrapper = new THREE.Group();
      wrapper.name = "dive-suit-wearer";
      wrapper.add(base.visual);
      // A fresh, not-yet-scene-attached clone never had a real frame
      // update its skeleton's bone matrices — Box3.expandByObject only
      // updates each node's own matrixWorld as it's visited, in whatever
      // order `children` happens to hold them, so a SkinnedMesh visited
      // before its own (sibling, not descendant) bone hierarchy computes
      // its skinned bounding box from still-default (identity) bone
      // matrices — a tiny, wrong box (confirmed directly: measured ~0.07
      // world units tall for Fox instead of its real ~2.24, see
      // window.__getAvatarWorldHeight). Forcing a full recursive update
      // first (bones included, regardless of traversal order) fixes that —
      // same "render/measure, don't assume a fresh object is already
      // measurable" discipline as the SkeletonUtils-clone/Robot-scale
      // lessons elsewhere in this file. Only after that is the box the
      // character's real local bounding box (already reflecting its
      // per-skin `scale`, applied above) — exactly what
      // createDiveGearOverlay needs to fit gear to this specific
      // character rather than the capsule alone.
      base.visual.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(base.visual);
      wrapper.add(createDiveGearOverlay(box));

      return { visual: wrapper, mixer: base.mixer, actions: base.actions, resolvedSkinId: DIVE_SUIT_AVATAR_SKIN_ID };
    }

    if (skin.kind === "procedural") {
      const visual = createProceduralAvatarMesh();
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
