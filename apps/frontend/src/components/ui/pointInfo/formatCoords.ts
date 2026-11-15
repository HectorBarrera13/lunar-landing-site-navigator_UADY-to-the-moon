export function formatLat(latDeg: number): string {
  return `${Math.abs(latDeg).toFixed(3)}° ${latDeg < 0 ? 'S' : 'N'}`
}

export function formatLon(lonDeg: number): string {
  return `${Math.abs(lonDeg).toFixed(3)}° ${lonDeg < 0 ? 'W' : 'E'}`
}
