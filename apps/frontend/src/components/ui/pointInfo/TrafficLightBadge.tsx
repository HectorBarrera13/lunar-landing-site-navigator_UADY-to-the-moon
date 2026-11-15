import type { TrafficLight } from '@/types'
import { POINT_INFO_STRINGS as S } from './strings'
import { LIGHT_ICON } from './trafficLight'

/** Literal classes: traffic-light colors only on text, icon, glyph and border, never as a background fill. */
const TONE: Record<TrafficLight, string> = {
  green: 'text-light-green border-light-green',
  orange: 'text-light-orange border-light-orange',
  red: 'text-light-red border-light-red',
}

export default function TrafficLightBadge({ light }: { light: TrafficLight }) {
  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 border bg-chassis px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] ${TONE[light]}`}
    >
      <span aria-hidden="true" className="size-1 bg-current" />
      <span aria-hidden="true">{LIGHT_ICON[light]}</span>
      {S.trafficLight[light]}
    </span>
  )
}
