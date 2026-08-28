import type { Vec3 } from "../math/vec3";

/** The camera position that keeps a fixed offset behind/above the target. */
export function desiredCameraPosition(target: Vec3, offset: Vec3): Vec3 {
  return {
    x: target.x + offset.x,
    y: target.y + offset.y,
    z: target.z + offset.z,
  };
}

/**
 * Frame-rate-independent smoothing factor for lerping toward a moving
 * target: converges at the same real-world rate regardless of dt/frame rate.
 */
export function smoothingFactor(responsiveness: number, dt: number): number {
  return 1 - Math.pow(1 - responsiveness, dt * 60);
}
