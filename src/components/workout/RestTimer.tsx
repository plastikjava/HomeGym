'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, SkipForward, Plus, Play, Pause } from 'lucide-react';
import type { SetType } from '@/types';

function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playSingleBeep = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      osc.start(time);
      osc.stop(time + 0.25);
    };

    const now = ctx.currentTime;
    playSingleBeep(now, 880); // A5 note
    playSingleBeep(now + 0.3, 880); // A5 note again
  } catch (err) {
    console.error("Failed to play beep:", err);
  }
}

interface RestTimerProps {
  duration: number;
  isActive: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  setType: SetType;
}

const RING_SIZE = 120;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RestTimer({
  duration,
  isActive,
  onComplete,
  onDismiss,
  setType,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [pulsing, setPulsing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompleted = useRef(false);

  // Reset when duration or active state changes
  useEffect(() => {
    if (isActive) {
      setRemaining(duration);
      setTotalDuration(duration);
      hasCompleted.current = false;
      setPulsing(false);
      setIsPaused(false);
    }
  }, [duration, isActive]);

  // Countdown interval
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused]);

  // Fire onComplete when timer reaches 0
  useEffect(() => {
    if (remaining === 0 && isActive && !hasCompleted.current) {
      hasCompleted.current = true;
      setPulsing(true);
      
      // Play audio alarm signal
      playBeep();

      const timeout = setTimeout(() => {
        onComplete();
        setPulsing(false);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [remaining, isActive, onComplete]);

  const handleExtend = useCallback(() => {
    setRemaining((prev) => prev + 30);
    setTotalDuration((prev) => prev + 30);
  }, []);

  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isWarmup = setType === 'warmup';
  const ringColor = isWarmup ? '#eab308' : '#3b82f6';
  const ringTrackColor = isWarmup
    ? 'rgba(234, 179, 8, 0.12)'
    : 'rgba(59, 130, 246, 0.12)';
  const label = isWarmup ? 'Aufwärmpause' : 'Arbeitspause';

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Timer panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md rounded-t-3xl bg-zinc-900/95 ring-1 ring-white/[0.08] backdrop-blur-xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-white/[0.15]" />
            </div>

            <div className="flex flex-col items-center px-6 pb-20 pt-2">
              {/* Circular progress ring */}
              <motion.div
                animate={
                  pulsing
                    ? {
                        scale: [1, 1.08, 1],
                        transition: {
                          duration: 0.5,
                          repeat: 1,
                          ease: 'easeInOut',
                        },
                      }
                    : {}
                }
                className="relative"
              >
                <svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  className="-rotate-90"
                >
                  {/* Track */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={ringTrackColor}
                    strokeWidth={STROKE_WIDTH}
                  />
                  {/* Progress */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transition: isPaused ? 'none' : 'stroke-dashoffset 1s linear',
                    }}
                  />
                </svg>

                {/* Center time */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">
                    {formatTime(remaining)}
                  </span>
                </div>
              </motion.div>

              {/* Labels */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <Timer
                    size={14}
                    style={{ color: ringColor }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: ringColor }}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {formatTime(totalDuration)} gesamt
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] py-3 text-xs font-medium text-zinc-300 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.1] active:bg-white/[0.14]"
                >
                  {isPaused ? <Play size={14} className="fill-current" /> : <Pause size={14} />}
                  <span>{isPaused ? 'Start' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] py-3 text-xs font-medium text-zinc-300 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.1] active:bg-white/[0.14]"
                >
                  <SkipForward size={14} />
                  <span>Skip</span>
                </button>
                <button
                  type="button"
                  onClick={handleExtend}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors ring-1"
                  style={{
                    backgroundColor: `${ringColor}15`,
                    color: ringColor,
                    // @ts-expect-error CSS custom ring color
                    '--tw-ring-color': `${ringColor}30`,
                  }}
                >
                  <Plus size={14} />
                  <span>+30s</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
