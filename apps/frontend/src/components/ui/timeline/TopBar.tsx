import { MissionWindowPicker } from '@/components/ui/mission'
import { PANEL } from '@/components/ui/common/styles'
import HourControl from './HourControl'
import TimeCursorBar from './TimeCursorBar'
import ViewToggle from './ViewToggle'

/** Fixed-height (`h-28`, see `TOP_BAR_PX`) top bar; floating overlays start below it. */
export default function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-28 flex-col">
      <div className="flex h-12 items-center gap-3 border-b border-line bg-chassis px-4">
        <MissionWindowPicker />
        <ViewToggle />
      </div>
      <div className="flex h-16 items-center gap-4 px-4">
        <TimeCursorBar />
      </div>
      {/* Own container right under the day cells; positioned against this absolute header. */}
      <div className={`${PANEL} absolute top-full left-4 mt-2 p-2`}>
        <HourControl />
      </div>
    </header>
  )
}
