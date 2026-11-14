import { useAppStore } from '@/store'
import { horizonStrings as t } from './strings'

const STEP_MINUTES = 60

export default function TimeSlider(): React.JSX.Element | null {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  const cursor = useAppStore((s) => s.mission.timeCursor)
  const setTimeCursor = useAppStore((s) => s.setTimeCursor)
  if (t0 === null || tf === null) return null

  const startMs = Date.parse(t0)
  const maxStep = Math.floor((Date.parse(tf) - startMs) / (STEP_MINUTES * 60_000))
  const cursorMs = cursor === null ? startMs : Date.parse(cursor)
  const value = Math.min(maxStep, Math.max(0, Math.round((cursorMs - startMs) / (STEP_MINUTES * 60_000))))
  const shown = new Date(startMs + value * STEP_MINUTES * 60_000).toISOString().replace('.000Z', 'Z')

  return (
    <div className="mt-3">
      <label htmlFor="time-cursor" className="flex justify-between text-xs">
        <span>{t.sliderLabel}</span>
        <time dateTime={shown}>{shown}</time>
      </label>
      <input
        id="time-cursor"
        type="range"
        min={0}
        max={maxStep}
        step={1}
        value={value}
        aria-valuetext={shown}
        onChange={(e) =>
          setTimeCursor(
            new Date(startMs + Number(e.target.value) * STEP_MINUTES * 60_000).toISOString().replace('.000Z', 'Z'),
          )
        }
        className="mt-1 w-full accent-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      />
      <p className="text-xs opacity-70">{t.sliderHint}</p>
    </div>
  )
}
