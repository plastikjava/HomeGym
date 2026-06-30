import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutSession, WorkoutExercise, WorkoutSet, SetType } from '@/types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface WorkoutStore {
  // Active workout
  activeWorkout: WorkoutSession | null;
  // History
  workoutHistory: WorkoutSession[];
  // Actions
  startWorkout: (planId: string, planDayId: string, exercises: WorkoutExercise[]) => void;
  cancelWorkout: () => void;
  completeWorkout: (notes?: string, avgHeartRate?: number, maxHeartRate?: number, progressionsCount?: number) => void;
  // Set management
  addSet: (exerciseId: string, set: WorkoutSet) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  updateWorkoutSession: (id: string, updates: Partial<WorkoutSession>) => void;
  deleteWorkoutSession: (id: string) => void;
  // History
  getWorkoutsByDate: (date: string) => WorkoutSession[];
  getLastWorkoutForDay: (planDayId: string) => WorkoutSession | undefined;
  getWorkoutsThisWeek: () => WorkoutSession[];
  getTotalWorkouts: () => number;
  getCurrentStreak: () => number;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      workoutHistory: [],

      startWorkout: (planId, planDayId, exercises) => {
        const now = new Date().toISOString();
        const session: WorkoutSession = {
          id: generateId(),
          planId,
          planDayId,
          date: now.split('T')[0]!,
          startedAt: now,
          exercises,
        };
        set({ activeWorkout: session });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      completeWorkout: (notes, avgHeartRate, maxHeartRate, progressionsCount) => {
        const { activeWorkout, workoutHistory } = get();
        if (!activeWorkout) return;

        const completedSession: WorkoutSession = {
          ...activeWorkout,
          completedAt: new Date().toISOString(),
          notes: notes || activeWorkout.notes,
          avgHeartRate,
          maxHeartRate,
          progressionsCount: progressionsCount || 0,
        };

        set({
          activeWorkout: null,
          workoutHistory: [completedSession, ...workoutHistory],
        });
      },

      addSet: (exerciseId, newSet) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        set({
          activeWorkout: {
            ...activeWorkout,
            exercises: activeWorkout.exercises.map((ex) =>
              ex.exerciseId === exerciseId
                ? { ...ex, sets: [...ex.sets, newSet] }
                : ex
            ),
          },
        });
      },

      updateSet: (exerciseId, setId, updates) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        set({
          activeWorkout: {
            ...activeWorkout,
            exercises: activeWorkout.exercises.map((ex) => {
              if (ex.exerciseId !== exerciseId) return ex;

              const targetIndex = ex.sets.findIndex((s) => s.id === setId);
              if (targetIndex === -1) return ex;

              const updatedSet = { ...ex.sets[targetIndex]!, ...updates };

              // If weight is being updated, propagate it to subsequent uncompleted sets in the exercise
              const newSets = ex.sets.map((s, idx) => {
                if (idx === targetIndex) {
                  return updatedSet;
                }
                // Propagate to subsequent sets (idx > targetIndex) that are not completed
                if (idx > targetIndex && !s.completed && updates.weight !== undefined) {
                  return { ...s, weight: updates.weight };
                }
                return s;
              });

              return {
                ...ex,
                sets: newSets,
              };
            }),
          },
        });
      },

      removeSet: (exerciseId, setId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        set({
          activeWorkout: {
            ...activeWorkout,
            exercises: activeWorkout.exercises.map((ex) =>
              ex.exerciseId === exerciseId
                ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
                : ex
            ),
          },
        });
      },

      completeSet: (exerciseId, setId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        set({
          activeWorkout: {
            ...activeWorkout,
            exercises: activeWorkout.exercises.map((ex) =>
              ex.exerciseId === exerciseId
                ? {
                    ...ex,
                    sets: ex.sets.map((s) =>
                      s.id === setId
                        ? {
                            ...s,
                            completed: true,
                            completedAt: new Date().toISOString(),
                          }
                        : s
                    ),
                  }
                : ex
            ),
          },
        });
      },

      updateWorkoutSession: (id, updates) => {
        set((state) => ({
          workoutHistory: state.workoutHistory.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWorkoutSession: (id) => {
        set((state) => ({
          workoutHistory: state.workoutHistory.filter((w) => w.id !== id),
        }));
      },

      getWorkoutsByDate: (date) => {
        return get().workoutHistory.filter((w) => w.date === date);
      },

      getLastWorkoutForDay: (planDayId) => {
        return get().workoutHistory.find((w) => w.planDayId === planDayId);
      },

      getWorkoutsThisWeek: () => {
        const now = new Date();
        // Get Monday of the current week (ISO week starts on Monday)
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(monday.getDate() - diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const mondayStr = monday.toISOString().split('T')[0]!;
        const sundayStr = sunday.toISOString().split('T')[0]!;

        return get().workoutHistory.filter(
          (w) => w.date >= mondayStr && w.date <= sundayStr
        );
      },

      getTotalWorkouts: () => {
        return get().workoutHistory.length;
      },

      getCurrentStreak: () => {
        const { workoutHistory } = get();
        if (workoutHistory.length === 0) return 0;

        // Collect unique workout dates sorted descending
        const uniqueDates = Array.from(
          new Set(workoutHistory.map((w) => w.date))
        ).sort((a, b) => b.localeCompare(a));

        if (uniqueDates.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0]!;

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0]!;

        // Streak must include today or yesterday to be active
        const mostRecentDate = uniqueDates[0]!;
        if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
          return 0;
        }

        let streak = 0;
        let checkDate = new Date(mostRecentDate + 'T00:00:00');

        for (const dateStr of uniqueDates) {
          const expectedStr = checkDate.toISOString().split('T')[0]!;
          if (dateStr === expectedStr) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (dateStr < expectedStr) {
            // There's a gap — streak is broken
            break;
          }
          // If dateStr > expectedStr, it's a duplicate or future date, skip
        }

        return streak;
      },
    }),
    {
      name: 'homegym-workouts',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        activeWorkout: state.activeWorkout,
        workoutHistory: state.workoutHistory,
      }),
    }
  )
);
