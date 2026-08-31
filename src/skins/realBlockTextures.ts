import * as THREE from "three";
import type { BlockMaterialTextureUrls } from "./blockMaterials";

/**
 * Real photographed PBR maps for block materials — ambientCG (CC0-1.0),
 * mirrored on GitHub Releases by the community `@jgengine/assets` index
 * (github.com/Noisemaker111/jgengine), which this session's network policy
 * *can* reach even though ambientcg.com itself is blocked (see
 * DECISIONS.md). Downloaded once, resized to 512px, and committed directly
 * into public/assets/textures/ — same "small enough to bundle" reasoning as
 * fox.glb/robot.glb, so there's no runtime fetch to a third party at all.
 */

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, Promise<THREE.Texture>>();

function loadTexture(url: string): Promise<THREE.Texture> {
  let cached = textureCache.get(url);
  if (!cached) {
    cached = textureLoader.loadAsync(url);
    textureCache.set(url, cached);
  }
  return cached;
}

/** Test-only: the module-level cache otherwise leaks a texture/promise across tests using the same URL. */
export function __resetRealTextureCacheForTests(): void {
  textureCache.clear();
}

type MapSlot = "map" | "normalMap" | "roughnessMap" | "metalnessMap";

const MAP_COLOR_SPACE: Record<MapSlot, THREE.ColorSpace> = {
  map: THREE.SRGBColorSpace,
  normalMap: THREE.NoColorSpace,
  roughnessMap: THREE.NoColorSpace,
  metalnessMap: THREE.NoColorSpace,
};

/**
 * Loads a block material's real photographed PBR maps and swaps them onto
 * `material` in place, one at a time as each finishes — the material starts
 * (and, on any single map's load failure, stays for that map) on whatever
 * createCastlePieceMesh already set it to (the generated proceduralTextures
 * pattern), so a bad/missing texture file can never leave a piece blank or
 * broken, only less detailed. Mirrors AvatarView's "build the safe default
 * first, upgrade in place once the real asset is ready" philosophy — these
 * maps are bundled locally rather than fetched from a third party, so the
 * only realistic failure mode is a local bug, which this still guards
 * against rather than assuming can't happen.
 */
export function upgradeToRealTextures(
  material: THREE.MeshStandardMaterial,
  urls: BlockMaterialTextureUrls,
  options: { tint: boolean },
): void {
  const apply = (slot: MapSlot, url: string | undefined) => {
    if (!url) return;
    loadTexture(url)
      .then((texture) => {
        texture.colorSpace = MAP_COLOR_SPACE[slot];
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material[slot] = texture;
        if (slot === "map" && !options.tint) {
          // A real photo is already the right hue — undo the flat-color
          // tint createCastlePieceMesh applied for the generated fallback,
          // so the photo reads at its own natural color.
          material.color.setHex(0xffffff);
        }
        if (slot === "metalnessMap") {
          // MeshStandardMaterial's `metalness` scalar multiplies the map's
          // per-pixel value and defaults to 0 — with no map that's correct,
          // but it would zero out this map entirely. Capped well under 1:
          // this scene lights with Ambient+Directional only, no environment
          // map, and a fully metallic surface reflects almost nothing but
          // environment light — metalness 1 here rendered as a near-black
          // silhouette, not "gold" (confirmed with a real screenshot).
          material.metalness = 0.35;
        }
        material.needsUpdate = true;
      })
      .catch((err) => {
        console.error(`Failed to load real block texture "${url}" — keeping the generated fallback.`, err);
      });
  };

  apply("map", urls.color);
  apply("normalMap", urls.normal);
  apply("roughnessMap", urls.roughness);
  apply("metalnessMap", urls.metalness);
}
