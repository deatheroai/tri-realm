import * as THREE from "three";
import { createScene, AVATAR_GROUND_OFFSET } from "./scene";
import { createCamera } from "./camera";
import { KeyboardInput, type MoveInput } from "./input/keyboardInput";
import { TouchJoystick } from "./input/touchJoystick";
import { combineMoveInputs } from "./input/combineMoveInputs";
import { stepLandMovement, type LandMovementState } from "./land/landMovement";
import { desiredCameraPosition, smoothingFactor } from "./land/followCamera";
import { createLandRealmMap, landTerrainPlacementRule, LAND_MAP_ID } from "./land/landRealmMap";
import { createCastlePieceMesh, castlePieceGroundOffset } from "./land/placement";
import {
  CASTLE_STRUCTURE_TYPES,
  DEFAULT_CASTLE_STRUCTURE_TYPE_ID,
  findCastleStructureType,
} from "./land/castleStructures";
import { addStructure, sampleTerrainHeight, type RealmMap } from "./world/realmMap";
import { validatePlacement } from "./world/placementValidation";
import { loadRealmMap, saveRealmMap } from "./world/realmMapStorage";
import { findNearbyPortal, PORTAL_TRIGGER_RADIUS } from "./world/portalTransition";
import { createAirScene } from "./air/airScene";
import { createAirRealmMap, AIR_MAP_ID } from "./air/airRealmMap";
import { stepAirMovement, type AirMovementState } from "./air/airMovement";
import { moveInputToAirAnimationState, withFloatAnimationState } from "./air/airAnimation";
import { createSeaScene } from "./sea/seaScene";
import { createSeaRealmMap, SEA_FLOOR_Y, SEA_SURFACE_Y } from "./sea/seaRealmMap";
import { stepSeaMovement, type SeaMovementState } from "./sea/seaMovement";
import { moveInputToSeaAnimationState, withSwimAnimationState } from "./sea/seaAnimation";
import { lerpVec3, type Vec3 } from "./math/vec3";
import { AvatarView } from "./skins/avatarView";
import {
  AVATAR_SKINS,
  DEFAULT_AVATAR_SKIN_ID,
  DIVE_SUIT_AVATAR_SKIN_ID,
  moveInputToAnimationState,
  type MoveAnimationState,
} from "./skins/avatarSkins";
import { PORTAL_KIND as DIVING_HOUSE_PORTAL_KIND } from "./world/landSeaPortal";
import { BLOCK_MATERIALS, DEFAULT_BLOCK_MATERIAL_ID } from "./skins/blockMaterials";
import { ATTRIBUTIONS } from "./skins/attributions";

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
// Captured (not just fired-and-forgotten) so the dev skin panel, built
// later, can reflect whichever skin actually ends up selected once this
// resolves — DEFAULT_AVATAR_SKIN_ID almost always, but AvatarView falls
// back to the procedural capsule on a load failure, and the panel should
// show that real outcome, not just assume the click/default succeeded.
const initialAvatarSkin = avatarView.setSkin(DEFAULT_AVATAR_SKIN_ID);

const groundOrUndefined = scene.getObjectByName("ground");
if (!groundOrUndefined) {
  throw new Error("Missing ground in scene");
}
const ground = groundOrUndefined;

// Air realm (BACKLOG.md Phase 2) — its own scene/avatar/movement, reached
// either via the dev realm panel below or, now that both ends are scoped,
// the real land<->air portal (src/world/landAirPortal.ts). Still no
// placement/save-load in air's scope — `airMap` exists only to hold its
// portal back to land; structures/entities stay unused for now.
const airScene = createAirScene();
const airMap = createAirRealmMap();
const airAvatarOrUndefined = airScene.getObjectByName("avatar");
if (!airAvatarOrUndefined) {
  throw new Error("Missing avatar in air scene");
}
const airAvatar = airAvatarOrUndefined;

// A second, independent AvatarView — not a shared one — because land's and
// air's avatar live in separate Scenes/Groups at once (only one is
// rendered per frame, but both persist). AvatarView itself clones its
// loaded glTF scene graph per instance (src/skins/avatarView.ts) precisely
// so two views can hold the same skin simultaneously without one stealing
// the model out from under the other.
const airAvatarView = new AvatarView(airAvatar);
void airAvatarView.setSkin(DEFAULT_AVATAR_SKIN_ID);

// Sea realm (BACKLOG.md Phase 3) — same "own scene/avatar/movement, no
// placement/save-load yet" shape air's Phase 2 first item started with.
// `seaMap` holds no portal yet — the land<->sea flavor is still a pending
// decision (DECISIONS.md), so there's nothing concrete to wire in; this
// realm is reachable only via the dev realm panel for now, same as air
// was before its own portal existed.
const seaScene = createSeaScene();
const seaMap = createSeaRealmMap();
const seaAvatarOrUndefined = seaScene.getObjectByName("avatar");
if (!seaAvatarOrUndefined) {
  throw new Error("Missing avatar in sea scene");
}
const seaAvatar = seaAvatarOrUndefined;

const seaAvatarView = new AvatarView(seaAvatar);
void seaAvatarView.setSkin(DEFAULT_AVATAR_SKIN_ID);

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
//
// A previous session's save (src/world/realmMapStorage.ts) is restored
// here if one exists; `localStorage` can throw (private browsing, storage
// disabled) or hold a corrupted/foreign value, so a failure here falls
// back to a fresh map rather than breaking the app.
const PLAYER_ENTITY_ID = "player";

function loadOrCreateLandMap(): RealmMap {
  try {
    return loadRealmMap(LAND_MAP_ID, window.localStorage) ?? createLandRealmMap();
  } catch (err) {
    console.warn("Failed to load saved land map, starting fresh:", err);
    return createLandRealmMap();
  }
}

let landMap = loadOrCreateLandMap();

// Same terrain the ground mesh itself is built from (scene.ts) — movement
// collision and the rendered terrain can't drift apart, and both now go
// through the map's own `terrain` field rather than a bare function.
const groundHeightAt = (x: number, z: number) => sampleTerrainHeight(landMap.terrain, x, z);

const input = new KeyboardInput();

const structuresHud = document.getElementById("hud-structures");

function updateStructuresHud(lastPosition?: Vec3): void {
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
// A restored save's last structure counts as "last placed" too, so the
// HUD (and E2E assertions against it) reflect a reload the same way they
// reflect a fresh placement.
updateStructuresHud(landMap.structures[landMap.structures.length - 1]?.position);

// Test-only hook: projects a world point to screen pixels the same way the
// renderer does, so E2E tests can click a placed piece's actual position
// instead of guessing screen offsets (this camera's shallow angle means a
// piece's rendered footprint is nowhere near directly below its own
// ground-click point in screen space).
declare global {
  interface Window {
    __projectToScreen?: (x: number, y: number, z: number) => { x: number; y: number };
    __getAvatarSkinId?: () => string;
    __getAirAvatarSkinId?: () => string;
    __getSeaAvatarSkinId?: () => string;
    __getAvatarWorldHeight?: () => number;
    __getLastPlacedColor?: () => number | undefined;
    __getLastPlacedMapUuid?: () => string | undefined;
    __getLastPlacedType?: () => string | undefined;
    __getActiveRealm?: () => "land" | "air" | "sea";
    __getAirAltitude?: () => number;
    __getSeaDepth?: () => number;
    __getAirAvatarPitch?: () => number;
    __getAirAvatarMoveState?: () => MoveAnimationState;
    __getSeaAvatarPitch?: () => number;
    __getSeaAvatarMoveState?: () => MoveAnimationState;
    __getAvatarVisualLocalY?: () => number | undefined;
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
window.__getAirAvatarSkinId = () => airAvatarView.skinId;
window.__getSeaAvatarSkinId = () => seaAvatarView.skinId;
// World-space height of whatever's currently rendering inside the avatar
// group — lets skin scale be checked/tuned against a real number instead
// of by eye (see BACKLOG.md: Robot originally shipped far too tall).
window.__getAvatarWorldHeight = () => {
  const box = new THREE.Box3().setFromObject(avatar);
  return box.max.y - box.min.y;
};
// Local-space y of land's avatar visual (its child inside the `avatar`
// group `AvatarView` never repositions itself — see AvatarView.update's
// procedural idle/movement bob, src/skins/avatarView.ts): nonzero for a
// skin with no clip for the current move state (Capsule/Princess), exactly
// 0 for one that does (Fox/Robot/Mannequin, whose own clip already
// supplies motion). Lets an E2E test check the bob is actually happening
// (or not) without screenshot diffing.
window.__getAvatarVisualLocalY = () => avatar.children[0]?.position.y;
window.__getLastPlacedColor = () => {
  const lastStructure = landMap.structures[landMap.structures.length - 1];
  const last = lastStructure && placedMeshes.get(lastStructure.id);
  const material = (last as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined;
  return material?.color.getHex();
};
// A block material's real texture (once loaded) resets `.color` to white
// for every material except Gold (src/skins/realBlockTextures.ts) — so
// `.color` alone can't reliably distinguish materials once real textures
// have taken over. The texture map's identity always can, procedural
// fallback or real: every catalog entry's pattern/photo is distinct.
window.__getLastPlacedMapUuid = () => {
  const lastStructure = landMap.structures[landMap.structures.length - 1];
  const last = lastStructure && placedMeshes.get(lastStructure.id);
  const material = (last as THREE.Mesh | undefined)?.material as THREE.MeshStandardMaterial | undefined;
  return material?.map?.uuid;
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

// `landMap.structures` is data only — a restored save has no meshes yet,
// so rebuild one per structure (same type/material it was placed with) and
// add it to the scene before the first frame renders.
for (const structure of landMap.structures) {
  const restoredPiece = createCastlePieceMesh(structure.type, structure.materialId);
  restoredPiece.position.set(structure.position.x, structure.position.y, structure.position.z);
  scene.add(restoredPiece);
  placedMeshes.set(structure.id, restoredPiece);
}

// Saved on every successful placement (not continuously/on-unload — the
// existing land-walk E2E tests reload mid-scenario and rely on a fresh
// spawn when nothing's been built yet, so persistence is deliberately
// scoped to "you built something," not every frame of movement).
function persistLandMap(): void {
  try {
    const mapWithEntities: RealmMap = {
      ...landMap,
      entities: [{ id: PLAYER_ENTITY_ID, position: movement.position }],
    };
    saveRealmMap(mapWithEntities, window.localStorage);
  } catch (err) {
    console.warn("Failed to save land map:", err);
  }
}

function placeCastlePieceAt(clientX: number, clientY: number): void {
  // Placement is land-only for now — the ground/placedMeshes raycast
  // targets belong to the land scene, which isn't even rendered while
  // viewing air.
  if (activeRealm !== "land") return;

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
    materialId: currentBlockMaterialId,
  });
  landMap = map;
  placedMeshes.set(structure.id, piece);

  scene.add(piece);
  updateStructuresHud(piece.position);
  persistLandMap();
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

/**
 * Marks exactly one button in a dev panel row as the currently-selected
 * option (adds the shared `.active` class, removes it from siblings) —
 * without this the panels were silent about current state, making it
 * harder to review the deployed preview ("did that click actually select
 * Robot?"). Any dev panel row can reuse this; only the rows below
 * (Skins-owned) call it so far.
 */
function setActiveButton(row: HTMLElement, activeButton: HTMLButtonElement): void {
  for (const child of row.children) {
    if (child instanceof HTMLButtonElement) {
      child.classList.toggle("active", child === activeButton);
    }
  }
}

// Dev-only skin switcher (not child-facing UI) — cycles the avatar's skin
// and the block material used for new placements, live, no redeploy. See
// DECISIONS.md for why this exists now (in-app preview, since real asset
// sourcing happens outside this session).
//
// Hoisted to module scope (not declared inside the `if (devSkinPanel)`
// block below) so applyAvatarSkin — called both by a manual button click
// and by the diving-house portal's automatic dive-suit swap further down
// — can keep the dev panel's active-button highlighting honest either way,
// not just when a human clicked something.
const avatarRow = document.createElement("div");
avatarRow.textContent = "Avatar: ";
const avatarButtonsById = new Map<string, HTMLButtonElement>();

/**
 * Drives all three realms' AvatarView together — the player's chosen skin
 * is one shared choice, not a separate one per realm (see the
 * airAvatarView/seaAvatarView comments above). Each AvatarView is
 * independently a no-op if this skin is already selected, so switching
 * realms and then applying the same skin again is harmless — used both by
 * the dev panel's own buttons and by the diving-house portal's automatic
 * dive-suit swap (maybeTriggerPortal, below).
 */
function applyAvatarSkin(skinId: string): void {
  void avatarView.setSkin(skinId).then(() => {
    // Reflects whichever skin land's AvatarView actually resolved to
    // (could differ from what was requested if the load failed and it
    // fell back to the procedural capsule instead), not just an
    // assumption that the request succeeded.
    const resolvedButton = avatarButtonsById.get(avatarView.skinId);
    if (resolvedButton) setActiveButton(avatarRow, resolvedButton);
  });
  void airAvatarView.setSkin(skinId);
  void seaAvatarView.setSkin(skinId);
}

const devSkinPanel = document.getElementById("dev-skin-panel");
if (devSkinPanel) {
  for (const skin of AVATAR_SKINS) {
    const btn = document.createElement("button");
    btn.textContent = skin.label;
    avatarButtonsById.set(skin.id, btn);
    btn.addEventListener("click", () => {
      // An explicit choice always wins — clears any pending auto-revert
      // from the diving-house portal's dive-suit swap (maybeTriggerPortal,
      // below) so it never fights a player who picked something on
      // purpose, dive suit itself included.
      diveSuitAutoEquipped = false;
      applyAvatarSkin(skin.id);
    });
    avatarRow.appendChild(btn);
  }
  // Reflects the real outcome of the app's own startup skin load (not
  // just an optimistic guess) once it resolves — see initialAvatarSkin
  // above.
  void initialAvatarSkin.then(() => {
    const resolvedButton = avatarButtonsById.get(avatarView.skinId);
    if (resolvedButton) setActiveButton(avatarRow, resolvedButton);
  });

  const materialRow = document.createElement("div");
  materialRow.textContent = "Blocks: ";
  const materialButtonsById = new Map<string, HTMLButtonElement>();
  for (const material of BLOCK_MATERIALS) {
    const btn = document.createElement("button");
    btn.textContent = material.label;
    materialButtonsById.set(material.id, btn);
    btn.addEventListener("click", () => {
      currentBlockMaterialId = material.id;
      setActiveButton(materialRow, btn);
    });
    materialRow.appendChild(btn);
  }
  // Materials apply synchronously (no async load to wait on) — reflect the
  // startup default (currentBlockMaterialId, initialized above) right away.
  const defaultMaterialButton = materialButtonsById.get(currentBlockMaterialId);
  if (defaultMaterialButton) setActiveButton(materialRow, defaultMaterialButton);

  devSkinPanel.appendChild(avatarRow);
  devSkinPanel.appendChild(materialRow);
}

// Real, player-facing credits (not dev-only, unlike the panels above/below)
// — required by the Fox's CC BY 4.0 rigging/animation credit
// (public/assets/ATTRIBUTIONS.md), which legally needs attribution
// wherever the asset ships. Collapsed by default; expands on click/tap.
const creditsToggle = document.getElementById("credits-toggle");
const creditsPanel = document.getElementById("credits-panel");
if (creditsToggle && creditsPanel) {
  for (const entry of ATTRIBUTIONS) {
    const line = document.createElement("div");
    line.append(`${entry.asset} — `);
    if (entry.creatorUrl) {
      const creatorLink = document.createElement("a");
      creatorLink.href = entry.creatorUrl;
      creatorLink.target = "_blank";
      creatorLink.rel = "noopener";
      creatorLink.textContent = entry.creator;
      line.append(creatorLink);
    } else {
      line.append(entry.creator);
    }
    line.append(", ");
    const licenseLink = document.createElement("a");
    licenseLink.href = entry.licenseUrl;
    licenseLink.target = "_blank";
    licenseLink.rel = "noopener";
    licenseLink.textContent = entry.license;
    line.append(licenseLink);
    creditsPanel.appendChild(line);
  }

  creditsToggle.addEventListener("click", () => {
    const isOpen = creditsPanel.classList.toggle("open");
    creditsToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Collapse toggle for the shared #dev-panels column (genuinely shared
// between World and Skins, same as the column itself — see AUTONOMY.md's
// "UI layout convention" section). Reported 2026-09-08: on a real phone
// this column had grown tall enough to cover most of the game view.
// Inert on a fine-pointer/desktop device (the toggle button stays
// `display: none` there, per index.html's `@media (pointer: coarse)`
// rule) — wiring it unconditionally here is harmless either way, exactly
// the same "no-op where the CSS doesn't apply" approach the touch-zone's
// own pointer-events toggle already uses. Same expand-on-click idiom as
// the credits toggle just above.
const devPanelsToggle = document.getElementById("dev-panels-toggle");
const devPanelsContent = document.getElementById("dev-panels-content");
if (devPanelsToggle && devPanelsContent) {
  devPanelsToggle.addEventListener("click", () => {
    const isOpen = devPanelsContent.classList.toggle("open");
    devPanelsToggle.setAttribute("aria-expanded", String(isOpen));
  });
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

// Which realm's scene/movement module is currently active. The real
// land<->air portal (below, maybeTriggerPortal) is the in-world way to
// switch now — this dev-only panel stays as a "cheat" for quick review/
// testing, same "in-app preview" spirit as the skin/structure dev panels
// above.
type Realm = "land" | "air" | "sea";
let activeRealm: Realm = "land";

const devRealmPanel = document.getElementById("dev-realm-panel");
if (devRealmPanel) {
  const realmRow = document.createElement("div");
  realmRow.textContent = "Realm: ";
  const realms: Array<{ id: Realm; label: string }> = [
    { id: "land", label: "Land" },
    { id: "air", label: "Air" },
    { id: "sea", label: "Sea" },
  ];
  for (const realm of realms) {
    const btn = document.createElement("button");
    btn.textContent = realm.label;
    btn.addEventListener("click", () => {
      activeRealm = realm.id;
    });
    realmRow.appendChild(btn);
  }
  devRealmPanel.appendChild(realmRow);
}
window.__getActiveRealm = () => activeRealm;

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

// Resume where the player left off if a save had their position; otherwise
// the usual fresh-spawn point.
const savedPlayerPosition = landMap.entities.find((e) => e.id === PLAYER_ENTITY_ID)?.position;

let movement: LandMovementState = {
  position: savedPlayerPosition ?? { x: 0, y: sampleTerrainHeight(landMap.terrain, 0, 0), z: 0 },
  velocityY: 0,
};

// Air has no saved state yet (todo, once air's own Phase 2b hardening
// wires in the RealmMap/save-load path land already has) — always spawns
// fresh at the air scene's own starting position.
let airMovement: AirMovementState = {
  position: { x: airAvatar.position.x, y: airAvatar.position.y, z: airAvatar.position.z },
  velocity: { x: 0, y: 0, z: 0 },
};
// Test-only hook: #hud-position only ever displays x/z (land has no
// vertical movement to show), so this is how E2E coverage verifies
// ascend/descend actually changes altitude.
window.__getAirAltitude = () => airMovement.position.y;
// Test-only hook, mirrors __getSeaAvatarPitch — how E2E coverage verifies
// setVerticalPitch tilts the rendered model while flying (Phase 2's
// "Air-specific animation/pitch parity with Sea" fix).
window.__getAirAvatarPitch = () => airAvatar.rotation.x;
// Test-only hook, mirrors __getSeaAvatarMoveState — how E2E coverage
// verifies moveInputToAirAnimationState treats vertical-only flight as
// real motion instead of idle.
window.__getAirAvatarMoveState = () => airAvatarView.moveState;

// Sea has no saved state yet either (same "todo" as air) — always spawns
// fresh at the sea scene's own starting position.
let seaMovement: SeaMovementState = {
  position: { x: seaAvatar.position.x, y: seaAvatar.position.y, z: seaAvatar.position.z },
  velocity: { x: 0, y: 0, z: 0 },
};
// Test-only hook, mirrors __getAirAltitude — how E2E coverage verifies
// dive/surface (and passive buoyant drift) actually change depth.
window.__getSeaDepth = () => seaMovement.position.y;
// Test-only hook: how E2E coverage verifies setVerticalPitch actually
// tilts the rendered model (src/skins/avatarView.ts), not just that
// dive/surface change depth (__getSeaDepth already covers that).
window.__getSeaAvatarPitch = () => seaAvatar.rotation.x;
// Test-only hook: how E2E coverage verifies withSwimAnimationState actually
// requests the dedicated swimIdle/swimActive states for a swim-capable skin
// (mannequin) while leaving every other skin on the shared walk/run states.
window.__getSeaAvatarMoveState = () => seaAvatarView.moveState;

// Portal transition (ARCHITECTURE.md's "Portal transition system",
// src/world/portalTransition.ts) — proximity-based: walking/flying within
// PORTAL_TRIGGER_RADIUS of a portal swaps the active realm and teleports
// to its targetSpawnPosition. A short cooldown after each transition
// (rather than relying solely on the arrival spot being far enough from
// the portal, though it is — see landAirPortal.ts) is the actual
// guarantee against instantly bouncing back through the portal you just
// arrived near.
const PORTAL_COOLDOWN_SECONDS = 1.5;
let portalCooldown = 0;

// The land<->sea diving-house portal's "costume change" moment
// (DECISIONS.md, 2026-09-07) — auto-equipped crossing into sea through
// that specific portal, reverted crossing back through it, without
// touching a skin the player picked by hand (see applyAvatarSkin's own
// click-handler comment above, which clears diveSuitAutoEquipped on any
// explicit choice). skinBeforeDiveSuit remembers what to revert to;
// gated on portal.kind (not just "any land<->sea transition") so a future
// second land<->sea portal with a different flavor isn't forced into the
// same costume change.
let diveSuitAutoEquipped = false;
let skinBeforeDiveSuit: string | null = null;

function activeRealmMap(): RealmMap {
  if (activeRealm === "land") return landMap;
  if (activeRealm === "air") return airMap;
  return seaMap;
}

function maybeTriggerPortal(position: Vec3): void {
  if (portalCooldown > 0) return;
  const portal = findNearbyPortal(activeRealmMap(), position, PORTAL_TRIGGER_RADIUS);
  if (!portal) return;

  if (portal.targetRealmMapId === AIR_MAP_ID) {
    airMovement = { position: { ...portal.targetSpawnPosition }, velocity: { x: 0, y: 0, z: 0 } };
    activeRealm = "air";
  } else if (portal.targetRealmMapId === seaMap.id) {
    seaMovement = { position: { ...portal.targetSpawnPosition }, velocity: { x: 0, y: 0, z: 0 } };
    activeRealm = "sea";
    if (portal.kind === DIVING_HOUSE_PORTAL_KIND && avatarView.skinId !== DIVE_SUIT_AVATAR_SKIN_ID) {
      skinBeforeDiveSuit = avatarView.skinId;
      diveSuitAutoEquipped = true;
      applyAvatarSkin(DIVE_SUIT_AVATAR_SKIN_ID);
    }
  } else {
    movement = { position: { ...portal.targetSpawnPosition }, velocityY: 0 };
    activeRealm = "land";
    if (portal.kind === DIVING_HOUSE_PORTAL_KIND && diveSuitAutoEquipped && skinBeforeDiveSuit) {
      applyAvatarSkin(skinBeforeDiveSuit);
      diveSuitAutoEquipped = false;
      skinBeforeDiveSuit = null;
    }
  }
  portalCooldown = PORTAL_COOLDOWN_SECONDS;
}

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

  // Only the active realm's movement module runs each frame — a realm
  // transition swaps which one, no continuous blending (ARCHITECTURE.md).
  let targetPosition: Vec3;
  let cameraLookAtY: number;

  if (activeRealm === "land") {
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

    targetPosition = movement.position;
    cameraLookAtY = movement.position.y + 1;
  } else if (activeRealm === "air") {
    const vertical = input.getVerticalInput();
    airMovement = stepAirMovement(airMovement, moveInput, vertical, dt);
    airAvatar.position.set(airMovement.position.x, airMovement.position.y, airMovement.position.z);

    // Air-specific animation/pitch parity with sea (Phase 2 `todo`,
    // BACKLOG.md): flying used to reuse land's purely-horizontal mapping
    // and never leaned into vertical motion, so ascending/descending in
    // place read as "walking on land" with no sense of floating.
    // `moveInputToAirAnimationState` (src/air/airAnimation.ts) treats an
    // active vertical hold as real flight even with zero horizontal
    // input, same shape as sea's own fix but without sea's passive-drift
    // exception (air never moves vertically except from direct input).
    // `setVerticalPitch` (src/skins/avatarView.ts, already generic —
    // sea's own use needed no changes) noses the model toward the
    // direction of vertical motion — up while ascending, down while
    // descending — settling level again at rest.
    //
    // Reported 2026-09-09 with a screenshot: even with pitch, flying still
    // looked like "running in the air" — the walk/run clip is a grounded
    // gait (a full leg stride implies feet pushing off a floor), so it
    // reads as wrong the moment there's visibly no ground under it, which
    // pitch alone can't fix. No skin has a dedicated flying/glide clip to
    // reach for (same gap air's own doc comment already flagged), but
    // Mannequin/Female do have real swim-stroke clips (limbs moving
    // through open space, not planted footsteps) — a first pass reused
    // sea's own `withSwimAnimationState` outright to reach for those.
    //
    // Reviewed live and refined the same day: the active `swimActive`
    // stroke it played while moving read as swimming — "like a fish" —
    // when the actual ask was more like a balloon, drifting regardless of
    // how it's being pushed. `withFloatAnimationState`
    // (`src/air/airAnimation.ts`) is air's own version of that routing:
    // always the calm `swimIdle` clip for a skin that has one, never the
    // active stroke. Skins without swim clips (Fox/Robot/Princess/
    // Capsule/Dive Suit) keep exactly today's walk/run behavior while
    // flying, unchanged either way.
    airAvatarView.faceDirection(moveInput.moveX, moveInput.moveZ, dt);
    airAvatarView.setVerticalPitch(airMovement.velocity.y, dt);
    airAvatarView.setMoveState(
      withFloatAnimationState(
        moveInputToAirAnimationState(moveInput.moveX, moveInput.moveZ, vertical, moveInput.run),
        airAvatarView.hasAnimation("swimIdle"),
      ),
    );
    airAvatarView.update(dt);

    targetPosition = airMovement.position;
    cameraLookAtY = airMovement.position.y;
  } else {
    const vertical = input.getVerticalInput();
    seaMovement = stepSeaMovement(seaMovement, moveInput, vertical, dt, SEA_FLOOR_Y, SEA_SURFACE_Y);
    seaAvatar.position.set(seaMovement.position.x, seaMovement.position.y, seaMovement.position.z);

    // Sea-specific animation-state mapping (src/sea/seaAnimation.ts,
    // BACKLOG.md Phase 3): unlike land/air's purely-horizontal intent, an
    // active dive/surface hold with zero horizontal input still counts as
    // swimming, not idle — a genuine sea-specific signal the generic
    // mapping had no way to see. `withSwimAnimationState` then routes that
    // generic idle/walk/run result to the dedicated swimIdle/swimActive
    // states, but only for a skin that actually has them (checked via
    // `hasAnimation("swimIdle")` — currently just "mannequin") — every
    // other skin keeps playing the shared walk/run clip while swimming,
    // exactly as before. Sea also gets one other real sea-specific visual:
    // pitch (setVerticalPitch, src/skins/avatarView.ts) leans the model
    // into its actual vertical velocity, nose-down diving / nose-up
    // surfacing — land/air have no meaningful vertical velocity to react
    // to, so neither calls this.
    seaAvatarView.faceDirection(moveInput.moveX, moveInput.moveZ, dt);
    seaAvatarView.setVerticalPitch(seaMovement.velocity.y, dt);
    seaAvatarView.setMoveState(
      withSwimAnimationState(
        moveInputToSeaAnimationState(moveInput.moveX, moveInput.moveZ, vertical, moveInput.run),
        seaAvatarView.hasAnimation("swimIdle"),
      ),
    );
    seaAvatarView.update(dt);

    targetPosition = seaMovement.position;
    cameraLookAtY = seaMovement.position.y;
  }

  const target = desiredCameraPosition(targetPosition, cameraOffset);
  const t = smoothingFactor(0.12, dt);
  const nextCameraPos = lerpVec3(
    { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target,
    t,
  );
  camera.position.set(nextCameraPos.x, nextCameraPos.y, nextCameraPos.z);
  camera.lookAt(targetPosition.x, cameraLookAtY, targetPosition.z);

  if (hud) {
    hud.textContent = `x: ${targetPosition.x.toFixed(2)}  z: ${targetPosition.z.toFixed(2)}`;
    hud.dataset.x = targetPosition.x.toFixed(3);
    hud.dataset.z = targetPosition.z.toFixed(3);
  }

  const activeScene = activeRealm === "land" ? scene : activeRealm === "air" ? airScene : seaScene;
  renderer.render(activeScene, camera);

  // Checked after this frame's render, so a transition takes effect
  // starting next frame — no partial-frame mix of old/new realm state
  // (a realm transition swaps, it doesn't blend, per ARCHITECTURE.md).
  portalCooldown = Math.max(0, portalCooldown - dt);
  maybeTriggerPortal(targetPosition);
}
animate();
