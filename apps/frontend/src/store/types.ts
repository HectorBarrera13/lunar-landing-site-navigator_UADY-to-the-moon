export type ViewMode = '3d' | '2d'

export type CameraView = 'moon' | 'perspective' | 'south_pole'

export type MoonMapView = 'albedo' | 'relief'

export type ActiveLayer = 'illumination' | 'earth_visibility' | 'slope' | 'permanent_shadow'

export type Selection =
  | { kind: 'none' }
  | { kind: 'site'; siteId: string }
  | { kind: 'point'; latDeg: number; lonDeg: number }
