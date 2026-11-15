import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT, LABEL } from '@/components/ui/common/styles'
import { MISSION_BOUNDS, SUNLIT_EXAMPLE_WINDOW, toIsoUtc } from '@/lib/mission'
import { useAppStore } from '@/store'
import { MISSION_STRINGS as S } from './strings'

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))
const MIN_DATE = MISSION_BOUNDS.startUtc.slice(0, 10)
const MAX_DATE = MISSION_BOUNDS.endUtc.slice(0, 10)

interface Draft {
  startDate: string
  startHour: string
  endDate: string
  endHour: string
}

function draftFrom(t0: string, tf: string): Draft {
  return {
    startDate: t0.slice(0, 10),
    startHour: t0.slice(11, 13),
    endDate: tf.slice(0, 10),
    endHour: tf.slice(11, 13),
  }
}

function parse(date: string, hour: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Number.NaN
  return Date.parse(`${date}T${hour}:00:00Z`)
}

type Validation = { ok: true; t0: string; tf: string } | { ok: false; error: string; field: 'start' | 'end' }

function validate(draft: Draft): Validation {
  const start = parse(draft.startDate, draft.startHour)
  const end = parse(draft.endDate, draft.endHour)
  if (Number.isNaN(start)) return { ok: false, error: S.errors.startMissing, field: 'start' }
  if (Number.isNaN(end)) return { ok: false, error: S.errors.endMissing, field: 'end' }
  if (start < Date.parse(MISSION_BOUNDS.startUtc) || start > Date.parse(MISSION_BOUNDS.endUtc)) {
    return { ok: false, error: S.errors.outOfBounds, field: 'start' }
  }
  if (end < Date.parse(MISSION_BOUNDS.startUtc) || end > Date.parse(MISSION_BOUNDS.endUtc)) {
    return { ok: false, error: S.errors.outOfBounds, field: 'end' }
  }
  if (end <= start) return { ok: false, error: S.errors.order, field: 'end' }
  return { ok: true, t0: toIsoUtc(start), tf: toIsoUtc(end) }
}

interface FormProps {
  t0: string
  tf: string
}

/** Remounted (keyed) whenever the applied window changes, so the draft starts from the store. */
function MissionWindowForm({ t0, tf }: FormProps) {
  const setMissionWindow = useAppStore((s) => s.setMissionWindow)
  const [draft, setDraft] = useState<Draft>(() => draftFrom(t0, tf))
  const [error, setError] = useState<{ message: string; field: 'start' | 'end' } | null>(null)
  const id = useId()
  const errorId = `${id}-error`

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setError(null)
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = validate(draft)
    if (!result.ok) {
      setError({ message: result.error, field: result.field })
      return
    }
    setError(null)
    setMissionWindow(result.t0, result.tf)
  }

  const invalid = (field: 'start' | 'end') => error?.field === field
  const describedBy = (field: 'start' | 'end') => (invalid(field) ? errorId : undefined)

  return (
    <form
      aria-label={S.groupLabel}
      onSubmit={onSubmit}
      noValidate
      className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2"
    >
      <span className={LABEL}>{S.title}</span>
      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">{S.start}</legend>
        <input
          type="date"
          aria-label={S.startDate}
          min={MIN_DATE}
          max={MAX_DATE}
          value={draft.startDate}
          aria-invalid={invalid('start')}
          aria-describedby={describedBy('start')}
          onChange={(e) => update({ startDate: e.target.value })}
          className={`${INPUT} w-34`}
        />
        <select
          aria-label={S.startHour}
          value={draft.startHour}
          onChange={(e) => update({ startHour: e.target.value })}
          className={`${INPUT} w-14`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </fieldset>
      <span aria-hidden="true" className="font-mono text-xs text-ink-subtle">
        {'→'}
      </span>
      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">{S.end}</legend>
        <input
          type="date"
          aria-label={S.endDate}
          min={MIN_DATE}
          max={MAX_DATE}
          value={draft.endDate}
          aria-invalid={invalid('end')}
          aria-describedby={describedBy('end')}
          onChange={(e) => update({ endDate: e.target.value })}
          className={`${INPUT} w-34`}
        />
        <select
          aria-label={S.endHour}
          value={draft.endHour}
          onChange={(e) => update({ endHour: e.target.value })}
          className={`${INPUT} w-14`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
      </fieldset>
      <span className="font-mono text-[10px] text-line-strong">{S.utc}</span>
      <button type="submit" className={BUTTON_PRIMARY}>
        {S.apply}
      </button>
      <button
        type="button"
        title={S.sunlitExampleHint}
        aria-describedby={`${id}-sunlit`}
        onClick={() => setMissionWindow(SUNLIT_EXAMPLE_WINDOW.startUtc, SUNLIT_EXAMPLE_WINDOW.endUtc)}
        className={BUTTON_SECONDARY}
      >
        <span aria-hidden="true" className="mr-1.5 text-sun">
          {'☉'}
        </span>
        {S.sunlitExample}
      </button>
      <span id={`${id}-sunlit`} className="sr-only">
        {S.sunlitExampleHint}
      </span>
      {error !== null && (
        <p id={errorId} role="alert" className="line-clamp-2 min-w-0 flex-1 text-xs text-ink">
          <span aria-hidden="true" className="mr-1 text-ink-muted">
            {'⚠'}
          </span>
          {error.message}
        </p>
      )}
    </form>
  )
}

export default function MissionWindowPicker() {
  const t0 = useAppStore((s) => s.mission.t0)
  const tf = useAppStore((s) => s.mission.tf)
  if (t0 === null || tf === null) return null
  return <MissionWindowForm key={`${t0}|${tf}`} t0={t0} tf={tf} />
}
