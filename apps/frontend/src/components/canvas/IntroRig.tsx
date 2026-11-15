import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useAppStore } from '@/store'
import { INTRO_MOON_Y_FRACTION, INTRO_VIEW_DISTANCE, MOON_VIEW_DISTANCE } from './scale'

const DAMPING = 3
const DONE = 0.999

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Intro framing: a closer camera plus a view offset that pushes the Moon down. The Moon stays at the
 * world origin, so markers and the camera rig keep their coordinates. The camera sits on the Sun
 * side (direction of `bodies.sunDir`), so the face turned toward the viewer is the lit one, both in
 * the intro and in the usual view it eases back to; the offset is cleared when the transition ends.
 */
export default function IntroRig() {
  const progress = useRef(0)
  const done = useRef(false)
  const first = useRef(true)
  const dir = useRef(new Vector3())
  const sun = useRef(new Vector3())

  useFrame(({ camera, size }, delta) => {
    if (done.current) return
    const introActive = useAppStore.getState().introActive
    if (introActive) {
      progress.current = 0
    } else if (prefersReducedMotion()) {
      progress.current = 1
    } else {
      progress.current = MathUtils.damp(progress.current, 1, DAMPING, Math.min(delta, 0.1))
    }
    const p = progress.current >= DONE ? 1 : progress.current

    const [sx, sy, sz] = useAppStore.getState().bodies.sunDir
    sun.current.set(sx, sy, sz).normalize()
    if (first.current || prefersReducedMotion()) {
      dir.current.copy(sun.current)
      first.current = false
    } else {
      const k = 1 - Math.exp(-DAMPING * Math.min(delta, 0.1))
      dir.current.copy(camera.position).normalize().lerp(sun.current, k).normalize()
    }
    camera.position.copy(dir.current).multiplyScalar(MathUtils.lerp(INTRO_VIEW_DISTANCE, MOON_VIEW_DISTANCE, p))
    camera.lookAt(0, 0, 0)
    if (p >= 1) {
      camera.clearViewOffset()
      done.current = true
      return
    }
    const shiftPx = (INTRO_MOON_Y_FRACTION - 0.5) * size.height * (1 - p)
    camera.setViewOffset(size.width, size.height, 0, -shiftPx, size.width, size.height)
  })

  return null
}
