import { useCallback, useEffect, useRef, useState } from 'react'
import { TOUR_STEPS, resetDemoState } from './steps'
import TourCard from './TourCard'
import TourOverlay from './TourOverlay'
import { useTargetRect } from './useTargetRect'

/** Waits for the UI reveal animation (700 ms) before the first window appears. */
const START_DELAY_MS = 800
/** Lets panels that grab focus when they open (compare sidebar) settle before focusing Continue. */
const FOCUS_DELAY_MS = 80

/**
 * One-time guided tour shown after the intro (once per page load). Each step highlights an area,
 * dimming the rest, and a message window offers Continue / Skip all. Steps that need a selected
 * point drive the store themselves (demo); the demo state is cleared when the tour ends.
 */
export default function TourGuide() {
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [index, setIndex] = useState(0)
  const continueRef = useRef<HTMLButtonElement>(null)
  const step = TOUR_STEPS[index]
  const rect = useTargetRect(started && !done ? step.target : null)

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), START_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const finish = useCallback(() => {
    resetDemoState()
    setDone(true)
  }, [])

  const next = () => {
    if (index === TOUR_STEPS.length - 1) finish()
    else setIndex(index + 1)
  }

  useEffect(() => {
    if (!started || done) return
    step.enter?.()
    const timer = window.setTimeout(() => continueRef.current?.focus(), FOCUS_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [started, done, step])

  useEffect(() => {
    if (!started || done) return
    // Capture phase: runs before the compare sidebar's own Escape handler.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      finish()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [started, done, finish])

  if (!started || done) return null

  return (
    <>
      <TourOverlay rect={rect} />
      <TourCard
        title={step.title}
        text={step.text}
        index={index}
        total={TOUR_STEPS.length}
        rect={rect}
        last={index === TOUR_STEPS.length - 1}
        continueRef={continueRef}
        onContinue={next}
        onSkip={finish}
      />
    </>
  )
}
