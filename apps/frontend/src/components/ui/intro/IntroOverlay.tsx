import { useAppStore } from '@/store'
import { INTRO_STRINGS as S } from './strings'

/**
 * Title shown over the Canvas during the intro, vertically centered between the top of the page and
 * the top edge of the Moon (about 35 % of the height: see `INTRO_VIEW_DISTANCE` and
 * `INTRO_MOON_Y_FRACTION` in `canvas/scale.ts`). It never intercepts pointer events.
 */
export default function IntroOverlay() {
  const introActive = useAppStore((s) => s.introActive)
  if (!introActive) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[35%] flex-col items-center justify-center px-4 text-center">
      <p className="font-title text-6xl tracking-tight text-ink sm:text-7xl lg:text-8xl">
        {S.title}
      </p>
      <p className="mt-4 text-sm uppercase tracking-widest text-ink-muted">{S.hint}</p>
    </div>
  )
}
