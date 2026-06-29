'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Dumbbell,
  Flame,
  Repeat,
  Trophy,
  X,
} from 'lucide-react';
import type { Exercise, WorkoutSession } from '@/types';

interface WorkoutSummaryProps {
  session: WorkoutSession;
  exercises: Exercise[];
  onClose: () => void;
}

// Simple confetti-like particles
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const color = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'][
    Math.floor(Math.abs(x * 6)) % 6
  ];

  return (
    <motion.div
      initial={{ y: -20, x: x * 100, opacity: 1, scale: 1 }}
      animate={{
        y: 300,
        x: x * 160,
        opacity: 0,
        scale: 0.5,
        rotate: x > 0 ? 360 : -360,
      }}
      transition={{
        duration: 2,
        delay,
        ease: 'easeOut',
      }}
      className="pointer-events-none absolute top-0 h-2 w-2 rounded-sm"
      style={{ backgroundColor: color, left: '50%' }}
    />
  );
}

export default function WorkoutSummary({
  session,
  exercises,
  onClose,
}: WorkoutSummaryProps) {
  const stats = useMemo(() => {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;

    const exerciseDetails: Array<{
      name: string;
      nameDe?: string;
      completedSets: number;
      totalSets: number;
    }> = [];

    for (const we of session.exercises) {
      const ex = exercises.find((e) => e.id === we.exerciseId);
      const completed = we.sets.filter((s) => s.completed);
      totalSets += completed.length;

      for (const s of completed) {
        totalReps += s.reps;
        totalVolume += s.reps * s.weight;
      }

      exerciseDetails.push({
        name: ex?.nameEn ?? we.exerciseId,
        nameDe: ex?.nameDe,
        completedSets: completed.length,
        totalSets: we.sets.length,
      });
    }

    // Duration in minutes
    const start = new Date(session.startedAt).getTime();
    const end = session.completedAt
      ? new Date(session.completedAt).getTime()
      : Date.now();
    const durationMin = Math.round((end - start) / 60000);

    return { totalSets, totalReps, totalVolume, durationMin, exerciseDetails };
  }, [session, exercises]);

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.6,
        x: (Math.random() - 0.5) * 2,
      })),
    [],
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-blue-500/[0.06]" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.1] rounded-3xl" />

          {/* Content */}
          <div className="relative px-6 pb-6 pt-5">
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] transition-colors"
              aria-label="Schließen"
            >
              <X size={16} />
            </button>

            {/* Confetti */}
            <div className="absolute inset-x-0 top-0 flex justify-center overflow-hidden h-80 pointer-events-none">
              {confettiParticles.map((p) => (
                <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
              ))}
            </div>

            {/* Heading */}
            <div className="flex flex-col items-center pt-2 pb-5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  stiffness: 200,
                  delay: 0.15,
                }}
              >
                <Trophy size={40} className="text-amber-400" />
              </motion.div>
              <h2 className="mt-3 text-xl font-bold text-zinc-100">
                Workout abgeschlossen! 💪
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Hervorragende Arbeit!
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Clock size={18} />}
                label="Dauer"
                value={`${stats.durationMin} min`}
                color="text-blue-400"
                delay={0.1}
              />
              <StatCard
                icon={<Dumbbell size={18} />}
                label="Sätze"
                value={String(stats.totalSets)}
                color="text-emerald-400"
                delay={0.15}
              />
              <StatCard
                icon={<Repeat size={18} />}
                label="Wiederholungen"
                value={String(stats.totalReps)}
                color="text-purple-400"
                delay={0.2}
              />
              <StatCard
                icon={<Flame size={18} />}
                label="Volumen"
                value={`${stats.totalVolume.toLocaleString('de-DE')} kg`}
                color="text-amber-400"
                delay={0.25}
              />
            </div>

            {/* Exercise breakdown */}
            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Übungen
              </h3>
              <div className="space-y-1.5">
                {stats.exerciseDetails.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {ex.name}
                      </p>
                      {ex.nameDe && (
                        <p className="text-[10px] text-zinc-500 truncate">
                          ({ex.nameDe})
                        </p>
                      )}
                    </div>
                    <span className="ml-3 shrink-0 text-xs font-medium text-zinc-400 tabular-nums">
                      {ex.completedSets}/{ex.totalSets} Sätze
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA button */}
            <motion.button
              type="button"
              onClick={onClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-400 active:bg-emerald-600"
            >
              Zum Dashboard
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Stat card sub-component ───────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center rounded-xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/[0.06]"
    >
      <span className={color}>{icon}</span>
      <span className="mt-1.5 text-lg font-bold text-zinc-100 tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </motion.div>
  );
}
