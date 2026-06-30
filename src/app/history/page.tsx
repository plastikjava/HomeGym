"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Dumbbell, ChevronRight, X, Trash2, Clipboard, Trophy, TrendingUp } from "lucide-react";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { usePlanStore } from "@/stores/planStore";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { WorkoutSession, Exercise, WorkoutPlan } from "@/types";
import ExportDialog from "@/components/workout/ExportDialog";
import { getPersonalRecord } from "@/lib/api";

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const deleteWorkoutSession = useWorkoutStore((s) => s.deleteWorkoutSession);
  const exercises = useExerciseStore((s) => s.exercises);
  const plans = usePlanStore((s) => s.plans);
  
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [selectedChartExerciseId, setSelectedChartExerciseId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort history by date, newest first
  const sortedHistory = useMemo(() => {
    return [...workoutHistory]
      .filter((w) => w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [workoutHistory]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof sortedHistory> = {};
    sortedHistory.forEach((session) => {
      const monthKey = format(parseISO(session.completedAt!), "MMMM yyyy", { locale: de });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(session);
    });
    return groups;
  }, [sortedHistory]);

  // Compute all exercises that have PRs
  const personalRecords = useMemo(() => {
    const list: Array<{ exercise: Exercise; record: any }> = [];
    exercises.forEach((ex) => {
      const rec = getPersonalRecord(ex.id, workoutHistory);
      if (rec) {
        list.push({ exercise: ex, record: rec });
      }
    });
    // Sort list by date newest first
    return list.sort((a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime());
  }, [exercises, workoutHistory]);

  // Set default exercise for chart when component mounts or history updates
  useEffect(() => {
    if (personalRecords.length > 0 && !selectedChartExerciseId) {
      setSelectedChartExerciseId(personalRecords[0].exercise.id);
    }
  }, [personalRecords, selectedChartExerciseId]);

  // Generate chart data points
  const chartPoints = useMemo(() => {
    if (!selectedChartExerciseId) return [];
    
    const points: Array<{ date: string; displayDate: string; value: number; label: string; isSeconds: boolean }> = [];
    
    // Sort chronologically (oldest to newest)
    const chronoHistory = [...workoutHistory]
      .filter((w) => w.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    chronoHistory.forEach((session) => {
      const match = session.exercises.find((e) => e.exerciseId === selectedChartExerciseId);
      if (match) {
        let maxVal = 0;
        let isSec = false;
        match.sets.forEach((s) => {
          if (s.completed && s.type === "working") {
            if (s.isSeconds) {
              maxVal = Math.max(maxVal, s.reps);
              isSec = true;
            } else {
              maxVal = Math.max(maxVal, s.weight);
            }
          }
        });
        if (maxVal > 0) {
          const parsed = parseISO(session.completedAt!);
          points.push({
            date: session.completedAt!,
            displayDate: format(parsed, "dd.MM", { locale: de }),
            value: maxVal,
            label: isSec ? `${maxVal}s` : `${maxVal}kg`,
            isSeconds: isSec,
          });
        }
      }
    });

    return points;
  }, [selectedChartExerciseId, workoutHistory]);

  if (!mounted) return null;

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        <h1 className="text-2xl font-bold">Trainingshistorie</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {sortedHistory.length} abgeschlossene Trainings
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Trainingsverlauf
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stats"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Statistiken & Rekorde
        </button>
      </div>

      {activeTab === "history" ? (
        /* ─── HISTORY TAB ─────────────────────────────────────────── */
        sortedHistory.length === 0 ? (
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
            <div key={month} className="space-y-3">
              <h2 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mt-4 mb-2">
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
        )
      ) : (
        /* ─── STATS & RECORDS TAB ──────────────────────────────────── */
        <div className="space-y-6">
          {/* Progress Chart Card */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-sm text-zinc-100">Leistungsverlauf</h2>
              </div>
              
              {/* Exercise Selector */}
              {personalRecords.length > 0 && (
                <select
                  value={selectedChartExerciseId}
                  onChange={(e) => setSelectedChartExerciseId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                >
                  {personalRecords.map((item) => (
                    <option key={item.exercise.id} value={item.exercise.id}>
                      {item.exercise.nameEn}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {chartPoints.length >= 2 ? (
              /* Custom SVG Line Chart */
              <div className="pt-2">
                <div className="relative w-full h-[180px]">
                  <svg className="w-full h-full" viewBox="0 0 320 180">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="20" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="20" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="20" y1="140" x2="300" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {(() => {
                      const values = chartPoints.map((p) => p.value);
                      const maxVal = Math.max(...values, 1);
                      const minVal = Math.min(...values, 0);
                      const range = maxVal - minVal || 1;
                      const width = 320;
                      const height = 180;
                      const padX = 25;
                      const padY = 25;

                      const pts = chartPoints.map((p, idx) => {
                        const x = padX + (idx / (chartPoints.length - 1)) * (width - padX * 2);
                        const y = height - padY - ((p.value - minVal) / range) * (height - padY * 2);
                        return { x, y, ...p };
                      });

                      const pathD = `M ${pts[0]!.x} ${pts[0]!.y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
                      const areaD = `${pathD} L ${pts[pts.length - 1]!.x} 155 L ${pts[0]!.x} 155 Z`;

                      return (
                        <>
                          {/* Gradient fill */}
                          <path d={areaD} fill="url(#chartGradient)" />

                          {/* Line */}
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />

                          {/* Dots */}
                          {pts.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#09090b"
                                stroke="#3b82f6"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y - 8}
                                textAnchor="middle"
                                className="text-[8px] fill-zinc-400 font-bold font-mono"
                              >
                                {p.label}
                              </text>
                              <text
                                x={p.x}
                                y="168"
                                textAnchor="middle"
                                className="text-[8px] fill-zinc-500 font-semibold"
                              >
                                {p.displayDate}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Trage mindestens 2 Einheiten dieser Übung ein, um den Verlauf zu sehen.
              </div>
            )}
          </div>

          {/* Personal Records List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-sm text-zinc-100">Persönliche Rekorde (PR)</h2>
            </div>

            {personalRecords.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">Noch keine Rekorde aufgestellt.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {personalRecords.map(({ exercise, record }) => (
                  <div
                    key={exercise.id}
                    className="glass-card p-3 flex items-center justify-between hover:border-amber-500/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-200 block truncate">
                        {exercise.nameEn}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        erreicht am {format(parseISO(record.date), "dd.MM.yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl text-amber-400 text-xs font-bold font-mono">
                      🏆 {record.isSeconds ? `${record.reps} sek` : `${record.weight} kg × ${record.reps}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
                      {s.type === "warmup" ? `W${idx + 1}` : `S${idx + 1}`}: {s.isSeconds ? `${s.reps} sek` : `${s.weight}k x ${s.reps}`}
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
