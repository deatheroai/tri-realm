import type { Vec3 } from "../math/vec3";
import type { Portal, RealmMap } from "./realmMap";

/**
 * Portal transition (`ARCHITECTURE.md`'s "Portal transition system") —
 * moves an avatar from one `RealmMap` to another by id, using shared
 * logic regardless of source/target realm. This file only answers "is
 * `position` close enough to one of `map`'s portals to trigger it" —
 * realm-agnostic, walking/flying into a portal being the natural
 * interaction for both land and air alike. What actually happens on
 * trigger (switching which scene/movement module is active, resetting
 * velocity, a cooldown so arriving next to a portal doesn't immediately
 * bounce back) is `main.ts`'s job — this file doesn't know realms exist.
 */
export function findNearbyPortal(map: RealmMap, position: Vec3, triggerRadius: number): Portal | undefined {
  return map.portals.find((portal) => distance(position, portal.position) <= triggerRadius);
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
