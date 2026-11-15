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
