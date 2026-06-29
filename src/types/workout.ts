// ─── Enums & Literals ────────────────────────────────────────────────
export type SetType = 'warmup' | 'working';

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'compound'
  | 'other';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'band'
  | 'kettlebell'
  | 'other';

// ─── Core Models ─────────────────────────────────────────────────────
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  type: SetType;
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Exercise {
  id: string;
  nameEn: string;
  nameDe?: string;
  description?: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  equipment: EquipmentType[];
  isCustom: boolean;
}

export interface PlanExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

export interface PlanDay {
  id: string;
  name: string;
  focusAreas: string[];
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  days: PlanDay[];
}

export interface RestTimerConfig {
  warmupSeconds: number;
  workingSeconds: number;
}

// ─── Session ─────────────────────────────────────────────────────────
export interface WorkoutSession {
  id: string;
  planId?: string;
  planName?: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

// ─── Category helpers ────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f97316',
  arms: '#a855f7',
  legs: '#22c55e',
  core: '#eab308',
  cardio: '#ec4899',
  compound: '#06b6d4',
  other: '#6b7280',
};

export const CATEGORY_LABELS_DE: Record<ExerciseCategory, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  arms: 'Arme',
  legs: 'Beine',
  core: 'Rumpf',
  cardio: 'Ausdauer',
  compound: 'Ganzkörper',
  other: 'Sonstige',
};
