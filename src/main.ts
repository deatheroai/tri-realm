import * as THREE from "three";
import { createScene, AVATAR_GROUND_OFFSET } from "./scene";
import { createCamera } from "./camera";
import { KeyboardInput, type MoveInput } from "./input/keyboardInput";
import { TouchJoystick } from "./input/touchJoystick";
import { combineMoveInputs } from "./input/combineMoveInputs";
import { stepLandMovement, type LandMovementState } from "./land/landMovement";
import { desiredCameraPosition, smoothingFactor } from "./land/followCamera";
import { createLandRealmMap, landTerrainPlacementRule } from "./land/landRealmMap";
import { createCastlePieceMesh, castlePieceGroundOffset } from "./land/placement";
import {
  CASTLE_STRUCTURE_TYPES,
  DEFAULT_CASTLE_STRUCTURE_TYPE_ID,
  findCastleStructureType,
} from "./land/castleStructures";
import { addStructure, sampleTerrainHeight } from "./world/realmMap";
import { validatePlacement } from "./world/placementValidation";
import { lerpVec3, type Vec3 } from "./math/vec3";
import { AvatarView } from "./skins/avatarView";
import { AVATAR_SKINS, DEFAULT_AVATAR_SKIN_ID, moveInputToAnimationState } from "./skins/avatarSkins";
import { BLOCK_MATERIALS, DEFAULT_BLOCK_MATERIAL_ID } from "./skins/blockMaterials";

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app root element");
}

const scene = createScene();
const camera = createCamera(window.innerWidth / window.innerHeight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

const avatarOrUndefined = scene.getObjectByName("avatar");
if (!avatarOrUndefined) {
  throw new Error("Missing avatar in scene");
}
const avatar = avatarOrUndefined;

const avatarView = new AvatarView(avatar);
void avatarView.setSkin(DEFAULT_AVATAR_SKIN_ID);

const groundOrUndefined = scene.getObjectByName("ground");
if (!groundOrUndefined) {
  throw new Error("Missing ground in scene");
}
const ground = groundOrUndefined;

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

// The Phase 1a prototype is now backed by a real RealmMap (src/world/
// realmMap.ts, src/land/landRealmMap.ts) instead of hardcoded constants —
// `landMap` is reassigned (immutably) as structures are placed, mirroring
// how `movement` is reassigned each frame below.
let landMap = createLandRealmMap();

// Same terrain the ground mesh itself is built from (scene.ts) — movement
// collision and the rendered terrain can't drift apart, and both now go
// through the map's own `terrain` field rather than a bare function.
const groundHeightAt = (x: number, z: number) => sampleTerrainHeight(landMap.terrain, x, z);

const input = new KeyboardInput();

const structuresHud = document.getElementById("hud-structures");

function updateStructuresHud(lastPosition?: THREE.Vector3): void {
  if (!structuresHud) return;
  const placedCount = landMap.structures.length;
  structuresHud.textContent = `Structures: ${placedCount}`;
  structuresHud.dataset.count = String(placedCount);
  if (lastPosition) {
    structuresHud.dataset.lastX = lastPosition.x.toFixed(3);
    structuresHud.dataset.lastY = lastPosition.y.toFixed(3);
    structuresHud.dataset.lastZ = lastPosition.z.toFixed(3);
  }
}
updateStructuresHud();

// Test-only hook: projects a world point to screen pixels the same way the
// renderer does, so E2E tests can click a placed piece's actual position
// instead of guessing screen offsets (this camera's shallow angle means a
// piece's rendered footprint is nowhere near directly below its own
// ground-click point in screen space).
declare global {
  interface Window {
    __projectToScreen?: (x: number, y: number, z: number) => { x: number; y: number };
    __getAvatarSkinId?: () => string;
    __getAvatarWorldHeight?: () => number;
    __getLastPlacedColor?: () => number | undefined;
    __getLastPlacedType?: () => string | undefined;
  }
}
window.__projectToScreen = (x, y, z) => {
  const ndc = new THREE.Vector3(x, y, z).project(camera);
  return {
    x: ((ndc.x + 1) / 2) * window.innerWidth,
    y: ((1 - ndc.y) / 2) * window.innerHeight,
  };
};
window.__getAvatarSkinId = () => avatarView.skinId;
// World-space height of whatever's currently rendering inside the avatar
// group — lets skin scale be checked/tuned against a real number instead
// of by eye (see BACKLOG.md: Robot originally shipped far too tall).
window.__getAvatarWorldHeight = () => {
  const box = new THREE.Box3().setFromObject(avatar);
  return box.max.y - box.min.y;
};
window.__getLastPlacedColor = () => {
  const lastStructure = landMap.structures[landMap.structures.length - 1];
  const last = lastStructure && placedMeshes.get(lastStructure.id);
  const material = (last as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined;
  return material?.color.getHex();
};
window.__getLastPlacedType = () => landMap.structures[landMap.structures.length - 1]?.type;

// Click/tap-to-place: raycast against the ground mesh AND every already-
// placed piece (not the whole scene — avatar/landmarks are deliberately
// excluded, so clicking one of those still resolves to the ground/piece
// behind it) so a second click on an existing piece stacks instead of
// falling through to the ground underneath it.
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
// The mesh for each placed piece, keyed by its RealmMap PlacedStructure id
// — `landMap.structures` is the source of truth (what was placed, where);
// this Map is purely the rendering/raycasting side of the same data.
const placedMeshes = new Map<string, THREE.Object3D>();
let currentBlockMaterialId = DEFAULT_BLOCK_MATERIAL_ID;
let currentStructureTypeId = DEFAULT_CASTLE_STRUCTURE_TYPE_ID;

// Footprint lookup for validatePlacement (src/world/placementValidation.ts)
// — a structure type's `dimensions` already has the shape it wants.
const castleStructureFootprintOf = (typeId: string) => findCastleStructureType(typeId).dimensions;

function placeCastlePieceAt(clientX: number, clientY: number): void {
  pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);

  const hits = raycaster.intersectObjects([ground, ...placedMeshes.values()], false);
  if (hits.length === 0) return;

  const hit = hits[0];
  const groundOffset = castlePieceGroundOffset(currentStructureTypeId);

  let position: Vec3;
  if (hit.object === ground) {
    position = { x: hit.point.x, y: hit.point.y + groundOffset, z: hit.point.z };
  } else {
    // Stack centered on the hit piece rather than at the raw click point —
    // clicking a side face would otherwise offset the new piece into an
    // overhang instead of a clean stack. Top face height comes from its
    // actual bounds, not an assumed constant, so this still works across
    // the real catalog's differently-sized structure types.
    const hitBox = new THREE.Box3().setFromObject(hit.object);
    position = { x: hit.object.position.x, y: hitBox.max.y + groundOffset, z: hit.object.position.z };
  }

  const check = validatePlacement(landMap, currentStructureTypeId, position, castleStructureFootprintOf, landTerrainPlacementRule);
  if (!check.valid) return; // rough Phase 1b pass: reject silently, no error UI yet

  const piece = createCastlePieceMesh(currentStructureTypeId, currentBlockMaterialId);
  piece.position.set(position.x, position.y, position.z);

  const { map, structure } = addStructure(landMap, {
    type: currentStructureTypeId,
    position,
    rotation: 0,
  });
  landMap = map;
  placedMeshes.set(structure.id, piece);

  scene.add(piece);
  updateStructuresHud(piece.position);
}

// The touch-zone (joystick) only becomes pointer-interactive on touch
// devices (see index.html's `pointer: coarse` rule), so a click here is
// always a real placement intent — no need to check the event target.
window.addEventListener("click", (e) => placeCastlePieceAt(e.clientX, e.clientY));

const touchZone = document.getElementById("touch-zone");
const joystickBase = document.getElementById("joystick-base");
const joystickKnob = document.getElementById("joystick-knob");
const touchJoystick =
  touchZone && joystickBase && joystickKnob
    ? new TouchJoystick(touchZone, joystickBase, joystickKnob, { onTap: placeCastlePieceAt })
    : null;

// Dev-only skin switcher (not child-facing UI) — cycles the avatar's skin
// and the block material used for new placements, live, no redeploy. See
// DECISIONS.md for why this exists now (in-app preview, since real asset
// sourcing happens outside this session).
const devSkinPanel = document.getElementById("dev-skin-panel");
if (devSkinPanel) {
  const avatarRow = document.createElement("div");
  avatarRow.textContent = "Avatar: ";
  for (const skin of AVATAR_SKINS) {
    const btn = document.createElement("button");
    btn.textContent = skin.label;
    btn.addEventListener("click", () => void avatarView.setSkin(skin.id));
    avatarRow.appendChild(btn);
  }

  const materialRow = document.createElement("div");
  materialRow.textContent = "Blocks: ";
  for (const material of BLOCK_MATERIALS) {
    const btn = document.createElement("button");
    btn.textContent = material.label;
    btn.addEventListener("click", () => {
      currentBlockMaterialId = material.id;
    });
    materialRow.appendChild(btn);
  }

  devSkinPanel.appendChild(avatarRow);
  devSkinPanel.appendChild(materialRow);
}

// Dev-only structure-type switcher (not child-facing UI) — separate panel
// from the skins one above (that's Skins-track-owned wiring); picks which
// castle structure type (src/land/castleStructures.ts) new placements use.
const devStructurePanel = document.getElementById("dev-structure-panel");
if (devStructurePanel) {
  const structureRow = document.createElement("div");
  structureRow.textContent = "Structure: ";
  for (const type of CASTLE_STRUCTURE_TYPES) {
    const btn = document.createElement("button");
    btn.textContent = type.label;
    btn.addEventListener("click", () => {
      currentStructureTypeId = type.id;
    });
    structureRow.appendChild(btn);
  }
  devStructurePanel.appendChild(structureRow);
}

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

let movement: LandMovementState = {
  position: { x: 0, y: sampleTerrainHeight(landMap.terrain, 0, 0), z: 0 },
  velocityY: 0,
};

const cameraOffset = { x: 0, y: 4.5, z: 7.5 };

const hud = document.getElementById("hud-position");
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);

  // Clamp dt so a dropped/backgrounded frame can't cause a huge physics jump.
  const dt = Math.min(clock.getDelta(), 0.1);

  const moveInput = combineMoveInputs(
    input.getMoveInput(),
    touchJoystick?.getMoveInput() ?? ZERO_INPUT,
  );
  movement = stepLandMovement(movement, moveInput, groundHeightAt, dt);
  avatar.position.set(
    movement.position.x,
    movement.position.y + AVATAR_GROUND_OFFSET,
    movement.position.z,
  );

  // Skin-swapping (AvatarView) is purely visual — it never touches
  // movement.position or stepLandMovement's inputs, only what's rendered.
  avatarView.faceDirection(moveInput.moveX, moveInput.moveZ, dt);
  avatarView.setMoveState(moveInputToAnimationState(moveInput.moveX, moveInput.moveZ, moveInput.run));
  avatarView.update(dt);

  const target = desiredCameraPosition(movement.position, cameraOffset);
  const t = smoothingFactor(0.12, dt);
  const nextCameraPos = lerpVec3(
    { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target,
    t,
  );
  camera.position.set(nextCameraPos.x, nextCameraPos.y, nextCameraPos.z);
  camera.lookAt(movement.position.x, movement.position.y + 1, movement.position.z);

  if (hud) {
    hud.textContent = `x: ${movement.position.x.toFixed(2)}  z: ${movement.position.z.toFixed(2)}`;
    hud.dataset.x = movement.position.x.toFixed(3);
    hud.dataset.z = movement.position.z.toFixed(3);
  }

  renderer.render(scene, camera);
}
animate();
