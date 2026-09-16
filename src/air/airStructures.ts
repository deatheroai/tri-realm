/**
 * Air's own structure catalog (`ARCHITECTURE.md`'s "Construction system":
 * "sea/air add their own catalog + rule later without [placementValidation.ts]
 * changing" — this is air's half, sea's own already landed). Mirrors
 * `src/sea/seaStructures.ts`'s shape (`dimensions` doubles as both the
 * visual box size and `placementValidation.ts`'s `StructureFootprint`) and
 * its "rough is fine, one type first" discipline — no `realModel` concept
 * here yet either, same reasoning sea's own single starter type used.
 */
export interface AirStructureType {
  id: string;
  label: string;
  dimensions: { width: number; height: number; depth: number };
}

export const AIR_STRUCTURE_TYPES: AirStructureType[] = [
  // A flat landing pad — wide and thin, reads as somewhere to rest or
  // build a path through open sky, distinct from air's existing
  // decorative cloud platforms (world-authored terrain, not player-built).
  {
    id: "sky-platform",
    label: "Platform",
    dimensions: { width: 2.4, height: 0.4, depth: 2.4 },
  },
];

export const DEFAULT_AIR_STRUCTURE_TYPE_ID = "sky-platform";

export function findAirStructureType(id: string): AirStructureType {
  const found = AIR_STRUCTURE_TYPES.find((type) => type.id === id);
  if (!found) {
    throw new Error(`Unknown air structure type: ${id}`);
  }
  return found;
}
