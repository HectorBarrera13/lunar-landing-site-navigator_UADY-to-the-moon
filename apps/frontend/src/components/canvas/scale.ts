// Physical sizes (km), NASA Goddard NSSDC fact sheets:
//   Moon  mean radius 1737.4 km  https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
//   Earth volumetric mean radius 6371.000 km  https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
//   Sun   volumetric mean radius 695700 km  https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
// (Moon-Earth semimajor axis 0.3844e6 km and Sun mean distance 149.6e6 km are NOT used: see below.)
export const MOON_RADIUS_KM = 1737.4
export const EARTH_RADIUS_KM = 6371.0
export const SUN_RADIUS_KM = 695700

/** Scene units: Moon radius = 1. Body radii are at real relative proportions. */
export const MOON_RADIUS = 1
export const EARTH_RADIUS = EARTH_RADIUS_KM / MOON_RADIUS_KM
export const SUN_RADIUS = SUN_RADIUS_KM / MOON_RADIUS_KM

// DISTANCES ARE NOT TO SCALE. Real distances (about 221 and 86100 Moon radii) would make the
// Sun unreachable in a single view, so they are compressed. Ordering is preserved (Sun >> Earth).
// Tuned by angular size from the Moon: Earth ~5.3 deg radius, Sun ~16.6 deg radius (a huge
// disc; the real Sun is ~0.27 deg). Sun + max camera distance stays well inside CAMERA_FAR.
export const EARTH_DISTANCE = 40
export const SUN_DISTANCE = 1400

export const CAMERA_FAR = 20000
export const MOON_VIEW_DISTANCE = 3.2
export const PERSPECTIVE_DISTANCE = 120
/** Camera distance from the Moon center when a site is focused (0.8 Moon radii above the surface). */
export const FOCUS_DISTANCE = 1.8
export const CAMERA_MIN_DISTANCE = 1.6
export const CAMERA_MAX_DISTANCE = 400
