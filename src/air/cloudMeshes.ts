import * as THREE from "three";

/**
 * Air's floating platforms as actual cloud-shaped meshes (`BACKLOG.md`,
 * locked in during the 2026-09-08 design review): the platform *is* the
 * cloud, not a separate backdrop layer — chosen so the flight mechanic and
 * the "cloudy sky" visual theme read as the same object, same
 * foundational-starter reasoning as land's parkland dressing
 * (`src/land/landDecorations.ts`). Replaces the old plain gray-cylinder
 * platform mesh in `airScene.ts`. Placement data/collision radius are
 * unchanged (`AIR_FLOATING_PLATFORM_POSITIONS`, `airRealmMap.ts`) — this
 * is a mesh swap, not a schema change.
 *
 * A soft puffy cluster: several overlapping spheres of varying size,
 * flattened slightly and clustered low/wide (a real cloud silhouette is
 * wider than it is tall), rather than a single sphere or a literal
 * geometric primitive. Fixed, not random — the same "no Math.random"
 * discipline the rest of this codebase already keeps (e.g.
 * `landDecorations.ts`'s `BLOOM_LAYOUT`, `terrainHeightAt`'s deterministic
 * formula) — so the cloud shape is identical every load and stays
 * screenshot/test-reproducible.
 */
const CLOUD_COLOR = 0xf5f8fb;

interface CloudPuff {
  dx: number;
  dy: number;
  dz: number;
  radius: number;
}

// One shared layout — every platform is the same cloud shape (like the
// old cylinder was uniform too); a future item could vary this per
// position, not required for this first pass. Widest along x/z, flattened
// on y — reads as a cloud silhouette from the follow camera rather than a
// lumpy sphere pile.
const CLOUD_PUFFS: CloudPuff[] = [
  { dx: 0, dy: 0, dz: 0, radius: 1.1 },
  { dx: 1.0, dy: -0.1, dz: 0.3, radius: 0.85 },
  { dx: -1.0, dy: -0.05, dz: -0.2, radius: 0.9 },
  { dx: 0.4, dy: 0.35, dz: -0.6, radius: 0.75 },
  { dx: -0.5, dy: 0.3, dz: 0.6, radius: 0.7 },
  { dx: 0.1, dy: -0.25, dz: 0.9, radius: 0.65 },
];
const CLOUD_FLATTEN_Y = 0.55; // puffs squashed vertically so the cluster reads wide/flat, not spherical

/**
 * Builds one cloud platform. Local origin sits at the platform's own
 * center (matching the old cylinder's positioning convention exactly —
 * `airScene.ts` sets this group's position directly to each
 * `AIR_FLOATING_PLATFORM_POSITIONS` entry, no extra offset), so swapping
 * the mesh needed no changes to placement or collision-radius logic.
 */
export function createCloudPlatformMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "cloud-platform";

  const material = new THREE.MeshStandardMaterial({ color: CLOUD_COLOR });
  for (let i = 0; i < CLOUD_PUFFS.length; i++) {
    const puff = CLOUD_PUFFS[i];
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(puff.radius, 10, 8), material);
    mesh.scale.y = CLOUD_FLATTEN_Y;
    mesh.position.set(puff.dx, puff.dy, puff.dz);
    mesh.name = "cloud-puff";
    group.add(mesh);
  }

  return group;
}
