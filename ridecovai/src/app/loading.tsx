"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-transparent">
      <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
        <motion.div
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-gray-400 text-sm font-medium tracking-wider animate-pulse">
          Loading premium experience...
        </p>
      </div>
    </div>
  );
}
