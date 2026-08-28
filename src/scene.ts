import * as THREE from "three";
import { terrainHeightAt } from "./land/terrain";

const AVATAR_RADIUS = 0.4;
const AVATAR_LENGTH = 1.0;
const GROUND_SIZE = 50;
const GROUND_SEGMENTS = 64;

/** Half-height of the avatar capsule — add this to a ground-contact y to get the mesh's center. */
export const AVATAR_GROUND_OFFSET = AVATAR_LENGTH / 2 + AVATAR_RADIUS;

/**
 * Displaces a flat PlaneGeometry's vertices to match terrainHeightAt.
 * Before the mesh's own -90°-about-X rotation, a vertex's local (x, y)
 * maps to world (x, -y); setting local z (which becomes world y/height
 * after that rotation) to terrainHeightAt(worldX, worldZ) is what makes
 * the mesh actually match the height function movement collides against.
 */
function buildGroundGeometry(): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const worldX = position.getX(i);
    const worldZ = -position.getY(i);
    position.setZ(i, terrainHeightAt(worldX, worldZ));
  }
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Builds the Phase 1a land scene: varied terrain, a player-controlled
 * avatar capsule, and basic lighting. Still a single hardcoded map — no
 * RealmMap schema yet (see BACKLOG.md Phase 1a/1b).
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151c);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(5, 10, 5);
  scene.add(ambient, sun);

  const ground = new THREE.Mesh(
    buildGroundGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x3a5f3a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = "ground";
  scene.add(ground);

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
    landmark.position.set(x, terrainHeightAt(x, z) + 0.75, z);
    landmark.name = "landmark";
    scene.add(landmark);
  }

  const avatar = new THREE.Mesh(
    new THREE.CapsuleGeometry(AVATAR_RADIUS, AVATAR_LENGTH, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9822b }),
  );
  avatar.position.set(0, terrainHeightAt(0, 0) + AVATAR_GROUND_OFFSET, 0);
  avatar.name = "avatar";
  scene.add(avatar);

  return scene;
}
