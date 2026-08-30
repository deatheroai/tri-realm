import * as THREE from "three";

/**
 * Interim block-material texturing: a real generated pattern (not a flat
 * color) for each BLOCK_MATERIALS entry, built entirely from our own code —
 * no external asset needed. Swapped for a photographed PBR pack once
 * ambientCG (or equivalent) content is reachable — see DECISIONS.md and
 * BACKLOG.md's "Real textures for block materials" item. Each pattern is a
 * pure greyscale *shading* multiplier (not a saturated color), so the
 * material's own `color` still supplies hue — the texture only adds
 * per-pixel light/dark detail on top of it, the same way a real diffuse/AO
 * detail map would.
 */
export type ProceduralTextureKind = "sandstone" | "slate" | "timber" | "gold";

const DEFAULT_TEXTURE_SIZE = 64;

/**
 * Deterministic pseudo-random value in [0, 1) for an integer coordinate
 * pair — same inputs always produce the same output, so generated textures
 * are reproducible and directly unit-testable (no seeded-RNG state to
 * manage). Same trick `terrainHeightAt` uses one layer over: a small sum of
 * sine waves standing in for real noise.
 */
function grain(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Per-pixel shading intensity (roughly 0.5–1.0) for a given material's pattern at (x, y) in a `size`×`size` tile. */
function patternIntensity(kind: ProceduralTextureKind, x: number, y: number, size: number): number {
  const u = x / size;
  const v = y / size;
  switch (kind) {
    case "sandstone": {
      // Thin horizontal sediment banding, like real sandstone strata, plus fine grain.
      const bands = Math.sin(v * size * 0.9) * 0.5 + 0.5;
      return 0.72 + bands * 0.18 + grain(x, y) * 0.1;
    }
    case "slate": {
      // Jagged interlocking facets, like cleaved rock plates.
      const facets = Math.sin(u * 9 + Math.sin(v * 7) * 2) * Math.sin(v * 8);
      return 0.68 + Math.abs(facets) * 0.32;
    }
    case "timber": {
      // Vertical wavy wood grain.
      const wave = Math.sin(u * size * 0.35 + Math.sin(v * 4) * 3);
      return 0.72 + wave * 0.2 + grain(x, y) * 0.08;
    }
    case "gold": {
      // A soft diagonal metallic sheen band plus fine speckle.
      const sheen = Math.sin((u + v) * 6);
      return 0.75 + sheen * 0.18 + grain(x, y) * 0.12;
    }
  }
}

/**
 * Pure: an RGBA greyscale pixel buffer for a tileable procedural pattern.
 * No THREE dependency, so the pattern logic itself is directly
 * unit-testable without constructing a real texture/renderer.
 */
export function generateTexturePixels(kind: ProceduralTextureKind, size = DEFAULT_TEXTURE_SIZE): Uint8Array {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const intensity = Math.min(1, Math.max(0, patternIntensity(kind, x, y, size)));
      const grey = Math.round(intensity * 255);
      const i = (y * size + x) * 4;
      pixels[i] = grey;
      pixels[i + 1] = grey;
      pixels[i + 2] = grey;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const textureCache = new Map<ProceduralTextureKind, THREE.DataTexture>();

/**
 * A THREE.DataTexture built from generateTexturePixels, cached per kind —
 * every placed piece sharing a material reuses the same generated texture
 * instead of rebuilding it per placement.
 */
export function getProceduralTexture(kind: ProceduralTextureKind, size = DEFAULT_TEXTURE_SIZE): THREE.DataTexture {
  let texture = textureCache.get(kind);
  if (!texture) {
    texture = new THREE.DataTexture(generateTexturePixels(kind, size), size, size, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    textureCache.set(kind, texture);
  }
  return texture;
}

/** Test-only: the module-level cache otherwise leaks a texture instance across tests using the same kind. */
export function __resetProceduralTextureCacheForTests(): void {
  textureCache.clear();
}
