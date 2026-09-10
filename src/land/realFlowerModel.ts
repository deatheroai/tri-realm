import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

/**
 * Upgrades a flower bed's procedural blooms with a real Quaternius glTF
 * model, once loaded — same "safe default first, upgrade once ready"
 * philosophy `land/realCastlePieceModels.ts` already established for
 * castle pieces (and `skins/avatarView.ts`/`skins/realBlockTextures.ts`
 * before that): `landDecorations.ts`'s `createFlowerBed` always builds
 * the procedural stem/blossom/center trio synchronously first, and this
 * fires an async load that hides those and adds the real model as a
 * sibling once it resolves. A load failure (network, a bad file) leaves
 * the procedural blooms exactly as they already were — there's no
 * separate fallback to reach for, they already *are* the safe default.
 *
 * A dedicated loader/cache, not `realCastlePieceModels.ts`'s or
 * `skins/avatarView.ts`'s — same "self-contained rather than reaching
 * into another module's cache" choice those two already made for each
 * other (`air/airScene.ts`'s own comment gives the original reasoning).
 */
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
export function __resetRealFlowerModelCacheForTests(): void {
  gltfCache.clear();
}

export const FLOWER_MODEL_URL = "/assets/models/flower.glb";
/**
 * Uniform scale applied to the loaded model to match our world units.
 * Measured for real via `gltf-transform inspect` (not guessed, same
 * discipline `castleStructures.ts`'s own scale values use): the source
 * pack's "Flower_3_Group" is authored at a much larger, single-plant
 * scale (bbox ~1.5 × 2.0 × 1.6 units) — this scale brings it down to sit
 * comfortably within the flower bed's existing 0.8-radius soil disc.
 */
export const FLOWER_MODEL_SCALE = 0.35;

const FLOWER_BLOOM_CHILD_NAMES = ["flower-bed-stem", "flower-bed-bloom", "flower-bed-center"];

/**
 * Returns the upgrade's own `Promise<void>` (resolves once the swap is
 * done or the failure is logged) purely so tests can await it —
 * `landDecorations.ts` fires this right after building the procedural
 * blooms and never awaits it itself, same fire-and-forget shape
 * `placement.ts` already allows `upgradeCastlePieceToRealModel`. Every
 * flower bed gets its own clone — `gltf.scene` is cached and shared
 * across every bed, and a three.js `Object3D` can only ever have one
 * parent (the same sharing bug `AvatarView` hit and fixed for land/air's
 * two simultaneous avatars); this model has no skeleton, so a plain
 * `.clone(true)` is enough, no need for `SkeletonUtils`.
 */
export function upgradeFlowerBedToRealModel(group: THREE.Group): Promise<void> {
  return loadGltf(FLOWER_MODEL_URL)
    .then((gltf) => {
      // Hidden, not removed — if a future change reorders/removes this
      // upgrade, the group still renders correctly on its own, and a
      // failed load (caught below) leaves them visible exactly as before.
      for (const child of group.children) {
        if (FLOWER_BLOOM_CHILD_NAMES.includes(child.name)) {
          child.visible = false;
        }
      }

      const visual = gltf.scene.clone(true);
      visual.scale.setScalar(FLOWER_MODEL_SCALE);
      // The model's own local origin sits almost exactly at its base
      // (bboxMin.y ≈ -0.035 in source units, confirmed via
      // `gltf-transform inspect`), so placing it at the soil disc's own
      // top face — same height `flower-bed-soil` in `createFlowerBed`
      // already uses — lands it right on the patch, no per-model offset
      // arithmetic needed.
      visual.position.y = 0.12;
      visual.name = "flower-bed-real-model";
      group.add(visual);
    })
    .catch((err) => {
      console.error("Failed to load real flower model — staying on the procedural blooms.", err);
    });
}
