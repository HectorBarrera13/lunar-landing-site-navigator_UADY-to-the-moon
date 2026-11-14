import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace, SphereGeometry } from 'three'

const MOON_RADIUS = 1

export default function MoonGlobe() {
  const texture = useTexture('/textures/2k_moon.jpg')
  const geometry = useMemo(() => new SphereGeometry(MOON_RADIUS, 64, 64), [])

  useMemo(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}
