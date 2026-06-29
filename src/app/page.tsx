"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePlanStore } from "@/stores/planStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { NextWorkoutCard } from "@/components/dashboard/NextWorkoutCard";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  const plans = usePlanStore((s) => s.plans);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const getWorkoutsThisWeek = useWorkoutStore((s) => s.getWorkoutsThisWeek);
  const getCurrentStreak = useWorkoutStore((s) => s.getCurrentStreak);
  const getTotalWorkouts = useWorkoutStore((s) => s.getTotalWorkouts);
  const exercises = useExerciseStore((s) => s.exercises);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activePlan = plans.find((p) => p.id === activePlanId);

  // Determine next workout day based on last completed workout
  const getNextDayIndex = (): number => {
    if (!activePlan || workoutHistory.length === 0) return 0;

    const lastWorkout = workoutHistory
      .filter((w) => w.planId === activePlan.id && w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    if (!lastWorkout) return 0;

    const lastDayIndex = activePlan.days.findIndex((d) => d.id === lastWorkout.planDayId);
    return (lastDayIndex + 1) % activePlan.days.length;
  };

  const nextDayIndex = getNextDayIndex();
  const nextDay = activePlan?.days[nextDayIndex];

  // Calculate total volume from all completed workouts
  const totalVolume = workoutHistory.reduce((total, session) => {
    return (
      total +
      session.exercises.reduce((exTotal, ex) => {
        return (
          exTotal +
          ex.sets
            .filter((s) => s.completed)
            .reduce((setTotal, s) => setTotal + s.weight * s.reps, 0)
        );
      }, 0)
    );
  }, 0);

  const workoutsThisWeek = getWorkoutsThisWeek().length;
  const totalWorkouts = getTotalWorkouts();
  const currentStreak = getCurrentStreak();

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold">
          Hallo! <span className="wave inline-block">👋</span>
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Bereit für dein nächstes Training?
        </p>
      </motion.div>

      {/* Stats Overview */}
      <StatsOverview
        workoutsThisWeek={workoutsThisWeek}
        totalWorkouts={totalWorkouts}
        currentStreak={currentStreak}
        totalVolume={Math.round(totalVolume)}
      />

      {/* Next Workout Card */}
      {activePlan && nextDay && (
        <NextWorkoutCard
          planDay={nextDay}
          dayIndex={nextDayIndex}
          planName={activePlan.name}
        />
      )}

      {/* Recent Workouts */}
      <RecentWorkouts workouts={workoutHistory} exercises={exercises} />
    </div>
  );
}
