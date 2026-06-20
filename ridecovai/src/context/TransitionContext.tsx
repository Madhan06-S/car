"use client";

import React, { createContext, useContext, useState, useTransition as useReactTransition } from "react";
import { useRouter } from "next/navigation";

interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (targetUrl: string) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [, startTransition] = useReactTransition();

  const triggerTransition = (targetUrl: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Prefetch the target route immediately for faster loading
    router.prefetch(targetUrl);

    // Wait for the animation duration & black screen fade (1.45 seconds) before executing push
    setTimeout(() => {
      startTransition(() => {
        router.push(targetUrl);
        // Let it fade out slightly after navigation starts
        setTimeout(() => {
          setIsTransitioning(false);
        }, 450);
      });
    }, 1450);
  };

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}
