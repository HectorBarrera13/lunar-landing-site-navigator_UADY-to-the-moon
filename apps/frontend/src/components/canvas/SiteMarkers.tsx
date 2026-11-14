import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Color, InstancedMesh, MathUtils, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { getSites } from '@/lib/api'
import { useAppStore } from '@/store'
import type { SiteListItem } from '@/types'

const MARKER_RADIUS = 0.015
const SURFACE_OFFSET = 1.004
const BASE_COLOR = new Color('#f5c542')
const SELECTED_COLOR = new Color('#ffffff')

/** Convention (unverified against the texture): +Y = north pole, lon 0 on +X, east toward -Z. */
function setSurfacePosition(target: Object3D, latDeg: number, lonDeg: number): void {
  const lat = MathUtils.degToRad(latDeg)
  const lon = MathUtils.degToRad(lonDeg)
  target.position.set(
    SURFACE_OFFSET * Math.cos(lat) * Math.cos(lon),
    SURFACE_OFFSET * Math.sin(lat),
    -SURFACE_OFFSET * Math.cos(lat) * Math.sin(lon),
  )
}

export default function SiteMarkers() {
  const [sites, setSites] = useState<SiteListItem[]>([])
  const meshRef = useRef<InstancedMesh>(null)
  const selectSite = useAppStore((s) => s.selectSite)
  const selectedId = useAppStore((s) => (s.selection.kind === 'site' ? s.selection.siteId : null))

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
    const site = sites[event.instanceId]
    if (site) selectSite(site.id)
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
