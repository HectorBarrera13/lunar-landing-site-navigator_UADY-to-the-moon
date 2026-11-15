import { MathUtils } from 'three'
import type { Object3D, Vector3 } from 'three'

export const SURFACE_OFFSET = 1.004

/**
 * UNVERIFIED against the Moon texture / MOON_ME: convention is +Y = north pole,
 * longitude 0 on +X, east toward -Z. Both functions below must stay in sync.
 */
export function setSurfaceVector(target: Vector3, latDeg: number, lonDeg: number): void {
  const lat = MathUtils.degToRad(latDeg)
  const lon = MathUtils.degToRad(lonDeg)
  target.set(
    SURFACE_OFFSET * Math.cos(lat) * Math.cos(lon),
    SURFACE_OFFSET * Math.sin(lat),
    -SURFACE_OFFSET * Math.cos(lat) * Math.sin(lon),
  )
}

export function setSurfacePosition(target: Object3D, latDeg: number, lonDeg: number): void {
  setSurfaceVector(target.position, latDeg, lonDeg)
}

/** Inverse of setSurfacePosition (same UNVERIFIED convention). Lon in [-180, 180]. */
export function pointToLatLon(point: Vector3): { latDeg: number; lonDeg: number } {
  const r = point.length() || 1
  return {
    latDeg: MathUtils.radToDeg(Math.asin(MathUtils.clamp(point.y / r, -1, 1))),
    lonDeg: MathUtils.radToDeg(Math.atan2(-point.z, point.x)),
  }
}
