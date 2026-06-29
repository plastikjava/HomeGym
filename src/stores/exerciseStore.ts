import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Exercise } from '@/types';
import { defaultExercises } from '@/data/defaultPlans';

interface ExerciseStore {
  exercises: Exercise[];
  initialized: boolean;
  initializeExercises: () => void;
  addExercise: (exercise: Exercise) => void;
  addExercises: (exercises: Exercise[]) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  getExerciseById: (id: string) => Exercise | undefined;
  getExercisesByCategory: (category: string) => Exercise[];
  getExercisesByEquipment: (equipment: string[]) => Exercise[];
  searchExercises: (query: string) => Exercise[];
}

export const useExerciseStore = create<ExerciseStore>()(
  persist(
    (set, get) => ({
      exercises: [],
      initialized: false,
      initializeExercises: () => {
        const currentExercises = get().exercises;
        if (get().initialized && currentExercises.length > 0) {
          const defaultIds = new Set(defaultExercises.map(e => e.id));
          
          // Filter out wger exercises
          const withoutWger = currentExercises.filter(e => !e.id.startsWith("wger-"));
          const currentIds = new Set(withoutWger.map(e => e.id));
          
          // Find any default exercises that are missing in the current list
          const missingDefaults = defaultExercises.filter(e => !currentIds.has(e.id));
          
          const updated = withoutWger.map(e => {
            if (defaultIds.has(e.id) && e.gifUrl && e.gifUrl.includes("exercisedb.dev")) {
              return { ...e, gifUrl: undefined };
            }
            return e;
          });
          
          if (missingDefaults.length > 0) {
            set({ exercises: [...updated, ...missingDefaults] });
          } else {
            set({ exercises: updated });
          }
        } else {
          set({ exercises: defaultExercises, initialized: true });
        }
      },
      addExercise: (exercise) =>
        set((state) => ({ exercises: [...state.exercises, exercise] })),
      addExercises: (newExercises) =>
        set((state) => {
          const existingIds = new Set(state.exercises.map((e) => e.id));
          const filteredNew = newExercises.filter((e) => !existingIds.has(e.id));
          return { exercises: [...state.exercises, ...filteredNew] };
        }),
      updateExercise: (id, updates) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteExercise: (id) =>
        set((state) => ({
          exercises: state.exercises.filter((e) => e.id !== id),
        })),
      getExerciseById: (id) => get().exercises.find((e) => e.id === id),
      getExercisesByCategory: (category) =>
        get().exercises.filter((e) => e.category === category),
      getExercisesByEquipment: (equipment) =>
        get().exercises.filter((e) =>
          e.equipment.some((eq) => equipment.includes(eq))
        ),
      searchExercises: (query) => {
        const q = query.toLowerCase();
        return get().exercises.filter(
          (e) =>
            e.nameEn.toLowerCase().includes(q) ||
            (e.nameDe && e.nameDe.toLowerCase().includes(q)) ||
            e.primaryMuscles.some((m) => m.toLowerCase().includes(q))
        );
      },
    }),
    {
      name: 'homegym-exercises',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
