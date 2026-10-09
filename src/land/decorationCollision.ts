import { LAND_DECORATION_POSITIONS, type LandDecorationKind, type LandDecorationPosition } from "./landDecorations";
import type { StructureObstacle } from "./structureCollision";
import { terrainHeightAt } from "./terrain";

/**
 * Solid footprint of the decoration kinds the land avatar can't walk
 * through. Half-extent is the box's half-width on X and Z (a circle's radius
 * approximated by its bounding square); height is above local terrain.
 * Flower beds and path stones are flat dressing and deliberately absent.
 * A tree's trunk is tall enough that it can't be jumped onto.
 */
const SOLID_DECORATIONS: Partial<Record<LandDecorationKind, { halfExtent: number; height: number }>> = {
  tree: { halfExtent: 0.2, height: 3 },
  fountain: { halfExtent: 1.4, height: 0.5 },
};

export function decorationObstacles(
  decorations: readonly LandDecorationPosition[] = LAND_DECORATION_POSITIONS,
  heightAt: (x: number, z: number) => number = terrainHeightAt,
): StructureObstacle[] {
  return decorations.flatMap((d) => {
    const solid = SOLID_DECORATIONS[d.kind];
    if (!solid) return [];
    return [
      {
        minX: d.x - solid.halfExtent,
        maxX: d.x + solid.halfExtent,
        minZ: d.z - solid.halfExtent,
        maxZ: d.z + solid.halfExtent,
        topY: heightAt(d.x, d.z) + solid.height,
      },
    ];
  });
}
