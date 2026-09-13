import * as THREE from "three";
import { DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "../skins/blockMaterials";
import { getProceduralTexture } from "../skins/proceduralTextures";
import { upgradeToRealTextures } from "../skins/realBlockTextures";
import { DEFAULT_SEA_STRUCTURE_TYPE_ID, findSeaStructureType } from "./seaStructures";

/**
 * A placed sea structure's visual — mirrors `src/land/placement.ts`'s
 * `createCastlePieceMesh` exactly (same block-material/procedural-texture
 * pipeline, same "generated pattern first, real texture upgrades in place"
 * behavior), just against sea's own catalog. No `realModel` upgrade step
 * yet — `seaStructures.ts`'s single type has none (same "rough is fine"
 * discipline castle pieces themselves started under).
 */
export function createSeaStructureMesh(
  typeId: string = DEFAULT_SEA_STRUCTURE_TYPE_ID,
  materialId: string = DEFAULT_BLOCK_MATERIAL_ID,
): THREE.Mesh {
  const type = findSeaStructureType(typeId);
  const material = findBlockMaterial(materialId);
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: material.color,
    map: getProceduralTexture(material.textureKind),
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(type.dimensions.width, type.dimensions.height, type.dimensions.depth),
    meshMaterial,
  );
  mesh.name = "placed-structure";
  if (material.textureUrls) {
    upgradeToRealTextures(meshMaterial, material.textureUrls, { tint: material.tintRealTexture ?? false });
  }
  return mesh;
}

/** Half-height of a sea structure type's box — add this to a floor-contact
 * y to get the mesh's center for that type, same convention
 * `castlePieceGroundOffset` uses for land. */
export function seaStructureGroundOffset(typeId: string = DEFAULT_SEA_STRUCTURE_TYPE_ID): number {
  return findSeaStructureType(typeId).dimensions.height / 2;
}
