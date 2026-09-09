import * as THREE from "three";
import { terrainHeightAt } from "./land/terrain";
import { LAND_MAP_SIZE } from "./land/landRealmMap";
import { LAND_PORTAL_POSITION } from "./world/landAirPortal";
import { LAND_PORTAL_POSITION as LAND_SEA_PORTAL_POSITION } from "./world/landSeaPortal";
import { createPortalMarkerMesh } from "./world/portalMarker";
import { createDivingHouseMesh } from "./world/divingHouseMarker";
import { LAND_DECORATION_POSITIONS, createLandDecorationMesh } from "./land/landDecorations";
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

  // Parkland dressing (`BACKLOG.md`, 2026-09-08 design review) — replaces
  // the old plain gray-cylinder landmarks with trees/flower beds/a path/a
  // fountain centerpiece, driven entirely by `LAND_DECORATION_POSITIONS`
  // (`src/land/landDecorations.ts`) so a fork can reskin land by swapping
  // that one array/mesh set, same pattern air's/sea's own data arrays
  // already established. Each decoration group's local origin is ground
  // level (see that file's own comment), so positioning here needs only
  // `terrainHeightAt`, no per-kind offset.
  for (const { x, z, kind } of LAND_DECORATION_POSITIONS) {
    const decoration = createLandDecorationMesh(kind);
    decoration.position.set(x, terrainHeightAt(x, z), z);
    scene.add(decoration);
  }

  const avatarRoot = new THREE.Group();
  avatarRoot.name = "avatar";
  avatarRoot.add(createProceduralAvatarMesh());
  avatarRoot.position.set(0, terrainHeightAt(0, 0) + AVATAR_GROUND_OFFSET, 0);
  scene.add(avatarRoot);

  // The land<->air portal (src/world/landAirPortal.ts) — purely visual
  // here; the actual trigger is proximity to LAND_PORTAL_POSITION,
  // checked in main.ts against the RealmMap's own Portal data, not this
  // mesh's position (which is placed at that same shared constant so the
  // two can't drift apart).
  const portalMarker = createPortalMarkerMesh();
  portalMarker.position.set(LAND_PORTAL_POSITION.x, LAND_PORTAL_POSITION.y, LAND_PORTAL_POSITION.z);
  scene.add(portalMarker);

  // The land<->sea portal (src/world/landSeaPortal.ts) — a diving house,
  // same "purely visual here, real trigger is proximity checked in
  // main.ts" relationship as the balloon above.
  const divingHouse = createDivingHouseMesh();
  divingHouse.position.set(
    LAND_SEA_PORTAL_POSITION.x,
    LAND_SEA_PORTAL_POSITION.y,
    LAND_SEA_PORTAL_POSITION.z,
  );
  scene.add(divingHouse);

  return scene;
}
