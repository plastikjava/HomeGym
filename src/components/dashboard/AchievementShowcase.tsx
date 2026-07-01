"use client";

import { useMemo, useEffect } from "react";
import { useAchievementStore } from "@/stores/achievementStore";
import { Lock, Award } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function AchievementShowcase() {
  const achievements = useAchievementStore((s) => s.achievements);
  const newlyUnlocked = useAchievementStore((s) => s.newlyUnlocked);
  const initializeAchievements = useAchievementStore((s) => s.initializeAchievements);

  useEffect(() => {
    initializeAchievements();
  }, [initializeAchievements]);

  const stats = useMemo(() => {
    const total = achievements.length || 13;
    const unlocked = achievements.filter((a) => a.unlockedAt).length;
    const percent = Math.round((unlocked / total) * 100);
    return { total, unlocked, percent };
  }, [achievements]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 15 } },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Erfolge ({stats.unlocked}/{stats.total})
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
          {stats.percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800/40 h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
        />
      </div>

      {/* Grid */}
      {achievements.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 text-xs">Initialisiere Erfolge...</div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-2.5 mt-1"
        >
          {achievements.map((ach) => {
            const isUnlocked = !!ach.unlockedAt;
            const isNew = newlyUnlocked.includes(ach.id);
            const dateStr = ach.unlockedAt
              ? format(parseISO(ach.unlockedAt), "dd.MM.yy")
              : "";

            return (
              <motion.div
                key={ach.id}
                variants={cardVariants}
                className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                  isUnlocked
                    ? isNew
                      ? "bg-amber-500/5 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                      : "bg-white/[0.04] border-purple-500/20 hover:border-purple-500/40 hover:bg-white/[0.06] shadow-[0_4px_12px_rgba(139,92,246,0.02)]"
                    : "bg-black/[0.08] border-zinc-800/30 opacity-40 select-none"
                }`}
                title={`${ach.name}: ${ach.description} (${ach.condition})`}
              >
                {/* Lock overlay for locked achievements */}
                {!isUnlocked && (
                  <div className="absolute top-1.5 right-1.5 text-zinc-600">
                    <Lock className="w-3 h-3" />
                  </div>
                )}

                {/* Emoji Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-1.5 transition-transform ${
                    isUnlocked ? "bg-purple-500/10 scale-100 rotate-0" : "bg-zinc-800/50 scale-90"
                  }`}
                >
                  <span className={isUnlocked ? "filter-none" : "grayscale"}>{ach.icon}</span>
                </div>

                {/* Achievement Name */}
                <span className="text-[10px] font-bold text-zinc-200 leading-snug truncate w-full px-1">
                  {ach.name}
                </span>

                {/* Condition / Description subtext */}
                <span className="text-[8px] text-zinc-500 mt-0.5 line-clamp-1 w-full px-0.5">
                  {isUnlocked ? `Freigeschaltet ${dateStr}` : ach.condition}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.section>
  );
}
