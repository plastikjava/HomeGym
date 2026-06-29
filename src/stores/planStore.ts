import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutPlan, PlanDay, PlanExercise } from '@/types';
import { defaultSBSHypertrophy } from '@/data/defaultPlans';

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
        const updatedPlans = hasSBS ? currentPlans : [...currentPlans, defaultSBSHypertrophy];
        
        const activePlanId = get().activePlanId === 'default-3split' || !get().activePlanId
          ? defaultSBSHypertrophy.id
          : get().activePlanId;

        set({
          plans: updatedPlans,
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
    }),
    {
      name: 'homegym-plans',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
