import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import type { Object3D } from 'three'
import { useAppStore } from '@/store'

const TWO_PI = Math.PI * 2
const SETTLE_DAMPING = 3
const SETTLE_EPSILON = 1e-3

/** Moon spin during the intro, in rad/s about the north axis (+Y): a medium speed. */
export const MOON_SPIN_SPEED = 0.4
/** Starfield spin during the intro: slower and in the opposite direction. */
export const STARS_SPIN_SPEED = -0.08

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Spins `target` about +Y while the intro is active. When the intro ends the spin decelerates and
 * settles on the next whole turn in the same direction, leaving the rotation at exactly 0 so the
 * surface matches the unrotated frame that markers and picking assume (`surface.ts`).
 */
export function useIntroSpin(target: RefObject<Object3D | null>, speed: number): void {
  const angle = useRef(0)
  const settleTarget = useRef<number | null>(null)
  const settled = useRef(false)

  useFrame((_, delta) => {
    const object = target.current
    if (!object || settled.current) return
    const dt = Math.min(delta, 0.1)

    if (useAppStore.getState().introActive) {
      if (!prefersReducedMotion()) angle.current += speed * dt
    } else {
      if (settleTarget.current === null) {
        settleTarget.current =
          speed >= 0 ? Math.ceil(angle.current / TWO_PI) * TWO_PI : Math.floor(angle.current / TWO_PI) * TWO_PI
      }
      angle.current = MathUtils.damp(angle.current, settleTarget.current, SETTLE_DAMPING, dt)
      if (Math.abs(angle.current - settleTarget.current) < SETTLE_EPSILON) {
        angle.current = 0
        settled.current = true
      }
    }
    object.rotation.y = settled.current ? 0 : angle.current
  })
}
