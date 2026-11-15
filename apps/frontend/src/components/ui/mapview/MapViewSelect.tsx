import { INPUT, LABEL, PANEL } from '@/components/ui/common/styles'
import { MOON_MAP_VIEWS } from '@/lib/moonMapViews'
import { useAppStore } from '@/store'
import type { MoonMapView } from '@/store'
import { mapViewStrings as t } from './strings'

export default function MapViewSelect(): React.JSX.Element {
  const view = useAppStore((s) => s.moonMapView)
  const setMoonMapView = useAppStore((s) => s.setMoonMapView)

  return (
    <div className={`${PANEL} w-56 p-2.5 text-sm`}>
      <label htmlFor="map-view" className={`block ${LABEL}`}>
        {t.label}
      </label>
      <select
        id="map-view"
        value={view}
        aria-describedby="map-view-hint"
        onChange={(e) => setMoonMapView(e.target.value as MoonMapView)}
        className={`${INPUT} mt-1 w-full`}
      >
        {MOON_MAP_VIEWS.map((id) => (
          <option key={id} value={id}>
            {t.options[id]}
          </option>
        ))}
      </select>
      <p id="map-view-hint" className="mt-1 text-[11px] text-ink-subtle">
        {t.hints[view]}
      </p>
    </div>
  )
}
