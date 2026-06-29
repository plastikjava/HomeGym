import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserSettings, EquipmentType } from '@/types';

const defaultSettings: UserSettings = {
  theme: 'dark',
  restTimer: {
    warmupSeconds: 60,
    workingSeconds: 120,
  },
  availableEquipment: [
    'adjustable_dumbbells',
    'pull_up_bar',
    'resistance_bands',
    'bodyweight',
  ],
};

interface SettingsStore {
  settings: UserSettings;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setRestTimer: (config: Partial<{ warmupSeconds: number; workingSeconds: number }>) => void;
  setAvailableEquipment: (equipment: EquipmentType[]) => void;
  toggleEquipment: (equipment: EquipmentType) => void;
  setGoogleClientId: (id: string) => void;
  setLastGoogleSync: (date: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'dark' ? 'light' : 'dark',
          },
        })),

      setRestTimer: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            restTimer: { ...state.settings.restTimer, ...config },
          },
        })),

      setAvailableEquipment: (equipment) =>
        set((state) => ({
          settings: { ...state.settings, availableEquipment: equipment },
        })),

      toggleEquipment: (equipment) =>
        set((state) => {
          const current = state.settings.availableEquipment;
          const updated = current.includes(equipment)
            ? current.filter((e) => e !== equipment)
            : [...current, equipment];
          return {
            settings: { ...state.settings, availableEquipment: updated },
          };
        }),
      setGoogleClientId: (id) =>
        set((state) => ({
          settings: { ...state.settings, googleClientId: id },
        })),
      setLastGoogleSync: (date) =>
        set((state) => ({
          settings: { ...state.settings, lastGoogleSync: date },
        })),
    }),
    {
      name: 'homegym-settings',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
