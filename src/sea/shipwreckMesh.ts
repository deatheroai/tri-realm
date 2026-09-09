import * as THREE from "three";

/**
 * Sea's centerpiece shipwreck landmark (`BACKLOG.md`, locked in during the
 * 2026-09-08 design review, supersedes the old "sea-floating-docks"
 * item): a single large, dramatic broken-ship hull + mast — bigger and
 * more distinct than the existing `SEA_WRECKAGE_POSITIONS` debris boxes,
 * which stay exactly as-is around it for scale/parallax (this adds one
 * real centerpiece, it doesn't replace the whole field). Same
 * procedural-primitives-first approach as land's parkland dressing and
 * air's cloud platforms.
 *
 * Two hull segments (a larger main section and a smaller, differently
 * tilted stern section, with a real gap between them) instead of one
 * solid box — "broken," not just "a plain ship" — plus a mast leaning off
 * the main hull rather than standing upright, snapped rather than intact.
 * Local origin sits at the hull's resting/contact point (y=0), same
 * ground-level convention `land/landDecorations.ts` and
 * `world/portalMarker.ts` already use, so `seaScene.ts` positions the
 * whole group with a single literal y (`SEA_SHIPWRECK_POSITION`,
 * `seaRealmMap.ts`), no extra offset at the call site.
 */
const HULL_COLOR = 0x4a3626; // weathered dark wood — distinct from and darker than the smaller debris' WRECKAGE_COLOR
const MAST_COLOR = 0x6b4a2f;
const TRIM_COLOR = 0x8a6f4a;

export function createShipwreckMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = "shipwreck";

  // Main hull — the larger, mostly-intact segment, listing to one side.
  const mainHull = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 1.6, 2.2),
    new THREE.MeshStandardMaterial({ color: HULL_COLOR }),
  );
  mainHull.position.set(-0.8, 0.8, 0);
  mainHull.rotation.z = THREE.MathUtils.degToRad(18);
  mainHull.rotation.y = THREE.MathUtils.degToRad(8);
  mainHull.name = "shipwreck-hull-main";

  // Broken-off stern segment — smaller, tilted the other way, with a real
  // gap between the two so it reads as broken rather than one solid ship.
  const sternHull = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.3, 2.0),
    new THREE.MeshStandardMaterial({ color: HULL_COLOR }),
  );
  sternHull.position.set(3.6, 0.5, 0.6);
  sternHull.rotation.z = THREE.MathUtils.degToRad(-22);
  sternHull.rotation.y = THREE.MathUtils.degToRad(-15);
  sternHull.name = "shipwreck-hull-stern";

  // A snapped mast, leaning off the main hull — angled and shorter than a
  // full mast, so it reads as broken rather than a still-standing ship.
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: MAST_COLOR }),
  );
  mast.position.set(-1.6, 2.2, 0);
  mast.rotation.z = THREE.MathUtils.degToRad(35);
  mast.name = "shipwreck-mast";

  // A crossbar (yard) partway up the mast — reads as "a ship's mast," not
  // just a leaning pole.
  const yard = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: TRIM_COLOR }),
  );
  yard.position.set(-2.0, 3.1, 0);
  yard.rotation.z = THREE.MathUtils.degToRad(35);
  yard.name = "shipwreck-yard";

  group.add(mainHull, sternHull, mast, yard);
  return group;
}
