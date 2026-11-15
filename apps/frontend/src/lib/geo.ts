const RAD = Math.PI / 180

/** Great-circle angle in degrees between two surface coordinates. */
export function centralAngleDegrees(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const phiA = latA * RAD
  const phiB = latB * RAD
  const deltaLon = (lonB - lonA) * RAD
  const cosine = Math.sin(phiA) * Math.sin(phiB) + Math.cos(phiA) * Math.cos(phiB) * Math.cos(deltaLon)
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / RAD
}

/** Unit surface normal in scene axes (+Y north pole, longitude 0 on +X, east toward -Z); same convention as `orientation.ts`. */
export function surfaceNormal(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = latDeg * RAD
  const lon = lonDeg * RAD
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)]
}

/** True when the Sun is above the local horizon of the surface point (point normal . Sun direction > 0). */
export function isSunlitSurfacePoint(
  latDeg: number,
  lonDeg: number,
  sunDir: readonly [number, number, number],
): boolean {
  const n = surfaceNormal(latDeg, lonDeg)
  return n[0] * sunDir[0] + n[1] * sunDir[1] + n[2] * sunDir[2] > 0
}
