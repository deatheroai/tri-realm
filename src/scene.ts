import * as THREE from "three";
import { terrainHeightAt } from "./land/terrain";
import { LAND_MAP_SIZE } from "./land/landRealmMap";
import { AVATAR_GROUND_OFFSET, createProceduralAvatarMesh } from "./skins/avatarView";

const GROUND_SIZE = LAND_MAP_SIZE;
const GROUND_SEGMENTS = 64;

export { AVATAR_GROUND_OFFSET };

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
 * Builds the land scene: varied terrain, a player-controlled avatar, and
 * basic lighting. `GROUND_SIZE` matches the `RealmMap`'s own `bounds`
 * (`land/landRealmMap.ts`) so the rendered ground and the map data can't
 * drift apart. Landmarks stay local hardcoded dressing — they're cosmetic
 * scene parallax, not `PlacedStructure`s, so they're outside the schema.
 *
 * The avatar is a Group ("avatar") holding whichever skin is currently
 * active — starts with the default procedural capsule as its one child;
 * AvatarView (src/skins/avatarView.ts) takes over swapping that child
 * once main.ts wires it up. The group itself is what main.ts positions
 * every frame, so skin-swapping never touches movement/positioning code.
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

  const avatarRoot = new THREE.Group();
  avatarRoot.name = "avatar";
  avatarRoot.add(createProceduralAvatarMesh());
  avatarRoot.position.set(0, terrainHeightAt(0, 0) + AVATAR_GROUND_OFFSET, 0);
  scene.add(avatarRoot);

  return scene;
}
