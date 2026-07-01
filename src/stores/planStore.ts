import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutPlan, PlanDay, PlanExercise } from '@/types';
import { defaultSBSHypertrophy, defaultSBSHypertrophyLight } from '@/data/defaultPlans';

interface PlanStore {
  plans: WorkoutPlan[];
  activePlanId: string | null;
  initialized: boolean;
  initializePlans: () => void;
  addPlan: (plan: WorkoutPlan) => void;
  updatePlan: (id: string, updates: Partial<WorkoutPlan>) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string) => void;
  getActivePlan: () => WorkoutPlan | undefined;
  addDayToPlan: (planId: string, day: PlanDay) => void;
  removeDayFromPlan: (planId: string, dayId: string) => void;
  addExerciseToDay: (planId: string, dayId: string, exercise: PlanExercise) => void;
  removeExerciseFromDay: (planId: string, dayId: string, exerciseId: string) => void;
  updatePlanExercise: (planId: string, dayId: string, exerciseId: string, updates: Partial<PlanExercise>) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlanId: null,
      initialized: false,
      initializePlans: () => {
        const currentPlans = get().plans.filter((p) => p.id !== 'default-3split');
        const hasSBS = currentPlans.some((p) => p.id === 'sbs-hypertrophy');
        const hasSBSLight = currentPlans.some((p) => p.id === 'sbs-hypertrophy-light');
        
        let updatedPlans = currentPlans;
        if (!hasSBS) {
          updatedPlans = [...updatedPlans, defaultSBSHypertrophy];
        }
        if (!hasSBSLight) {
          updatedPlans = [...updatedPlans, defaultSBSHypertrophyLight];
        }
        
        // Migrate all plans to start at 3 sets and 8 reps (except timed exercises)
        const migratedPlans = updatedPlans.map((plan) => ({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((ex) => {
              const isTimed = ex.targetReps.includes('s');
              return {
                ...ex,
                targetSets: 3,
                targetReps: isTimed ? ex.targetReps : '8',
              };
            }),
          })),
        }));
        
        const activePlanId = get().activePlanId === 'default-3split' || !get().activePlanId
          ? defaultSBSHypertrophy.id
          : get().activePlanId;

        set({
          plans: migratedPlans,
          activePlanId: activePlanId,
          initialized: true,
        });
      },
      addPlan: (plan) =>
        set((state) => ({ plans: [...state.plans, plan] })),
      updatePlan: (id, updates) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      deletePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        })),
      setActivePlan: (id) => set({ activePlanId: id }),
      getActivePlan: () => {
        const state = get();
        return state.plans.find((p) => p.id === state.activePlanId);
      },
      addDayToPlan: (planId, day) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  days: [...p.days, day],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
      removeDayFromPlan: (planId, dayId) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  days: p.days.filter((d) => d.id !== dayId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
      addExerciseToDay: (planId, dayId, exercise) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  days: p.days.map((d) =>
                    d.id === dayId
                      ? { ...d, exercises: [...d.exercises, exercise] }
                      : d
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
      removeExerciseFromDay: (planId, dayId, exerciseId) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  days: p.days.map((d) =>
                    d.id === dayId
                      ? {
                          ...d,
                          exercises: d.exercises.filter(
                            (e) => e.exerciseId !== exerciseId
                          ),
                        }
                      : d
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
        updatePlanExercise: (planId, dayId, exerciseId, updates) =>
          set((state) => ({
            plans: state.plans.map((p) =>
              p.id === planId
                ? {
                    ...p,
                    days: p.days.map((d) =>
                      d.id === dayId
                        ? {
                            ...d,
                            exercises: d.exercises.map((e) =>
                              e.exerciseId === exerciseId
                                ? { ...e, ...updates }
                                : e
                            ),
                          }
                        : d
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          })),
    }),
    {
      name: 'homegym-plans',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
