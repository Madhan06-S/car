"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTransition } from "@/context/TransitionContext";
import { useEffect, useState } from "react";

export default function CarTransitionLoader() {
  const { isTransitioning } = useTransition();

  useEffect(() => {
    if (isTransitioning) {
      const audio = new Audio("/engine.mp3");
      audio.volume = 0.45;
      audio.play().catch(() => {});
    }
  }, [isTransitioning]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 bg-[#0D0D0D] overflow-hidden z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Subtle Ambient Red Glow Pulsing at the Center */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF4D4D]/5 blur-[120px] rounded-full pointer-events-none" />

          {/* PARALLAX BACKGROUND: Speed Lines (Moving Right to Left) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(18)].map((_, i) => {
              // Higher speed lines towards the top, faster movement
              const duration = 0.3 + Math.random() * 0.3;
              const delay = Math.random() * 0.2;
              const top = 5 + Math.random() * 55; // Keep above road
              const width = 120 + Math.random() * 250;
              const isRed = Math.random() > 0.55;
              return (
                <motion.div
                  key={i}
                  className={`absolute h-[1.5px] rounded-full opacity-45 ${
                    isRed ? "bg-[#FF4D4D]" : "bg-white"
                  }`}
                  style={{
                    top: `${top}%`,
                    width: `${width}px`,
                    right: "-300px",
                  }}
                  animate={{
                    x: ["0vw", "-160vw"],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear",
                  }}
                />
              );
            })}
          </div>

          {/* ROAD LANE (Lower Third of the screen) */}
          <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-b from-[#141414] to-[#0A0A0A] border-t border-white/5 overflow-hidden">
            {/* Asphalt Texture Overlay (SVG Noise Pattern) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }} />

            {/* Faint Red Glow Reflection on Road Surface */}
            <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-gradient-to-b from-[#FF4D4D]/10 to-transparent blur-xl pointer-events-none" />

            {/* Dynamic Road Dash Lane Markings */}
            <div className="absolute top-1/2 left-0 right-0 h-[4px] overflow-hidden opacity-25">
              <motion.div 
                className="flex gap-16 w-[300%]"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
              >
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="w-16 h-full bg-white rounded-sm shrink-0" />
                ))}
              </motion.div>
            </div>

            {/* Tire Skid Marks (Left behind as the car launches) */}
            <motion.div 
              className="absolute left-[10%] bottom-[35%] w-[400px] h-[3px] bg-black/60 rounded-full blur-[0.5px]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.8, 0.8, 0] }}
              transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
              style={{ transformOrigin: "left center" }}
            />
            <motion.div 
              className="absolute left-[13%] bottom-[15%] w-[400px] h-[3px] bg-black/60 rounded-full blur-[0.5px]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.8, 0.8, 0] }}
              transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
              style={{ transformOrigin: "left center" }}
            />
          </div>

          {/* MAIN CONTAINER FOR CAR AND TRAILING EFFECTS */}
          {/* Apply launch screen shake here */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{
              y: [0, -4, 3, -2, 1, 0, 0],
              x: [0, 2, -2, 1, -1, 0, 0]
            }}
            transition={{
              duration: 0.5,
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
              ease: "easeInOut"
            }}
          >
            {/* Burnout Smoke Puffs (Standstill launch, starts at rear wheels) */}
            <div className="absolute left-[12%] bottom-[12%] z-20 flex gap-1">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 bg-neutral-600/30 rounded-full blur-md"
                  initial={{ scale: 0.2, opacity: 0.9, x: 0, y: 0 }}
                  animate={{
                    scale: [0.2, 3.5, 0],
                    opacity: [0.9, 0.3, 0],
                    x: [-15, -140 - Math.random() * 100],
                    y: [0, -35 - Math.random() * 30],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Exhaust Fire / Spark Particles */}
            <div className="absolute left-[10%] bottom-[14%] z-20">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-[#FF4D4D] rounded-full"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: [-5, -60 - Math.random() * 30],
                    y: [0, -10 + Math.random() * 20],
                    opacity: [1, 0],
                    scale: [1, 0.2]
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.06,
                    ease: "linear"
                  }}
                />
              ))}
            </div>

            {/* 3D-STYLED COUPE SPORTS CAR PROFILE */}
            <motion.div
              className="absolute z-30 w-[420px] h-[150px] filter drop-shadow-[0_12px_15px_rgba(0,0,0,0.7)]"
              style={{
                bottom: "7%",
              }}
              animate={{
                x: ["-90vw", "-12vw", "-10vw", "130vw"],
                y: [0, -2, 2, 0],
                skewX: [0, -3, -6, -12],
                scaleY: [1, 0.97, 0.99, 0.92],
                filter: [
                  "blur(0px) drop-shadow(0 12px 15px rgba(0,0,0,0.7))",
                  "blur(0px) drop-shadow(0 12px 15px rgba(0,0,0,0.7))",
                  "blur(1px) drop-shadow(0 12px 15px rgba(0,0,0,0.7))",
                  "blur(8px) drop-shadow(0 12px 15px rgba(0,0,0,0.7))"
                ]
              }}
              transition={{
                times: [0, 0.25, 0.38, 1],
                duration: 1.35,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <svg
                viewBox="0 0 500 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  {/* Body Metallic Gradient */}
                  <linearGradient id="bodyGradient" x1="0" y1="80" x2="500" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#08080A" />
                    <stop offset="25%" stopColor="#18181C" />
                    <stop offset="55%" stopColor="#2A2A32" />
                    <stop offset="85%" stopColor="#3E3E48" />
                    <stop offset="100%" stopColor="#1E1E22" />
                  </linearGradient>

                  {/* Window Reflection Gradient */}
                  <linearGradient id="windowGradient" x1="180" y1="35" x2="310" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#050505" />
                    <stop offset="40%" stopColor="#1A1A22" />
                    <stop offset="70%" stopColor="#3A3A4A" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Metallic Wheel Rims */}
                  <radialGradient id="wheelRim" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="45%" stopColor="#6C6C75" />
                    <stop offset="80%" stopColor="#222226" />
                    <stop offset="100%" stopColor="#44444A" />
                  </radialGradient>
                </defs>

                {/* Ground Reflection Glow beneath wheels */}
                <ellipse cx="140" cy="148" rx="55" ry="8" fill="#FF4D4D" opacity="0.3" filter="blur(4px)" />
                <ellipse cx="370" cy="148" rx="55" ry="8" fill="#FF4D4D" opacity="0.3" filter="blur(4px)" />

                {/* Car 3D Shadow Cast */}
                <path d="M40 148 L460 148 C480 148, 490 142, 470 138 L70 138 C50 138, 30 142, 40 148 Z" fill="black" opacity="0.8" filter="blur(3px)" />

                {/* CAR BODY - Lower Sill / Side Skirt */}
                <path d="M185 138 L325 138 L315 143 L195 143 Z" fill="#FF4D4D" opacity="0.9" />

                {/* MAIN CAR BODY (Aerodynamic curves with metallic gradient) */}
                <path
                  d="M40 120 C35 110, 42 85, 80 82 C95 80, 115 84, 130 84 C155 58, 205 32, 275 32 C350 32, 385 52, 410 76 C435 78, 465 88, 475 102 C485 115, 470 125, 455 127 C440 127, 435 125, 425 122 C415 105, 385 98, 370 122 C330 122, 230 122, 195 122 C185 98, 155 105, 140 122 L82 122 C65 122, 45 125, 40 120 Z"
                  fill="url(#bodyGradient)"
                  stroke="#33333C"
                  strokeWidth="1.5"
                />

                {/* 3D Fender Flares & Highlights */}
                <path d="M68 96 C85 86, 120 90, 140 115" stroke="#FF4D4D" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M345 92 C365 80, 405 84, 428 115" stroke="#FF4D4D" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

                {/* Sleek Cabin Roofline & Window Glass (3D Reflections) */}
                <path
                  d="M165 78 C195 52, 260 40, 315 40 C355 40, 382 58, 395 76 C370 78, 290 78, 165 78 Z"
                  fill="url(#windowGradient)"
                  stroke="#111"
                  strokeWidth="1.5"
                />
                
                {/* Windshield Pillar A & B highlights */}
                <path d="M168 76 L205 48" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
                <path d="M312 40 L308 76" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.2" />

                {/* Aerodynamic Body Contour lines (adding depth/panels) */}
                <path d="M142 120 C180 118, 240 118, 368 120" stroke="#121215" strokeWidth="2" />
                <path d="M148 110 C210 102, 280 102, 362 110" stroke="#444" strokeWidth="1" opacity="0.7" />
                <path d="M210 78 L200 120" stroke="#121215" strokeWidth="1.5" />
                <path d="M305 78 L310 120" stroke="#121215" strokeWidth="1.5" />

                {/* Rear Spoiler (Sleek aerodynamic curves) */}
                <path d="M54 82 C42 80, 35 83, 32 88 L34 94 C42 90, 52 86, 62 86 Z" fill="#0A0A0C" stroke="#222" strokeWidth="1" />

                {/* Glowing LED Taillight Line (Intense Red Glow) */}
                <path
                  d="M40 94 L42 108"
                  stroke="#FF4D4D"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_6px_#FF4D4D]"
                />
                <path
                  d="M38 100 C34 98, 32 104, 35 106"
                  stroke="#FF4D4D"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Front Xenon Headlight Lens (Sharp White/Ice Blue Flare) */}
                <path
                  d="M465 96 C470 98, 475 104, 470 108"
                  stroke="#FFFFFF"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_6px_#FFFFFF]"
                />
                
                {/* WHEEL RIMS (Spinning 3D Alloys with Motion Blur) */}
                {/* Rear Wheel Setup */}
                <circle cx="140" cy="122" r="30" fill="#080808" stroke="#1C1C1F" strokeWidth="3" />
                <circle cx="140" cy="122" r="23" fill="url(#wheelRim)" />
                <circle cx="140" cy="122" r="15" fill="none" stroke="#FF4D4D" strokeWidth="2.5" strokeDasharray="12 6" className="animate-spin" style={{ transformOrigin: "140px 122px", animationDuration: "0.15s" }} />
                <circle cx="140" cy="122" r="8" fill="#1C1C1F" />
                
                {/* Front Wheel Setup */}
                <circle cx="370" cy="122" r="30" fill="#080808" stroke="#1C1C1F" strokeWidth="3" />
                <circle cx="370" cy="122" r="23" fill="url(#wheelRim)" />
                <circle cx="370" cy="122" r="15" fill="none" stroke="#FF4D4D" strokeWidth="2.5" strokeDasharray="12 6" className="animate-spin" style={{ transformOrigin: "370px 122px", animationDuration: "0.15s" }} />
                <circle cx="370" cy="122" r="8" fill="#1C1C1F" />
              </svg>
            </motion.div>

            {/* Exhaust Emission Trail / Wind Streaks behind the car */}
            <motion.div
              className="absolute left-[3%] bottom-[12.5%] w-[480px] h-[55px] bg-gradient-to-r from-transparent via-[#FF4D4D]/25 to-white/10 blur-xl pointer-events-none"
              style={{
                transformOrigin: "left center",
              }}
              animate={{
                x: ["-90vw", "-12vw", "-10vw", "130vw"],
                scaleX: [1, 1.8, 1],
              }}
              transition={{
                times: [0, 0.25, 0.38, 1],
                duration: 1.35,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          </motion.div>

          {/* TEXT OVERLAY (ENGAGING GEAR...) */}
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-40">
            <motion.h2
              className="text-white text-base tracking-[0.4em] font-sans font-black filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              animate={{
                textShadow: [
                  "0 0 4px rgba(255, 77, 77, 0.1)",
                  "0 0 16px rgba(255, 77, 77, 0.85)",
                  "0 0 4px rgba(255, 77, 77, 0.1)"
                ]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ENGAGING GEAR...
            </motion.h2>
          </div>

          {/* END TRANSITION COVER (Fades to absolute pitch black at the end 1.3s - 1.5s) */}
          <motion.div 
            className="absolute inset-0 bg-black pointer-events-none z-[99999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{ times: [0, 0.85, 1], duration: 1.45 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
