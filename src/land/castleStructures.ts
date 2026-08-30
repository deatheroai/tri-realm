/**
 * The starter castle structure catalog (`BACKLOG.md` Phase 1b) — real
 * types instead of the single hardcoded placeholder box Phase 1a used.
 * Each is still a plain box visually (rough is fine — see `AUTONOMY.md`'s
 * visual-first guardrail), differentiated by dimensions/label; a real
 * shape per type is future polish, not required for the mechanics this
 * item is about (a real catalog + placement validation). `dimensions`
 * doubles as the structure's placement footprint
 * (`src/world/placementValidation.ts`'s `StructureFootprint` shape).
 */
export interface CastleStructureType {
  id: string;
  label: string;
  dimensions: { width: number; height: number; depth: number };
}

export const CASTLE_STRUCTURE_TYPES: CastleStructureType[] = [
  // Matches Phase 1a's original placeholder box exactly, so it stays the
  // default and existing behavior/tests built around that box are unchanged.
  { id: "castle-keep", label: "Keep", dimensions: { width: 1.2, height: 1.4, depth: 1.2 } },
  { id: "castle-wall", label: "Wall", dimensions: { width: 2.0, height: 1.0, depth: 0.4 } },
  { id: "castle-gate", label: "Gate", dimensions: { width: 1.6, height: 1.8, depth: 0.4 } },
];

export const DEFAULT_CASTLE_STRUCTURE_TYPE_ID = "castle-keep";

export function findCastleStructureType(id: string): CastleStructureType {
  const found = CASTLE_STRUCTURE_TYPES.find((type) => type.id === id);
  if (!found) {
    throw new Error(`Unknown castle structure type: ${id}`);
  }
  return found;
}
