/**
 * Deterministic rolling-hill heightfield: a small sum of sine waves at
 * different wavelengths/amplitudes rather than true noise — enough to read
 * as varied land instead of a flat void, trivially reproducible, and
 * cheap to sample per-frame for movement collision.
 *
 * This single function drives both the rendered ground mesh (scene.ts)
 * and stepLandMovement's ground collision (main.ts) — they can't visually
 * and physically drift apart because there's only one height function.
 */
export function terrainHeightAt(x: number, z: number): number {
  return Math.sin(x * 0.2) * 0.8 + Math.cos(z * 0.2) * 0.8 + Math.sin((x + z) * 0.08) * 1.5;
}
