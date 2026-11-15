import type { KeyboardEvent } from 'react'
import { useAppStore } from '@/store'
import type { CameraView } from '@/store'
import { TIMELINE_STRINGS } from './strings'

const OPTIONS: { value: CameraView; label: string }[] = [
  { value: 'moon', label: TIMELINE_STRINGS.viewMoon },
  { value: 'perspective', label: TIMELINE_STRINGS.viewPerspective },
]

export default function ViewToggle() {
  const cameraView = useAppStore((s) => s.cameraView)
  const setCameraView = useAppStore((s) => s.setCameraView)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const idx = OPTIONS.findIndex((o) => o.value === cameraView)
    const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1
    const next = OPTIONS[(idx + step + OPTIONS.length) % OPTIONS.length]
    setCameraView(next.value)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next.value}"]`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={TIMELINE_STRINGS.viewGroupLabel}
      onKeyDown={onKeyDown}
      className="pointer-events-auto flex shrink-0 rounded border border-star-100/30 bg-space-800 p-0.5 text-xs text-star-100"
    >
      {OPTIONS.map((o) => {
        const active = o.value === cameraView
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-view={o.value}
            onClick={() => setCameraView(o.value)}
            className={`rounded px-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${active ? 'bg-accent-400/20 font-bold underline decoration-2 underline-offset-4 ring-2 ring-accent-400' : 'font-normal hover:bg-star-100/10'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
