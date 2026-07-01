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
