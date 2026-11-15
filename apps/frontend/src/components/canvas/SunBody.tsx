import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace, SphereGeometry } from 'three'
import { useAppStore } from '@/store'
import { SUN_DISTANCE, SUN_RADIUS } from './scale'

export default function SunBody() {
  const sunDir = useAppStore((s) => s.bodies.sunDir)
  const texture = useTexture('/textures/2k_sun.jpg')
  const geometry = useMemo(() => new SphereGeometry(SUN_RADIUS, 48, 48), [])
  const position = useMemo<[number, number, number]>(() => {
    const [x, y, z] = sunDir
    const len = Math.hypot(x, y, z) || 1
    const k = SUN_DISTANCE / len
    return [x * k, y * k, z * k]
  }, [sunDir])

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} position={position} frustumCulled={false}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
