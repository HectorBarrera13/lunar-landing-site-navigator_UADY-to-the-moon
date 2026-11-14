import MoonScene from '@/components/canvas/MoonScene'
import { HorizonPanel } from '@/components/ui/horizon'

export default function App() {
  return (
    <main className="relative h-dvh w-full bg-space-950 text-star-100">
      <h1 className="sr-only">Lunar Landing Site Navigator</h1>
      <MoonScene />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto w-full max-w-3xl">
          <HorizonPanel />
        </div>
      </div>
    </main>
  )
}
