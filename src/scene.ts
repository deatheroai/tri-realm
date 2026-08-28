import * as THREE from "three";

const AVATAR_RADIUS = 0.4;
const AVATAR_LENGTH = 1.0;

/** Half-height of the avatar capsule — add this to a ground-contact y to get the mesh's center. */
export const AVATAR_GROUND_OFFSET = AVATAR_LENGTH / 2 + AVATAR_RADIUS;

/**
 * Builds the Phase 1a land scene: a ground plane, a player-controlled
 * avatar capsule, and basic lighting. Still a single hardcoded flat map —
 * no RealmMap schema yet (see BACKLOG.md Phase 1a/1b).
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151c);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(5, 10, 5);
  scene.add(ambient, sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x3a5f3a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = "ground";
  scene.add(ground);

  // A plain flat plane gives the follow-camera no parallax to show movement
  // against — a grid plus a few scattered landmarks make walking visible at
  // a glance, ahead of Phase 1a's next item swapping in real terrain.
  const grid = new THREE.GridHelper(50, 50, 0x2c4a2c, 0x2c4a2c);
  grid.position.y = 0.01;
  scene.add(grid);

  const landmarkPositions: Array<[number, number]> = [
    [4, -6],
    [-5, -4],
    [6, 4],
    [-6, 5],
    [2, 10],
    [-8, -10],
  ];
  const landmarkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b7a99 });
  for (const [x, z] of landmarkPositions) {
    const landmark = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8), landmarkMaterial);
    landmark.position.set(x, 0.75, z);
    landmark.name = "landmark";
    scene.add(landmark);
  }

  const avatar = new THREE.Mesh(
    new THREE.CapsuleGeometry(AVATAR_RADIUS, AVATAR_LENGTH, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9822b }),
  );
  avatar.position.set(0, AVATAR_GROUND_OFFSET, 0);
  avatar.name = "avatar";
  scene.add(avatar);

  return scene;
}
