import * as THREE from "three";
import { createProceduralAvatarMesh } from "../skins/avatarView";

const SKY_COLOR = 0x8fc7e8;

const FLOATING_PLATFORM_POSITIONS: Array<[number, number, number]> = [
  [6, 2, -8],
  [-8, 6, -4],
  [10, -3, 6],
  [-6, 8, 8],
  [3, 12, 14],
  [-12, -2, -10],
];

const AVATAR_SPAWN_HEIGHT = 5;

/**
 * Builds the air scene: an open sky volume with scattered floating
 * platforms for movement parallax (`ARCHITECTURE.md`: each realm gets
 * "its own realm-appropriate floating elements"), and a player-controlled
 * avatar. No ground plane, no ground collision — flight
 * (`src/air/airMovement.ts`) is free 3D movement, matching air's "mostly
 * open volume" terrain per the `RealmMap` schema. Rough/hardcoded per
 * `AUTONOMY.md`'s visual-first sequencing — this is air's Phase 2
 * equivalent of land's very first Phase 1a slice.
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
  for (const [x, y, z] of FLOATING_PLATFORM_POSITIONS) {
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 10), platformMaterial);
    platform.position.set(x, y, z);
    platform.name = "landmark";
    scene.add(platform);
  }

  const avatarRoot = new THREE.Group();
  avatarRoot.name = "avatar";
  avatarRoot.add(createProceduralAvatarMesh());
  avatarRoot.position.set(0, AVATAR_SPAWN_HEIGHT, 0);
  scene.add(avatarRoot);

  return scene;
}
