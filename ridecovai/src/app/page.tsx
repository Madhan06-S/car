'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, MeshReflectorMaterial, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Car, MapPin, Star, ArrowRight, Shield, 
  Clock, Gauge, Users, Fuel, Navigation, CheckCircle2, Zap, Phone, Flame, Palette, Calendar, User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers';
import SearchFilter from '@/components/SearchFilter';

// ─── REAL COIMBATORE DATA ───
const fleetData = [
  { id: 1, category: 'HATCHBACK', name: 'Maruti Swift', price: 1999, rating: 4.7, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=800&q=80', tags: ['Compact', 'City-Friendly', '4-Seater', 'Manual'], specs: { mileage: '22 km/l', fuel: 'Petrol', seats: 4, transmission: 'Manual' } },
  { id: 2, category: 'SEDAN', name: 'Honda City', price: 2899, rating: 4.8, image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80', tags: ['Premium', '5-Seater', 'Spacious', 'Automatic'], specs: { mileage: '18 km/l', fuel: 'Petrol', seats: 5, transmission: 'Auto' } },
  { id: 3, category: 'SUV', name: 'Hyundai Creta', price: 3499, rating: 4.9, image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80', tags: ['High Ground', '5-Seater', 'Sunroof', 'Diesel'], specs: { mileage: '16 km/l', fuel: 'Diesel', seats: 5, transmission: 'Auto' } },
  { id: 4, category: 'MUV', name: 'Toyota Innova Crysta', price: 4499, rating: 4.9, image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80', tags: ['7-Seater', 'Diesel', 'Luxury', 'Family'], specs: { mileage: '14 km/l', fuel: 'Diesel', seats: 7, transmission: 'Auto' } },
  { id: 5, category: 'SUV', name: 'Mahindra XUV500', price: 3999, rating: 4.6, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', tags: ['7-Seater', 'Powerful', '4x4', 'Adventure'], specs: { mileage: '15 km/l', fuel: 'Diesel', seats: 7, transmission: 'Auto' } },
  { id: 6, category: 'COMPACT SUV', name: 'Ford EcoSport', price: 2799, rating: 4.5, image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', tags: ['Urban', '5-Seater', 'Compact', 'Manual'], specs: { mileage: '17 km/l', fuel: 'Petrol', seats: 5, transmission: 'Manual' } }
];

const coimbatoreRoutes = [
  { name: 'Ooty', distance: '90 km', time: '3 hrs', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80', desc: 'Queen of Hills' },
  { name: 'Munnar', distance: '160 km', time: '5 hrs', image: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&q=80', desc: 'Tea Gardens' },
  { name: 'Valparai', distance: '100 km', time: '3.5 hrs', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', desc: 'Hidden Paradise' },
  { name: 'Palakkad', distance: '50 km', time: '1.5 hrs', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', desc: 'Gateway to Kerala' }
];

const pickupPoints = ['Gandhipuram', 'RS Puram', 'Peelamedu', 'CJB Airport', 'Singanallur', 'Ukkadam', 'Saibaba Colony', 'Race Course'];

const carColors = [
  { name: 'Midnight Black', color: '#0a0a0a', metalness: 0.95, roughness: 0.05 },
  { name: 'Racing Red', color: '#cc0000', metalness: 0.9, roughness: 0.1 },
  { name: 'Arctic White', color: '#f0f0f0', metalness: 0.85, roughness: 0.08 },
  { name: 'Gunmetal Grey', color: '#444444', metalness: 0.92, roughness: 0.06 },
  { name: 'Electric Blue', color: '#0033cc', metalness: 0.9, roughness: 0.1 },
  { name: 'Champagne Gold', color: '#c9a961', metalness: 0.95, roughness: 0.05 },
];

function RealCar3D({ scrollProgress, carColor }: { scrollProgress: number; carColor: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();

    loader.load(
      '/models/toyota_fortuner_2021.glb',
      (gltf) => {
        if (!isMounted) return;
        const scene = gltf.scene;

        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        scene.position.set(-center.x, -box.min.y, -center.z);

        setModelScene(scene);
      },
      (xhr) => {
        if (isMounted && xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else if (isMounted) {
          setLoadingProgress((prev) => Math.min(prev + 5, 95));
        }
      },
      (error) => {
        console.error('Failed to load 3D GLB model:', error);
        if (isMounted) setLoadError('Model load timeout/error');
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.04 - 0.75;
      groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.01;
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.005;
      groupRef.current.rotation.y = scrollProgress * Math.PI * 2 + time * 0.05;
    }
  });

  useEffect(() => {
    if (!modelScene) return;
    modelScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const matName = (child.material.name || child.name || '').toLowerCase();
        const isBodyMaterial = 
          matName.includes('carpaint') || matName.includes('paint') || matName.includes('body') || 
          matName.includes('car') || matName.includes('exterior') || matName.includes('shell') || 
          matName.includes('color') || matName.includes('main') || matName.includes('surface') || 
          matName.includes('material_0') || matName.includes('body_color') || matName.includes('object023');
          
        if (isBodyMaterial) {
          if (!child.userData.clonedMat) {
            child.material = child.material.clone();
            child.userData.clonedMat = true;
          }
          child.material.color = new THREE.Color(carColor.color);
          child.material.metalness = carColor.metalness;
          child.material.roughness = carColor.roughness;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [carColor, modelScene]);

  if (loadError) {
    return (
      <Html center>
        <div className="bg-black/90 p-4 rounded-xl border border-red-500/50 text-red-400 text-sm font-semibold">
          ⚠️ 3D Model Notice: {loadError}
        </div>
      </Html>
    );
  }

  if (!modelScene) {
    return (
      <Html center>
        <div className="flex flex-col items-center justify-center p-5 bg-black/85 backdrop-blur-md rounded-2xl border border-red-500/40 text-white min-w-[220px] shadow-2xl">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold tracking-wide text-gray-200">Loading 3D Fortuner</p>
          <p className="text-xs text-red-400 font-mono mt-1 font-bold">{loadingProgress}%</p>
        </div>
      </Html>
    );
  }

  return (
    <group ref={groupRef} position={[0, -0.75, 0]} scale={0.85}>
      <primitive object={modelScene} />
    </group>
  );
}


function ReflectiveGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.5}
        mirror={0.8}
      />
    </mesh>
  );
}

function AntiGravityParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = Math.random() * 0.02 + 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      pos[idx] += velocities[idx];
      pos[idx + 1] += velocities[idx + 1];
      pos[idx + 2] += velocities[idx + 2];
      
      if (pos[idx + 1] > 5) {
        pos[idx] = (Math.random() - 0.5) * 10;
        pos[idx + 1] = -5;
        pos[idx + 2] = (Math.random() - 0.5) * 10;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.02} 
        color="#ff4444" 
        transparent 
        opacity={0.4} 
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

function TransitionOverlay({ isActive, carName }: { isActive: boolean; carName: string }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
              style={{ top: `${15 + Math.random() * 70}%`, left: '-100%', width: '25%' }}
              animate={{ left: ['-25%', '125%'], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: Math.random() * 2, ease: 'easeInOut' }}
            />
          ))}
          
          <motion.div
            initial={{ x: '-100%', y: '15%', scale: 0.7 }}
            animate={{ x: '100%', y: '15%', scale: 1 }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-1/4 w-full"
          >
            <div className="relative w-80 h-40 mx-auto">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <defs>
                  <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="50%" stopColor="#333" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                  </linearGradient>
                </defs>
                <path d="M10,60 L30,60 L40,38 L80,33 L120,33 L140,43 L180,48 L190,58 L190,68 L170,73 L150,73 L140,68 L50,68 L40,73 L20,73 L10,68 Z" fill="url(#carGrad)" stroke="#ef4444" strokeWidth="0.5" />
                <circle cx="45" cy="72" r="8" fill="#111" stroke="#555" strokeWidth="1.5" />
                <circle cx="155" cy="72" r="8" fill="#111" stroke="#555" strokeWidth="1.5" />
              </svg>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center z-20">
            <h2 className="text-4xl font-bold text-white tracking-[0.3em] mb-3">ENGAGING GEAR...</h2>
            <p className="text-red-500 text-xl tracking-wider font-light">{carName}</p>
            <div className="mt-10 flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-red-900/10 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transitionActive, setTransitionActive] = useState(false);
  const [transitionCar, setTransitionCar] = useState('');
  const [selectedColor, setSelectedColor] = useState(carColors[0]);
  const [modelFailed, setModelFailed] = useState(false);
  const [useRealModel, setUseRealModel] = useState(true);
  const [canvasError, setCanvasError] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    minPrice: 0,
    maxPrice: 10000,
    transmission: 'All',
    fuel: 'All',
    minSeats: 0,
    sortBy: 'popular',
  });
  
  const { user } = useAuth();
  
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const carRotate = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const handleModelError = () => {
    console.log('Model failed to load, switching to fallback');
    setModelFailed(true);
  };

  const handleCarClick = (carName: string) => {
    setTransitionCar(carName);
    setTransitionActive(true);
    setTimeout(() => {
      setTransitionActive(false);
      window.location.href = `/car/${carName.toLowerCase().replace(/\s+/g, '-')}`;
    }, 2000);
  };

  const filteredFleet = useMemo(() => {
    let result = [...fleetData];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(car => 
        car.name.toLowerCase().includes(searchLower) ||
        car.category.toLowerCase().includes(searchLower) ||
        car.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.category !== 'All') {
      result = result.filter(car => car.category.toUpperCase() === filters.category.toUpperCase());
    }
    
    result = result.filter(car => car.price >= filters.minPrice && car.price <= filters.maxPrice);
    
    if (filters.transmission !== 'All') {
      result = result.filter(car => {
        const trans = car.specs.transmission.toLowerCase();
        const filterTrans = filters.transmission.toLowerCase();
        if (filterTrans === 'auto' || filterTrans === 'automatic') {
          return trans.includes('auto');
        }
        return trans === filterTrans;
      });
    }
    
    if (filters.fuel !== 'All') {
      result = result.filter(car => car.specs.fuel.toLowerCase() === filters.fuel.toLowerCase());
    }
    
    if (filters.minSeats > 0) {
      result = result.filter(car => car.specs.seats >= filters.minSeats);
    }
    
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
      default:
        break;
    }
    
    return result;
  }, [filters]);

  return (
    <div ref={containerRef} className="bg-[#0a0a0a] min-h-screen text-white overflow-x-hidden">
      <TransitionOverlay isActive={transitionActive} carName={transitionCar} />

      {/* HERO SECTION */}
      <motion.section style={{ y: heroY, opacity: heroOpacity }} className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          {!canvasError ? (
            <Canvas 
              camera={{ position: [5.5, 2.5, 6.5], fov: 35 }}
              gl={{ powerPreference: 'high-performance', antialias: true }}
              onCreated={({ gl }) => {
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
              }}
              onError={() => setCanvasError(true)}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 15, 10]} intensity={1.5} color="#ffffff" />
              <spotLight position={[8, 12, 8]} angle={0.4} penumbra={0.8} intensity={2.0} color="#fff5e6" />
              <pointLight position={[-8, 4, -8]} intensity={1.2} color="#aaddff" />
              <pointLight position={[0, -2, 0]} intensity={0.6} color="#ff2d2d" />
              
              <RealCar3D 
                scrollProgress={carRotate.get()} 
                carColor={selectedColor} 
              />
              
              <AntiGravityParticles />
              <ReflectiveGround />
              <ContactShadows position={[0, -0.76, 0]} opacity={0.6} scale={15} blur={2} far={4} />
              <Environment preset="city" />
              
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.3}
                maxPolarAngle={Math.PI / 2.1}
                minPolarAngle={Math.PI / 3.5}
              />
            </Canvas>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
              <div className="text-center">
                <Car className="w-24 h-24 text-red-500/30 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">3D Experience Loading...</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-8 bottom-32 z-20 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 pointer-events-auto">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-red-500" /> Paint Color
          </div>
          <div className="flex gap-2">
            {carColors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                  selectedColor.name === c.name 
                    ? 'border-white scale-125' 
                    : 'border-white/10 hover:scale-110'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </div>
          <div className="text-[10px] text-gray-500 text-right">{selectedColor.name}</div>
        </div>

        <div className="relative z-10 text-center px-4 pointer-events-none w-full max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="pointer-events-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-red-500 text-sm tracking-[0.3em] uppercase">Coimbatore</span>
              <span className="w-8 h-px bg-red-500" />
              <span className="text-amber-500 text-sm tracking-[0.3em] uppercase">Kovai</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-4 tracking-tight">
              <span className="text-white">DRIVE</span>
              <span className="text-red-500"> KOVAI</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-2 tracking-widest uppercase">Rent Freedom</p>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">Premium self-drive cars in Coimbatore — From Gandhipuram to Ooty, we fuel your journey</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => {
                  const fleetSection = document.getElementById('fleet-section');
                  if (fleetSection) fleetSection.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full font-semibold tracking-wider transition-all flex items-center gap-2 group cursor-pointer"
              >
                EXPLORE FLEET
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  const stepsSection = document.getElementById('steps-section');
                  if (stepsSection) stepsSection.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="px-8 py-4 border border-white/20 hover:border-white/40 rounded-full font-semibold tracking-wider transition-all cursor-pointer"
              >
                HOW IT WORKS
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.2 }} 
            className="flex justify-center gap-8 md:gap-16 pointer-events-auto"
          >
            {[
              { icon: Car, value: '50+', label: 'Cars' }, 
              { icon: MapPin, value: '8', label: 'Pickup Points' }, 
              { icon: Star, value: '4.8', label: 'Rating' }, 
              { icon: Shield, value: '100%', label: 'Insured' }
            ].map((stat, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <div className="w-10 h-10 flex items-center justify-center mb-2 bg-red-500/10 rounded-lg">
                  <stat.icon className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </motion.div>
      </motion.section>

      <section className="py-8 border-y border-white/10 bg-black/50">
        <div className="flex overflow-hidden">
          <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }} className="flex gap-8 items-center whitespace-nowrap">
            {[...pickupPoints, ...pickupPoints].map((point, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-sm tracking-wider uppercase">{point}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fleet Section with Search & Filters */}
      <section id="fleet-section" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-red-500 text-sm tracking-[0.3em] uppercase">Our Fleet</span>
          <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-4">CHOOSE YOUR RIDE</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Real prices, real cars. No hidden charges. All vehicles sanitized and inspected before every trip.</p>
        </motion.div>

        <SearchFilter filters={filters} onFilterChange={setFilters} />

        <div className="mb-6 text-sm text-gray-400">
          Showing {filteredFleet.length} of {fleetData.length} vehicles
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFleet.map((car, index) => (
            <motion.div 
              key={car.id} 
              initial={{ opacity: 0, y: 50 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: index * 0.1 }} 
              whileHover={{ y: -10 }} 
              className="group relative bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all duration-500"
            >
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs tracking-wider uppercase border border-white/10">{car.category}</span>
              </div>
              <div className="relative h-56 overflow-hidden">
                <Image src={car.image} alt={car.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 animate-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold">{car.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm">{car.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {car.tags.map((tag, i) => <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-400">{tag}</span>)}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Gauge className="w-4 h-4 text-red-500" />{car.specs.mileage}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Fuel className="w-4 h-4 text-red-500" />{car.specs.fuel}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Users className="w-4 h-4 text-red-500" />{car.specs.seats} Seats</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400"><Zap className="w-4 h-4 text-red-500" />{car.specs.transmission}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">FROM</span>
                    <div className="text-2xl font-bold text-white">₹{car.price.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/day</span></div>
                  </div>
                  <button 
                    onClick={() => handleCarClick(car.name)} 
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center group/btn hover:bg-red-500 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5 text-black group-hover/btn:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredFleet.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No vehicles match your filters</p>
            <button 
              onClick={() => setFilters({
                search: '',
                category: 'All',
                minPrice: 0,
                maxPrice: 10000,
                transmission: 'All',
                fuel: 'All',
                minSeats: 0,
                sortBy: 'popular',
              })}
              className="mt-4 text-red-500 hover:text-red-400"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      <section id="explore-section" className="py-24 px-4 md:px-8 bg-gradient-to-b from-black to-red-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-amber-500 text-sm tracking-[0.3em] uppercase">Explore</span>
            <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-4">ROADS FROM KOVAI</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Coimbatore is the gateway to the Nilgiris and Kerala. Pick your destination.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coimbatoreRoutes.map((route, index) => (
              <motion.div 
                key={route.name} 
                initial={{ opacity: 0, scale: 0.9 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                viewport={{ once: true }} 
                transition={{ delay: index * 0.15 }} 
                whileHover={{ scale: 1.05 }} 
                className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer"
              >
                <Image src={route.image} alt={route.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 animate-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold mb-1">{route.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{route.desc}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-red-400">
                      <Navigation className="w-4 h-4" />
                      {route.distance}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-4 h-4" />
                      {route.time}
                    </span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="steps-section" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-red-500 text-sm tracking-[0.3em] uppercase">Simple Process</span>
          <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-4">BOOK IN 3 STEPS</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: Calendar, title: 'Choose Dates', desc: 'Select your pickup and drop-off dates. Flexible hourly or daily rentals available.' },
            { step: '02', icon: Car, title: 'Pick Your Car', desc: 'Browse our fleet and select the perfect vehicle for your Coimbatore journey.' },
            { step: '03', icon: MapPin, title: 'Drive Away', desc: 'Pickup from any of our 8 locations across Coimbatore. No paperwork hassle.' }
          ].map((item, index) => (
            <motion.div 
              key={item.step} 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: index * 0.2 }} 
              className="relative text-center p-8"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
                <item.icon className="w-10 h-10 text-white" />
              </div>
              <div className="text-6xl font-bold text-white/5 absolute top-4 left-1/2 -translate-x-1/2">{item.step}</div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
              {index < 2 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-red-500 to-transparent" />}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 border-y border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Shield, title: 'Fully Insured', desc: 'Comprehensive coverage' },
            { icon: Clock, title: '24/7 Support', desc: 'Always here to help' },
            { icon: CheckCircle2, title: 'Sanitized Cars', desc: 'Cleaned before every trip' },
            { icon: Star, title: 'Best Prices', desc: 'No hidden charges' }
          ].map((badge, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: i * 0.1 }} 
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <badge.icon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold">{badge.title}</h4>
                <p className="text-sm text-gray-400">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-black" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">READY TO <span className="text-red-500">HIT THE ROAD?</span></h2>
            <p className="text-xl text-gray-400 mb-8">Join 10,000+ happy drivers in Coimbatore. Your next adventure starts here.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  const fleetSection = document.getElementById('fleet-section');
                  if (fleetSection) fleetSection.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full font-bold tracking-wider transition-all flex items-center gap-2 justify-center group cursor-pointer"
              >
                <Flame className="w-5 h-5" />
                BOOK NOW
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border border-white/20 hover:border-white/40 rounded-full font-semibold tracking-wider transition-all flex items-center gap-2 justify-center">
                <Phone className="w-5 h-5" />
                +91 98765 43210
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">RIDE<span className="text-red-500">KOVAI</span></h3>
            <p className="text-gray-400 text-sm">Coimbatore's premium self-drive car rental. Built for the road ahead.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#fleet-section">Our Fleet</Link></li>
              <li><Link href="#steps-section">Popular Routes</Link></li>
              <li><Link href="#about">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Pickup Points</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {pickupPoints.slice(0, 4).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                +91 98765 43210
              </li>
              <li>hello@ridekovai.com</li>
              <li className="text-xs text-gray-500 mt-4">© 2026 RideKovai. All rights reserved.</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}