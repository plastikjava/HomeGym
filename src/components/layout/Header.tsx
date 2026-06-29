"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { Sun, Moon, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Header() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger rehydration on mount
    useSettingsStore.persist.rehydrate();
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-blue-500" />
          <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
            HomeGym
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-6 h-6 text-blue-500 animate-pulse-glow rounded-lg" />
        <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
          HomeGym
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        aria-label="Theme umschalten"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.button>
    </header>
  );
}
