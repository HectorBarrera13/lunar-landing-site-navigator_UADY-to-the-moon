import { useEffect } from 'react'
import MoonScene from '@/components/canvas/MoonScene'
import HorizonPanel from '@/components/ui/horizon'
import { LandingView } from '@/components/ui/map'
import { MapViewSelect } from '@/components/ui/mapview'
import { BlockedNotice } from '@/components/ui/notice'
import { PointInfoCard, PointSidebar } from '@/components/ui/pointInfo'
import { TopBar } from '@/components/ui/timeline'
import { useMissionSeries } from '@/lib/api/useSiteSeries'
import { useAppStore } from '@/store'

export default function App() {
  const loadSites = useAppStore((s) => s.loadSites)
  const mode = useAppStore((s) => s.mode)

  useEffect(() => {
    void loadSites()
  }, [loadSites])

  useMissionSeries()

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-base font-sans text-ink">
      <h1 className="sr-only">Lunar Landing Site Navigator</h1>
      {/* Stays mounted in the 2D view so the camera state survives; LandingView covers it. */}
      <MoonScene />
      <LandingView />
      <TopBar />
      <HorizonPanel />
      {/* Globe-only controls: the map texture and the anchored card have no meaning in the 2D view. */}
      {mode === '3d' && (
        <>
          {/* Right of the 560px horizon panel (bottom-left). */}
          <div className="absolute bottom-4 left-[calc(560px+2rem)] z-10">
            <MapViewSelect />
          </div>
          <PointInfoCard />
        </>
      )}
      <PointSidebar />
      <BlockedNotice />
    </main>
  )
}
