"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useSettingsStore } from "@/stores/settingsStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { usePlanStore } from "@/stores/planStore";

import { useWorkoutStore } from "@/stores/workoutStore";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useSettingsStore((s) => s.settings.theme);
  const initExercises = useExerciseStore((s) => s.initializeExercises);
  const initPlans = usePlanStore((s) => s.initializePlans);

  const activePlan = usePlanStore((s) => s.plans.find((p) => p.id === s.activePlanId));
  const plansInitialized = usePlanStore((s) => s.initialized);
  const updatePlanExercise = usePlanStore((s) => s.updatePlanExercise);

  // Initialize stores and apply theme on mount
  useEffect(() => {
    // Rehydrate stores from localStorage first to prevent data resets
    useSettingsStore.persist.rehydrate();
    useExerciseStore.persist.rehydrate();
    usePlanStore.persist.rehydrate();
    useWorkoutStore.persist.rehydrate();

    initExercises();
    initPlans();

    // Intercept Google OAuth redirects
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");

      if (accessToken) {
        // Clean URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        const action = sessionStorage.getItem("google_drive_sync_action") || "backup";
        sessionStorage.removeItem("google_drive_sync_action");

        import("@/lib/googleDrive").then(async ({ uploadBackupToGoogleDrive, downloadBackupFromGoogleDrive }) => {
          if (action === "backup") {
            const backupData = {
              exercises: localStorage.getItem("homegym-exercises"),
              plans: localStorage.getItem("homegym-plans"),
              settings: localStorage.getItem("homegym-settings"),
              workouts: localStorage.getItem("homegym-workouts"),
            };
            const fileContent = JSON.stringify(backupData);
            const success = await uploadBackupToGoogleDrive(accessToken, fileContent);
            if (success) {
              useSettingsStore.getState().setLastGoogleSync(new Date().toISOString());
              alert("Erfolgreich in Google Drive gesichert!");
            } else {
              alert("Fehler beim Sichern in Google Drive.");
            }
          } else if (action === "restore") {
            const backup = await downloadBackupFromGoogleDrive(accessToken);
            if (backup) {
              if (backup.exercises) localStorage.setItem("homegym-exercises", backup.exercises);
              if (backup.plans) localStorage.setItem("homegym-plans", backup.plans);
              if (backup.settings) localStorage.setItem("homegym-settings", backup.settings);
              if (backup.workouts) localStorage.setItem("homegym-workouts", backup.workouts);
              alert("Daten erfolgreich aus Google Drive geladen! App lädt neu...");
              window.location.reload();
            } else {
              alert("Kein Backup auf Google Drive gefunden oder Fehler beim Laden.");
            }
          } else if (action === "fit-sync") {
            const rawStore = localStorage.getItem("homegym-workouts");
            let workouts = [];
            if (rawStore) {
              try {
                const parsed = JSON.parse(rawStore);
                workouts = parsed?.state?.workoutHistory || [];
              } catch (e) {
                console.error("Failed to parse workouts:", e);
              }
            }

            if (!Array.isArray(workouts) || workouts.length === 0) {
              alert("Keine Workouts zum Synchronisieren gefunden.");
              return;
            }

            import("@/lib/googleFit").then(async ({ syncWorkoutsToGoogleFit }) => {
              const success = await syncWorkoutsToGoogleFit(accessToken, workouts);
              if (success) {
                alert("Workouts erfolgreich mit Google Fit synchronisiert!");
              } else {
                alert("Fehler bei der Synchronisation mit Google Fit.");
              }
            });
          }
        });
      }
    }

    setMounted(true);
  }, [initExercises, initPlans]);

  // Auto-align progression of exercises appearing on multiple days in the active plan (e.g. Overhead Press)
  useEffect(() => {
    if (!mounted || !plansInitialized || !activePlan) return;

    const maxTargets: Record<string, { sets: number; reps: string; weight?: number }> = {};
    let hasMismatches = false;

    // 1. Find max target values
    activePlan.days.forEach((day) => {
      day.exercises.forEach((ex) => {
        const currentMax = maxTargets[ex.exerciseId];
        const weight = ex.targetWeight || 0;
        const repsNum = parseInt(ex.targetReps) || 0;

        if (!currentMax) {
          maxTargets[ex.exerciseId] = { sets: ex.targetSets, reps: ex.targetReps, weight };
        } else {
          const currentRepsNum = parseInt(currentMax.reps) || 0;
          const currentVolume = currentMax.sets * currentRepsNum;
          const newVolume = ex.targetSets * repsNum;

          if (weight > (currentMax.weight || 0) || (weight === currentMax.weight && newVolume > currentVolume)) {
            maxTargets[ex.exerciseId] = { sets: ex.targetSets, reps: ex.targetReps, weight };
          }
        }
      });
    });

    // 2. Check if we need to update anything
    activePlan.days.forEach((day) => {
      day.exercises.forEach((ex) => {
        const max = maxTargets[ex.exerciseId];
        if (max && (ex.targetSets !== max.sets || ex.targetReps !== max.reps || ex.targetWeight !== max.weight)) {
          hasMismatches = true;
        }
      });
    });

    if (hasMismatches) {
      // Apply updates to align them
      activePlan.days.forEach((day) => {
        day.exercises.forEach((ex) => {
          const max = maxTargets[ex.exerciseId];
          if (max && (ex.targetSets !== max.sets || ex.targetReps !== max.reps || ex.targetWeight !== max.weight)) {
            updatePlanExercise(activePlan.id, day.id, ex.exerciseId, {
              targetSets: max.sets,
              targetReps: max.reps,
              targetWeight: max.weight,
            });
          }
        });
      });
    }
  }, [mounted, plansInitialized, activePlan, updatePlanExercise]);

  // Apply dark/light class to html element
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  // Show a skeleton / nothing during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <Header />
      <main className="flex-1 mb-bottom-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
