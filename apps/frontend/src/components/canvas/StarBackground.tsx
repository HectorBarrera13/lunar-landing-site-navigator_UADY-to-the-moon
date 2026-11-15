import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { BackSide, SRGBColorSpace, SphereGeometry } from 'three'
import type { Mesh } from 'three'
import { STARS_SPIN_SPEED, useIntroSpin } from './useIntroSpin'

const STAR_SPHERE_RADIUS = 8000

/**
 * NASA SVS "Deep Star Maps 2020" (plate carree, ICRF/J2000, RA increases to the left).
 * UNVERIFIED mapping: the sphere is not yet rotated from ICRF to the scene axes (MOON_ME),
 * so the sky is realistic but not positioned for a given date and site.
 */
export default function StarBackground() {
  const texture = useTexture('/textures/starmap_2020_4k.jpg')
  const geometry = useMemo(() => new SphereGeometry(STAR_SPHERE_RADIUS, 64, 32), [])
  const mesh = useRef<Mesh>(null)
  useIntroSpin(mesh, STARS_SPIN_SPEED)

  useMemo(() => {
    texture.colorSpace = SRGBColorSpace
  }, [texture])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    mesh.current?.position.copy(state.camera.position)
  })

  return (
    <mesh ref={mesh} geometry={geometry} scale={[-1, 1, 1]} renderOrder={-1} frustumCulled={false}>
      <meshBasicMaterial map={texture} side={BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
