import { useMemo } from 'react'
import { useAppStore } from '@/store'

const SUN_DISTANCE = 10

export default function SunLight() {
  const sunDir = useAppStore((s) => s.bodies.sunDir)
  const position = useMemo<[number, number, number]>(() => {
    const [x, y, z] = sunDir
    const k = SUN_DISTANCE / (Math.hypot(x, y, z) || 1)
    return [x * k, y * k, z * k]
  }, [sunDir])
  return <directionalLight position={position} intensity={3} />
}
