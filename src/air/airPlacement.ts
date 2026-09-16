import * as THREE from "three";
import { DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "../skins/blockMaterials";
import { getProceduralTexture } from "../skins/proceduralTextures";
import { upgradeToRealTextures } from "../skins/realBlockTextures";
import { DEFAULT_AIR_STRUCTURE_TYPE_ID, findAirStructureType } from "./airStructures";

/**
 * A placed air structure's visual — mirrors `src/sea/seaPlacement.ts`'s
 * `createSeaStructureMesh` exactly (same block-material/procedural-texture
 * pipeline, same "generated pattern first, real texture upgrades in place"
 * behavior), just against air's own catalog. No `realModel` upgrade step
 * yet — `airStructures.ts`'s single type has none, same "rough is fine"
 * discipline sea's own catalog started under.
 */
export function createAirStructureMesh(
  typeId: string = DEFAULT_AIR_STRUCTURE_TYPE_ID,
  materialId: string = DEFAULT_BLOCK_MATERIAL_ID,
): THREE.Mesh {
  const type = findAirStructureType(typeId);
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

/** Half-height of an air structure type's box — add this to the point a
 * structure is anchored at to get the mesh's center for that type, same
 * convention `seaStructureGroundOffset`/`castlePieceGroundOffset` use. */
export function airStructureGroundOffset(typeId: string = DEFAULT_AIR_STRUCTURE_TYPE_ID): number {
  return findAirStructureType(typeId).dimensions.height / 2;
}
