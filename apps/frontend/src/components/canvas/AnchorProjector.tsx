import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAppStore } from '@/store'
import type { FocusedLocation } from '@/types'
import { setSurfaceVector } from './surface'

const MOVE_THRESHOLD_PX = 1
const HORIZON_EPSILON = 0.001

/** Projects the focused surface point to CSS pixels and writes it to the store. */
export default function AnchorProjector() {
  const pos = useRef(new Vector3())
  const proj = useRef(new Vector3())
  const cached = useRef<FocusedLocation | null>(null)
  const last = useRef({ x: NaN, y: NaN, visible: false, none: true })

  useFrame(({ camera, size }) => {
    const { focus, setAnchor } = useAppStore.getState()
    const l = last.current
    if (!focus) {
      if (!l.none) {
        l.none = true
        cached.current = null
        setAnchor(null)
      }
      return
    }
    if (cached.current !== focus) {
      cached.current = focus
      setSurfaceVector(pos.current, focus.latDeg, focus.lonDeg)
      l.x = NaN
      l.y = NaN
      l.none = false
    }
    camera.updateMatrixWorld()
    const p = pos.current
    // Visible from the camera when the point lies on the near side of the sphere's horizon cone.
    const facing = p.dot(camera.position) / p.length() - 1 > HORIZON_EPSILON
    proj.current.copy(p).project(camera)
    const x = (proj.current.x * 0.5 + 0.5) * size.width
    const y = (-proj.current.y * 0.5 + 0.5) * size.height
    const onScreen = proj.current.z < 1 && x >= 0 && x <= size.width && y >= 0 && y <= size.height
    const visible = facing && onScreen
    const moved = !(Math.abs(x - l.x) <= MOVE_THRESHOLD_PX && Math.abs(y - l.y) <= MOVE_THRESHOLD_PX)
    if (visible === l.visible && (!visible || !moved) && !Number.isNaN(l.x)) return
    l.x = x
    l.y = y
    l.visible = visible
    setAnchor({ x, y, visible })
  })

  return null
}
