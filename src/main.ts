import * as THREE from "three";
import { createScene, AVATAR_GROUND_OFFSET } from "./scene";
import { createCamera } from "./camera";
import { KeyboardInput, type MoveInput } from "./input/keyboardInput";
import { TouchJoystick } from "./input/touchJoystick";
import { combineMoveInputs } from "./input/combineMoveInputs";
import { stepLandMovement, type LandMovementState } from "./land/landMovement";
import { desiredCameraPosition, smoothingFactor } from "./land/followCamera";
import { terrainHeightAt } from "./land/terrain";
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
