"use client";

import { Target, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsOverviewProps {
  workoutsThisWeek: number;
  totalWorkouts: number;
  progressionsCount: number;
  totalVolume: number;
}

export function StatsOverview({
  workoutsThisWeek,
  totalWorkouts,
  progressionsCount,
  totalVolume,
}: StatsOverviewProps) {
  
  const stats = [
    {
      label: "Diese Woche",
      value: workoutsThisWeek,
      sub: "Trainings",
      icon: Target,
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Gesamt",
      value: totalWorkouts,
      sub: "Workouts",
      icon: Trophy,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Progression",
      value: `${progressionsCount} ✨`,
      sub: "Aufstiege gesamt",
      icon: Sparkles,
      colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Volumen",
      value: `${totalVolume.toLocaleString()}`,
      sub: "kg gesamt",
      icon: TrendingUp,
      colorClass: "text-green-500 bg-green-500/10 border-green-500/20",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            variants={item}
            className="glass-card p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold text-zinc-800 dark:text-zinc-100 font-mono">
                {stat.value}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                {stat.sub}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
