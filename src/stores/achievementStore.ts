import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  condition: string; // human-readable condition
  unlockedAt?: string; // ISO timestamp when unlocked
}

export interface AchievementContext {
  totalWorkouts: number;
  workoutsThisWeek: number;
  totalVolume: number;
  totalProgressions: number;
  totalPRs: number;
  deloadEverUsed: boolean;
  longestGapDays: number; // max gap between workouts in last 4 weeks (0 if no gap or not enough data)
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-workout', name: 'Erste Schritte', description: 'Du hast dein erstes Training beendet!', icon: '🥇', condition: '1 Training abgeschlossen' },
  { id: 'week-warrior', name: 'Wochenkrieger', description: 'Du ziehst voll durch!', icon: '⚔️', condition: '3 Trainings in einer Woche' },
  { id: 'tonnage-1000', name: 'Tonnenschwer', description: '1 Tonne Gesamtgewicht gehoben.', icon: '🏗️', condition: '1.000 kg Gesamtvolumen' },
  { id: 'tonnage-5000', name: 'Kraftwerk', description: '5 Tonnen Gesamtgewicht gehoben.', icon: '🏭', condition: '5.000 kg Gesamtvolumen' },
  { id: 'pr-hunter-5', name: 'PR-Jäger', description: '5 persönliche Rekorde gebrochen.', icon: '🎯', condition: '5 persönliche Rekorde' },
  { id: 'pr-hunter-10', name: 'PR-Legende', description: '10 persönliche Rekorde gebrochen.', icon: '🏆', condition: '10 persönliche Rekorde' },
  { id: 'iron-discipline', name: 'Eiserne Disziplin', description: 'Keine Pause länger als 7 Tage.', icon: '🔥', condition: '4 Wochen ohne Pause > 7 Tage' },
  { id: 'level-5', name: 'Level 5', description: 'Fünf Progressionsstufen aufgestiegen.', icon: '⬆️', condition: '5 Progressions-Aufstiege' },
  { id: 'level-10', name: 'Level 10', description: 'Zehn Progressionsstufen aufgestiegen.', icon: '🌟', condition: '10 Progressions-Aufstiege' },
  { id: 'deload-pro', name: 'Deload-Profi', description: 'Gönn deinen Muskeln eine aktive Pause.', icon: '🧘', condition: 'Erste Deload-Woche aktiviert' },
  { id: 'consistency-10', name: 'Beständigkeit', description: 'Gute Gewohnheiten etabliert.', icon: '💎', condition: '10 Trainings insgesamt' },
  { id: 'consistency-25', name: 'Silber-Status', description: 'Du bist voll dabei!', icon: '🥈', condition: '25 Trainings insgesamt' },
  { id: 'consistency-50', name: 'Gold-Status', description: 'Du bist eine Fitness-Maschine!', icon: '🥇', condition: '50 Trainings insgesamt' },
];

interface AchievementStore {
  achievements: Achievement[];
  newlyUnlocked: string[]; // IDs of achievements unlocked this session
  initializeAchievements: () => void;
  checkAndUnlockAchievements: (context: AchievementContext) => string[]; // returns newly unlocked IDs
  clearNewlyUnlocked: () => void;
}

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      achievements: [],
      newlyUnlocked: [],
      initializeAchievements: () => {
        if (get().achievements.length === 0) {
          set({ achievements: DEFAULT_ACHIEVEMENTS, newlyUnlocked: [] });
        }
      },
      checkAndUnlockAchievements: (context) => {
        // Initialize if not done
        if (get().achievements.length === 0) {
          get().initializeAchievements();
        }

        const nowStr = new Date().toISOString();
        const currentAchievements = get().achievements;
        const newlyUnlockedIds: string[] = [];

        const updatedAchievements = currentAchievements.map((ach) => {
          if (ach.unlockedAt) return ach; // Already unlocked

          let shouldUnlock = false;

          switch (ach.id) {
            case 'first-workout':
              shouldUnlock = context.totalWorkouts >= 1;
              break;
            case 'week-warrior':
              shouldUnlock = context.workoutsThisWeek >= 3;
              break;
            case 'tonnage-1000':
              shouldUnlock = context.totalVolume >= 1000;
              break;
            case 'tonnage-5000':
              shouldUnlock = context.totalVolume >= 5000;
              break;
            case 'pr-hunter-5':
              shouldUnlock = context.totalPRs >= 5;
              break;
            case 'pr-hunter-10':
              shouldUnlock = context.totalPRs >= 10;
              break;
            case 'iron-discipline':
              shouldUnlock = context.totalWorkouts >= 4 && context.longestGapDays <= 7 && context.longestGapDays > 0;
              break;
            case 'level-5':
              shouldUnlock = context.totalProgressions >= 5;
              break;
            case 'level-10':
              shouldUnlock = context.totalProgressions >= 10;
              break;
            case 'deload-pro':
              shouldUnlock = context.deloadEverUsed;
              break;
            case 'consistency-10':
              shouldUnlock = context.totalWorkouts >= 10;
              break;
            case 'consistency-25':
              shouldUnlock = context.totalWorkouts >= 25;
              break;
            case 'consistency-50':
              shouldUnlock = context.totalWorkouts >= 50;
              break;
          }

          if (shouldUnlock) {
            newlyUnlockedIds.push(ach.id);
            return { ...ach, unlockedAt: nowStr };
          }
          return ach;
        });

        if (newlyUnlockedIds.length > 0) {
          set({
            achievements: updatedAchievements,
            newlyUnlocked: [...get().newlyUnlocked, ...newlyUnlockedIds],
          });
        }

        return newlyUnlockedIds;
      },
      clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),
    }),
    {
      name: 'homegym-achievements',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
