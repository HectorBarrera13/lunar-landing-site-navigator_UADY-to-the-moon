import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MoonGlobe from './MoonGlobe'
import SceneFallback from './SceneFallback'
import SiteMarkers from './SiteMarkers'
import CameraRig from './CameraRig'
import AnchorProjector from './AnchorProjector'
import SunLight from './SunLight'
import EarthBody from './EarthBody'
import SunBody from './SunBody'
import StarBackground from './StarBackground'
import IntroRig from './IntroRig'
import { useAppStore } from '@/store'
import {
  CAMERA_FAR,
  CAMERA_MAX_DISTANCE,
  CAMERA_MIN_DISTANCE,
  INTRO_VIEW_DISTANCE,
} from './scale'

/** Fill light: dim by default; raised in the South Pole view so shadowed relief stays readable without losing the shadow. */
const AMBIENT_DEFAULT = 0.08
const AMBIENT_SOUTH_POLE = 0.35

const CAMERA = { position: [0, 0, INTRO_VIEW_DISTANCE] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: CAMERA_FAR, }

export default function MoonScene() {
  const introActive = useAppStore((s) => s.introActive)
  const southPoleView = useAppStore((s) => s.cameraView === 'south_pole')
  return (
    <Canvas dpr={[1, 2]} camera={CAMERA} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
      <ambientLight intensity={southPoleView ? AMBIENT_SOUTH_POLE : AMBIENT_DEFAULT} />
      <SunLight />
      <Suspense fallback={<SceneFallback />}>
        <StarBackground />
        <MoonGlobe />
        {!introActive && (
          <>
            <SiteMarkers />
            <EarthBody />
            <SunBody />
          </>
        )}
      </Suspense>
      <OrbitControls
        makeDefault
        enabled={!introActive}
        enablePan={false}
        enableDamping
        minDistance={CAMERA_MIN_DISTANCE}
        maxDistance={CAMERA_MAX_DISTANCE}
        rotateSpeed={0.6}
        zoomSpeed={0.6}
      />
      <IntroRig />
      <CameraRig />
      <AnchorProjector />
    </Canvas>
  )
}
