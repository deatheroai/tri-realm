import * as THREE from "three";

/**
 * The land↔air portal's shared visual: a simple hot-air-balloon shape (a
 * sphere "balloon" over a small box "basket") — rough primitives per
 * `AUTONOMY.md`'s visual-first guardrail, same shape at both ends so the
 * portal reads as one consistent landmark regardless of which realm
 * you're viewing it from. Purely decorative — the actual trigger is
 * proximity to the matching `Portal`'s `position`
 * (`src/world/portalTransition.ts`), not this mesh.
 */
export function createPortalMarkerMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "portal-marker";

  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd9822b }),
  );
  balloon.position.y = 1.6;
  balloon.name = "portal-marker-balloon";

  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.5, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f }),
  );
  basket.position.y = 0.25;
  basket.name = "portal-marker-basket";

  group.add(balloon, basket);
  return group;
}
