"use client";

import { useState, useMemo } from "react";
import { Target, Trophy, Sparkles, TrendingUp, X, Calendar, Activity, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkoutStore } from "@/stores/workoutStore";
import { usePlanStore } from "@/stores/planStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

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
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const plans = usePlanStore((s) => s.plans);
  const exercises = useExerciseStore((s) => s.exercises);
  const activePlanId = usePlanStore((s) => s.activePlanId);

  const stats = [
    {
      label: "Diese Woche",
      value: workoutsThisWeek,
      sub: "Trainings",
      icon: Target,
      colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Gesamt",
      value: totalWorkouts,
      sub: "Workouts",
      icon: Trophy,
      colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Progression",
      value: `${progressionsCount} ✨`,
      sub: "Aufstiege gesamt",
      icon: "💪",
      colorClass: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Volumen",
      value: `${totalVolume.toLocaleString()}`,
      sub: "kg gesamt",
      icon: TrendingUp,
      colorClass: "text-green-400 bg-green-500/10 border-green-500/20",
    },
  ];

  // 1. Data helper for "Diese Woche"
  const thisWeeksWorkoutsData = useMemo(() => {
    const now = new Date();
    // Monday of current week
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - diffToMonday);

    return workoutHistory
      .filter((w) => w.completedAt && new Date(w.completedAt) >= monday)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [workoutHistory]);

  // 2. Data helper for "Gesamt"
  const totalBreakdownData = useMemo(() => {
    const counts: Record<string, { name: string; count: number; lastDate?: string }> = {};
    workoutHistory.forEach((w) => {
      if (!w.completedAt) return;
      const plan = plans.find((p) => p.id === w.planId);
      const day = plan?.days.find((d) => d.id === w.planDayId);
      const name = day?.name || "Unbekanntes Workout";
      if (!counts[w.planDayId]) {
        counts[w.planDayId] = { name, count: 0 };
      }
      counts[w.planDayId].count += 1;
      if (!counts[w.planDayId].lastDate || new Date(w.completedAt) > new Date(counts[w.planDayId].lastDate!)) {
        counts[w.planDayId].lastDate = w.completedAt;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [workoutHistory, plans]);

  // 3. Data helper for "Progression"
  const activePlan = useMemo(() => plans.find((p) => p.id === activePlanId), [plans, activePlanId]);
  const progressionData = useMemo(() => {
    if (!activePlan) return [];
    const list: Array<{ nameEn: string; nameDe?: string; targetSets: number; targetReps: string; targetWeight?: number; category: string }> = [];
    activePlan.days.forEach((day) => {
      day.exercises.forEach((pe) => {
        const ex = exercises.find((e) => e.id === pe.exerciseId);
        list.push({
          nameEn: ex?.nameEn || pe.exerciseId,
          nameDe: ex?.nameDe,
          targetSets: pe.targetSets,
          targetReps: pe.targetReps,
          targetWeight: pe.targetWeight,
          category: ex?.category || "other"
        });
      });
    });
    return list;
  }, [activePlan, exercises]);

  // 4. Data helper for "Volumen"
  const volumeData = useMemo(() => {
    const vols: Record<string, { nameEn: string; nameDe?: string; volume: number; setsCount: number }> = {};
    workoutHistory.forEach((w) => {
      w.exercises.forEach((we) => {
        const ex = exercises.find((e) => e.id === we.exerciseId);
        const nameEn = ex?.nameEn || we.exerciseId;
        const nameDe = ex?.nameDe;
        const sessionVolume = we.sets
          .filter((s) => s.completed)
          .reduce((sum, s) => sum + s.weight * s.reps, 0);

        if (sessionVolume > 0) {
          if (!vols[we.exerciseId]) {
            vols[we.exerciseId] = { nameEn, nameDe, volume: 0, setsCount: 0 };
          }
          vols[we.exerciseId].volume += sessionVolume;
          vols[we.exerciseId].setsCount += we.sets.filter((s) => s.completed).length;
        }
      });
    });
    return Object.values(vols).sort((a, b) => b.volume - a.volume);
  }, [workoutHistory, exercises]);

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
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {stats.map((stat, idx) => {
          return (
            <motion.div
              key={stat.label}
              variants={item}
              onClick={() => setSelectedStat(stat.label)}
              className="glass-card p-4 flex flex-col justify-between cursor-pointer hover:bg-white/[0.06] hover:ring-white/[0.12] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.colorClass}`}>
                  {typeof stat.icon === "string" ? (
                    <span className="text-sm select-none">{stat.icon}</span>
                  ) : (
                    <stat.icon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-zinc-800 dark:text-white font-mono">
                  {stat.value}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block">
                  {stat.sub}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Details Modal overlay */}
      <AnimatePresence>
        {selectedStat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedStat(null)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative w-full max-w-sm max-h-[80vh] overflow-hidden rounded-3xl flex flex-col bg-zinc-900 border border-zinc-800 text-zinc-100 z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {selectedStat === "Diese Woche" && "🎯"}
                    {selectedStat === "Gesamt" && "🏆"}
                    {selectedStat === "Progression" && "💪"}
                    {selectedStat === "Volumen" && "⚡"}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedStat} Details</h3>
                </div>
                <button
                  onClick={() => setSelectedStat(null)}
                  className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list content */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                {/* 1. DIESE WOCHE VIEW */}
                {selectedStat === "Diese Woche" && (
                  <>
                    <p className="text-xs text-zinc-400">Absolvierte Trainings in der aktuellen Kalenderwoche:</p>
                    {thisWeeksWorkoutsData.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-sm">
                        Keine Workouts in dieser Woche aufgezeichnet. Let's go! 🏋️
                      </div>
                    ) : (
                      thisWeeksWorkoutsData.map((w) => {
                        const start = new Date(w.startedAt).getTime();
                        const end = w.completedAt ? new Date(w.completedAt).getTime() : Date.now();
                        const duration = Math.round((end - start) / 60000);
                        const vol = w.exercises.reduce((s, ex) => s + ex.sets.filter((st) => st.completed).reduce((s2, st) => s2 + st.weight * st.reps, 0), 0);
                        const formattedDate = format(parseISO(w.completedAt || w.startedAt), "eeee, dd. MMM", { locale: de });
                        const plan = plans.find((p) => p.id === w.planId);
                        const day = plan?.days.find((d) => d.id === w.planDayId);
                        
                        return (
                          <div key={w.id} className="p-3.5 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-2xl flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{formattedDate}</span>
                            <span className="text-sm font-bold text-zinc-200">{day?.name || "Workout"}</span>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                              <span>⏱️ {duration} Min</span>
                              <span>⚖️ {vol.toLocaleString()} kg</span>
                              {w.avgHeartRate && <span>💓 Ø {w.avgHeartRate} bpm</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* 2. GESAMT VIEW */}
                {selectedStat === "Gesamt" && (
                  <>
                    <p className="text-xs text-zinc-400">Häufigkeit deiner absolvierten Trainingstage:</p>
                    {totalBreakdownData.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-sm">
                        Noch keine abgeschlossenen Trainingseinheiten erfasst.
                      </div>
                    ) : (
                      totalBreakdownData.map((d) => {
                        const formattedLastDate = d.lastDate
                          ? format(parseISO(d.lastDate), "dd.MM.yy")
                          : "nie";
                        return (
                          <div key={d.name} className="p-3.5 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-zinc-200">{d.name}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">Zuletzt am {formattedLastDate}</p>
                            </div>
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-sm font-mono shrink-0 ml-4">
                              {d.count}×
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* 3. PROGRESSION VIEW */}
                {selectedStat === "Progression" && (
                  <>
                    <p className="text-xs text-zinc-400">Aktuelles Stufenziel deiner Übungen im aktiven Plan:</p>
                    {progressionData.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-sm">
                        Kein aktiver Trainingsplan geladen.
                      </div>
                    ) : (
                      progressionData.map((ex) => (
                        <div key={ex.nameEn} className="p-3.5 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-2xl flex items-center justify-between">
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-bold text-zinc-200 truncate">{ex.nameEn}</p>
                            {ex.nameDe && (
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">({ex.nameDe})</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-lg font-mono">
                              {ex.targetSets}×{ex.targetReps}
                            </span>
                            <span className="block text-[10px] text-zinc-400 font-mono mt-1">
                              {ex.targetWeight !== undefined ? `${ex.targetWeight} kg` : "--"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* 4. VOLUMEN VIEW */}
                {selectedStat === "Volumen" && (
                  <>
                    <p className="text-xs text-zinc-400">Bewege Gesamtlast (Gewicht × Wiederholungen) über alle Einheiten:</p>
                    {volumeData.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-sm">
                        Keine Volumen-Daten vorhanden. Starte dein erstes Workout!
                      </div>
                    ) : (
                      volumeData.map((ex) => (
                        <div key={ex.nameEn} className="p-3.5 bg-white/[0.04] ring-1 ring-white/[0.06] rounded-2xl flex items-center justify-between">
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-bold text-zinc-200 truncate">{ex.nameEn}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{ex.setsCount} gültige Arbeitssätze</p>
                          </div>
                          <div className="shrink-0 text-right ml-4">
                            <p className="text-sm font-bold text-green-400 font-mono">
                              {ex.volume.toLocaleString()} kg
                            </p>
                            <p className="text-[9px] text-zinc-500 tracking-wide uppercase mt-0.5">Gesamtvolumen</p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
