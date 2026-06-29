"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight, Dumbbell } from "lucide-react";
import { usePlanStore } from "@/stores/planStore";
import { useExerciseStore } from "@/stores/exerciseStore";

export default function PlansPage() {
  const [mounted, setMounted] = useState(false);
  const plans = usePlanStore((s) => s.plans);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const setActivePlan = usePlanStore((s) => s.setActivePlan);
  const exercises = useExerciseStore((s) => s.exercises);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Trainingspläne</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Verwalte deine Trainingspläne
          </p>
        </div>
        <button className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      <div className="space-y-3">
        {plans.map((plan, index) => {
          const isActive = plan.id === activePlanId;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActivePlan(plan.id)}
              className={`glass-card p-4 cursor-pointer transition-all ${
                isActive ? "ring-2 ring-blue-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">
                        Aktiv
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3">
                    {plan.days.map((day) => (
                      <div key={day.id} className="text-xs">
                        <span className="text-[var(--muted-light)]">{day.name.split(":")[0]}</span>
                        <div className="flex gap-1 mt-1">
                          {day.focusAreas.map((area) => (
                            <span
                              key={area}
                              className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] text-[10px]"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--muted-light)] flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center mt-4"
        >
          <Dumbbell className="w-12 h-12 text-[var(--muted-light)] mx-auto mb-3" />
          <p className="text-[var(--muted)]">
            Noch keine Trainingspläne erstellt.
          </p>
          <button className="btn-accent mt-4 text-sm">
            <Plus className="w-4 h-4 inline mr-1" />
            Plan erstellen
          </button>
        </motion.div>
      )}
    </div>
  );
}
