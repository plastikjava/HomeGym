"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Dumbbell, ChevronRight } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { usePlanStore } from "@/stores/planStore";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const exercises = useExerciseStore((s) => s.exercises);
  const plans = usePlanStore((s) => s.plans);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Sort by date, newest first
  const sortedHistory = [...workoutHistory]
    .filter((w) => w.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  // Group by month
  const groupedByMonth: Record<string, typeof sortedHistory> = {};
  sortedHistory.forEach((session) => {
    const monthKey = format(parseISO(session.completedAt!), "MMMM yyyy", { locale: de });
    if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
    groupedByMonth[monthKey].push(session);
  });

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Trainingshistorie</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {sortedHistory.length} abgeschlossene Trainings
        </p>
      </motion.div>

      {sortedHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <Calendar className="w-12 h-12 text-[var(--muted-light)] mx-auto mb-3" />
          <p className="text-[var(--muted)] font-medium">Noch keine Trainings absolviert</p>
          <p className="text-xs text-[var(--muted-light)] mt-1">
            Starte dein erstes Workout und verfolge deinen Fortschritt!
          </p>
        </motion.div>
      ) : (
        Object.entries(groupedByMonth).map(([month, sessions]) => (
          <div key={month} className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
              {month}
            </h2>
            <div className="space-y-2">
              {sessions.map((session, index) => {
                const plan = plans.find((p) => p.id === session.planId);
                const planDay = plan?.days.find((d) => d.id === session.planDayId);
                const completedSets = session.exercises.reduce(
                  (t, e) => t + e.sets.filter((s) => s.completed).length,
                  0
                );
                const totalVolume = session.exercises.reduce(
                  (t, e) =>
                    t + e.sets.filter((s) => s.completed).reduce((st, s) => st + s.weight * s.reps, 0),
                  0
                );
                const duration = session.completedAt
                  ? Math.round(
                      (new Date(session.completedAt).getTime() -
                        new Date(session.startedAt).getTime()) /
                        60000
                    )
                  : 0;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {planDay?.name || "Training"}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-[var(--muted)]">
                            {format(parseISO(session.completedAt!), "EEEE, d. MMM", { locale: de })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-[var(--muted-light)] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {duration} Min
                          </span>
                          <span className="text-[10px] text-[var(--muted-light)]">
                            {completedSets} Sätze
                          </span>
                          {totalVolume > 0 && (
                            <span className="text-[10px] text-[var(--muted-light)]">
                              {Math.round(totalVolume)} kg
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-light)] flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
