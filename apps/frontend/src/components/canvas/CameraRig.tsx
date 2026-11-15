import { useEffect, useRef } from 'react'
import type { ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls } from '@react-three/drei'
import { MathUtils, Quaternion, Vector3 } from 'three'
import { useAppStore } from '@/store'
import { setSurfaceVector } from './surface'
import { FOCUS_DISTANCE, MOON_VIEW_DISTANCE, PERSPECTIVE_DISTANCE } from './scale'

type Controls = ComponentRef<typeof OrbitControls>

// Angle between the Moon->Sun direction and the Moon->camera-opposite axis in Perspective,
// chosen so the Sun's disc edge sits about 20 deg off axis, so the whole disc fits a 16:9 frame (fov 45).
const PERSPECTIVE_SUN_ANGLE = (22 * Math.PI) / 180
const COS_PSI = Math.cos(PERSPECTIVE_SUN_ANGLE)
const SIN_PSI = Math.sin(PERSPECTIVE_SUN_ANGLE)
const DAMPING = 4
const DONE_DIST = 0.005
const DONE_ANGLE = 0.002

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as Controls | null
  const animating = useRef(false)
  const targetDir = useRef(new Vector3(0, 0, 1))
  const targetDist = useRef(MOON_VIEW_DISTANCE)
  const tmpDir = useRef(new Vector3())
  const qFull = useRef(new Quaternion())
  const qStep = useRef(new Quaternion())
  const identity = useRef(new Quaternion())
  const sunV = useRef(new Vector3())
  const lateral = useRef(new Vector3())
  const upAxis = useRef(new Vector3(0, 1, 0))

  useEffect(() => {
    let prevFocus = useAppStore.getState().focus
    let prevView = useAppStore.getState().cameraView
    let prevMap = useAppStore.getState().moonMapView
    let prevMode = useAppStore.getState().mode
    return useAppStore.subscribe((state) => {
      const { focus, cameraView, moonMapView, mode } = state
      const backTo3d = mode !== prevMode && mode === '3d'
      prevMode = mode
      if (focus === prevFocus && cameraView === prevView && moonMapView === prevMap) {
        if (backTo3d) {
          // Returning from the 2D view: pull back along the current (focus) direction.
          targetDir.current.copy(camera.position).normalize()
          targetDist.current = MOON_VIEW_DISTANCE
          animating.current = true
        }
        return
      }
      const mapChanged = moonMapView !== prevMap
      prevMap = moonMapView
      const refocusForMap = mapChanged && cameraView === 'moon'
      if (mapChanged && focus === prevFocus && cameraView === prevView && !refocusForMap) return
      const hadFocus = prevFocus !== null
      const focusChanged = focus !== prevFocus
      const viewChanged = cameraView !== prevView
      prevFocus = focus
      prevView = cameraView
      if (focus && focusChanged && !refocusForMap) {
        setSurfaceVector(targetDir.current, focus.latDeg, focus.lonDeg)
        targetDir.current.normalize()
        targetDist.current = FOCUS_DISTANCE
        animating.current = true
      } else if (viewChanged || hadFocus || refocusForMap) {
        if (cameraView === 'perspective') {
          const [x, y, z] = state.bodies.sunDir
          const sun = sunV.current.set(x, y, z).normalize()
          const lat = lateral.current.crossVectors(sun, upAxis.current)
          if (lat.lengthSq() < 1e-6) lat.set(1, 0, 0)
          lat.normalize()
          targetDir.current.copy(sun).multiplyScalar(-COS_PSI).addScaledVector(lat, -SIN_PSI)
          targetDist.current = PERSPECTIVE_DISTANCE
        } else if (viewChanged || refocusForMap) {
          const [x, y, z] = state.bodies.sunDir
          targetDir.current.set(x, y, z).normalize()
          targetDist.current = MOON_VIEW_DISTANCE
        } else {
          targetDir.current.copy(camera.position).normalize()
          targetDist.current = MOON_VIEW_DISTANCE
        }
        animating.current = true
      }
    })
  }, [camera])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      animating.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, delta) => {
    if (!animating.current || !controls) return
    const k = 1 - Math.exp(-DAMPING * Math.min(delta, 0.1))
    const dist = MathUtils.clamp(targetDist.current, controls.minDistance, controls.maxDistance)
    const cur = tmpDir.current.copy(camera.position)
    const len = cur.length()
    cur.divideScalar(len || 1)
    qFull.current.setFromUnitVectors(cur, targetDir.current)
    qStep.current.copy(identity.current).slerp(qFull.current, k)
    camera.position.applyQuaternion(qStep.current)
    camera.position.setLength(MathUtils.lerp(len, dist, k))
    controls.update()
    const angle = 2 * Math.acos(Math.min(1, Math.abs(qFull.current.w)))
    if (angle < DONE_ANGLE && Math.abs(len - dist) < DONE_DIST) {
      animating.current = false
    }
  })

  return null
}
