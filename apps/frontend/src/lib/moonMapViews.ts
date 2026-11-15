import type { MoonMapView } from '@/store/types'

export const MOON_MAP_VIEWS: readonly MoonMapView[] = ['albedo', 'relief']

export const MOON_MAP_TEXTURES: Record<MoonMapView, string> = {
  albedo: '/textures/2k_moon.jpg',
  relief: '/textures/moon_relief_4k.jpg',
}
