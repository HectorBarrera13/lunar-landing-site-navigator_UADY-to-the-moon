import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MoonGlobe from './MoonGlobe'
import SceneFallback from './SceneFallback'
import SiteMarkers from './SiteMarkers'
import PickedPointMarkers from './PickedPointMarkers'
import CameraRig from './CameraRig'
import AnchorProjector from './AnchorProjector'
import SunLight from './SunLight'
import EarthBody from './EarthBody'
import SunBody from './SunBody'
import {
  CAMERA_FAR,
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
  MOON_VIEW_DISTANCE,
} from './scale'

const CAMERA = { position: [0, 0, MOON_VIEW_DISTANCE] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: CAMERA_FAR, }

export default function MoonScene() {
  return (
    <Canvas dpr={[1, 2]} camera={CAMERA} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
      <ambientLight intensity={0.08} />
      <SunLight />
      <Suspense fallback={<SceneFallback />}>
        <MoonGlobe />
        <SiteMarkers />
        <PickedPointMarkers />
        <EarthBody />
        <SunBody />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={CAMERA_MIN_DISTANCE}
        maxDistance={CAMERA_MAX_DISTANCE}
        rotateSpeed={0.6}
        zoomSpeed={0.6}
      />
      <CameraRig />
      <AnchorProjector />
    </Canvas>
  )
}
