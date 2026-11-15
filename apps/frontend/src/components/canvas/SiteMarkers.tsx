import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { CircleGeometry, Color, DoubleSide, InstancedMesh, MathUtils, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import { useAppStore } from '@/store'
import type { SiteListItem, SiteRegion } from '@/types'
import { setSurfacePosition } from './surface'

const CORE_RADIUS = 0.011
const HALO_RADIUS = 0.024
const HALO_OPACITY = 0.35
/** Lifts the solid core above the halo along the surface normal to avoid z-fighting. */
const CORE_LIFT = 0.0006
const DRAG_THRESHOLD_PX = 2
/** Fixed markers by region (back-end `region` field): south pole pink, elsewhere yellow. */
const REGION_COLORS: Record<SiteRegion, Color> = {
  south_pole: new Color('#ff46af'),
  other: new Color('#ffec46'),
}
const SELECTED_SCALE = 1.8
/** Distance-dependent size: 1x at ZOOM_REF_DISTANCE, growing/shrinking with sqrt(distance), clamped. */
const ZOOM_REF_DISTANCE = 3
const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.5
/** Skip matrix rewrites for zoom changes below this (avoids per-frame work while idle). */
const ZOOM_EPSILON = 0.01

type SiteWithCoordinates = SiteListItem & { lat: number; lon: number }

function hasCoordinates(site: SiteListItem): site is SiteWithCoordinates {
  return site.lat !== null && site.lon !== null
}

export default function SiteMarkers() {
  const sites = useAppStore((s) => s.sites)
  const coreRef = useRef<InstancedMesh>(null)
  const haloRef = useRef<InstancedMesh>(null)
  const focusSite = useAppStore((s) => s.focusSite)
  const selectedId = useAppStore((s) => (s.focus?.kind === 'site' ? s.focus.id : null))
  const located = useMemo(() => sites.filter(hasCoordinates), [sites])

  const coreGeometry = useMemo(() => new CircleGeometry(CORE_RADIUS, 24), [])
  const haloGeometry = useMemo(() => new CircleGeometry(HALO_RADIUS, 24), [])
  const coreMaterial = useMemo(() => new MeshBasicMaterial({ side: DoubleSide }), [])
  const haloMaterial = useMemo(
    () => new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: HALO_OPACITY, depthWrite: false }),
    [],
  )
  useEffect(
    () => () => {
      coreGeometry.dispose()
      haloGeometry.dispose()
      coreMaterial.dispose()
      haloMaterial.dispose()
    },
    [coreGeometry, haloGeometry, coreMaterial, haloMaterial],
  )

  const scratch = useMemo(() => ({ dummy: new Object3D(), outward: new Vector3(), look: new Vector3() }), [])
  const zoomRef = useRef(1)

  const writeMatrices = useCallback(
    (zoom: number) => {
      const { dummy, outward, look } = scratch
      const layers = [
        { mesh: coreRef.current, lift: CORE_LIFT },
        { mesh: haloRef.current, lift: 0 },
      ]
      for (const { mesh, lift } of layers) {
        if (!mesh) continue
        located.forEach((site, i) => {
          setSurfacePosition(dummy, site.lat, site.lon)
          outward.copy(dummy.position).normalize()
          dummy.lookAt(look.copy(outward).multiplyScalar(2))
          dummy.position.addScaledVector(outward, lift)
          dummy.scale.setScalar(zoom * (site.id === selectedId ? SELECTED_SCALE : 1))
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        mesh.computeBoundingSphere()
      }
    },
    [located, selectedId, scratch],
  )

  useLayoutEffect(() => {
    writeMatrices(zoomRef.current)
  }, [writeMatrices])

  useFrame(({ camera }) => {
    const zoom = MathUtils.clamp(Math.sqrt(camera.position.length() / ZOOM_REF_DISTANCE), ZOOM_MIN, ZOOM_MAX)
    if (Math.abs(zoom - zoomRef.current) < ZOOM_EPSILON) return
    zoomRef.current = zoom
    writeMatrices(zoom)
  })

  useLayoutEffect(() => {
    for (const mesh of [coreRef.current, haloRef.current]) {
      if (!mesh) continue
      located.forEach((site, i) => {
        mesh.setColorAt(i, REGION_COLORS[site.region])
      })
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [located])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId === undefined) return
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const site = located[event.instanceId]
    if (site) focusSite(site)
  }

  if (located.length === 0) return null

  const pointerHandlers = {
    onClick: handleClick,
    onPointerOver: () => {
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      document.body.style.cursor = ''
    },
  }

  return (
    <>
      <instancedMesh
        key={`halo-${located.length}`}
        ref={haloRef}
        args={[haloGeometry, haloMaterial, located.length]}
        {...pointerHandlers}
      />
      <instancedMesh
        key={`core-${located.length}`}
        ref={coreRef}
        args={[coreGeometry, coreMaterial, located.length]}
        {...pointerHandlers}
      />
    </>
  )
}
