import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { getSites } from '@/lib/api'
import { useAppStore } from '@/store'
import type { SiteListItem } from '@/types'
import { setSurfacePosition } from './surface'

const MARKER_RADIUS = 0.015
const DRAG_THRESHOLD_PX = 2
const BASE_COLOR = new Color('#f5c542')
const SELECTED_COLOR = new Color('#ffffff')

export default function SiteMarkers() {
  const [sites, setSites] = useState<SiteListItem[]>([])
  const meshRef = useRef<InstancedMesh>(null)
  const focusSite = useAppStore((s) => s.focusSite)
  const selectedId = useAppStore((s) => (s.focus?.kind === 'site' ? s.focus.id : null))

  const geometry = useMemo(() => new SphereGeometry(MARKER_RADIUS, 12, 12), [])
  const material = useMemo(() => new MeshBasicMaterial(), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useEffect(() => {
    let cancelled = false
    void getSites().then((list) => {
      if (!cancelled) setSites(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new Object3D()
    sites.forEach((site, i) => {
      setSurfacePosition(dummy, site.lat, site.lon)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [sites])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    sites.forEach((site, i) => {
      mesh.setColorAt(i, site.id === selectedId ? SELECTED_COLOR : BASE_COLOR)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [sites, selectedId])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId === undefined) return
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const site = sites[event.instanceId]
    if (site) focusSite(site)
  }

  if (sites.length === 0) return null

  return (
    <instancedMesh
      key={sites.length}
      ref={meshRef}
      args={[geometry, material, sites.length]}
      onClick={handleClick}
    />
  )
}
