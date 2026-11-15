import { MOON_MAP_VIEWS } from '@/lib/moonMapViews'
import { useAppStore } from '@/store'
import type { MoonMapView } from '@/store'
import { mapViewStrings as t } from './strings'

export default function MapViewSelect(): React.JSX.Element {
  const view = useAppStore((s) => s.moonMapView)
  const setMoonMapView = useAppStore((s) => s.setMoonMapView)

  return (
    <div className="w-64 rounded-lg bg-space-900/80 p-3 text-sm backdrop-blur">
      <label htmlFor="map-view" className="block text-xs font-medium">
        {t.label}
      </label>
      <select
        id="map-view"
        value={view}
        aria-describedby="map-view-hint"
        onChange={(e) => setMoonMapView(e.target.value as MoonMapView)}
        className="mt-1 w-full rounded-md border border-star-100/30 bg-space-800 px-2 py-1.5 text-star-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        {MOON_MAP_VIEWS.map((id) => (
          <option key={id} value={id}>
            {t.options[id]}
          </option>
        ))}
      </select>
      <p id="map-view-hint" className="mt-1 text-xs opacity-70">
        {t.hints[view]}
      </p>
    </div>
  )
}
