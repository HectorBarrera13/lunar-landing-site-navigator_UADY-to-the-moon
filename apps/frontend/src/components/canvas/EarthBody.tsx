import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace, SphereGeometry } from 'three'
import { useAppStore } from '@/store'
import { EARTH_DISTANCE, EARTH_RADIUS } from './scale'

export default function EarthBody() {
  const earthDir = useAppStore((s) => s.bodies.earthDir)
  const texture = useTexture('/textures/2k_earth_daymap.jpg')
  const geometry = useMemo(() => new SphereGeometry(EARTH_RADIUS, 48, 48), [])
  const position = useMemo<[number, number, number]>(() => {
    const [x, y, z] = earthDir
    const len = Math.hypot(x, y, z) || 1
    const k = EARTH_DISTANCE / len
    return [x * k, y * k, z * k]
  }, [earthDir])

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} position={position} frustumCulled={false}>
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
