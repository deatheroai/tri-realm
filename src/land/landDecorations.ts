import * as THREE from "three";

/**
 * Land's "parkland" dressing (`BACKLOG.md`, locked in during a 2026-09-08
 * design review): a light, generic set — scattered trees, a few flower-bed
 * patches, a simple path connecting them, one small centerpiece (a
 * fountain) near spawn — deliberately generic/light-touch rather than a
 * heavily-opinionated theme, since this repo's stated purpose is to be
 * cloned and built on top of. Same "one data array a fork can swap" shape
 * `air/airRealmMap.ts`'s `AIR_FLOATING_PLATFORM_POSITIONS` and
 * `sea/seaRealmMap.ts`'s `SEA_WRECKAGE_POSITIONS` already established —
 * the actual foundational value here is that a fork can reskin land
 * entirely by swapping this one array/mesh set, without touching
 * terrain/collision code (`src/land/terrain.ts`, `src/land/landMovement.ts`
 * — both untouched by this item).
 */
export type LandDecorationKind = "tree" | "flowerBed" | "pathStone" | "fountain";

export interface LandDecorationPosition {
  x: number;
  z: number;
  kind: LandDecorationKind;
}

/**
 * Real positional + kind data — replaces the old flat `landmarkPositions`
 * array local to `scene.ts` (six identical gray cylinders). The six
 * original coordinates are kept as-is for the "tree" entries (already
 * tuned for follow-camera parallax spread), with a fountain + a short
 * connecting path added near spawn, and a few flower-bed patches filling
 * the middle ground. Deliberately not random — every position here is a
 * fixed literal, same discipline as the rest of this codebase (e.g.
 * `terrainHeightAt`'s deterministic sum-of-sines, `bobOffset`'s pure
 * function) — so the scene renders identically every load and stays
 * screenshot/test-reproducible.
 */
export const LAND_DECORATION_POSITIONS: LandDecorationPosition[] = [
  // Centerpiece, a short walk north of spawn.
  { x: 0, z: 5, kind: "fountain" },
  // A simple path connecting spawn to the fountain — stepping stones, not
  // a paved strip, so it reads as light-touch rather than heavily built.
  { x: 0, z: 1, kind: "pathStone" },
  { x: 0, z: 2, kind: "pathStone" },
  { x: 0, z: 3, kind: "pathStone" },
  { x: 0, z: 4, kind: "pathStone" },
  // Trees — the original six landmark coordinates, unchanged.
  { x: 4, z: -6, kind: "tree" },
  { x: -5, z: -4, kind: "tree" },
  { x: 6, z: 4, kind: "tree" },
  { x: -6, z: 5, kind: "tree" },
  { x: 2, z: 10, kind: "tree" },
  { x: -8, z: -10, kind: "tree" },
  // A few flower-bed color patches in the middle ground.
  { x: 3, z: 2, kind: "flowerBed" },
  { x: -3, z: 3, kind: "flowerBed" },
  { x: -3, z: -2, kind: "flowerBed" },
];

const TRUNK_COLOR = 0x6b4a2f;
const FOLIAGE_COLOR = 0x3f7d3f;
const FOLIAGE_COLOR_LIGHT = 0x5a9650; // a second, lighter tone breaks up the canopy's silhouette
const SOIL_COLOR = 0x4a3524;
const PATH_STONE_COLOR = 0xb9ac8f;
const FOUNTAIN_STONE_COLOR = 0x9a9a92;
const WATER_COLOR = 0x5fb8d8;
// Fixed, not random — a small deterministic layout of bloom colors/offsets
// reused by every flower-bed patch, same "no Math.random" discipline as
// the position data above.
const BLOOM_LAYOUT: Array<{ dx: number; dz: number; color: number }> = [
  { dx: 0, dz: 0, color: 0xe85d8a },
  { dx: 0.3, dz: 0.15, color: 0xf2c94c },
  { dx: -0.28, dz: 0.18, color: 0xb47ee0 },
  { dx: 0.12, dz: -0.3, color: 0xf2c94c },
  { dx: -0.2, dz: -0.22, color: 0xe85d8a },
];

// A cone reads as a traffic cone, not a tree — this replaces it with a
// small cluster of overlapping, low-poly (faceted, not smooth) blobs that
// build up an irregular canopy silhouette instead of one perfect point.
// Fixed, not random, same "no Math.random" discipline as BLOOM_LAYOUT
// above: every tree gets the identical cluster, so the scene stays
// screenshot/test-reproducible. `light` alternates in so the canopy reads
// as leaf clumps rather than one flat-shaded mass.
const CANOPY_LAYOUT: Array<{ dx: number; dy: number; dz: number; radius: number; light?: boolean }> = [
  { dx: 0, dy: 0, dz: 0, radius: 0.75 },
  { dx: 0.38, dy: 0.22, dz: 0.12, radius: 0.5, light: true },
  { dx: -0.32, dy: 0.3, dz: -0.22, radius: 0.48 },
  { dx: 0.08, dy: 0.5, dz: -0.3, radius: 0.42, light: true },
];

function createTree(): THREE.Group {
  const group = new THREE.Group();
  group.name = "tree";

  // A slight root flare (wider at the base than the old uniform taper)
  // reads less like a plain pole.
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.24, 1.2, 7),
    new THREE.MeshStandardMaterial({ color: TRUNK_COLOR }),
  );
  trunk.position.y = 0.6;
  trunk.name = "tree-trunk";
  group.add(trunk);

  const canopyBaseY = 1.2 + 0.55;
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: FOLIAGE_COLOR });
  const foliageMaterialLight = new THREE.MeshStandardMaterial({ color: FOLIAGE_COLOR_LIGHT });
  for (const blob of CANOPY_LAYOUT) {
    // IcosahedronGeometry at low detail gives a faceted, irregular ball —
    // closer to a leaf clump than SphereGeometry's perfectly smooth dome
    // (still "procedural primitive," same discipline the rest of this
    // file uses, just a rounder primitive than a cone).
    const clump = new THREE.Mesh(
      new THREE.IcosahedronGeometry(blob.radius, 1),
      blob.light ? foliageMaterialLight : foliageMaterial,
    );
    clump.position.set(blob.dx, canopyBaseY + blob.dy, blob.dz);
    clump.name = "tree-foliage";
    group.add(clump);
  }

  return group;
}

function createFlowerBed(): THREE.Group {
  const group = new THREE.Group();
  group.name = "flowerBed";

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.85, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: SOIL_COLOR }),
  );
  soil.position.y = 0.06;
  soil.name = "flower-bed-soil";
  group.add(soil);

  for (const bloom of BLOOM_LAYOUT) {
    const blossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshStandardMaterial({ color: bloom.color }),
    );
    blossom.position.set(bloom.dx, 0.24, bloom.dz);
    blossom.name = "flower-bed-bloom";
    group.add(blossom);
  }

  return group;
}

function createPathStone(): THREE.Group {
  const group = new THREE.Group();
  group.name = "pathStone";

  const stone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.55, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: PATH_STONE_COLOR }),
  );
  stone.position.y = 0.04;
  stone.name = "path-stone-slab";

  group.add(stone);
  return group;
}

function createFountain(): THREE.Group {
  const group = new THREE.Group();
  group.name = "fountain";

  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.4, 0.5, 14),
    new THREE.MeshStandardMaterial({ color: FOUNTAIN_STONE_COLOR }),
  );
  basin.position.y = 0.25;
  basin.name = "fountain-basin";

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.08, 8, 20),
    new THREE.MeshStandardMaterial({ color: FOUNTAIN_STONE_COLOR }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.5;
  rim.name = "fountain-rim";

  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: FOUNTAIN_STONE_COLOR }),
  );
  spout.position.y = 0.5 + 0.45;
  spout.name = "fountain-spout";

  const water = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({
      color: WATER_COLOR,
      emissive: WATER_COLOR,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.85,
    }),
  );
  water.position.y = 0.5 + 0.9 + 0.15;
  water.name = "fountain-water";

  group.add(basin, rim, spout, water);
  return group;
}

/**
 * Builds one decoration's mesh group for the given kind — every group's
 * local origin sits at ground level (y=0), children offset upward within
 * it, same convention `world/portalMarker.ts`/`world/divingHouseMarker.ts`
 * already use, so `scene.ts` can position a decoration with a single
 * `terrainHeightAt(x, z)` call, no per-kind offset arithmetic at the call
 * site.
 */
export function createLandDecorationMesh(kind: LandDecorationKind): THREE.Group {
  switch (kind) {
    case "tree":
      return createTree();
    case "flowerBed":
      return createFlowerBed();
    case "pathStone":
      return createPathStone();
    case "fountain":
      return createFountain();
  }
}
