import * as THREE from "three";
import { createScene, AVATAR_GROUND_OFFSET } from "./scene";
import { createCamera } from "./camera";
import { KeyboardInput, type MoveInput } from "./input/keyboardInput";
import { TouchJoystick } from "./input/touchJoystick";
import { combineMoveInputs } from "./input/combineMoveInputs";
import { stepLandMovement, type LandMovementState } from "./land/landMovement";
import { desiredCameraPosition, smoothingFactor } from "./land/followCamera";
import { terrainHeightAt } from "./land/terrain";
import { createCastlePieceMesh, CASTLE_PIECE_GROUND_OFFSET } from "./land/placement";
import { lerpVec3 } from "./math/vec3";

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

// Same height function the ground mesh itself is built from (scene.ts) —
// movement collision and the rendered terrain can't drift apart.
const groundHeightAt = terrainHeightAt;

const input = new KeyboardInput();

const touchZone = document.getElementById("touch-zone");
const joystickBase = document.getElementById("joystick-base");
const joystickKnob = document.getElementById("joystick-knob");
const touchJoystick =
  touchZone && joystickBase && joystickKnob
    ? new TouchJoystick(touchZone, joystickBase, joystickKnob)
    : null;

const ZERO_INPUT: MoveInput = { moveX: 0, moveZ: 0, run: false };

let movement: LandMovementState = {
  position: { x: 0, y: terrainHeightAt(0, 0), z: 0 },
  velocityY: 0,
};

const cameraOffset = { x: 0, y: 4.5, z: 7.5 };

const hud = document.getElementById("hud-position");
const structuresHud = document.getElementById("hud-structures");
const clock = new THREE.Clock();

// Click/tap-to-place: raycast against the ground mesh specifically (not the
// whole scene) so clicking on the avatar or a landmark still resolves to a
// point on the ground behind it, rather than placing on top of that object.
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let placedCount = 0;

function updateStructuresHud(): void {
  if (!structuresHud) return;
  structuresHud.textContent = `Structures: ${placedCount}`;
  structuresHud.dataset.count = String(placedCount);
}
updateStructuresHud();

function placeCastlePieceAt(clientX: number, clientY: number): void {
  pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);

  const hits = raycaster.intersectObject(ground, false);
  if (hits.length === 0) return;

  const point = hits[0].point;
  const piece = createCastlePieceMesh();
  piece.position.set(point.x, point.y + CASTLE_PIECE_GROUND_OFFSET, point.z);
  scene.add(piece);

  placedCount += 1;
  updateStructuresHud();
}

// The touch-zone (joystick) only becomes pointer-interactive on touch
// devices (see index.html's `pointer: coarse` rule), so a click here is
// always a real placement intent — no need to check the event target.
window.addEventListener("click", (e) => placeCastlePieceAt(e.clientX, e.clientY));

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
