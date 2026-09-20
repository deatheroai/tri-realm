import * as THREE from "three";

/**
 * The land↔air portal's second flavor (`DECISIONS.md`, 2026-09-02 — both
 * balloon and stairway wanted eventually; balloon built first for being
 * the more visually/thematically distinctive of the two, stairway always
 * meant to follow as "a second catalog entry, not new plumbing"). Same
 * "one shared shape at both ends" convention `portalMarker.ts`'s balloon
 * already established (unlike `divingHouseMarker.ts`'s two-different-
 * meshes approach) — a plain rising staircase reads as the same landmark
 * from either realm, rough primitives per `AUTONOMY.md`'s visual-first
 * guardrail. Purely decorative — the actual trigger is proximity to the
 * matching `Portal`'s `position` (`src/world/portalTransition.ts`,
 * checked against the base of the stairs, not requiring the avatar to
 * actually climb every step), same as every other portal marker.
 */

const STEP_COUNT = 8;
const STEP_WIDTH = 1.6;
const STEP_DEPTH = 0.8;
const STEP_HEIGHT = 0.6;
const STONE_COLOR = 0x8c8c86;

export function createStairwayMarkerMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "stairway-marker";

  const stepMaterial = new THREE.MeshStandardMaterial({ color: STONE_COLOR });
  for (let i = 0; i < STEP_COUNT; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(STEP_WIDTH, STEP_HEIGHT, STEP_DEPTH), stepMaterial);
    // Each step sits half a step higher and further back (-z, the shared
    // "forward" direction every portal is reachable along) than the last,
    // so the stack reads as a staircase climbing away from the viewer.
    step.position.set(0, STEP_HEIGHT * (i + 0.5), -STEP_DEPTH * i);
    step.name = `stairway-step-${i}`;
    group.add(step);
  }

  return group;
}
