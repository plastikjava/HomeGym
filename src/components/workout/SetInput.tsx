'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, X, Clock, Dumbbell, Play, Pause } from 'lucide-react';
import type { WorkoutSet } from '@/types';

interface SetInputProps {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onRemove: () => void;
  isPullUp?: boolean;
  isTimedExercise?: boolean;
}

export default function SetInput({
  set,
  index,
  onUpdate,
  onComplete,
  onRemove,
  isPullUp,
  isTimedExercise,
}: SetInputProps) {
  const isWarmup = set.type === 'warmup';
  const isSecondsMode = !!(set.isSeconds || isTimedExercise);

  // ⏱️ Stopwatch Timer state & logic
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isStopwatchPaused, setIsStopwatchPaused] = useState(false);
  const stopwatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStopwatch = useCallback(() => {
    setElapsed(0);
    setIsStopwatchPaused(false);
    setStopwatchActive(true);

    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }

    stopwatchIntervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const togglePauseStopwatch = useCallback(() => {
    setIsStopwatchPaused((prev) => {
      const next = !prev;
      if (next) {
        if (stopwatchIntervalRef.current) {
          clearInterval(stopwatchIntervalRef.current);
          stopwatchIntervalRef.current = null;
        }
      } else {
        stopwatchIntervalRef.current = setInterval(() => {
          setElapsed((p) => p + 1);
        }, 1000);
      }
      return next;
    });
  }, []);

  const saveStopwatch = useCallback(() => {
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }
    onUpdate({ reps: elapsed });
    setStopwatchActive(false);
  }, [elapsed, onUpdate]);

  const cancelStopwatch = useCallback(() => {
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }
    setStopwatchActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, []);

  const handleRepsChange = useCallback(
    (delta: number) => {
      const step = 1; // Always increment/decrement by 1 (both for reps and seconds!)
      const next = Math.max(0, set.reps + delta * step);
      onUpdate({ reps: next });
    },
    [set.reps, onUpdate],
  );

  const handleWeightChange = useCallback(
    (delta: number) => {
      const allowedSteps = [0, 1.5, 3, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18];
      const current = set.weight;
      
      let next = current;
      if (delta > 0) {
        const step = allowedSteps.find((v) => v > current);
        if (step !== undefined) {
          next = step;
        }
      } else {
        const reverseSteps = [...allowedSteps].reverse();
        const step = reverseSteps.find((v) => v < current);
        if (step !== undefined) {
          next = step;
        }
      }
      onUpdate({ weight: next });
    },
    [set.weight, onUpdate],
  );

  return (
    <motion.div
      layout
      layoutId={set.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
        set.completed
          ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
          : stopwatchActive
          ? 'bg-blue-500/10 ring-1 ring-blue-500/30'
          : 'bg-white/[0.04] ring-1 ring-white/[0.06]'
      }`}
    >
      {stopwatchActive ? (
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-zinc-100 tabular-nums">
              Stoppuhr: {elapsed} Sek.
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={togglePauseStopwatch}
              className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-zinc-300 hover:bg-white/[0.1] active:scale-95 transition-all"
            >
              {isStopwatchPaused ? <Play size={10} className="mr-1" /> : <Pause size={10} className="mr-1" />}
              {isStopwatchPaused ? 'Weiter' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={saveStopwatch}
              className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-emerald-500 text-[10px] font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/15"
            >
              Sichern
            </button>
            <button
              type="button"
              onClick={cancelStopwatch}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
              title="Abbrechen"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Set number + type badge */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 w-10">
            <span className="text-[11px] font-medium text-zinc-500">
              #{index + 1}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                isWarmup
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {isWarmup ? 'W' : 'A'}
            </span>
            {isPullUp && !set.completed && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    isSeconds: !set.isSeconds,
                    reps: !set.isSeconds ? 30 : 8,
                    weight: !set.isSeconds ? 0 : set.weight,
                  })
                }
                className="mt-1 flex items-center justify-center p-1 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
                title={set.isSeconds ? "Auf Wiederholungen wechseln" : "Auf Sekunden (Dead Hang) wechseln"}
              >
                {set.isSeconds ? <Dumbbell size={10} /> : <Clock size={10} />}
              </button>
            )}
          </div>

          {/* Reps stepper */}
          <div
            className={`flex items-center gap-0.5 transition-opacity ${
              set.completed ? 'opacity-50' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => handleRepsChange(-1)}
              disabled={set.completed}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] disabled:opacity-30"
              aria-label={isSecondsMode ? "Sekunden verringern" : "Wiederholungen verringern"}
            >
              <Minus size={14} />
            </button>
            <div className="flex w-10 flex-col items-center">
              <span className="text-base font-semibold text-zinc-100 tabular-nums">
                {set.reps}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                {isSecondsMode ? 'Sek' : 'Wdh'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRepsChange(1)}
              disabled={set.completed}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] disabled:opacity-30"
              aria-label={isSecondsMode ? "Sekunden erhöhen" : "Wiederholungen erhöhen"}
            >
              <Plus size={14} />
            </button>

            {/* Inline Stopwatch toggle */}
            {isSecondsMode && !set.completed && (
              <button
                type="button"
                onClick={startStopwatch}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all ml-1.5 shrink-0"
                title="Stoppuhr starten"
              >
                <Clock size={12} />
              </button>
            )}
          </div>

          {/* Divider */}
          {!isSecondsMode && <div className="h-6 w-px bg-white/[0.08]" />}

          {/* Weight stepper */}
          {!isSecondsMode && (
            <div
              className={`flex items-center gap-0.5 transition-opacity ${
                set.completed ? 'opacity-50' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => handleWeightChange(-0.5)}
                disabled={set.completed}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] disabled:opacity-30"
                aria-label="Gewicht verringern"
              >
                <Minus size={14} />
              </button>
              <div className="flex w-14 flex-col items-center">
                <span className="text-base font-semibold text-zinc-100 tabular-nums">
                  {set.weight}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                  kg
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleWeightChange(0.5)}
                disabled={set.completed}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] disabled:opacity-30"
                aria-label="Gewicht erhöhen"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(40);
              }
              onComplete();
            }}
            className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              set.completed
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'border-zinc-600 text-zinc-600 hover:border-emerald-500/50 hover:text-emerald-500/50'
            }`}
            aria-label={set.completed ? 'Satz nicht abgeschlossen' : 'Satz abschließen'}
          >
            <Check size={16} strokeWidth={3} />
          </button>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            aria-label="Satz entfernen"
          >
            <X size={14} />
          </button>
        </>
      )}
    </motion.div>
  );
}
