import * as THREE from "three";
import { DEFAULT_BLOCK_MATERIAL_ID, findBlockMaterial } from "../skins/blockMaterials";
import { getProceduralTexture } from "../skins/proceduralTextures";
import { upgradeToRealTextures } from "../skins/realBlockTextures";
import { DEFAULT_CASTLE_STRUCTURE_TYPE_ID, findCastleStructureType } from "./castleStructures";
import { upgradeCastlePieceToRealModel } from "./realCastlePieceModels";

/**
 * A placed castle piece's visual: a plain box per type (rough is fine, see
 * `AUTONOMY.md`) — real `CastleStructureType`s (`castleStructures.ts`)
 * instead of one hardcoded shape: `typeId` picks the box's dimensions,
 * `materialId` selects a color + generated shading pattern from the
 * BLOCK_MATERIALS catalog (src/skins/blockMaterials.ts,
 * src/skins/proceduralTextures.ts). The material starts on that generated
 * pattern and, when the catalog entry names real photographed textures
 * (src/skins/realBlockTextures.ts), upgrades to them in place once loaded.
 * Some types (`castleStructures.ts`'s `realModel` field) go further and
 * upgrade the box itself to a real Quaternius model
 * (`realCastlePieceModels.ts`'s `upgradeCastlePieceToRealModel`) — fired
 * here as a non-blocking side effect, so this function itself still never
 * needs to be async: every caller (live placement, save/load
 * reconstruction) keeps getting a real mesh back synchronously, which
 * upgrades itself in place a moment later if a real model is configured
 * and loads successfully. A placed piece is a real `PlacedStructure` on
 * the `RealmMap` (`src/world/realmMap.ts`), checked against
 * `src/world/placementValidation.ts` before it's ever created.
 */
export function createCastlePieceMesh(
  typeId: string = DEFAULT_CASTLE_STRUCTURE_TYPE_ID,
  materialId: string = DEFAULT_BLOCK_MATERIAL_ID,
): THREE.Mesh {
  const type = findCastleStructureType(typeId);
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
  upgradeCastlePieceToRealModel(mesh, typeId);
  return mesh;
}

/** Half-height of a structure type's box — add this to a ground-contact y
 * to get the mesh's center for that type. */
export function castlePieceGroundOffset(typeId: string = DEFAULT_CASTLE_STRUCTURE_TYPE_ID): number {
  return findCastleStructureType(typeId).dimensions.height / 2;
}
