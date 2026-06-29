"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { usePlanStore } from "@/stores/planStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { useSettingsStore } from "@/stores/settingsStore";
import ExerciseCard from "@/components/workout/ExerciseCard";
import RestTimer from "@/components/workout/RestTimer";
import WorkoutSummary from "@/components/workout/WorkoutSummary";
import type { WorkoutExercise, WorkoutSet, SetType, PlanDay } from "@/types";
import { getEstimatedWorkoutDuration, getNextProgressionStep } from "@/lib/api";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function WorkoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timerSetType, setTimerSetType] = useState<SetType>("warmup");
  const [showSummary, setShowSummary] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const plans = usePlanStore((s) => s.plans);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const updatePlanExercise = usePlanStore((s) => s.updatePlanExercise);
  const [progressionsApplied, setProgressionsApplied] = useState<{
    exerciseNameDe: string;
    exerciseNameEn: string;
    oldTarget: string;
    newTarget: string;
    oldWeight: number;
    newWeight: number;
    weightIncreased: boolean;
  }[]>([]);
  const exercises = useExerciseStore((s) => s.exercises);
  const settings = useSettingsStore((s) => s.settings);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);
  const cancelWorkout = useWorkoutStore((s) => s.cancelWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const completeSet = useWorkoutStore((s) => s.completeSet);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Elapsed time counter when workout is active
  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      const start = new Date(activeWorkout.startedAt).getTime();
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const activePlan = plans.find((p) => p.id === activePlanId);
  const currentPlanDay =
    selectedDay ||
    activePlan?.days.find((d) => d.id === activeWorkout?.planDayId);

  const handleStartWorkout = useCallback(
    (day: PlanDay) => {
      if (!activePlan) return;

      const workoutExercises: WorkoutExercise[] = day.exercises.map((pe) => {
        const reps = parseInt(pe.targetReps) || 8;
        const weight = pe.targetWeight ?? 0;

        const sets: WorkoutSet[] = [];
        for (let i = 0; i < pe.targetSets; i++) {
          sets.push({
            id: generateId(),
            reps,
            weight,
            type: "working",
            completed: false,
          });
        }

        return {
          exerciseId: pe.exerciseId,
          sets,
        };
      });

      startWorkout(activePlan.id, day.id, workoutExercises);
      setSelectedDay(day);
    },
    [activePlan, startWorkout]
  );

  const handleAddSet = useCallback(
    (exerciseId: string, type: SetType) => {
      const newSet: WorkoutSet = {
        id: generateId(),
        reps: type === "warmup" ? 10 : 10,
        weight: 0,
        type,
        completed: false,
      };
      addSet(exerciseId, newSet);
    },
    [addSet]
  );

  const handleCompleteSet = useCallback(
    (exerciseId: string, setId: string) => {
      const exercise = activeWorkout?.exercises.find(
        (e) => e.exerciseId === exerciseId
      );
      const set = exercise?.sets.find((s) => s.id === setId);
      const isCompleting = set ? !set.completed : false;

      completeSet(exerciseId, setId);

      if (isCompleting && set) {
        // Determine rest time based on scientific best practices:
        // Main compound lifts get 120s (2 minutes), accessory lifts get 90s working / 60s warmup.
        const isCompound = [
          'floor-press', 'overhead-press', 'pull-up', 
          'glute-bridge', 'hip-thrust', 'single-arm-row'
        ].includes(exerciseId);

        const duration = set.type === 'warmup'
          ? 60 // 1 minute for all warmup sets
          : (isCompound ? 120 : 90); // 120s compound working / 90s accessory working

        setTimerDuration(duration);
        setTimerSetType(set.type);
        setShowTimer(true);
      }
    },
    [completeSet, activeWorkout]
  );

  const handleCompleteWorkout = useCallback(() => {
    if (!activeWorkout || !activePlan || !currentPlanDay) return;

    const applied: typeof progressionsApplied = [];

    activeWorkout.exercises.forEach((loggedEx) => {
      const pe = currentPlanDay.exercises.find((e) => e.exerciseId === loggedEx.exerciseId);
      if (!pe) return;

      const targetRepsNum = parseInt(pe.targetReps);
      if (isNaN(targetRepsNum)) return; // Skip timed exercises like wall-sit or plank

      const completedWorkingSets = loggedEx.sets.filter((s) => s.completed && s.type === "working");
      
      // Success condition: reached at least targetSets and met/exceeded targetReps in all of them
      const completedTargetSetsCount = completedWorkingSets.length >= pe.targetSets;
      const allSetsMetRepTarget = completedWorkingSets.length > 0 && completedWorkingSets.every((s) => s.reps >= targetRepsNum);

      if (completedTargetSetsCount && allSetsMetRepTarget) {
        // Find current weight (use first completed set weight or targetWeight)
        const currentWeight = pe.targetWeight ?? (completedWorkingSets[0]?.weight || 0);
        const nextStep = getNextProgressionStep(pe.targetSets, targetRepsNum, currentWeight);

        // Update plan in store
        updatePlanExercise(activePlan.id, activeWorkout.planDayId, pe.exerciseId, {
          targetSets: nextStep.sets,
          targetReps: String(nextStep.reps),
          targetWeight: nextStep.weight,
        });

        // Get exercise metadata to show in summary
        const exerciseMeta = exercises.find((e) => e.id === pe.exerciseId);
        applied.push({
          exerciseNameDe: exerciseMeta?.nameDe || pe.exerciseId,
          exerciseNameEn: exerciseMeta?.nameEn || pe.exerciseId,
          oldTarget: `${pe.targetSets} × ${pe.targetReps}`,
          newTarget: `${nextStep.sets} × ${nextStep.reps}`,
          oldWeight: currentWeight,
          newWeight: nextStep.weight,
          weightIncreased: nextStep.weightIncreased,
        });
      }
    });

    setProgressionsApplied(applied);
    completeWorkout();
    setShowSummary(true);
  }, [activeWorkout, activePlan, currentPlanDay, updatePlanExercise, completeWorkout, exercises, progressionsApplied]);

  const handleCancelWorkout = useCallback(() => {
    if (window.confirm("Workout wirklich abbrechen? Alle Daten gehen verloren.")) {
      cancelWorkout();
      setSelectedDay(null);
    }
  }, [cancelWorkout]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    setSelectedDay(null);
    router.push("/");
  }, [router]);

  if (!mounted) return null;

  // Show summary if workout just completed
  if (showSummary && workoutHistory.length > 0) {
    const lastSession = workoutHistory[workoutHistory.length - 1];
    return (
      <WorkoutSummary
        session={lastSession}
        exercises={exercises}
        onClose={handleCloseSummary}
        progressions={progressionsApplied}
      />
    );
  }

  // If no active workout, show day selection
  if (!activeWorkout) {
    return (
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">Workout starten</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Wähle einen Trainingstag aus deinem Plan
          </p>
        </motion.div>

        {activePlan ? (
          <div className="space-y-3">
            {activePlan.days.map((day, index) => (
              <motion.button
                key={day.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleStartWorkout(day)}
                className="w-full glass-card p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{day.name}</h3>
                    <div className="flex gap-2 mt-2">
                      {day.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-2">
                      {day.exercises.length} Übungen · ~{getEstimatedWorkoutDuration(day.exercises)} Min
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                    {index + 1}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-[var(--muted)]">
              Kein aktiver Trainingsplan. Erstelle zuerst einen Plan.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Active workout view

  const totalSets = activeWorkout.exercises.reduce(
    (t, e) => t + e.sets.length,
    0
  );
  const completedSets = activeWorkout.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      {/* Workout Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <button
          onClick={handleCancelWorkout}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <XCircle className="w-5 h-5" />
          <span className="text-sm">Abbrechen</span>
        </button>
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </motion.div>

      {/* Day Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <h1 className="text-xl font-bold">{currentPlanDay?.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-[var(--muted)]">
            {completedSets}/{totalSets} Sätze
          </span>
          <div className="flex-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : "0%",
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {activeWorkout.exercises.map((workoutExercise, index) => {
          const exercise = exercises.find(
            (e) => e.id === workoutExercise.exerciseId
          );
          const planExercise = currentPlanDay?.exercises.find(
            (pe) => pe.exerciseId === workoutExercise.exerciseId
          );

          if (!exercise || !planExercise) return null;

          return (
            <motion.div
              key={workoutExercise.exerciseId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ExerciseCard
                exercise={exercise}
                planExercise={planExercise}
                workoutExercise={workoutExercise}
                onAddSet={(type) =>
                  handleAddSet(workoutExercise.exerciseId, type)
                }
                onUpdateSet={(setId, updates) =>
                  updateSet(workoutExercise.exerciseId, setId, updates)
                }
                onCompleteSet={(setId) =>
                  handleCompleteSet(workoutExercise.exerciseId, setId)
                }
                onRemoveSet={(setId) =>
                  removeSet(workoutExercise.exerciseId, setId)
                }
              />
            </motion.div>
          );
        })}
      </div>

      {/* Complete Workout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <button
          onClick={handleCompleteWorkout}
          disabled={completedSets === 0}
          className="w-full btn-accent flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-lg py-4"
        >
          <CheckCircle2 className="w-5 h-5" />
          Workout abschließen
        </button>
      </motion.div>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {showTimer && (
          <RestTimer
            duration={timerDuration}
            isActive={showTimer}
            setType={timerSetType}
            onComplete={() => setShowTimer(false)}
            onDismiss={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
