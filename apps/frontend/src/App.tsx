import MoonScene from '@/components/canvas/MoonScene'
import { PointInfoCard, PointSidebar } from '@/components/ui/pointInfo'
import { TimeCursorBar } from '@/components/ui/timeline'

export default function App() {
  return (
    <main className="relative h-dvh w-full bg-space-950 text-star-100">
      <h1 className="sr-only">Lunar Landing Site Navigator</h1>
      <MoonScene />
      <TimeCursorBar />
      <PointInfoCard />
      <PointSidebar />
    </main>
  )
}
