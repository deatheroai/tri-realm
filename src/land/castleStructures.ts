/**
 * The starter castle structure catalog (`BACKLOG.md` Phase 1b) — real
 * types instead of the single hardcoded placeholder box Phase 1a used.
 * `dimensions` doubles as the structure's placement footprint
 * (`src/world/placementValidation.ts`'s `StructureFootprint` shape) and,
 * for a type with no `realModel`, its actual visual size too.
 *
 * **`realModel`** (`BACKLOG.md`, "real Quaternius castle-piece models"):
 * each type started as a plain box (rough is fine — see `AUTONOMY.md`'s
 * visual-first guardrail) and two of the three now upgrade to a real
 * asset once loaded (`src/land/realCastlePieceModels.ts` owns the actual
 * loading/swap mechanism — this file only declares *which* model and how
 * it fits, same split `skins/blockMaterials.ts`/`skins/realBlockTextures.ts`
 * already use). Source: Quaternius's "Medieval Village MegaKit" (CC0-1.0),
 * reached via the GitHub-releases mirror (`DECISIONS.md`, 2026-08-31) —
 * a village/house-building kit, not a dedicated fortress kit, so the fit
 * varies per type (see each entry's own comment); full attribution in
 * `public/assets/ATTRIBUTIONS.md`.
 */
export interface CastleStructureType {
  id: string;
  label: string;
  dimensions: { width: number; height: number; depth: number };
  realModel?: RealCastlePieceModel;
}

export interface RealCastlePieceModel {
  /** Path under /public the model is served from. */
  modelUrl: string;
  /** Uniform scale applied to the loaded model to match our world units — measured for real via `gltf-transform inspect` against this catalog entry's own `dimensions`, same discipline the avatar skins' own scale values use (not guessed). */
  scale: number;
  /**
   * "replace-ground": the model *is* the piece — placement.ts's box
   * becomes invisible once the model loads (still a fully valid,
   * unchanged raycast/stacking target: three.js's Raycaster doesn't gate
   * on `.visible`) and the model sits where the box's own bottom face
   * was, base on the ground.
   * "roof-cap": the model *decorates* the piece — the box stays visible,
   * still taking its usual block-material color/texture; the model sits
   * on the box's own top face, additive only.
   */
  placement: "replace-ground" | "roof-cap";
}

export const CASTLE_STRUCTURE_TYPES: CastleStructureType[] = [
  // Matches Phase 1a's original placeholder box exactly, so it stays the
  // default and existing behavior/tests built around that box are unchanged.
  // No single model in the reachable pack reads as "a keep" (a fortified
  // tower) — it's a village-house kit, no dedicated tower/keep piece —
  // so the box itself (and its block-material coloring) stays exactly as
  // it was; only a real conical tower-roof cap (`Roof_Tower_RoundTiles`)
  // is added on top for a more distinctive silhouette. Real bbox at
  // scale 1: 5.65w x 7.36h x 5.43d — scaled to a ~1.6-wide cap, a modest
  // overhang past the 1.2-wide box beneath it.
  {
    id: "castle-keep",
    label: "Keep",
    dimensions: { width: 1.2, height: 1.4, depth: 1.2 },
    realModel: { modelUrl: "/assets/models/castle-keep-roof.glb", scale: 0.28, placement: "roof-cap" },
  },
  // Real asset (Wall_UnevenBrick_Straight) measured 2.0w x 3.12h x 0.41d
  // at scale 1 — width/depth already matched the old placeholder box
  // almost exactly, so only `height` changed to fit the real model
  // (was 1.0, a stubby "waist-high fence" scale; a village building wall
  // is genuinely this tall). `depth` nudged up slightly (0.4 -> 0.42) so
  // the hitbox clears the model's own footprint with a touch of margin.
  {
    id: "castle-wall",
    label: "Wall",
    dimensions: { width: 2.0, height: 3.1, depth: 0.42 },
    realModel: { modelUrl: "/assets/models/castle-wall.glb", scale: 1, placement: "replace-ground" },
  },
  // Real asset (DoorFrame_Round_Brick — a free-standing archway, not a
  // wall-with-a-door-cut-into-it, so it reads as "a gate" specifically)
  // measured 1.6w x 2.58h x 0.48d at scale 1 — width already matched the
  // old placeholder box exactly; `height`/`depth` updated to fit.
  {
    id: "castle-gate",
    label: "Gate",
    dimensions: { width: 1.6, height: 2.6, depth: 0.48 },
    realModel: { modelUrl: "/assets/models/castle-gate.glb", scale: 1, placement: "replace-ground" },
  },
];

export const DEFAULT_CASTLE_STRUCTURE_TYPE_ID = "castle-keep";

export function findCastleStructureType(id: string): CastleStructureType {
  const found = CASTLE_STRUCTURE_TYPES.find((type) => type.id === id);
  if (!found) {
    throw new Error(`Unknown castle structure type: ${id}`);
  }
  return found;
}
