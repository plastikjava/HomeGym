"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, RefreshCw, Calendar, Lightbulb } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { format, parseISO, subDays } from "date-fns";
import { de } from "date-fns/locale";

export function TrainerAI() {
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const { settings, setDeloadActive } = useSettingsStore();

  const recommendation = useMemo(() => {
    // 1. Welcome Recommendation
    if (workoutHistory.length === 0) {
      return {
        type: "info",
        title: "Willkommen bei HomeGym! 🚀",
        text: "Starte dein erstes Training, indem du unten auf 'Workout starten' tippst. Konzentriere dich am Anfang auf eine saubere Ausführung und trage deine geschafften Wiederholungen ein. Die App passt sich dir an!",
        action: null,
      };
    }

    // 2. Deload Active Banner
    if (settings.deloadActive) {
      const startDateStr = settings.deloadStartedAt
        ? format(parseISO(settings.deloadStartedAt), "dd.MM.yyyy")
        : "";
      return {
        type: "deload-active",
        title: "Deload-Woche Aktiv ⚡",
        text: `Du befindest dich im regenerativen Deload-Modus (gestartet am ${startDateStr}). Deine Gewichte sind um 40% reduziert und deine Sätze sind halbiert. Nutze diese Zeit zur Muskel- und Gelenkregeneration.`,
        action: {
          label: "Deload beenden",
          handler: () => {
            if (confirm("Möchtest du den Deload-Modus vorzeitig beenden?")) {
              setDeloadActive(false);
            }
          },
        },
      };
    }

    // 3. Deload Recommendation Check
    // If completed >= 15 workouts in the last 6 weeks (42 days)
    const fortyTwoDaysAgo = subDays(new Date(), 42);
    const recentWorkouts = workoutHistory.filter(
      (w) => w.completedAt && new Date(w.completedAt) >= fortyTwoDaysAgo
    );

    const hasRecentDeload = settings.deloadStartedAt && new Date(settings.deloadStartedAt) >= fortyTwoDaysAgo;

    if (recentWorkouts.length >= 15 && !hasRecentDeload) {
      return {
        type: "deload-suggest",
        title: "Regeneration empfohlen (Deload) 🧘",
        text: `Du hast in den letzten 6 Wochen sehr intensiv trainiert (${recentWorkouts.length} Workouts!). Um Übertraining zu vermeiden und deine Gelenke zu schonen, wird eine einwöchige Deload-Woche empfohlen.`,
        action: {
          label: "Deload-Woche starten",
          handler: () => {
            if (
              confirm(
                "Möchtest du eine Deload-Woche aktivieren? Deine Arbeitsgewichte werden für das nächste Training um 40% reduziert und die Satzzahlen halbiert. Du kannst den Modus jederzeit wieder beenden."
              )
            ) {
              setDeloadActive(true);
            }
          },
        },
      };
    }

    // 4. Legs Workout Reminder
    // Find last legs workout
    const completedWorkouts = workoutHistory
      .filter((w) => w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    const lastLegsWorkout = completedWorkouts.find((w) => {
      // Typically Day 1 has Legs/Beine in name or ID
      return w.planDayId.includes("legs") || w.planDayId.includes("beine");
    });

    const eightDaysAgo = subDays(new Date(), 8);
    if (lastLegsWorkout && new Date(lastLegsWorkout.completedAt!) < eightDaysAgo) {
      const daysDiff = Math.floor(
        (new Date().getTime() - new Date(lastLegsWorkout.completedAt!).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        type: "legs-reminder",
        title: "Beine nicht vergessen! 🦵",
        text: `Dein letztes Beintraining liegt bereits ${daysDiff} Tage zurück. Ein ausgeglichenes Beintraining stärkt die Rumpfmuskulatur, stabilisiert deine Kniegelenke und kurbelt den Hormonhaushalt an!`,
        action: null,
      };
    }

    // 5. Pull-up Dead Hang Tip
    // Check if they ever performed single pullups
    const hasPullUps = workoutHistory.some((w) =>
      w.exercises.some((e) => e.exerciseId === "pull-up")
    );
    if (hasPullUps) {
      return {
        type: "tip",
        title: "Klimmzug-Tipp ⏱️",
        text: "Klimmzüge sind extrem schwer. Wenn du noch keine vollständige Wiederholung schaffst, schalte einen Satz über das kleine Uhr-Symbol auf 'Dead Hang' (Aushängen auf Zeit) um. Ziel: Versuche dich 30-45 Sekunden kontrolliert zu halten!",
        action: null,
      };
    }

    // 6. Default autoregulation tip
    return {
      type: "tip",
      title: "Stronger by Science Auto-Regulation 💡",
      text: "Wenn du alle Arbeitssätze mit deinem Zielgewicht in den vorgegebenen Wiederholungen (z.B. 3x8) schaffst, erhöht die App deine Zielvorgabe im nächsten Training automatisch auf die nächste Stufe. Bleib dran!",
      action: null,
    };
  }, [workoutHistory, settings.deloadActive, settings.deloadStartedAt, setDeloadActive]);

  // Color classes based on type
  const colorMap = {
    info: "bg-blue-500/[0.04] border-blue-500/15 text-blue-400",
    "deload-active": "bg-purple-500/[0.06] border-purple-500/20 text-purple-400",
    "deload-suggest": "bg-purple-500/[0.06] border-purple-500/20 text-purple-400",
    "legs-reminder": "bg-amber-500/[0.04] border-amber-500/15 text-amber-400",
    tip: "bg-zinc-500/[0.04] border-zinc-500/15 text-zinc-400",
  };

  const currentColors = colorMap[recommendation.type as keyof typeof colorMap] || colorMap.tip;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`glass-card p-4 border rounded-3xl flex gap-3.5 items-start ${currentColors}`}
    >
      <div className="w-9 h-9 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
        {recommendation.type.includes("deload") ? (
          <Brain size={18} className="text-purple-400" />
        ) : recommendation.type === "legs-reminder" ? (
          <Lightbulb size={18} className="text-amber-400" />
        ) : (
          <Sparkles size={18} className="text-blue-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="text-xs font-bold text-zinc-200">
          {recommendation.title}
        </h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {recommendation.text}
        </p>

        {recommendation.action && (
          <button
            onClick={recommendation.action.handler}
            className={`mt-1 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-colors border ${
              recommendation.type === "deload-active"
                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                : "bg-purple-500 hover:bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/10"
            }`}
          >
            {recommendation.action.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
