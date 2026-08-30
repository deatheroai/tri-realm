import type { ProceduralTextureKind } from "./proceduralTextures";

export interface BlockMaterialSkin {
  id: string;
  label: string;
  /** Base hue — a generated texture (see proceduralTextures.ts) shades on top of this, so it stays meaningful even once a real photographed texture replaces textureKind. */
  color: number;
  /** Which generated pattern to shade this material with — swapped for a real photographed PBR texture once ambientCG (or equivalent) content is sourced (see DECISIONS.md). */
  textureKind: ProceduralTextureKind;
}

export const BLOCK_MATERIALS: readonly BlockMaterialSkin[] = [
  { id: "sandstone", label: "Sandstone", color: 0xb8a488, textureKind: "sandstone" },
  { id: "slate", label: "Slate", color: 0x6b7280, textureKind: "slate" },
  { id: "timber", label: "Timber", color: 0x6b4a2f, textureKind: "timber" },
  { id: "gold", label: "Gold", color: 0xd4af37, textureKind: "gold" },
];

export const DEFAULT_BLOCK_MATERIAL_ID = BLOCK_MATERIALS[0]!.id;

export function findBlockMaterial(id: string): BlockMaterialSkin {
  return BLOCK_MATERIALS.find((m) => m.id === id) ?? BLOCK_MATERIALS[0]!;
}
