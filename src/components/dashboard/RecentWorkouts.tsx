"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, Clock, TrendingUp, ChevronRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { usePlanStore } from "@/stores/planStore";
import type { WorkoutSession, Exercise } from "@/types";

interface RecentWorkoutsProps {
  workouts: WorkoutSession[];
  exercises: Exercise[];
}

export function RecentWorkouts({ workouts, exercises }: RecentWorkoutsProps) {
  const plans = usePlanStore((s) => s.plans);

  // Take the 5 most recent completed workouts
  const completedWorkouts = workouts
    .filter((w) => w.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);

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
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Letzte Aktivitäten
        </h3>
        {completedWorkouts.length > 0 && (
          <Link
            href="/history"
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Alle anzeigen
          </Link>
        )}
      </div>

      {completedWorkouts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800/80"
        >
          <Dumbbell className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5 animate-pulse" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Noch keine Trainings absolviert
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[240px] mx-auto">
            Starte dein erstes Workout über die Karte oben oder den Workout-Tab!
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {completedWorkouts.map((workout) => {
            const plan = plans.find((p) => p.id === workout.planId);
            const planDay = plan?.days.find((d) => d.id === workout.planDayId);
            const dayName = planDay?.name || "Workout";

            // Stats calculations
            const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
            const totalVolume = workout.exercises.reduce(
              (acc, ex) =>
                acc +
                ex.sets
                  .filter((s) => s.completed)
                  .reduce((vol, s) => vol + s.weight * s.reps, 0),
              0
            );

            const duration = workout.completedAt
              ? Math.round(
                  (new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) /
                    60000
                )
              : 0;

            const formattedDate = format(parseISO(workout.completedAt!), "eeee, d. MMMM", {
              locale: de,
            });

            return (
              <motion.div
                key={workout.id}
                variants={item}
                className="glass-card p-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Link href="/history" className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                        {dayName}
                      </span>
                    </div>
                    
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                      {formattedDate}
                    </span>

                    <div className="flex items-center gap-4 mt-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{duration} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <Dumbbell className="w-3 h-3 text-zinc-400" />
                        <span>{totalSets} Sätze</span>
                      </div>
                      {totalVolume > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <TrendingUp className="w-3 h-3 text-zinc-400" />
                          <span>{totalVolume.toLocaleString()} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0 ml-2" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
