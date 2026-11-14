import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MoonGlobe from './MoonGlobe'
import SceneFallback from './SceneFallback'
import SiteMarkers from './SiteMarkers'
import SunLight from './SunLight'
import EarthBody from './EarthBody'

const CAMERA = { position: [0, 0, 3.5] as [number, number, number], fov: 45, near: 0.1, far: 100 }

export default function MoonScene() {
  return (
    <Canvas dpr={[1, 2]} camera={CAMERA} gl={{ antialias: true }}>
      <ambientLight intensity={0.08} />
      <SunLight />
      <Suspense fallback={<SceneFallback />}>
        <MoonGlobe />
        <SiteMarkers />
        <EarthBody />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={1.6}
        maxDistance={10}
        rotateSpeed={0.6}
        zoomSpeed={0.6}
      />
    </Canvas>
  )
}
