export default function SceneFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#2a2a33" wireframe />
    </mesh>
  )
}
