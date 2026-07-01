"use client";

import { useRouter } from "next/navigation";
import { Play, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { usePlanStore } from "@/stores/planStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { WorkoutPlan } from "@/types";
import { getEstimatedWorkoutDuration } from "@/lib/api";

interface NextWorkoutCardProps {
  plan: WorkoutPlan;
  initialDayIndex: number;
}

export function NextWorkoutCard({ plan, initialDayIndex }: NextWorkoutCardProps) {
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);

  // Sync state if initialDayIndex changes from parent
  useEffect(() => {
    setCurrentDayIndex(initialDayIndex);
  }, [initialDayIndex]);

  const planDay = plan.days[currentDayIndex];
  if (!planDay) return null;

  const handleStartWorkout = () => {
    if (!activePlanId) return;

    const generateId = (): string => {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    };

    const snapToDumbbellWeight = (target: number): number => {
      const allowed = [0, 1.5, 3, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18];
      return allowed.reduce((prev, curr) => 
        Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
      );
    };

    const deloadActive = useSettingsStore.getState().settings.deloadActive;

    const workoutExercises = planDay.exercises.map((pe) => {
      const reps = parseInt(pe.targetReps) || 8;
      const baseWeight = pe.targetWeight ?? 0;
      const weight = deloadActive ? snapToDumbbellWeight(baseWeight * 0.6) : baseWeight;

      const sets: any[] = [];

      // Check if this exercise needs warmup
      const needsWarmup = [
        'floor-press', 'overhead-press', 'pull-up', 
        'glute-bridge', 'hip-thrust', 'single-arm-row'
      ].includes(pe.exerciseId);

      if (needsWarmup) {
        if (pe.exerciseId === 'pull-up') {
          sets.push({
            id: generateId() + '-w1',
            reps: 10,
            weight: 0,
            type: 'warmup',
            completed: false,
          });
          sets.push({
            id: generateId() + '-w2',
            reps: 5,
            weight: 0,
            type: 'warmup',
            completed: false,
          });
        } else {
          const w1Weight = snapToDumbbellWeight(weight * 0.5);
          const w2Weight = snapToDumbbellWeight(weight * 0.7);

          sets.push({
            id: generateId() + '-w1',
            reps: 10,
            weight: w1Weight,
            type: 'warmup',
            completed: false,
          });
          sets.push({
            id: generateId() + '-w2',
            reps: 5,
            weight: w2Weight,
            type: 'warmup',
            completed: false,
          });
        }
      }

      // Add regular target working sets (halved if deload active)
      const targetSetsCount = deloadActive ? Math.max(1, Math.round(pe.targetSets / 2)) : pe.targetSets;
      for (let i = 0; i < targetSetsCount; i++) {
        sets.push({
          id: generateId() + `-r${i}`,
          reps,
          weight,
          type: "working",
          completed: false,
        });
      }

      return {
        exerciseId: pe.exerciseId,
        sets,
        originalTargetSets: pe.targetSets,
        originalTargetReps: pe.targetReps,
        originalTargetWeight: pe.targetWeight,
      };
    });

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(100);
    }
    startWorkout(activePlanId, planDay.id, workoutExercises);
    router.push("/workout");
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left -> next day
      setCurrentDayIndex((prev) => (prev + 1) % plan.days.length);
    } else if (info.offset.x > swipeThreshold) {
      // Swiped right -> prev day
      setCurrentDayIndex((prev) => (prev - 1 + plan.days.length) % plan.days.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card overflow-hidden border border-blue-500/10 dark:border-blue-500/20 shadow-xl relative"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 gradient-hero opacity-30 pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentDayIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="p-6 relative z-10 select-none touch-pan-y"
        >
          <div className="flex items-center justify-between text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Nächstes anstehendes Training</span>
            </div>
            <span className="text-[10px] text-zinc-400 bg-zinc-800/30 px-2 py-0.5 rounded-full">
              Tag {currentDayIndex + 1} von {plan.days.length}
            </span>
          </div>

          {/* Swipe / Arrow Navigation Header */}
          <div className="flex items-center justify-between gap-1 mt-1">
            <button
              type="button"
              onClick={() => setCurrentDayIndex((prev) => (prev - 1 + plan.days.length) % plan.days.length)}
              className="p-1.5 rounded-lg bg-zinc-800/10 dark:bg-white/[0.03] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/25 dark:hover:bg-white/[0.06] active:scale-95 transition-all"
              aria-label="Vorheriger Tag"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex-1 text-center truncate px-1">
              {planDay.name}
            </h2>
            <button
              type="button"
              onClick={() => setCurrentDayIndex((prev) => (prev + 1) % plan.days.length)}
              className="p-1.5 rounded-lg bg-zinc-800/10 dark:bg-white/[0.03] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/25 dark:hover:bg-white/[0.06] active:scale-95 transition-all"
              aria-label="Nächster Tag"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-0.5">
            Plan: {plan.name}
          </p>

          {/* Focus Areas Badges */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3.5">
            {planDay.focusAreas.map((area) => (
              <span
                key={area}
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 font-medium"
              >
                {area}
              </span>
            ))}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 my-5 py-4 border-t border-b border-zinc-100 dark:border-zinc-800/50">
            <div className="text-center">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block uppercase font-medium">
                Übungen
              </span>
              <span className="text-lg font-bold text-zinc-800 dark:text-zinc-50">
                {planDay.exercises.length}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block uppercase font-medium">
                Dauer (ca.)
              </span>
              <span className="text-lg font-bold text-zinc-800 dark:text-zinc-50 font-mono">
                {getEstimatedWorkoutDuration(planDay.exercises)} Min
              </span>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartWorkout}
            className="w-full btn-accent flex items-center justify-center gap-2 text-sm py-3.5"
          >
            <Play className="w-4 h-4 fill-current" />
            Workout starten
          </motion.button>

          {/* Pagination Indicators (Dots) */}
          <div className="flex justify-center gap-1.5 mt-4">
            {plan.days.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentDayIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentDayIndex
                    ? "bg-blue-500 w-4"
                    : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                }`}
                aria-label={`Gehe zu Tag ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
