import * as THREE from "three";
import { createProceduralAvatarMesh } from "../skins/avatarView";
import {
  SEA_FLOOR_Y,
  SEA_SURFACE_Y,
  SEA_AVATAR_SPAWN_Y,
  SEA_WRECKAGE_POSITIONS,
  SEA_SHIPWRECK_POSITION,
} from "./seaRealmMap";
import { SEA_PORTAL_POSITION } from "../world/landSeaPortal";
import { createSeaPortalArchMesh } from "../world/divingHouseMarker";
import { createShipwreckMesh } from "./shipwreckMesh";

const DEEP_WATER_COLOR = 0x0c3550;
const FLOOR_COLOR = 0xb8a97a; // sandy sea floor
const WRECKAGE_COLOR = 0x5b4632; // weathered wood/wreckage

/**
 * Builds the sea scene: a bounded swimmable volume between a sea floor and
 * a water surface, with scattered floating docks/wreckage for movement
 * parallax (`ARCHITECTURE.md`: each realm gets "its own realm-appropriate
 * floating elements"), and a player-controlled avatar. Now has the
 * land↔sea portal's sea-side marker too (`src/world/landSeaPortal.ts`,
 * `src/world/divingHouseMarker.ts`) — the flavor decided `DECISIONS.md`
 * 2026-09-07, same pattern land↔air's balloon already used. Wreckage
 * positions come from
 * `seaRealmMap.ts`'s `SEA_WRECKAGE_POSITIONS` — real `RealmMap.terrain`
 * data, not a hardcoded array local to this file — so the visual and the
 * map data can't drift apart, same pattern as air's platforms.
 *
 * The avatar `Group` here is a small, intentional duplicate of
 * `scene.ts`'s pattern rather than a shared refactor — avatar-`Group`
 * creation there is Skins-track-owned (`AUTONOMY.md`'s file ownership),
 * so this stays self-contained instead of reaching into that file (same
 * choice `airScene.ts` made).
 */
export function createSeaScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(DEEP_WATER_COLOR);
  // Distant wreckage/floor fades into the deep-water color instead of
  // popping into view at a hard clip boundary — reads as "underwater," not
  // just "a dark box."
  scene.fog = new THREE.Fog(DEEP_WATER_COLOR, 8, 40);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const sun = new THREE.DirectionalLight(0xbfe3ff, 0.6); // dimmer, cool-tinted — light filtering down through water
  sun.position.set(4, 20, 4);
  scene.add(ambient, sun);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(60, 0.5, 60),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR }),
  );
  floor.name = "sea-floor";
  floor.position.set(0, SEA_FLOOR_Y - 0.25, 0);
  scene.add(floor);

  // A translucent plane at the water surface — purely visual (no
  // collision reads it; `stepSeaMovement` clamps against `SEA_SURFACE_Y`
  // directly), so a swimmer can see the surface approaching from below.
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x2f7ea8, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  surface.name = "sea-surface";
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, SEA_SURFACE_Y, 0);
  scene.add(surface);

  const wreckageMaterial = new THREE.MeshStandardMaterial({ color: WRECKAGE_COLOR });
  for (const position of SEA_WRECKAGE_POSITIONS) {
    const wreckage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1), wreckageMaterial);
    wreckage.position.set(position.x, position.y, position.z);
    wreckage.name = "landmark";
    scene.add(wreckage);
  }

  const avatarRoot = new THREE.Group();
  avatarRoot.name = "avatar";
  avatarRoot.add(createProceduralAvatarMesh());
  avatarRoot.position.set(0, SEA_AVATAR_SPAWN_Y, 0);
  scene.add(avatarRoot);

  // Centerpiece shipwreck landmark (`BACKLOG.md`, 2026-09-08 design
  // review) — one large, dramatic broken-ship hull + mast, distinct from
  // (and additional to) the smaller wreckage debris above.
  const shipwreck = createShipwreckMesh();
  shipwreck.position.set(SEA_SHIPWRECK_POSITION.x, SEA_SHIPWRECK_POSITION.y, SEA_SHIPWRECK_POSITION.z);
  scene.add(shipwreck);

  // The land<->sea portal's sea-side end — purely visual here, the real
  // trigger is proximity to SEA_PORTAL_POSITION, checked in main.ts
  // against the RealmMap's own Portal data, not this mesh's position
  // (placed at that same shared constant so the two can't drift apart).
  const seaPortalArch = createSeaPortalArchMesh();
  seaPortalArch.position.set(SEA_PORTAL_POSITION.x, SEA_PORTAL_POSITION.y, SEA_PORTAL_POSITION.z);
  scene.add(seaPortalArch);

  return scene;
}
