import * as THREE from "three";

/**
 * Land's "basic parkland dressing" (`BACKLOG.md` Phase 1a, locked in
 * 2026-09-08): replaces the old plain gray-cylinder `landmark` meshes with
 * a light, generic parkland set — scattered trees, a few flower-bed color
 * patches, a simple path connecting them, one small fountain centerpiece
 * near spawn. Deliberately generic/light-touch rather than a heavily
 * themed "garden" (see `DECISIONS.md`'s 2026-09-08 entry): this repo's
 * purpose is to be cloned and built on top of, so a fork can reskin land
 * entirely by swapping this one array/module, without touching
 * terrain/collision code (`src/land/terrain.ts` stays untouched).
 *
 * Procedural primitives only, matching the discipline block materials
 * already use (generated pattern before real photographed textures/
 * models) — real assets can follow later if wanted.
 */
export type LandDecorationKind = "tree" | "flowerbed" | "path" | "fountain";

export interface LandDecoration {
  x: number;
  z: number;
  kind: LandDecorationKind;
}

/**
 * A plain data array — the same pattern `AIR_FLOATING_PLATFORM_POSITIONS`/
 * `SEA_WRECKAGE_POSITIONS` already use — that `scene.ts` reads to place
 * meshes. Kept local here (not folded into `RealmMap.terrain` the way
 * air/sea's arrays were): that migration was explicit Phase 2 hardening
 * for those realms, and land's terrain schema (`land-heightfield`) stays
 * untouched per this item's own scope.
 *
 * Six trees at the original landmark spots (kept for camera-parallax
 * continuity), two flower-bed patches scattered among them, one path
 * strip from spawn (0, 0) toward the fountain, and the fountain itself
 * as the small centerpiece near spawn — kept to a modest total mesh
 * count (see `createPathMesh`'s and `createFountainMesh`'s own notes on
 * why each is a single/two-part mesh rather than several).
 */
export const LAND_DECORATION_POSITIONS: LandDecoration[] = [
  { x: 4, z: -6, kind: "tree" },
  { x: -5, z: -4, kind: "tree" },
  { x: 6, z: 4, kind: "tree" },
  { x: -6, z: 5, kind: "tree" },
  { x: 2, z: 10, kind: "tree" },
  { x: -8, z: -10, kind: "tree" },

  { x: 3, z: 4, kind: "flowerbed" },
  { x: -3, z: 6, kind: "flowerbed" },

  { x: 0, z: 2, kind: "path" },

  { x: 0, z: 4, kind: "fountain" },
];

const TRUNK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x6b4a2f });
const FOLIAGE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x4f9d4f });
const PATH_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xb9ab8a });
const FOUNTAIN_STONE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x8f8f8f });
const FOUNTAIN_WATER_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x3fa9dc });

// A small rotating palette so flower beds aren't all one flat color —
// picked deterministically from the decoration's own position, not
// randomly, so the scene is stable across renders/tests.
const FLOWER_COLORS = [0xd46a8c, 0xe0b13c, 0x9c5fc9];

function pickFlowerColor(decoration: LandDecoration): number {
  const hash = Math.abs(Math.round(decoration.x * 3 + decoration.z * 7));
  return FLOWER_COLORS[hash % FLOWER_COLORS.length];
}

function createTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "tree";

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 6), TRUNK_MATERIAL);
  trunk.position.y = 0.5;
  trunk.name = "tree-trunk";

  const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 8), FOLIAGE_MATERIAL);
  foliage.position.y = 1.9;
  foliage.name = "tree-foliage";

  group.add(trunk, foliage);
  return group;
}

function createFlowerbedMesh(decoration: LandDecoration): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ color: pickFlowerColor(decoration) });
  const flowerbed = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), material);
  flowerbed.rotation.x = -Math.PI / 2;
  flowerbed.position.y = 0.03; // just above the terrain surface, avoids z-fighting
  flowerbed.name = "flowerbed";
  return flowerbed;
}

// A single elongated strip rather than several small tiles — reads as one
// continuous path just as well, at a fraction of the draw-call cost.
function createPathMesh(): THREE.Mesh {
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.5), PATH_MATERIAL);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.02;
  path.name = "path";
  return path;
}

// Basin + water only, no separate spout mesh — a small centerpiece reads
// fine as two parts; a third didn't add enough to justify its own draw
// call (kept low-poly for the same reason: this is a background parallax
// object, not something the camera ever gets close to).
function createFountainMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "fountain";

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.4, 10), FOUNTAIN_STONE_MATERIAL);
  basin.position.y = 0.2;
  basin.name = "fountain-basin";

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.95, 10), FOUNTAIN_WATER_MATERIAL);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.41;
  water.name = "fountain-water";

  group.add(basin, water);
  return group;
}

/**
 * Builds the mesh for one decoration entry. Unlike air/sea's flat
 * `"landmark"`-named parallax objects, each root here is named for its
 * own kind (`"tree"`, `"flowerbed"`, `"path"`, `"fountain"`) —
 * there's real variety to distinguish now, so `scene.ts`'s and
 * `scene.test.ts`'s parallax check reads `LAND_DECORATION_POSITIONS`
 * itself rather than a shared literal name.
 */
export function createLandDecorationMesh(decoration: LandDecoration): THREE.Object3D {
  switch (decoration.kind) {
    case "tree":
      return createTreeMesh();
    case "flowerbed":
      return createFlowerbedMesh(decoration);
    case "path":
      return createPathMesh();
    case "fountain":
      return createFountainMesh();
  }
}
