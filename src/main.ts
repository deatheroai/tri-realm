import * as THREE from "three";
import { createScene } from "./scene";
import { createCamera } from "./camera";

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

const marker = scene.getObjectByName("marker");

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

function animate(): void {
  requestAnimationFrame(animate);
  if (marker) {
    marker.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}
animate();
