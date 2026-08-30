import * as THREE from "three";
import { DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "../skins/blockMaterials";
import { DEFAULT_CASTLE_STRUCTURE_TYPE_ID, findCastleStructureType } from "./castleStructures";

/**
 * A placed castle piece's visual — still just a plain box per type (rough
 * is fine, see `AUTONOMY.md`), but now real `CastleStructureType`s
 * (`castleStructures.ts`) instead of one hardcoded shape: `typeId` picks
 * the box's dimensions, `materialId` selects a flat color from the
 * BLOCK_MATERIALS catalog (src/skins/blockMaterials.ts) — swapped for a
 * real texture once one is sourced. A placed piece is a real
 * `PlacedStructure` on the `RealmMap` (`src/world/realmMap.ts`), checked
 * against `src/world/placementValidation.ts` before it's ever created.
 */
export function createCastlePieceMesh(
  typeId: string = DEFAULT_CASTLE_STRUCTURE_TYPE_ID,
  materialId: string = DEFAULT_BLOCK_MATERIAL_ID,
): THREE.Mesh {
  const type = findCastleStructureType(typeId);
  const material = findBlockMaterial(materialId);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(type.dimensions.width, type.dimensions.height, type.dimensions.depth),
    new THREE.MeshStandardMaterial({ color: material.color }),
  );
  mesh.name = "placed-structure";
  return mesh;
}

/** Half-height of a structure type's box — add this to a ground-contact y
 * to get the mesh's center for that type. */
export function castlePieceGroundOffset(typeId: string = DEFAULT_CASTLE_STRUCTURE_TYPE_ID): number {
  return findCastleStructureType(typeId).dimensions.height / 2;
}
