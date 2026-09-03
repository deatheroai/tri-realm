import * as THREE from "three";
import { AIR_PORTAL_POSITION } from "../world/landAirPortal";
import { createPortalMarkerMesh } from "../world/portalMarker";
import { createProceduralAvatarMesh } from "../skins/avatarView";
import { AIR_FLOATING_PLATFORM_POSITIONS } from "./airRealmMap";

const SKY_COLOR = 0x8fc7e8;

const AVATAR_SPAWN_HEIGHT = 5;

/**
 * Builds the air scene: an open sky volume with scattered floating
 * platforms for movement parallax (`ARCHITECTURE.md`: each realm gets
 * "its own realm-appropriate floating elements"), and a player-controlled
 * avatar. No ground plane, no ground collision — flight
 * (`src/air/airMovement.ts`) is free 3D movement, matching air's "mostly
 * open volume" terrain per the `RealmMap` schema. Platform positions come
 * from `airRealmMap.ts`'s `AIR_FLOATING_PLATFORM_POSITIONS` — real
 * `RealmMap.terrain` data now, not a hardcoded array local to this file
 * (`BACKLOG.md` Phase 2 hardening) — so the visual and the map data can't
 * drift apart.
 *
 * The avatar `Group` here is a small, intentional duplicate of
 * `scene.ts`'s pattern rather than a shared refactor — avatar-`Group`
 * creation there is Skins-track-owned (`AUTONOMY.md`'s file ownership),
 * so this stays self-contained instead of reaching into that file.
 */
export function createAirScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(8, 15, 5);
  scene.add(ambient, sun);

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xe4d9c4 });
  for (const position of AIR_FLOATING_PLATFORM_POSITIONS) {
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 10), platformMaterial);
    platform.position.set(position.x, position.y, position.z);
    platform.name = "landmark";
    scene.add(platform);
  }

  const avatarRoot = new THREE.Group();
  avatarRoot.name = "avatar";
  avatarRoot.add(createProceduralAvatarMesh());
  avatarRoot.position.set(0, AVATAR_SPAWN_HEIGHT, 0);
  scene.add(avatarRoot);

  // The air-side end of the land<->air portal (src/world/landAirPortal.ts)
  // — purely visual here; the actual trigger is proximity to
  // AIR_PORTAL_POSITION, checked in main.ts against the RealmMap's own
  // Portal data, not this mesh's position (placed at that same shared
  // constant so the two can't drift apart).
  const portalMarker = createPortalMarkerMesh();
  portalMarker.position.set(AIR_PORTAL_POSITION.x, AIR_PORTAL_POSITION.y, AIR_PORTAL_POSITION.z);
  scene.add(portalMarker);

  return scene;
}
