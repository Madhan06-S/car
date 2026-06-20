"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import MagicRings from "./MagicRings";

export default function FinalBossLoader({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = new Audio("/engine.mp3");
    audio.volume = 0.5;

    setTimeout(() => {
      audio.play().catch(() => {});
    }, 400);

    setTimeout(() => {
      setLoading(false);
      if (onComplete) onComplete();
    }, 5500);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center overflow-hidden z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >

          {/* MAGIC RINGS FROM BEFORE (Behind Everything) */}
          <div className="absolute inset-0 z-0">
            <MagicRings 
               color="#ff0000" 
               colorTwo="#3b82f6"
               speed={1.5}
               scaleRate={0.2}
               baseRadius={0.4}
               clickBurst={true}
               followMouse={true}
             />
          </div>

          {/* 🌧️ Rain Overlay */}
          <motion.div
            className="absolute inset-0 opacity-10 pointer-events-none z-10"
            animate={{ y: ["-10%", "10%"] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              background:
                "repeating-linear-gradient(to bottom, white 0px, white 2px, transparent 4px)"
            }}
          />

          {/* 🌫️ Fog */}
          <motion.div
            className="absolute w-full h-full bg-gradient-to-t from-black/85 via-black/40 to-black/85 pointer-events-none z-10"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />

          {/* 💨 SMOKE EFFECT */}
          <motion.div
            className="absolute bottom-0 w-full h-[500px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none z-10"
            animate={{ 
              x: [-100, 100, -50, 50, -100],
              y: [50, 0, 30, -20, 50],
              opacity: [0.3, 0.6, 0.3] 
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />

          {/* 🔆 Spotlight (TOP LIGHT) */}
          <div className="absolute top-20 w-[800px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none z-10" />

          {/* 🔵 Ambient Blue Glow */}
          <div className="absolute w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-10" />

          {/* 🚗 HD Car Video from Targo-Logistics (Replacing static image and custom headlights) */}
          <motion.div
            className="relative w-[750px] max-w-[90%] aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,77,77,0.25)] z-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
          >
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260227_042027_c4b2f2ea-1c7c-4d6e-9e3d-81a78063703f.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Dark gradient overlay inside video frame */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          </motion.div>

          {/* 🏎️ REV PUSH EFFECT */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.2 }}
          />

          {/* 🔥 ROAD REFLECTION */}
          <motion.div
            className="absolute bottom-10 w-[500px] h-16 bg-[#FF4D4D]/40 blur-3xl rounded-full pointer-events-none z-10"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />

          {/* 📳 CAMERA SHAKE */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            animate={{ x: [0, -2, 2, -1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          />

          {/* 🏷️ BRAND NAME */}
          <motion.h1
            className="absolute bottom-28 text-white text-2xl tracking-[0.5em] font-bold pointer-events-none z-30 drop-shadow-2xl"
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: [0, 1, 1], letterSpacing: ["0.2em", "0.5em"] }}
            transition={{ duration: 2 }}
          >
            RIDECOVAI
          </motion.h1>

          {/* ✨ TAGLINE */}
          <motion.p
            className="absolute bottom-16 text-white text-xs tracking-widest pointer-events-none z-30"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            IGNITING YOUR RIDE...
          </motion.p>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
