"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useSettingsStore } from "@/stores/settingsStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { usePlanStore } from "@/stores/planStore";

import { useWorkoutStore } from "@/stores/workoutStore";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useSettingsStore((s) => s.settings.theme);
  const initExercises = useExerciseStore((s) => s.initializeExercises);
  const initPlans = usePlanStore((s) => s.initializePlans);

  // Initialize stores and apply theme on mount
  useEffect(() => {
    // Rehydrate stores from localStorage first to prevent data resets
    useSettingsStore.persist.rehydrate();
    useExerciseStore.persist.rehydrate();
    usePlanStore.persist.rehydrate();
    useWorkoutStore.persist.rehydrate();

    initExercises();
    initPlans();

    // Register Service Worker for PWA installation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
        .catch((err) => console.warn('PWA ServiceWorker registration failed:', err));
    }

    setMounted(true);
  }, [initExercises, initPlans]);

  // Apply dark/light class to html element
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  // Show a skeleton / nothing during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <Header />
      <main className="flex-1 mb-bottom-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
