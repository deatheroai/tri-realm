import * as THREE from "three";

/** A fixed perspective camera looking at the scene origin. */
export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(6, 5, 8);
  camera.lookAt(0, 0, 0);
  return camera;
}
