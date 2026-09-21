/**
 * Sea's own structure catalog (`ARCHITECTURE.md`'s "Construction system":
 * "sea/air add their own catalog + rule later without [placementValidation.ts]
 * changing" — this is that catalog). Mirrors `src/land/castleStructures.ts`'s
 * shape (`dimensions` doubles as both the visual box size and
 * `placementValidation.ts`'s `StructureFootprint`) but deliberately starts
 * with a single type, same "rough is fine" Phase 1a discipline land itself
 * started under before Wall/Gate/Tower were added later — no `realModel`
 * concept here yet either, since land's own only landed once a real asset
 * pack was actually sourced (`BACKLOG.md`).
 */
export interface SeaStructureType {
  id: string;
  label: string;
  dimensions: { width: number; height: number; depth: number };
}

export const SEA_STRUCTURE_TYPES: SeaStructureType[] = [
  // A plain reef pillar — narrow and tall enough to read as a distinct
  // built object next to the wreckage/shipwreck's found-debris silhouette,
  // without implying any particular theme beyond "something placed here."
  {
    id: "reef-pillar",
    label: "Pillar",
    dimensions: { width: 1.0, height: 2.0, depth: 1.0 },
  },
  // Second type (mirrors land's own single-type-to-Wall/Gate/Tower growth,
  // `castleStructures.ts`) — a wide, low reef ridge, a distinct flat/wide
  // silhouette next to the pillar's narrow/tall one, same "rough box,
  // contrast in shape" discipline the pillar itself used. No `realModel`
  // yet either, same reasoning the pillar's own entry gives. Named "Ridge",
  // not "Wall" — land's own catalog already has a "Wall" button in the
  // same shared `#dev-structure-panel` (`castleStructures.ts`), and a
  // label with no shared substring avoids both a confusing dev-panel
  // near-duplicate and any risk of an ambiguous E2E button lookup.
  {
    id: "reef-ridge",
    label: "Reef Ridge",
    dimensions: { width: 1.8, height: 1.2, depth: 0.4 },
  },
];

export const DEFAULT_SEA_STRUCTURE_TYPE_ID = "reef-pillar";

export function findSeaStructureType(id: string): SeaStructureType {
  const found = SEA_STRUCTURE_TYPES.find((type) => type.id === id);
  if (!found) {
    throw new Error(`Unknown sea structure type: ${id}`);
  }
  return found;
}
