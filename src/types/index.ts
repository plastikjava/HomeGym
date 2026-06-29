// Equipment types available for exercises
export type EquipmentType =
  | 'adjustable_dumbbells'
  | 'pull_up_bar'
  | 'resistance_bands'
  | 'bodyweight'
  | 'barbell'
  | 'cable_machine'
  | 'kettlebell'
  | 'bench'
  | 'other';

export interface Equipment {
  id: EquipmentType;
  name: string; // German name
  nameEn: string; // English name
  icon: string; // lucide icon name
  isDefault: boolean; // true for user's default equipment
}

export interface Exercise {
  id: string;
  nameEn: string; // English name (primary)
  nameDe?: string; // German name (secondary, in parentheses)
  description?: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment: EquipmentType[];
  imageUrl?: string;
  gifUrl?: string; // For ExerciseDB fallback later
  videoUrl?: string; // Custom YouTube embed or Short URL
  isCustom: boolean;
  wgerId?: number; // Reference to wger API ID
}

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body';

export interface PlanExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. '10-12' or '45-60s' or 'max'
  notes?: string;
  targetWeight?: number; // in kg
}

export interface PlanDay {
  id: string;
  name: string; // e.g. 'Beine / Bauch'
  focusAreas: string[]; // e.g. ['Legs', 'Core']
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  days: PlanDay[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export type SetType = 'warmup' | 'working';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number; // in kg
  type: SetType;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  planDayId: string;
  date: string; // ISO date
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface RestTimerConfig {
  warmupSeconds: number; // default 60
  workingSeconds: number; // default 120
}

export interface UserSettings {
  theme: 'dark' | 'light';
  restTimer: RestTimerConfig;
  availableEquipment: EquipmentType[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  chest: 'border-red-500',
  back: 'border-blue-500',
  shoulders: 'border-purple-500',
  arms: 'border-amber-500',
  legs: 'border-green-500',
  core: 'border-cyan-500',
  cardio: 'border-pink-500',
  full_body: 'border-teal-500',
  other: 'border-zinc-500',
};

export const CATEGORY_LABELS_DE: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  arms: 'Arme',
  legs: 'Beine',
  core: 'Bauch',
  cardio: 'Cardio',
  full_body: 'Ganzkörper',
  other: 'Andere',
};
