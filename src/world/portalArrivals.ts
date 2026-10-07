import type { Vec3 } from "../math/vec3";
import type { Portal } from "./realmMap";
import { AIR_LAND_PORTAL, AIR_LAND_STAIRWAY_PORTAL, LAND_AIR_PORTAL, LAND_AIR_STAIRWAY_PORTAL } from "./landAirPortal";
import { LAND_SEA_PORTAL, SEA_LAND_PORTAL } from "./landSeaPortal";

// Every portal in the game, regardless of which map holds it. A portal's
// `targetSpawnPosition` is where the avatar *lands* in its target map — a
// spot that map's own `portals` list knows nothing about.
const ALL_PORTALS: readonly Portal[] = [
  LAND_AIR_PORTAL,
  AIR_LAND_PORTAL,
  LAND_AIR_STAIRWAY_PORTAL,
  AIR_LAND_STAIRWAY_PORTAL,
  LAND_SEA_PORTAL,
  SEA_LAND_PORTAL,
];

/** Where avatars arrive in `mapId` via a portal from elsewhere. Placement
 * keeps these clear (`src/world/placementValidation.ts`) so a piece can't
 * be dropped on an arrival spot and trap the next traveller inside it. */
export function arrivalPointsFor(mapId: string): Vec3[] {
  return ALL_PORTALS.filter((p) => p.targetRealmMapId === mapId).map((p) => p.targetSpawnPosition);
}
