import { useEffect } from 'react'
import MoonScene from '@/components/canvas/MoonScene'
import HorizonPanel from '@/components/ui/horizon'
import { MapViewSelect } from '@/components/ui/mapview'
import { PointInfoCard, PointSidebar } from '@/components/ui/pointInfo'
import { TimeCursorBar } from '@/components/ui/timeline'
import { useMissionSeries } from '@/lib/api/useSiteSeries'
import { useAppStore } from '@/store'

export default function App() {
  const loadSites = useAppStore((s) => s.loadSites)

  useEffect(() => {
    void loadSites()
  }, [loadSites])

  useMissionSeries()

  return (
    <main className="relative h-dvh w-full bg-space-950 text-star-100">
      <h1 className="sr-only">Lunar Landing Site Navigator</h1>
      <MoonScene />
      <TimeCursorBar />
      <HorizonPanel />
      <div className="absolute bottom-4 left-[18rem] z-10">
        <MapViewSelect />
      </div>
      <PointInfoCard />
      <PointSidebar />
    </main>
  )
}
