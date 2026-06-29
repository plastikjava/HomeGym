"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, ClipboardList, Search, History } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Workout", href: "/workout", icon: Dumbbell },
    { label: "Pläne", href: "/plans", icon: ClipboardList },
    { label: "Übungen", href: "/exercises", icon: Search },
    { label: "Historie", href: "/history", icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe h-20 flex items-center justify-around px-2 shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center justify-center py-2 cursor-pointer relative"
            >
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive
                    ? "text-blue-500 dark:text-blue-400 scale-110 stroke-[2.5px]"
                    : "text-zinc-500 dark:text-zinc-400 stroke-[1.8px]"
                }`}
              />
              <span
                className={`text-[10px] mt-1 transition-all duration-200 ${
                  isActive
                    ? "text-blue-500 dark:text-blue-400 font-semibold"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-3 w-8 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
