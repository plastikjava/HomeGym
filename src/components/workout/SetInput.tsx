'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, X } from 'lucide-react';
import type { WorkoutSet } from '@/types';

interface SetInputProps {
  set: WorkoutSet;
  index: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onRemove: () => void;
}

export default function SetInput({
  set,
  index,
  onUpdate,
  onComplete,
  onRemove,
}: SetInputProps) {
  const isWarmup = set.type === 'warmup';

  const handleRepsChange = useCallback(
    (delta: number) => {
      const next = Math.max(0, set.reps + delta);
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
          : 'bg-white/[0.04] ring-1 ring-white/[0.06]'
      }`}
    >
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
          aria-label="Wiederholungen verringern"
        >
          <Minus size={14} />
        </button>
        <div className="flex w-10 flex-col items-center">
          <span className="text-base font-semibold text-zinc-100 tabular-nums">
            {set.reps}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">
            Wdh
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleRepsChange(1)}
          disabled={set.completed}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 active:bg-white/[0.12] disabled:opacity-30"
          aria-label="Wiederholungen erhöhen"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/[0.08]" />

      {/* Weight stepper */}
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

      {/* Complete button */}
      <button
        type="button"
        onClick={onComplete}
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
    </motion.div>
  );
}
