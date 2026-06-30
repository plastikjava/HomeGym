"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Dumbbell, ChevronRight, X, Trash2, Clipboard } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { usePlanStore } from "@/stores/planStore";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { WorkoutSession, Exercise, WorkoutPlan } from "@/types";
import ExportDialog from "@/components/workout/ExportDialog";

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const deleteWorkoutSession = useWorkoutStore((s) => s.deleteWorkoutSession);
  const exercises = useExerciseStore((s) => s.exercises);
  const plans = usePlanStore((s) => s.plans);
  
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Sort by date, newest first
  const sortedHistory = [...workoutHistory]
    .filter((w) => w.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  // Group by month
  const groupedByMonth: Record<string, typeof sortedHistory> = {};
  sortedHistory.forEach((session) => {
    const monthKey = format(parseISO(session.completedAt!), "MMMM yyyy", { locale: de });
    if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
    groupedByMonth[monthKey].push(session);
  });

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Trainingshistorie</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {sortedHistory.length} abgeschlossene Trainings
        </p>
      </motion.div>

      {sortedHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <Calendar className="w-12 h-12 text-[var(--muted-light)] mx-auto mb-3" />
          <p className="text-[var(--muted)] font-medium">Noch keine Trainings absolviert</p>
          <p className="text-xs text-[var(--muted-light)] mt-1">
            Starte dein erstes Workout und verfolge deinen Fortschritt!
          </p>
        </motion.div>
      ) : (
        Object.entries(groupedByMonth).map(([month, sessions]) => (
          <div key={month} className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
              {month}
            </h2>
            <div className="space-y-2">
              {sessions.map((session, index) => {
                const plan = plans.find((p) => p.id === session.planId);
                const planDay = plan?.days.find((d) => d.id === session.planDayId);
                const completedSets = session.exercises.reduce(
                  (t, e) => t + e.sets.filter((s) => s.completed).length,
                  0
                );
                const totalVolume = session.exercises.reduce(
                  (t, e) =>
                    t + e.sets.filter((s) => s.completed).reduce((st, s) => st + s.weight * s.reps, 0),
                  0
                );
                const duration = session.completedAt
                  ? Math.round(
                      (new Date(session.completedAt).getTime() -
                        new Date(session.startedAt).getTime()) /
                        60000
                    )
                  : 0;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedSession(session)}
                    className="glass-card p-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {planDay?.name || "Training"}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-[var(--muted)]">
                            {format(parseISO(session.completedAt!), "EEEE, d. MMM", { locale: de })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-[var(--muted-light)] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {duration} Min
                          </span>
                          <span className="text-[10px] text-[var(--muted-light)]">
                            {completedSets} Sätze
                          </span>
                          {totalVolume > 0 && (
                            <span className="text-[10px] text-[var(--muted-light)]">
                              {Math.round(totalVolume)} kg
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-light)] flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <WorkoutDetailModal
            session={selectedSession}
            exercises={exercises}
            plans={plans}
            onClose={() => setSelectedSession(null)}
            onDelete={() => {
              if (confirm("Möchtest du dieses Training wirklich dauerhaft aus der Historie löschen?")) {
                deleteWorkoutSession(selectedSession.id);
                setSelectedSession(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Workout Detail Modal Component ─────────────────────────────────
function WorkoutDetailModal({
  session,
  exercises,
  plans,
  onClose,
  onDelete,
}: {
  session: WorkoutSession;
  exercises: Exercise[];
  plans: WorkoutPlan[];
  onClose: () => void;
  onDelete: () => void;
}) {
  const [showExport, setShowExport] = useState(false);
  const plan = plans.find((p) => p.id === session.planId);
  const planDay = plan?.days.find((d) => d.id === session.planDayId);

  const completedSets = session.exercises.reduce(
    (t, e) => t + e.sets.filter((s) => s.completed).length,
    0
  );

  const totalVolume = session.exercises.reduce(
    (t, e) =>
      t + e.sets.filter((s) => s.completed).reduce((st, s) => st + s.weight * s.reps, 0),
    0
  );

  const duration = session.completedAt
    ? Math.round(
        (new Date(session.completedAt).getTime() -
          new Date(session.startedAt).getTime()) /
          60000
      )
    : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl p-5 space-y-4 z-10 flex flex-col"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <h3 className="font-bold text-sm text-zinc-100 truncate flex-1 pr-2">
            {planDay?.name || "Training Details"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
              title="Löschen"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-400">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-zinc-400">
          {format(parseISO(session.completedAt || session.date), "EEEE, d. MMMM yyyy", { locale: de })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl">
          <div className="text-center">
            <span className="text-[9px] text-zinc-500 block">Dauer</span>
            <span className="text-xs font-bold text-zinc-200 font-mono">{duration} Min</span>
          </div>
          <div className="text-center border-l border-white/[0.05]">
            <span className="text-[9px] text-zinc-500 block">Sätze</span>
            <span className="text-xs font-bold text-zinc-200 font-mono">{completedSets} Sätze</span>
          </div>
          <div className="text-center border-l border-white/[0.05]">
            <span className="text-[9px] text-zinc-500 block">Volumen</span>
            <span className="text-xs font-bold text-zinc-200 font-mono">{Math.round(totalVolume)} kg</span>
          </div>
        </div>

        {/* Heart Rate Stats if present */}
        {session.avgHeartRate && (
          <div className="grid grid-cols-2 gap-2 bg-red-500/[0.02] border border-red-500/10 p-3 rounded-2xl">
            <div className="text-center">
              <span className="text-[9px] text-zinc-500 block">Ø Puls</span>
              <span className="text-xs font-bold text-red-400 font-mono">❤️ {session.avgHeartRate} bpm</span>
            </div>
            <div className="text-center border-l border-white/[0.05]">
              <span className="text-[9px] text-zinc-500 block">Max Puls</span>
              <span className="text-xs font-bold text-red-400 font-mono">⚡ {session.maxHeartRate} bpm</span>
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-3 overflow-y-auto max-h-[30vh] pr-1">
          {session.exercises.map((we) => {
            const ex = exercises.find((e) => e.id === we.exerciseId);
            const compSets = we.sets.filter((s) => s.completed);
            if (compSets.length === 0) return null;

            return (
              <div key={we.exerciseId} className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-2xl space-y-2">
                <div>
                  <span className="text-xs font-bold text-zinc-300 block truncate">
                    {ex?.nameEn || we.exerciseId}
                  </span>
                  {ex?.nameDe && (
                    <span className="text-[9px] text-zinc-500 block truncate">
                      ({ex.nameDe})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {compSets.map((s, idx) => (
                    <span
                      key={s.id}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        s.type === "warmup"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {s.type === "warmup" ? `W${idx + 1}` : `S${idx + 1}`}: {s.weight}k x {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Copy Export Trigger */}
        <button
          onClick={() => setShowExport(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-colors"
        >
          <Clipboard size={14} />
          Text-Export kopieren / bearbeiten
        </button>

        <AnimatePresence>
          {showExport && (
            <ExportDialog
              session={session}
              exercises={exercises}
              onClose={() => setShowExport(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
