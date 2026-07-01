'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Target, Info, Play, Dumbbell, Timer, Flame, Trophy } from 'lucide-react';
import { useWorkoutStore } from '@/stores/workoutStore';
import type {
  Exercise,
  PlanExercise,
  WorkoutExercise,
  WorkoutSet,
  SetType,
} from '@/types';
import {
  CATEGORY_COLORS as categoryColors,
  CATEGORY_LABELS_DE as categoryLabels,
} from '@/types';
import SetInput from './SetInput';
import { useExerciseStore } from '@/stores/exerciseStore';
import { usePlanStore } from '@/stores/planStore';
import { fetchExerciseGif, getYouTubeEmbedUrl, PROGRESSION_STEPS, ALLOWED_DUMBBELL_WEIGHTS, getPersonalRecord } from '@/lib/api';

const categoryBadgeColors: Record<string, string> = {
  chest: "bg-red-500/10 text-red-500 border border-red-500/20 dark:text-red-400",
  back: "bg-blue-500/10 text-blue-500 border border-blue-500/20 dark:text-blue-400",
  shoulders: "bg-purple-500/10 text-purple-500 border border-purple-500/20 dark:text-purple-400",
  arms: "bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:text-amber-400",
  legs: "bg-green-500/10 text-green-500 border border-green-500/20 dark:text-green-400",
  core: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 dark:text-cyan-400",
  cardio: "bg-pink-500/10 text-pink-500 border border-pink-500/20 dark:text-pink-400",
  full_body: "bg-teal-500/10 text-teal-500 border border-teal-500/20 dark:text-teal-400",
  other: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 dark:text-zinc-400",
};

interface ExerciseCardProps {
  exercise: Exercise;
  planExercise: PlanExercise;
  workoutExercise: WorkoutExercise;
  onAddSet: (type: SetType) => void;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onCompleteSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
}

function snapToDumbbellWeight(target: number): number {
  return ALLOWED_DUMBBELL_WEIGHTS.filter(w => w > 0).reduce((prev, curr) => 
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

export default function ExerciseCard({
  exercise,
  planExercise,
  workoutExercise,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onRemoveSet,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const [showProgressionMenu, setShowProgressionMenu] = useState(false);
  
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const pr = useMemo(() => getPersonalRecord(exercise.id, workoutHistory), [exercise.id, workoutHistory]);
  const [gifUrl, setGifUrl] = useState<string | null>(exercise.gifUrl || null);
  const [loadingGif, setLoadingGif] = useState(false);
  const updateExercise = useExerciseStore((s) => s.updateExercise);

  const getReferenceWeight = () => {
    // 1. Try history
    for (let i = workoutHistory.length - 1; i >= 0; i--) {
      const session = workoutHistory[i];
      const match = session.exercises.find((e) => e.exerciseId === exercise.id);
      if (match) {
        const completedSet = match.sets.find((s) => s.completed && s.type === 'working');
        if (completedSet) return completedSet.weight;
      }
    }
    // 2. Try current active sets
    const currentWorkingSet = workoutExercise.sets.find((s) => s.type === 'working' && s.weight > 0);
    if (currentWorkingSet) return currentWorkingSet.weight;
    
    return null;
  };

  const referenceWeight = getReferenceWeight();

  const needsWarmup = [
    'floor-press', 'overhead-press', 'pull-up', 
    'glute-bridge', 'hip-thrust', 'single-arm-row'
  ].includes(exercise.id);

  useEffect(() => {
    if (!showDemo || gifUrl || exercise.isCustom) return;

    const loadGif = async () => {
      setLoadingGif(true);
      try {
        const url = await fetchExerciseGif(exercise.nameEn);
        if (url) {
          setGifUrl(url);
          updateExercise(exercise.id, { gifUrl: url });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGif(false);
      }
    };

    loadGif();
  }, [showDemo, gifUrl, exercise.nameEn, exercise.id, exercise.isCustom, updateExercise]);

  const sets = workoutExercise.sets;
  const completedSets = sets.filter((s) => s.completed && s.type === 'working').length;
  const totalTargetSets = planExercise.targetSets;
  const progress =
    totalTargetSets > 0
      ? Math.min(completedSets / totalTargetSets, 1)
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] backdrop-blur-xl"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Exercise name */}
          <h3 className="text-base font-bold text-zinc-100 leading-tight truncate">
            {exercise.nameEn}
          </h3>
          {exercise.nameDe && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              ({exercise.nameDe})
            </p>
          )}

          {/* Muscle pills */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
              <span
                key={muscle}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400"
              >
                {muscle}
              </span>
            ))}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border flex-shrink-0 ${
                categoryBadgeColors[exercise.category] ?? categoryBadgeColors.other
              }`}
            >
              {categoryLabels[exercise.category]}
            </span>
          </div>
        </div>

        {/* Right side: progress + chevron */}
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {/* Collapsed summary */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-zinc-400 tabular-nums">
              {completedSets}/{totalTargetSets} Sätze
            </span>
            {/* Mini progress bar */}
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={false}
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-500"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </button>

      {/* ─── Target info ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 px-4 pb-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Target size={12} className="text-zinc-500" />
          <span>Ziel: {planExercise.targetSets} × {planExercise.targetReps}</span>
          {planExercise.targetWeight !== undefined && planExercise.targetWeight > 0 && (
            <span className="ml-1 font-semibold text-blue-400">({planExercise.targetWeight} kg)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Timer size={12} className="text-zinc-500" />
          <span>Pause: {['floor-press', 'overhead-press', 'pull-up', 'glute-bridge', 'hip-thrust', 'single-arm-row'].includes(exercise.id) ? '2 Min.' : '90 Sek.'}</span>
        </div>
        {pr && (
          <div className="flex items-center gap-1 text-amber-500/80 font-medium">
            <Trophy size={11} className="shrink-0" />
            <span>PR: {pr.isSeconds ? `${pr.reps} sek` : `${pr.weight} kg × ${pr.reps}`}</span>
          </div>
        )}
        {planExercise.notes && (
          <span className="italic text-zinc-600 truncate">
            – {planExercise.notes}
          </span>
        )}
        
        {/* Adjust Step Button */}
        {!['wall-sit', 'plank'].includes(exercise.id) && (
          <button
            type="button"
            onClick={() => setShowProgressionMenu(!showProgressionMenu)}
            className="ml-auto text-blue-400 hover:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
          >
            Progression anpassen
          </button>
        )}
      </div>

      {/* Progression Adjustment Menu */}
      <AnimatePresence>
        {showProgressionMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.05] bg-black/10 px-4 py-3 text-xs"
          >
            <div className="space-y-3">
              {/* Level Selector */}
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Progression-Stufe wählen (SBS Novice):
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {PROGRESSION_STEPS.map((step) => {
                    const isActive = planExercise.targetSets === step.sets && parseInt(planExercise.targetReps) === step.reps;
                    return (
                      <button
                        key={`${step.sets}x${step.reps}`}
                        type="button"
                        onClick={() => {
                          const activePlanId = usePlanStore.getState().activePlanId;
                          const activeWorkout = useWorkoutStore.getState().activeWorkout;
                          if (activePlanId && activeWorkout) {
                            usePlanStore.getState().updatePlanExercise(
                              activePlanId,
                              activeWorkout.planDayId,
                              exercise.id,
                              { targetSets: step.sets, targetReps: String(step.reps) }
                            );
                          }
                        }}
                        className={`py-1 rounded text-center font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-500 text-white font-bold'
                            : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.1]'
                        }`}
                      >
                        {step.sets} × {step.reps}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weight Selector */}
              {planExercise.targetWeight !== undefined && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Zielgewicht (Hantelstufe):
                  </p>
                  <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-1.5 border border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => {
                        const currentW = planExercise.targetWeight ?? 0;
                        const idx = ALLOWED_DUMBBELL_WEIGHTS.indexOf(currentW);
                        const nextIdx = idx > 0 ? idx - 1 : 0;
                        const nextWeight = ALLOWED_DUMBBELL_WEIGHTS[nextIdx]!;
                        const activePlanId = usePlanStore.getState().activePlanId;
                        const activeWorkout = useWorkoutStore.getState().activeWorkout;
                        if (activePlanId && activeWorkout) {
                          usePlanStore.getState().updatePlanExercise(
                            activePlanId,
                            activeWorkout.planDayId,
                            exercise.id,
                            { targetWeight: nextWeight }
                          );
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center font-bold text-zinc-300 hover:bg-white/[0.1] text-sm"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm text-zinc-200 font-bold">
                      {planExercise.targetWeight} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentW = planExercise.targetWeight ?? 0;
                        const idx = ALLOWED_DUMBBELL_WEIGHTS.indexOf(currentW);
                        const nextIdx = idx !== -1 && idx < ALLOWED_DUMBBELL_WEIGHTS.length - 1 ? idx + 1 : idx;
                        const nextWeight = ALLOWED_DUMBBELL_WEIGHTS[nextIdx]!;
                        const activePlanId = usePlanStore.getState().activePlanId;
                        const activeWorkout = useWorkoutStore.getState().activeWorkout;
                        if (activePlanId && activeWorkout) {
                          usePlanStore.getState().updatePlanExercise(
                            activePlanId,
                            activeWorkout.planDayId,
                            exercise.id,
                            { targetWeight: nextWeight }
                          );
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center font-bold text-zinc-300 hover:bg-white/[0.1] text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Progress dots ──────────────────────────────────────── */}
      <div className="flex gap-1.5 px-4 pb-3">
        {Array.from({ length: totalTargetSets }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < completedSets
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                : 'bg-white/[0.1]'
            }`}
          />
        ))}
      </div>

      {/* ─── Expanded body ──────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <div className="px-4 pb-2.5 flex items-center justify-between border-b border-white/[0.04] mb-3">
                <button
                  type="button"
                  onClick={() => setShowDemo(!showDemo)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Info size={14} />
                  <span>{showDemo ? "Demo ausblenden" : "Ausführung anzeigen"}</span>
                </button>
              </div>

              {showDemo && (
                <div className="px-4 pb-4">
                  <div className="w-full aspect-video rounded-xl bg-black/20 border border-white/[0.05] overflow-hidden flex items-center justify-center relative mb-3">
                    {exercise.videoUrl && getYouTubeEmbedUrl(exercise.videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(exercise.videoUrl) || ""}
                        title={exercise.nameEn}
                        className="w-full h-full border-0 pointer-events-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : loadingGif ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-zinc-500">Lade GIF...</span>
                      </div>
                    ) : gifUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={gifUrl} alt={exercise.nameEn} className="w-full h-full object-contain" />
                    ) : exercise.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={exercise.imageUrl} alt={exercise.nameEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                        <Dumbbell className="w-6 h-6 text-zinc-600" />
                        <span className="text-[10px] text-zinc-500">Keine Bildvorschau vorhanden</span>
                      </div>
                    )}
                  </div>
                  {exercise.description && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg mb-3">
                      {exercise.description}
                    </p>
                  )}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      exercise.nameEn + " exercise demonstration"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-red-500/20 bg-red-500/[0.03] text-red-500 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] transition-colors text-[10px] font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Auf YouTube ansehen (Realer Mensch)
                  </a>
                </div>
              )}
            </div>

            {needsWarmup && (
              <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-500 mb-1">
                  <Flame size={14} />
                  <span>Aufwärm-Empfehlung (1-2 Sätze)</span>
                </div>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  {exercise.id === 'pull-up' ? (
                    <>
                      <p>• Satz 1: Aktives Hängen / Scapula Pulls (Eigengewicht)</p>
                      <p>• Satz 2: Unterstützte Klimmzüge (mit Band oder Beine aufgestützt)</p>
                    </>
                  ) : referenceWeight ? (
                    <>
                      <p>• Satz 1 (50%): ~{snapToDumbbellWeight(referenceWeight * 0.5)} kg für 8-10 Wdh.</p>
                      <p>• Satz 2 (70%): ~{snapToDumbbellWeight(referenceWeight * 0.7)} kg für 4-6 Wdh.</p>
                      <p className="text-[10px] text-zinc-500 mt-1 italic">
                        Berechnet und angepasst auf deine Hantelstufen (Arbeitsgewicht: {referenceWeight} kg).
                      </p>
                    </>
                  ) : (
                    <>
                      <p>• Satz 1: 50% des Arbeitsgewichts (10 Wdh.)</p>
                      <p>• Satz 2: 70% des Arbeitsgewichts (5 Wdh.)</p>
                      <p className="text-[10px] text-zinc-500 mt-1 italic">
                        Trage ein Arbeitsgewicht ein, um konkrete Empfehlungen zu sehen.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 px-4 pb-2">
              <AnimatePresence mode="popLayout">
                {sets.map((set, i) => (
                  <SetInput
                    key={set.id}
                    set={set}
                    index={i}
                    onUpdate={(updates) => onUpdateSet(set.id, updates)}
                    onComplete={() => onCompleteSet(set.id)}
                    onRemove={() => onRemoveSet(set.id)}
                    isPullUp={exercise.id === 'pull-up'}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add set buttons */}
            <div className="flex gap-2 px-4 pb-4 pt-1">
              <button
                type="button"
                onClick={() => onAddSet('warmup')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.05] py-2.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/[0.1] active:bg-amber-500/[0.15]"
              >
                <Plus size={14} />
                Aufwärmsatz
              </button>
              <button
                type="button"
                onClick={() => onAddSet('working')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/[0.05] py-2.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/[0.1] active:bg-blue-500/[0.15]"
              >
                <Plus size={14} />
                Arbeitssatz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
