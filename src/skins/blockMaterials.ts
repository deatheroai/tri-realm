import type { ProceduralTextureKind } from "./proceduralTextures";

/** Real photographed PBR maps for a material — served from /public, always bundled (no external fetch), so a load failure can only mean a local bug, not a flaky network. */
export interface BlockMaterialTextureUrls {
  color: string;
  normal?: string;
  roughness?: string;
  metalness?: string;
}

export interface BlockMaterialSkin {
  id: string;
  label: string;
  /** Base hue — tints the generated pattern (proceduralTextures.ts) always, and the real texture below only when tintRealTexture is set. */
  color: number;
  /** Which generated pattern to shade this material with while textureUrls is loading, or forever if it fails to load or isn't set. */
  textureKind: ProceduralTextureKind;
  /** Real photographed PBR maps (ambientCG, CC0-1.0) — swapped onto the mesh in place once loaded; see realBlockTextures.ts's upgradeToRealTextures. */
  textureUrls?: BlockMaterialTextureUrls;
  /**
   * Whether `color` keeps tinting the *real* color map once it loads (not
   * just the generated fallback). Off by default — a real photo is already
   * the right hue, tinting it would muddy it. Gold is the exception: the
   * actual photographed metal is a neutral scratched grey and needs
   * `color`'s gold cast to read as gold at all, same as it already does for
   * the generated pattern.
   */
  tintRealTexture?: boolean;
}

export const BLOCK_MATERIALS: readonly BlockMaterialSkin[] = [
  {
    id: "sandstone",
    label: "Sandstone",
    color: 0xb8a488,
    textureKind: "sandstone",
    textureUrls: {
      color: "/assets/textures/sandstone/color.jpg",
      normal: "/assets/textures/sandstone/normal.jpg",
      roughness: "/assets/textures/sandstone/roughness.jpg",
    },
  },
  {
    id: "slate",
    label: "Slate",
    color: 0x6b7280,
    textureKind: "slate",
    textureUrls: {
      color: "/assets/textures/slate/color.jpg",
      normal: "/assets/textures/slate/normal.jpg",
      roughness: "/assets/textures/slate/roughness.jpg",
    },
  },
  {
    id: "timber",
    label: "Timber",
    color: 0x6b4a2f,
    textureKind: "timber",
    textureUrls: {
      color: "/assets/textures/timber/color.jpg",
      normal: "/assets/textures/timber/normal.jpg",
      roughness: "/assets/textures/timber/roughness.jpg",
    },
  },
  {
    id: "gold",
    label: "Gold",
    color: 0xd4af37,
    textureKind: "gold",
    tintRealTexture: true,
    textureUrls: {
      color: "/assets/textures/gold/color.jpg",
      normal: "/assets/textures/gold/normal.jpg",
      roughness: "/assets/textures/gold/roughness.jpg",
      metalness: "/assets/textures/gold/metalness.jpg",
    },
  },
];

export const DEFAULT_BLOCK_MATERIAL_ID = BLOCK_MATERIALS[0]!.id;

export function findBlockMaterial(id: string): BlockMaterialSkin {
  return BLOCK_MATERIALS.find((m) => m.id === id) ?? BLOCK_MATERIALS[0]!;
}
