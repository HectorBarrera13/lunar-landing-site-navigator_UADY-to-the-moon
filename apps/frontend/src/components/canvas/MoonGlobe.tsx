import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { SRGBColorSpace, SphereGeometry } from 'three'
import { useAppStore } from '@/store'
import { pointToLatLon } from './surface'

const MOON_RADIUS = 1
const DRAG_THRESHOLD_PX = 2

export default function MoonGlobe() {
  const texture = useTexture('/textures/2k_moon.jpg')
  const geometry = useMemo(() => new SphereGeometry(MOON_RADIUS, 64, 64), [])
  const focusNearestSite = useAppStore((s) => s.focusNearestSite)

  useMemo(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])

  useEffect(() => () => geometry.dispose(), [geometry])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const { latDeg, lonDeg } = pointToLatLon(event.point)
    focusNearestSite(latDeg, lonDeg)
  }

  return (
    <mesh geometry={geometry} onClick={handleClick}>
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}
