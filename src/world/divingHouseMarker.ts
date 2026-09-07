import * as THREE from "three";

/**
 * The land<->sea diving-house portal's visuals (`DECISIONS.md`,
 * 2026-09-07): unlike the land<->air balloon (one shared shape at both
 * ends), this portal reads differently from each side — a small stone
 * house with a dark basement opening on land, a sunken stone archway
 * marking where the pothole surfaces underwater on the sea side — rough
 * primitives per `AUTONOMY.md`'s visual-first guardrail, same language
 * as `portalMarker.ts`'s balloon. Purely decorative — the actual trigger
 * is proximity to the matching `Portal`'s `position`
 * (`src/world/portalTransition.ts`), not either mesh. The sea-side arch
 * floats at the same mid-water depth as the sea realm's own spawn
 * (`src/world/landSeaPortal.ts`'s `SEA_PORTAL_POSITION`), not down at the
 * sea floor — reachable by horizontal swimming alone, no dive required,
 * mirroring how both land<->air portals sit reachable by a single
 * direction key with no vertical input either.
 */
export function createDivingHouseMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "diving-house";

  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.2, 3),
    new THREE.MeshStandardMaterial({ color: 0x9c8f74 }),
  );
  walls.position.y = 1.1;
  walls.name = "diving-house-walls";

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.3, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x5b3a29 }),
  );
  roof.position.y = 2.9;
  roof.rotation.y = Math.PI / 4;
  roof.name = "diving-house-roof";

  // The basement pothole: a dark disc sunk flush with the ground, just
  // inside the house's footprint — the visual stand-in for "descending
  // through the basement pothole" (DECISIONS.md), even though the actual
  // trigger is proximity to the whole group's position, not this disc
  // specifically.
  const pothole = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 16),
    new THREE.MeshStandardMaterial({ color: 0x0c0c0c }),
  );
  pothole.rotation.x = -Math.PI / 2;
  pothole.position.y = 0.02;
  pothole.name = "diving-house-pothole";

  group.add(walls, roof, pothole);
  return group;
}

/**
 * The sea-side end: a sunken stone archway floating mid-water, marking
 * where the pothole surfaces underwater — distinct from the house above,
 * since there's no house to speak of on the sea side, just an exit.
 */
export function createSeaPortalArchMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "sea-portal-arch";

  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6558 });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), stoneMaterial);
  leftPillar.position.set(-0.9, 1.1, 0);
  leftPillar.name = "sea-portal-arch-left-pillar";

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), stoneMaterial);
  rightPillar.position.set(0.9, 1.1, 0);
  rightPillar.name = "sea-portal-arch-right-pillar";

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.6), stoneMaterial);
  lintel.position.set(0, 2.35, 0);
  lintel.name = "sea-portal-arch-lintel";

  group.add(leftPillar, rightPillar, lintel);
  return group;
}
