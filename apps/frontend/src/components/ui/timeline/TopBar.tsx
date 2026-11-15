import { MissionWindowPicker } from '@/components/ui/mission'
import HourControl from './HourControl'
import TimeCursorBar from './TimeCursorBar'
import ViewToggle from './ViewToggle'

/** Fixed-height (`h-28`, see `TOP_BAR_PX`) top bar; floating overlays start below it. */
export default function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-28 flex-col border-b border-line bg-chassis">
      <div className="flex h-12 items-center gap-3 border-b border-line px-4">
        <MissionWindowPicker />
        <ViewToggle />
      </div>
      <div className="flex h-16 items-center gap-4 px-4">
        <TimeCursorBar />
        <HourControl />
      </div>
    </header>
  )
}
