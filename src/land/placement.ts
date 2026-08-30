import * as THREE from "three";
import { DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "../skins/blockMaterials";

const PIECE_WIDTH = 1.2;
const PIECE_HEIGHT = 1.4;
const PIECE_DEPTH = 1.2;

/** Half-height of a placed piece — add this to a ground-contact y to get the mesh's center. */
export const CASTLE_PIECE_GROUND_OFFSET = PIECE_HEIGHT / 2;

/**
 * A single placeholder castle piece — a plain box, still no real structure
 * catalog or placement validation (those are separate `BACKLOG.md` Phase 1b
 * items; a placed piece is now a real `PlacedStructure` on the `RealmMap` —
 * see `src/world/realmMap.ts` — but its visual is still just this one box
 * shape, and any position is accepted with no validity check). `materialId`
 * selects a flat color from the BLOCK_MATERIALS catalog
 * (src/skins/blockMaterials.ts) — swapped for a real texture once one is
 * sourced.
 */
export function createCastlePieceMesh(materialId: string = DEFAULT_BLOCK_MATERIAL_ID): THREE.Mesh {
  const material = findBlockMaterial(materialId);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(PIECE_WIDTH, PIECE_HEIGHT, PIECE_DEPTH),
    new THREE.MeshStandardMaterial({ color: material.color }),
  );
  mesh.name = "placed-structure";
  return mesh;
}
