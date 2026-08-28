import * as THREE from "three";

const PIECE_WIDTH = 1.2;
const PIECE_HEIGHT = 1.4;
const PIECE_DEPTH = 1.2;

/** Half-height of a placed piece — add this to a ground-contact y to get the mesh's center. */
export const CASTLE_PIECE_GROUND_OFFSET = PIECE_HEIGHT / 2;

/**
 * A single placeholder castle piece — a plain box, no catalog or placement
 * validation yet (that's Phase 1b, once the RealmMap schema exists). The
 * point of this pass is just proving the core loop: walk somewhere, place
 * something, see it appear.
 */
export function createCastlePieceMesh(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(PIECE_WIDTH, PIECE_HEIGHT, PIECE_DEPTH),
    new THREE.MeshStandardMaterial({ color: 0xb8a488 }),
  );
  mesh.name = "placed-structure";
  return mesh;
}
