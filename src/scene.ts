import * as THREE from "three";

/**
 * Builds the Phase 0 placeholder scene: a ground plane, one placeholder
 * marker shape, and basic lighting. No terrain/avatar/building systems
 * yet — this exists purely to prove the deploy pipeline end to end.
 * See BACKLOG.md Phase 0.
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

  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xd9822b }),
  );
  marker.position.set(0, 0.5, 0);
  marker.name = "marker";
  scene.add(marker);

  return scene;
}
