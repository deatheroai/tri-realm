import type { PlacementRejectionReason } from "./placementValidation";

/** Player-facing text for a rejected placement — replaces the old "reject
 * silently, no error UI yet" pass. Keyed exhaustively on the reason union
 * so a new `PlacementRejectionReason` fails typecheck until it gets a
 * message here. */
export function describePlacementRejection(reason: PlacementRejectionReason): string {
  switch (reason) {
    case "out-of-bounds":
      return "Can't place here: outside the realm";
    case "overlaps-structure":
      return "Can't place here: overlaps a piece";
    case "terrain-not-suitable":
      return "Can't place here: unsuitable terrain";
  }
}
