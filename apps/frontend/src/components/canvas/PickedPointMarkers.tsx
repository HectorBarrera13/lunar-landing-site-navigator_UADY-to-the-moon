import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { useAppStore, MAX_PICKED_POINTS } from '@/store'
import { POINT_COLORS } from '@/lib/pointColors'
import { setSurfacePosition } from './surface'

const MARKER_RADIUS = 0.015
const FOCUS_SCALE = 1.5
const CAPACITY = MAX_PICKED_POINTS
const DRAG_THRESHOLD_PX = 2
const PALETTE = POINT_COLORS.map((hex) => new Color(hex))

export default function PickedPointMarkers() {
  const meshRef = useRef<InstancedMesh>(null)
  const pickedPoints = useAppStore((s) => s.pickedPoints)
  const focusedId = useAppStore((s) => (s.focus?.kind === 'point' ? s.focus.id : null))
  const focusPoint = useAppStore((s) => s.focusPoint)

  const geometry = useMemo(() => new SphereGeometry(MARKER_RADIUS, 12, 12), [])
  const material = useMemo(() => new MeshBasicMaterial(), [])
  const dummy = useMemo(() => new Object3D(), [])
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
    pickedPoints.forEach((p, i) => {
      const focused = p.id === focusedId
      setSurfacePosition(dummy, p.latDeg, p.lonDeg)
      dummy.scale.setScalar(focused ? FOCUS_SCALE : 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, PALETTE[p.colorIndex ?? 0] ?? PALETTE[0])
    })
    mesh.count = pickedPoints.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [pickedPoints, focusedId, dummy])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.instanceId === undefined) return
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX) return
    const point = pickedPoints[event.instanceId]
    if (point) focusPoint(point.id)
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CAPACITY]}
      count={0}
      frustumCulled={false}
      onClick={handleClick}
    />
  )
}
