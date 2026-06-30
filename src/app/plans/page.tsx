"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  Dumbbell,
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  PlusCircle,
  Minus,
  Trash,
  Check,
  Search,
} from "lucide-react";
import { usePlanStore } from "@/stores/planStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { getEstimatedWorkoutDuration } from "@/lib/api";
import { WorkoutPlan, PlanDay, PlanExercise, Exercise } from "@/types";

export default function PlansPage() {
  const [mounted, setMounted] = useState(false);
  const plans = usePlanStore((s) => s.plans);
  const activePlanId = usePlanStore((s) => s.activePlanId);
  const setActivePlan = usePlanStore((s) => s.setActivePlan);
  const addPlan = usePlanStore((s) => s.addPlan);
  const updatePlan = usePlanStore((s) => s.updatePlan);
  const deletePlan = usePlanStore((s) => s.deletePlan);
  
  const allExercises = useExerciseStore((s) => s.exercises);

  // UI state variables
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<WorkoutPlan | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<{ dayId: string } | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // ─── Plan Creator / Editor Action Handlers ──────────────────────────

  const handleStartCreatePlan = () => {
    const newPlanId = "custom-plan-" + Math.random().toString(36).substring(2, 9);
    const newPlan: WorkoutPlan = {
      id: newPlanId,
      name: "Neuer Trainingsplan",
      description: "Beschreibung deines Trainingsplans...",
      days: [
        {
          id: "day-1",
          name: "Tag 1: Ganzkörper",
          focusAreas: ["Full Body"],
          exercises: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditedPlan(newPlan);
    setSelectedPlanId(newPlanId);
    setIsEditing(true);
  };

  const handleStartEditPlan = () => {
    if (!selectedPlan) return;
    setEditedPlan(JSON.parse(JSON.stringify(selectedPlan))); // Deep copy
    setIsEditing(true);
  };

  const handleSavePlan = () => {
    if (!editedPlan) return;

    if (!editedPlan.name.trim()) {
      alert("Bitte gib einen Plannamen ein.");
      return;
    }

    const planExists = plans.some((p) => p.id === editedPlan.id);
    if (planExists) {
      updatePlan(editedPlan.id, editedPlan);
    } else {
      addPlan(editedPlan);
    }

    setIsEditing(false);
    setSelectedPlanId(editedPlan.id);
    setEditedPlan(null);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm("Möchtest du diesen Trainingsplan wirklich endgültig löschen?")) {
      deletePlan(planId);
      setSelectedPlanId(null);
      setIsEditing(false);
      setEditedPlan(null);
    }
  };

  const handleCancelEdit = () => {
    const planExists = plans.some((p) => p.id === editedPlan?.id);
    if (!planExists) {
      // If creating new plan, go back to list
      setSelectedPlanId(null);
    }
    setIsEditing(false);
    setEditedPlan(null);
  };

  // ─── Exercise List Modification Handlers (Within Edit Mode) ──────────

  const handleUpdatePlanExercise = (
    dayId: string,
    exerciseId: string,
    updates: Partial<PlanExercise>
  ) => {
    if (!editedPlan) return;
    setEditedPlan({
      ...editedPlan,
      days: editedPlan.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          exercises: d.exercises.map((e) =>
            e.exerciseId === exerciseId ? { ...e, ...updates } : e
          ),
        };
      }),
    });
  };

  const handleRemoveExercise = (dayId: string, exerciseId: string) => {
    if (!editedPlan) return;
    setEditedPlan({
      ...editedPlan,
      days: editedPlan.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          exercises: d.exercises.filter((e) => e.exerciseId !== exerciseId),
        };
      }),
    });
  };

  const handleAddExerciseToDay = (exerciseId: string) => {
    if (!editedPlan || !showAddExerciseModal) return;
    const { dayId } = showAddExerciseModal;

    const day = editedPlan.days.find((d) => d.id === dayId);
    if (!day) return;

    // Check if exercise already exists in this day
    if (day.exercises.some((e) => e.exerciseId === exerciseId)) {
      alert("Diese Übung befindet sich bereits an diesem Tag.");
      return;
    }

    const newPlanExercise: PlanExercise = {
      exerciseId,
      targetSets: 3,
      targetReps: "8-10",
      targetWeight: 0,
    };

    setEditedPlan({
      ...editedPlan,
      days: editedPlan.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          exercises: [...d.exercises, newPlanExercise],
        };
      }),
    });

    setShowAddExerciseModal(null);
    setExerciseSearchQuery("");
  };

  const handleAddDay = () => {
    if (!editedPlan) return;
    const newDayId = "day-" + (editedPlan.days.length + 1);
    const newDay: PlanDay = {
      id: newDayId,
      name: `Tag ${editedPlan.days.length + 1}: Split`,
      focusAreas: ["Split"],
      exercises: [],
    };
    setEditedPlan({
      ...editedPlan,
      days: [...editedPlan.days, newDay],
    });
  };

  const handleRemoveDay = (dayId: string) => {
    if (!editedPlan) return;
    if (editedPlan.days.length <= 1) {
      alert("Ein Trainingsplan muss mindestens einen Trainingstag enthalten.");
      return;
    }
    if (confirm("Möchtest du diesen Tag und alle seine Übungen wirklich entfernen?")) {
      setEditedPlan({
        ...editedPlan,
        days: editedPlan.days.filter((d) => d.id !== dayId),
      });
    }
  };

  const handleUpdateDayName = (dayId: string, newName: string) => {
    if (!editedPlan) return;
    setEditedPlan({
      ...editedPlan,
      days: editedPlan.days.map((d) =>
        d.id === dayId ? { ...d, name: newName } : d
      ),
    });
  };

  // ─── Filtered Exercises for the Add Modal ─────────────────────────

  const currentEditingDay = editedPlan?.days.find(d => d.id === showAddExerciseModal?.dayId);
  const focusAreas = currentEditingDay?.focusAreas || [];

  const getExerciseScore = (ex: Exercise) => {
    return focusAreas.some(area => {
      const areaLower = area.toLowerCase();
      const catLower = ex.category.toLowerCase();
      if (areaLower === catLower) return true;
      if (areaLower === "chest" && catLower === "chest") return true;
      if (areaLower === "arms" && catLower === "arms") return true;
      if (areaLower === "legs" && catLower === "legs") return true;
      if (areaLower === "core" && catLower === "core") return true;
      if (areaLower === "back" && catLower === "back") return true;
      if (areaLower === "shoulders" && catLower === "shoulders") return true;
      if (areaLower === "full body" || areaLower === "full_body" || areaLower === "ganzkörper") return true;
      
      if (areaLower.includes("brust") && catLower === "chest") return true;
      if (areaLower.includes("arm") && catLower === "arms") return true;
      if (areaLower.includes("bein") && catLower === "legs") return true;
      if (areaLower.includes("bauch") && catLower === "core") return true;
      if (areaLower.includes("rumpf") && catLower === "core") return true;
      if (areaLower.includes("rück") && catLower === "back") return true;
      if (areaLower.includes("schulter") && catLower === "shoulders") return true;
      return false;
    }) ? 1 : 0;
  };

  const filteredExercises = allExercises
    .filter((ex) => {
      const query = exerciseSearchQuery.toLowerCase();
      return (
        ex.nameEn.toLowerCase().includes(query) ||
        (ex.nameDe && ex.nameDe.toLowerCase().includes(query)) ||
        ex.category.toLowerCase().includes(query) ||
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const scoreA = getExerciseScore(a);
      const scoreB = getExerciseScore(b);
      return scoreB - scoreA;
    });

  // ─── Render Sub-Views ──────────────────────────────────────────────

  // 1. EDIT MODE
  if (isEditing && editedPlan) {
    return (
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <button
            onClick={handleCancelEdit}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-zinc-100">Plan bearbeiten</h1>
          <button
            onClick={handleSavePlan}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500 text-white font-semibold text-xs hover:bg-blue-600 transition-colors"
          >
            <Save size={14} />
            Speichern
          </button>
        </div>

        {/* Name & Description Inputs */}
        <div className="space-y-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-3xl">
          <div>
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
              Name des Trainingsplans
            </label>
            <input
              type="text"
              value={editedPlan.name}
              onChange={(e) => setEditedPlan({ ...editedPlan, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">
              Beschreibung
            </label>
            <textarea
              value={editedPlan.description || ""}
              onChange={(e) => setEditedPlan({ ...editedPlan, description: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-6">
          {editedPlan.days.map((day) => (
            <div
              key={day.id}
              className="bg-zinc-950/40 border border-zinc-900/80 p-4 rounded-3xl space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={day.name}
                  onChange={(e) => handleUpdateDayName(day.id, e.target.value)}
                  className="flex-1 bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-blue-500 py-1 font-bold text-sm text-zinc-200 focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveDay(day.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Tag entfernen"
                >
                  <Trash size={14} />
                </button>
              </div>

              {/* Exercises in Day */}
              <div className="space-y-3">
                {day.exercises.map((pe) => {
                  const ex = allExercises.find((e) => e.id === pe.exerciseId);
                  return (
                    <div
                      key={pe.exerciseId}
                      className="flex items-center justify-between gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-zinc-200 block truncate">
                          {ex?.nameEn || pe.exerciseId}
                        </span>
                        {ex?.nameDe && (
                          <span className="text-[10px] text-zinc-500 truncate block">
                            ({ex.nameDe})
                          </span>
                        )}
                      </div>

                      {/* Config Steppers */}
                      <div className="flex items-center gap-2">
                        {/* Sets */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                          <button
                            onClick={() =>
                              handleUpdatePlanExercise(day.id, pe.exerciseId, {
                                targetSets: Math.max(1, pe.targetSets - 1),
                              })
                            }
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-mono font-bold w-6 text-center text-zinc-300">
                            {pe.targetSets}s
                          </span>
                          <button
                            onClick={() =>
                              handleUpdatePlanExercise(day.id, pe.exerciseId, {
                                targetSets: pe.targetSets + 1,
                              })
                            }
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Reps Input */}
                        <input
                          type="text"
                          value={pe.targetReps}
                          onChange={(e) =>
                            handleUpdatePlanExercise(day.id, pe.exerciseId, {
                              targetReps: e.target.value,
                            })
                          }
                          placeholder="Reps"
                          className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-1 text-center font-mono text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                        />

                        {/* Weight Stepper */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                          <button
                            onClick={() =>
                              handleUpdatePlanExercise(day.id, pe.exerciseId, {
                                targetWeight: Math.max(0, (pe.targetWeight ?? 0) - 1),
                              })
                            }
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-mono font-bold w-10 text-center text-zinc-300">
                            {pe.targetWeight ?? 0}k
                          </span>
                          <button
                            onClick={() =>
                              handleUpdatePlanExercise(day.id, pe.exerciseId, {
                                targetWeight: (pe.targetWeight ?? 0) + 1,
                              })
                            }
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Delete exercise button */}
                        <button
                          onClick={() => handleRemoveExercise(day.id, pe.exerciseId)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Exercise Trigger Button */}
              <button
                onClick={() => setShowAddExerciseModal({ dayId: day.id })}
                className="w-full py-2.5 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-all"
              >
                <PlusCircle size={14} />
                Übung hinzufügen
              </button>
            </div>
          ))}
        </div>

        {/* Add Day Button */}
        <button
          onClick={handleAddDay}
          className="w-full py-3 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-all bg-white/[0.01]"
        >
          <Plus size={16} />
          Trainingstag hinzufügen
        </button>

        {/* Save & Cancel */}
        <div className="flex gap-3 pt-4 border-t border-zinc-900">
          <button
            onClick={handleCancelEdit}
            className="flex-1 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSavePlan}
            className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-semibold text-xs hover:bg-blue-600 transition-colors"
          >
            Plan speichern
          </button>
        </div>

        {/* Add Exercise Modal Overlay */}
        <AnimatePresence>
          {showAddExerciseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => {
                  setShowAddExerciseModal(null);
                  setExerciseSearchQuery("");
                }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl p-5 space-y-4 z-10 max-h-[80vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <h3 className="font-bold text-sm text-zinc-100">Übung hinzufügen</h3>
                  <button
                    onClick={() => {
                      setShowAddExerciseModal(null);
                      setExerciseSearchQuery("");
                    }}
                    className="p-1 rounded-lg bg-white/[0.04] text-zinc-400"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                  <input
                    type="text"
                    value={exerciseSearchQuery}
                    onChange={(e) => setExerciseSearchQuery(e.target.value)}
                    placeholder="Nach Übung, Muskel oder Kategorie suchen..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Results List */}
                <div className="overflow-y-auto flex-1 space-y-2 max-h-[40vh] pr-1">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleAddExerciseToDay(ex.id)}
                      className={`w-full flex items-center justify-between text-left p-3 rounded-2xl border transition-all ${
                        getExerciseScore(ex) === 1
                          ? "bg-emerald-500/[0.02] border-emerald-500/20 hover:bg-emerald-500/[0.04]"
                          : "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-200">
                            {ex.nameEn}
                          </span>
                          {getExerciseScore(ex) === 1 && (
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Empfohlen
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {ex.nameDe ? `${ex.nameDe} · ` : ""}{ex.primaryMuscles[0]}
                        </span>
                      </div>
                      <PlusCircle size={16} className="text-blue-500 shrink-0" />
                    </button>
                  ))}
                  {filteredExercises.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">
                      Keine passenden Übungen gefunden.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 2. VIEW DETAILS MODE
  if (selectedPlan) {
    const isActive = selectedPlan.id === activePlanId;
    return (
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <button
            onClick={() => setSelectedPlanId(null)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartEditPlan}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Plan bearbeiten"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDeletePlan(selectedPlan.id)}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Plan löschen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Plan Info Card */}
        <div className="bg-white/[0.01] border border-white/[0.04] p-5 rounded-3xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-100">{selectedPlan.name}</h1>
            {isActive && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                Aktiv
              </span>
            )}
          </div>
          {selectedPlan.description && (
            <p className="text-xs text-zinc-400 leading-relaxed">
              {selectedPlan.description}
            </p>
          )}

          {!isActive && (
            <button
              onClick={() => setActivePlan(selectedPlan.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition-colors pt-2"
            >
              <Check size={14} />
              Als aktiven Plan festlegen
            </button>
          )}
        </div>

        {/* Days & Exercises List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Trainingstage
          </h2>

          {selectedPlan.days.map((day) => {
            const estimatedDuration = getEstimatedWorkoutDuration(day.exercises);
            return (
              <div
                key={day.id}
                className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-3xl space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-zinc-200">{day.name}</h3>
                  <span className="text-[10px] font-mono font-semibold bg-white/[0.03] text-zinc-400 px-2 py-0.5 rounded-full border border-white/[0.05]">
                    ~{estimatedDuration} Min.
                  </span>
                </div>

                <div className="space-y-2">
                  {day.exercises.map((pe) => {
                    const ex = allExercises.find((e) => e.id === pe.exerciseId);
                    return (
                      <div
                        key={pe.exerciseId}
                        className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.01] border border-white/[0.03]"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-300 block truncate">
                            {ex?.nameEn || pe.exerciseId}
                          </span>
                          {ex?.nameDe && (
                            <span className="text-[10px] text-zinc-500 truncate block">
                              ({ex.nameDe})
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-400 whitespace-nowrap">
                          {pe.targetSets} × {pe.targetReps}
                          {pe.targetWeight && pe.targetWeight > 0
                            ? ` @ ${pe.targetWeight}kg`
                            : ""}
                        </span>
                      </div>
                    );
                  })}

                  {day.exercises.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-2 italic">
                      Noch keine Übungen für diesen Tag hinzugefügt.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. MAIN PLANS LIST VIEW
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
            Wähle oder bearbeite deine Trainingspläne
          </p>
        </div>
        <button
          onClick={handleStartCreatePlan}
          className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors"
          title="Plan erstellen"
        >
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
              onClick={() => setSelectedPlanId(plan.id)}
              className={`glass-card p-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all ${
                isActive ? "ring-2 ring-blue-500/40" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-100 truncate">
                      {plan.name}
                    </h3>
                    {isActive && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold shrink-0">
                        Aktiv
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 overflow-x-auto pb-1 scrollbar-none">
                    {plan.days.map((day) => (
                      <div key={day.id} className="text-[10px] shrink-0">
                        <span className="text-zinc-500 block truncate font-medium">
                          {day.name.split(":")[0]}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 font-semibold">
                          ~{getEstimatedWorkoutDuration(day.exercises)} Min.
                        </span>
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
          <button onClick={handleStartCreatePlan} className="btn-accent mt-4 text-sm">
            <Plus className="w-4 h-4 inline mr-1" />
            Plan erstellen
          </button>
        </motion.div>
      )}
    </div>
  );
}
