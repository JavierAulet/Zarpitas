'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import * as THREE from 'three'

const GOLD_COLOR = new THREE.Color('#D4AF37')
const GOLD_LIGHT_COLOR = new THREE.Color('#F5D485')

function GoldParticles() {
  const mesh = useRef<THREE.Points>(null)
  const count = 280

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 25
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15 - 8
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = state.clock.elapsedTime * 0.015
    mesh.current.rotation.x = state.clock.elapsedTime * 0.008
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD_COLOR}
        size={0.06}
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  )
}

function FloatingOrb({
  position,
  scale = 1,
  speed = 1.5,
  wireframe = true,
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
  wireframe?: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.2 * speed
    ref.current.rotation.z = state.clock.elapsedTime * 0.15 * speed
  })

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          metalness={0.95}
          roughness={0.05}
          emissive={GOLD_COLOR}
          emissiveIntensity={wireframe ? 0.1 : 0.2}
          wireframe={wireframe}
        />
      </mesh>
    </Float>
  )
}

function FloatingTorus({
  position,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.3 * speed
    ref.current.rotation.y = state.clock.elapsedTime * 0.25 * speed
  })

  return (
    <Float speed={speed * 0.8} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[1, 0.28, 16, 50]} />
        <meshStandardMaterial
          color={GOLD_LIGHT_COLOR}
          metalness={0.9}
          roughness={0.1}
          emissive={GOLD_COLOR}
          emissiveIntensity={0.12}
        />
      </mesh>
    </Float>
  )
}

function FloatingSphere({
  position,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
}) {
  return (
    <Float speed={speed} floatIntensity={2}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={GOLD_COLOR}
          metalness={1}
          roughness={0}
          emissive={GOLD_COLOR}
          emissiveIntensity={0.05}
        />
      </mesh>
    </Float>
  )
}

function CameraRig() {
  const { camera } = useThree()

  useFrame((state) => {
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      state.pointer.x * 1.2,
      0.025
    )
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      state.pointer.y * 0.8,
      0.025
    )
    camera.lookAt(0, 0, 0)
  })

  return null
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 8, 4]} intensity={2.5} color="#F5D485" />
      <pointLight position={[-8, -6, -4]} intensity={0.6} color="#1a2a4a" />
      <pointLight position={[0, 0, 6]} intensity={0.4} color="#D4AF37" />

      <Stars
        radius={80}
        depth={60}
        count={2500}
        factor={3}
        saturation={0}
        fade
        speed={0.25}
      />

      <GoldParticles />

      {/* Left side shapes */}
      <FloatingOrb position={[-5, 2, -4]} scale={0.35} speed={1.1} />
      <FloatingTorus position={[-3.5, -1.5, -2.5]} scale={0.28} speed={0.9} />
      <FloatingSphere position={[-6, -1, -6]} scale={0.15} speed={1.6} />

      {/* Right side shapes */}
      <FloatingOrb position={[5, -1.5, -5]} scale={0.3} speed={1.4} wireframe={false} />
      <FloatingTorus position={[3.5, 2, -3]} scale={0.22} speed={1.2} />
      <FloatingSphere position={[6, 1, -7]} scale={0.12} speed={1.8} />

      {/* Center background */}
      <FloatingOrb position={[0, 4, -8]} scale={0.4} speed={0.7} />
      <FloatingSphere position={[-1, -3, -3]} scale={0.1} speed={2.1} />
      <FloatingSphere position={[2, -2.5, -4]} scale={0.08} speed={1.9} />

      <CameraRig />
    </>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  )
}
