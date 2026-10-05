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
    case "blocks-portal":
      return "Can't place here: blocks a portal";
    case "blocks-avatar":
      return "Can't place here: you're standing there";
    case "terrain-not-suitable":
      return "Can't place here: unsuitable terrain";
  }
}

/** The next placement's yaw as whole degrees clockwise-agnostic 0/90/180/270
 * (rotation is quarter-turn only, see placementValidation.ts). */
export function facingDegrees(rotation: number): number {
  const deg = Math.round((rotation * 180) / Math.PI) % 360;
  return (deg + 360) % 360;
}

/** HUD text for the yaw the next placement will use — kept to a bare
 * degree figure so the count line stays one line on narrow viewports. */
export function describeFacing(rotation: number): string {
  return `${facingDegrees(rotation)}°`;
}
