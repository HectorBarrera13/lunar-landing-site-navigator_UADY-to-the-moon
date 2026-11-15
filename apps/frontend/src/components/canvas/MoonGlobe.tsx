import { useEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { SRGBColorSpace, SphereGeometry } from 'three'
import type { Mesh } from 'three'
import { MOON_MAP_TEXTURES } from '@/lib/moonMapViews'
import { useAppStore } from '@/store'
import { pointToLatLon } from './surface'
import { MOON_SPIN_SPEED, useIntroSpin } from './useIntroSpin'

const MOON_RADIUS = 1
const DRAG_THRESHOLD_PX = 2

export default function MoonGlobe() {
  const view = useAppStore((s) => s.moonMapView)
  const texture = useTexture(MOON_MAP_TEXTURES[view])
  const geometry = useMemo(() => new SphereGeometry(MOON_RADIUS, 64, 64), [])
  const focusNearestSite = useAppStore((s) => s.focusNearestSite)
  const introActive = useAppStore((s) => s.introActive)
  const startSimulation = useAppStore((s) => s.startSimulation)
  const mesh = useRef<Mesh>(null)
  useIntroSpin(mesh, MOON_SPIN_SPEED)

  useMemo(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])

  useEffect(() => () => geometry.dispose(), [geometry])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    if (introActive) {
      startSimulation()
      return
    }
    const { latDeg, lonDeg } = pointToLatLon(event.point)
    focusNearestSite(latDeg, lonDeg)
  }

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      onClick={handleClick}
      onPointerOver={() => {
        if (introActive) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}
