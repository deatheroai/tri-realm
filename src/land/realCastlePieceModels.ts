import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { findCastleStructureType } from "./castleStructures";

/**
 * Upgrades a placed castle piece's box mesh in place with its real
 * Quaternius glTF model (`castleStructures.ts`'s `realModel` field), once
 * loaded — same "safe default first, upgrade once ready" philosophy
 * `skins/avatarView.ts` and `skins/realBlockTextures.ts`'s
 * `upgradeToRealTextures` already established: `placement.ts`'s
 * `createCastlePieceMesh` always returns the plain, block-material-colored
 * box synchronously first (so placement/collision/save-load — all
 * synchronous today — need zero changes), and this fires an async load
 * that mutates that same mesh once it resolves. A load failure (network,
 * a bad file) leaves the box exactly as it already was — there's no
 * separate fallback to reach for, the box already *is* the safe default
 * every type has rendered as since Phase 1a.
 *
 * A dedicated loader/cache, not `skins/avatarView.ts`'s — land structures
 * and avatar skins are different asset domains in different
 * tracks/files, same "self-contained rather than reaching into another
 * track's file" choice `air/airScene.ts`'s own comment already made for
 * its avatar-Group duplication.
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
export function __resetRealCastlePieceModelCacheForTests(): void {
  gltfCache.clear();
}

/**
 * Returns the upgrade's own `Promise<void>` (resolves once the swap is
 * done or the failure is logged) purely so tests can await it —
 * `placement.ts` calls this right after handing back the box mesh and
 * never awaits it itself, same fire-and-forget shape `AvatarView.setSkin`
 * allows its own callers. No-op for a type with no `realModel`
 * (Phase 1a/1b's plain-box behavior, unchanged). Every placement gets its
 * own clone — `gltf.scene` is cached and shared across every placement of
 * the same type, and a three.js `Object3D` can only ever have one parent
 * (the same sharing bug `AvatarView` hit and fixed for land/air's two
 * simultaneous avatars — these pieces have no skeleton, so a plain
 * `.clone(true)` is enough, no need for `SkeletonUtils`).
 */
export function upgradeCastlePieceToRealModel(box: THREE.Mesh, typeId: string): Promise<void> {
  const type = findCastleStructureType(typeId);
  const realModel = type.realModel;
  if (!realModel) return Promise.resolve();

  return loadGltf(realModel.modelUrl)
    .then((gltf) => {
      const visual = gltf.scene.clone(true);
      visual.scale.setScalar(realModel.scale);

      // A sibling of box (added to box.parent, not box itself) —
      // deliberately NOT box.add(visual). Found by actually rendering and
      // looking (same "render and look, don't guess" discipline as the
      // Robot-scale/Gold-metalness/dive-suit-legibility fixes elsewhere in
      // this codebase): three.js's renderer walks the scene via
      // `Object3D.traverseVisible`, which stops descending the instant it
      // hits an invisible object — so a child added under box would have
      // silently gone invisible right along with it the moment
      // `box.visible = false` ran below, for every "replace-ground" type.
      // Positioned at box's own world position (box has no rotation, and
      // its parent is the scene directly with no other transform, so
      // `.position` already *is* its world position) plus the same
      // ground/roof offset as before.
      visual.position.copy(box.position);

      if (realModel.placement === "replace-ground") {
        // The model's own local origin sits at its base (measured via
        // gltf-transform inspect against every real asset used here) —
        // placing it at the box's own bottom face (BoxGeometry centers
        // its geometry on the origin, so -height/2 from box's center is
        // that face) lands the model exactly on the ground the box
        // itself was standing on.
        visual.position.y -= type.dimensions.height / 2;
        box.visible = false; // still a valid raycast target — see this module's own doc comment
      } else {
        // "roof-cap": sits on the box's own top face; the box stays
        // visible and keeps its block-material color underneath.
        visual.position.y += type.dimensions.height / 2;
      }

      box.parent?.add(visual);
    })
    .catch((err) => {
      console.error(`Failed to load real model for castle piece type "${typeId}" — staying on the procedural box.`, err);
    });
}
