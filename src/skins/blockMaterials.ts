export interface BlockMaterialSkin {
  id: string;
  label: string;
  /** Flat color for now — swapped for a real texture once one is sourced (see DECISIONS.md). */
  color: number;
}

export const BLOCK_MATERIALS: readonly BlockMaterialSkin[] = [
  { id: "sandstone", label: "Sandstone", color: 0xb8a488 },
  { id: "slate", label: "Slate", color: 0x6b7280 },
  { id: "timber", label: "Timber", color: 0x6b4a2f },
  { id: "gold", label: "Gold", color: 0xd4af37 },
];

export const DEFAULT_BLOCK_MATERIAL_ID = BLOCK_MATERIALS[0]!.id;

export function findBlockMaterial(id: string): BlockMaterialSkin {
  return BLOCK_MATERIALS.find((m) => m.id === id) ?? BLOCK_MATERIALS[0]!;
}
