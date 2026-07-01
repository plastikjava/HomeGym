"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS_DE } from "@/types";

interface MuscleHeatmapProps {
  weeklyVolume: Record<string, number>; // category -> weekly sets count
}

/** Given a set count, return the zone color hex. */
function getVolumeColor(sets: number): string {
  if (sets === 0) return "#374151";
  if (sets <= 5) return "#ef4444";
  if (sets <= 11) return "#eab308";
  if (sets <= 20) return "#22c55e";
  return "#f97316";
}

/** Zone label for legend. */
const VOLUME_ZONES = [
  { color: "#374151", label: "Untrainiert", range: "0 Sätze" },
  { color: "#ef4444", label: "Unter MEV", range: "1–5 Sätze" },
  { color: "#eab308", label: "MEV–MAV", range: "6–11 Sätze" },
  { color: "#22c55e", label: "MAV Sweet Spot", range: "12–20 Sätze" },
  { color: "#f97316", label: "Nahe MRV", range: "21+ Sätze" },
];

/**
 * SVG muscle paths for a front-facing stylized body silhouette.
 * Each entry maps to an ExerciseCategory and has one or more SVG paths.
 * ViewBox is 200 × 380.
 */
const MUSCLE_PATHS: {
  category: string;
  label: string;
  paths: string[];
}[] = [
  {
    category: "shoulders",
    label: "Schultern",
    paths: [
      // Left deltoid
      "M58,95 Q48,90 40,100 Q36,108 38,118 L52,115 Q56,105 58,95 Z",
      // Right deltoid
      "M142,95 Q152,90 160,100 Q164,108 162,118 L148,115 Q144,105 142,95 Z",
    ],
  },
  {
    category: "chest",
    label: "Brust",
    paths: [
      // Left pec
      "M58,95 L68,92 Q80,88 100,90 L100,130 Q80,132 64,124 Q54,118 52,115 Z",
      // Right pec
      "M142,95 L132,92 Q120,88 100,90 L100,130 Q120,132 136,124 Q146,118 148,115 Z",
    ],
  },
  {
    category: "arms",
    label: "Arme",
    paths: [
      // Left arm (bicep + tricep)
      "M38,118 Q34,130 30,150 Q28,165 30,180 L44,180 Q48,165 48,150 Q50,135 52,115 Z",
      // Right arm
      "M162,118 Q166,130 170,150 Q172,165 170,180 L156,180 Q152,165 152,150 Q150,135 148,115 Z",
    ],
  },
  {
    category: "core",
    label: "Bauch",
    paths: [
      // Abs / obliques block
      "M72,130 L128,130 Q130,150 130,170 Q128,195 124,210 L76,210 Q72,195 70,170 Q70,150 72,130 Z",
    ],
  },
  {
    category: "back",
    label: "Rücken",
    paths: [
      // Left lat (visible as side wedge)
      "M52,115 Q50,135 50,150 L64,150 Q66,138 64,124 Z",
      // Right lat
      "M148,115 Q150,135 150,150 L136,150 Q134,138 136,124 Z",
    ],
  },
  {
    category: "legs",
    label: "Beine",
    paths: [
      // Left quad
      "M76,210 Q72,230 70,255 Q68,280 72,310 L96,310 Q100,280 100,255 Q100,230 100,210 Z",
      // Right quad
      "M124,210 Q128,230 130,255 Q132,280 128,310 L104,310 Q100,280 100,255 Q100,230 100,210 Z",
      // Left calf
      "M72,310 Q68,330 68,350 Q68,365 72,375 L94,375 Q96,365 96,350 Q96,330 96,310 Z",
      // Right calf
      "M128,310 Q132,330 132,350 Q132,365 128,375 L106,375 Q104,365 104,350 Q104,330 104,310 Z",
    ],
  },
];

export function MuscleHeatmap({ weeklyVolume }: MuscleHeatmapProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const activeData = activeGroup
    ? {
        label: CATEGORY_LABELS_DE[activeGroup] ?? activeGroup,
        sets: weeklyVolume[activeGroup] ?? 0,
      }
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg select-none">🏋️</span>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Muskel-Heatmap
        </h2>
      </div>

      {/* SVG Body */}
      <div className="flex justify-center relative">
        <svg
          viewBox="0 0 200 390"
          width={200}
          className="drop-shadow-lg select-none"
          role="img"
          aria-label="Muskel-Heatmap Körper-Silhouette"
        >
          {/* Head */}
          <circle cx={100} cy={40} r={24} fill="#1f2937" stroke="#4b5563" strokeWidth={1.5} />
          {/* Neck */}
          <rect x={92} y={64} width={16} height={18} rx={4} fill="#1f2937" />

          {/* Body outline (subtle background) */}
          <path
            d="M58,95 Q48,90 40,100 Q34,115 30,150 Q28,165 30,180 L44,180 Q48,165 48,150 Q50,135 52,115 L64,124 Q70,130 72,130 L72,210 Q70,230 68,255 Q66,280 72,310 Q68,330 68,350 Q68,370 72,375 L94,375 Q96,365 96,350 Q96,330 96,310 L100,310 L104,310 Q104,330 104,350 Q104,365 106,375 L128,375 Q132,370 132,350 Q132,330 128,310 Q132,280 130,255 Q128,230 124,210 L128,130 Q130,130 136,124 L148,115 Q150,135 152,150 Q152,165 156,180 L170,180 Q172,165 170,150 Q166,115 160,100 Q152,90 142,95 L132,92 Q120,86 100,88 Q80,86 68,92 Z"
            fill="#111827"
            stroke="#374151"
            strokeWidth={1}
            opacity={0.4}
          />

          {/* Muscle group paths */}
          {MUSCLE_PATHS.map((group) => {
            const sets = weeklyVolume[group.category] ?? 0;
            const color = getVolumeColor(sets);
            const isActive = activeGroup === group.category;

            return group.paths.map((d, i) => (
              <motion.path
                key={`${group.category}-${i}`}
                d={d}
                fill={color}
                stroke={isActive ? "#ffffff" : "#1f2937"}
                strokeWidth={isActive ? 2 : 1}
                style={{ cursor: "pointer" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0.85 }}
                transition={{ duration: 0.3 }}
                whileHover={{ opacity: 1, scale: 1.02 }}
                whileTap={{ opacity: 1 }}
                onPointerEnter={() => setActiveGroup(group.category)}
                onPointerLeave={() => setActiveGroup(null)}
                onPointerDown={() =>
                  setActiveGroup((prev) =>
                    prev === group.category ? null : group.category
                  )
                }
              />
            ));
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {activeData && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="absolute top-2 right-2 px-3 py-2 rounded-xl bg-zinc-800/90 backdrop-blur-md border border-zinc-700/60 shadow-xl pointer-events-none"
            >
              <p className="text-xs font-bold text-white">{activeData.label}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {activeData.sets} {activeData.sets === 1 ? "Satz" : "Sätze"} / Woche
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {VOLUME_ZONES.map((zone) => (
          <div key={zone.color} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            <span className="text-[10px] text-zinc-400 leading-tight">
              <span className="font-semibold text-zinc-300">{zone.label}</span>{" "}
              {zone.range}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
