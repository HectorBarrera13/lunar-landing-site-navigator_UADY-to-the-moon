import { POINT_INFO_STRINGS as S } from './strings'

/** Shown when a free globe click was resolved to the nearest preset site (`focusOrigin === 'nearest-site'`). */
export default function NearestSiteNote({ name }: { name: string }) {
  return (
    <p className="flex items-start gap-1.5 border border-line bg-chassis px-2 py-1 text-[11px] text-ink-muted">
      <span aria-hidden="true" className="text-primary">
        {'⌖'}
      </span>
      <span>
        <span className="text-ink">
          {S.nearestPreset}: {name}
        </span>
        <span className="sr-only">. {S.nearestPresetHint}</span>
      </span>
    </p>
  )
}
