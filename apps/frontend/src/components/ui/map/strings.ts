export const MAP_STRINGS = {
  viewLabel: '2D landing view',
  title: 'Landing zone',
  backToGlobe: 'Back to globe',
  backHint: 'Esc',
  baseNoteOfficial: 'The base image is the official LROC NAC mosaic centered on this site; it is not re-registered.',
  baseNotePlaceholder: 'There is no base image for this site; the drawing sits on a plain background.',
  noImagery: 'No official imagery available for this site yet.',
  canvasLabel: 'Landing zone drawing',
  legendLabel: 'Legend',
  legendZone: 'Landing zone',
  legendMargin: 'Error margin',
  legendPoint: 'Proposed landing point',
  legendScale: 'Scale',
  diameter: 'diameter',
  radius: 'radius',
  meters: 'm',
  noFocus: 'No location focused. Go back to the globe and pick a site.',
  neutralLoading: 'Zone outline neutral while the Suitability Index loads.',
  neutralFailed: 'Zone outline neutral: the Suitability Index is unavailable.',
  neutralNoData: 'Zone outline neutral: no precomputed data for this window.',
  zoneColored: 'Zone outline colored by the Suitability Index traffic light.',
  summary: (args: {
    name: string
    lat: string
    lon: string
    zoneDiameterM: number
    zoneRadiusM: number
    marginM: number
    marginRadiusM: number
    index: string
    baseNote: string
  }): string =>
    `Landing zone for ${args.name} at ${args.lat}, ${args.lon}. ` +
    `Circle of ${args.zoneDiameterM} m diameter (${args.zoneRadiusM} m radius) centered on the proposed landing point. ` +
    `Dotted error margin of ${args.marginM} m around it, out to ${args.marginRadiusM} m from the center. ` +
    `Zone and margin follow the agreed PD-02 values. ${args.index} ` +
    args.baseNote,
  indexText: (value: number, label: string): string => `Suitability Index ${value} of 100, ${label}.`,
} as const
