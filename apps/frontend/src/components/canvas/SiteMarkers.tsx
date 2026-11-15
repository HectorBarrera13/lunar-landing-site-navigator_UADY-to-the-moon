import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { useAppStore } from '@/store'
import type { SiteListItem, SiteRegion } from '@/types'
import { setSurfacePosition } from './surface'

const MARKER_RADIUS = 0.015
const DRAG_THRESHOLD_PX = 2
/** Fixed markers by region (back-end `region` field): south pole pink, elsewhere yellow. */
const REGION_COLORS: Record<SiteRegion, Color> = {
  south_pole: new Color('#ff46af'),
  other: new Color('#ffec46'),
}
const SELECTED_SCALE = 1.8

type SiteWithCoordinates = SiteListItem & { lat: number; lon: number }

function hasCoordinates(site: SiteListItem): site is SiteWithCoordinates {
  return site.lat !== null && site.lon !== null
}

export default function SiteMarkers() {
  const sites = useAppStore((s) => s.sites)
  const meshRef = useRef<InstancedMesh>(null)
  const focusSite = useAppStore((s) => s.focusSite)
  const selectedId = useAppStore((s) => (s.focus?.kind === 'site' ? s.focus.id : null))
  const located = useMemo(() => sites.filter(hasCoordinates), [sites])

  const geometry = useMemo(() => new SphereGeometry(MARKER_RADIUS, 12, 12), [])
  const material = useMemo(() => new MeshBasicMaterial(), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new Object3D()
    located.forEach((site, i) => {
      setSurfacePosition(dummy, site.lat, site.lon)
      dummy.scale.setScalar(site.id === selectedId ? SELECTED_SCALE : 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [located, selectedId])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    located.forEach((site, i) => {
      mesh.setColorAt(i, REGION_COLORS[site.region])
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [located])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId === undefined) return
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const site = located[event.instanceId]
    if (site) focusSite(site)
  }

  if (located.length === 0) return null

  return (
    <instancedMesh
      key={located.length}
      ref={meshRef}
      args={[geometry, material, located.length]}
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    />
  )
}
