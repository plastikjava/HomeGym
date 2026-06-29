"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Dumbbell,
  X,
  Sparkles,
  Play,
  Check,
  ChevronRight,
  Info,
  Globe,
} from "lucide-react";
import { useExerciseStore } from "@/stores/exerciseStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { fetchWgerExercises, fetchExerciseGif, getYouTubeEmbedUrl } from "@/lib/api";
import type { ExerciseCategory, Exercise, EquipmentType } from "@/types";

const categoryLabels: Record<ExerciseCategory, string> = {
  chest: "Brust",
  back: "Rücken",
  shoulders: "Schultern",
  arms: "Arme",
  legs: "Beine",
  core: "Bauch",
  cardio: "Cardio",
  full_body: "Ganzkörper",
};

const categoryColors: Record<ExerciseCategory, string> = {
  chest: "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400",
  back: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-blue-400",
  shoulders: "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:text-purple-400",
  arms: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400",
  legs: "bg-green-500/10 text-green-500 border-green-500/20 dark:text-green-400",
  core: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20 dark:text-cyan-400",
  cardio: "bg-pink-500/10 text-pink-500 border-pink-500/20 dark:text-pink-400",
  full_body: "bg-teal-500/10 text-teal-500 border-teal-500/20 dark:text-teal-400",
};

const equipmentLabels: Record<EquipmentType, string> = {
  adjustable_dumbbells: "Kurzhanteln",
  pull_up_bar: "Klimmzugstange",
  resistance_bands: "Bänder",
  bodyweight: "Eigengewicht",
  barbell: "Langhantel",
  cable_machine: "Kabelzug",
  kettlebell: "Kettlebell",
  bench: "Hantelbank",
  other: "Sonstiges",
};

export default function ExercisesPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | "all">("all");
  
  // Filtering & loading states
  const [filterOnlyOwnedEquipment, setFilterOnlyOwnedEquipment] = useState(true);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiLoadedCount, setApiLoadedCount] = useState(0);

  // Modals state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showEquipmentSettingsModal, setShowEquipmentSettingsModal] = useState(false);

  // Custom exercise form state
  const [customNameEn, setCustomNameEn] = useState("");
  const [customNameDe, setCustomNameDe] = useState("");
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>("chest");
  const [customDescription, setCustomDescription] = useState("");
  const [customMuscles, setCustomMuscles] = useState("");
  const [customEquipment, setCustomEquipment] = useState<EquipmentType[]>(["bodyweight"]);

  const exercises = useExerciseStore((s) => s.exercises);
  const addExercise = useExerciseStore((s) => s.addExercise);
  const addExercises = useExerciseStore((s) => s.addExercises);
  const updateExercise = useExerciseStore((s) => s.updateExercise);

  const availableEquipment = useSettingsStore((s) => s.settings.availableEquipment);
  const toggleEquipment = useSettingsStore((s) => s.toggleEquipment);

  const [currentGifUrl, setCurrentGifUrl] = useState<string | null>(null);
  const [loadingGif, setLoadingGif] = useState(false);

  useEffect(() => {
    setMounted(true);
    useExerciseStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!selectedExercise) {
      setCurrentGifUrl(null);
      return;
    }

    if (selectedExercise.gifUrl) {
      setCurrentGifUrl(selectedExercise.gifUrl);
      return;
    }

    if (selectedExercise.isCustom) {
      setCurrentGifUrl(null);
      return;
    }

    const loadGif = async () => {
      setLoadingGif(true);
      try {
        const url = await fetchExerciseGif(selectedExercise.nameEn);
        if (url) {
          setCurrentGifUrl(url);
          updateExercise(selectedExercise.id, { gifUrl: url });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGif(false);
      }
    };

    loadGif();
  }, [selectedExercise, updateExercise]);

  const handleFetchFromApi = async () => {
    setLoadingApi(true);
    try {
      // Fetch some wger exercises. Limit 50 for quick download.
      const apiExercises = await fetchWgerExercises(50, apiLoadedCount);
      addExercises(apiExercises);
      setApiLoadedCount((prev) => prev + apiExercises.length);
      alert(`${apiExercises.length} Übungen erfolgreich online nachgeladen!`);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Laden der API-Übungen.");
    } finally {
      setLoadingApi(false);
    }
  };

  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameEn.trim()) return;

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      nameEn: customNameEn,
      nameDe: customNameDe ? customNameDe : undefined,
      category: customCategory,
      description: customDescription,
      primaryMuscles: customMuscles
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      equipment: customEquipment,
      isCustom: true,
    };

    addExercise(newExercise);
    setShowAddCustomModal(false);
    
    // Reset Form
    setCustomNameEn("");
    setCustomNameDe("");
    setCustomCategory("chest");
    setCustomDescription("");
    setCustomMuscles("");
    setCustomEquipment(["bodyweight"]);
  };

  const handleEquipmentCheckboxChange = (eq: EquipmentType) => {
    if (customEquipment.includes(eq)) {
      setCustomEquipment(customEquipment.filter((item) => item !== eq));
    } else {
      setCustomEquipment([...customEquipment, eq]);
    }
  };

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.nameEn.toLowerCase().includes(q) ||
          (e.nameDe && e.nameDe.toLowerCase().includes(q)) ||
          e.primaryMuscles.some((m) => m.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((e) => e.category === selectedCategory);
    }

    if (filterOnlyOwnedEquipment) {
      result = result.filter((e) =>
        e.equipment.some((eq) => availableEquipment.includes(eq))
      );
    }

    return result;
  }, [exercises, searchQuery, selectedCategory, filterOnlyOwnedEquipment, availableEquipment]);

  if (!mounted) return null;

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Übungs-Datenbank</h1>
            <p className="text-[var(--muted)] text-sm mt-1">
              {filteredExercises.length} von {exercises.length} Übungen
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEquipmentSettingsModal(true)}
              className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 transition-colors"
              title="Ausrüstung verwalten"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              title="Übung erstellen"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Übung suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-[var(--muted-light)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          )}
        </div>

        {/* Equipment Filter Toggle */}
        <div className="flex items-center justify-between mt-3 px-1">
          <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterOnlyOwnedEquipment}
              onChange={(e) => setFilterOnlyOwnedEquipment(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--card-border)] text-blue-500 focus:ring-blue-500/50 bg-[var(--surface)]"
            />
            <span>Nur Übungen für meine Ausrüstung ({availableEquipment.length} aktiv)</span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-500/15 text-blue-500 border-blue-500/20 dark:text-blue-400"
                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--card-border)]"
            }`}
          >
            Alle
          </button>
          {(Object.keys(categoryLabels) as ExerciseCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
                selectedCategory === cat
                  ? categoryColors[cat]
                  : "bg-[var(--surface)] text-[var(--muted)] border-[var(--card-border)]"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Online Load Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4 border border-blue-500/10 mb-4 bg-blue-500/[0.02] flex items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs text-blue-500 font-semibold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>wger API Integration</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Hunderte Übungen online laden.
          </p>
        </div>
        <button
          onClick={handleFetchFromApi}
          disabled={loadingApi}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {loadingApi ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Online laden
        </button>
      </motion.div>

      {/* Exercise List */}
      <div className="space-y-2">
        {filteredExercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.2) }}
            onClick={() => setSelectedExercise(exercise)}
            className="glass-card p-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  categoryColors[exercise.category].split(" ")[0]
                }`}
              >
                <Dumbbell className={`w-4.5 h-4.5 ${categoryColors[exercise.category].split(" ")[1]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{exercise.nameEn}</h3>
                  {exercise.isCustom && (
                    <span className="text-[9px] px-1.5 py-0.25 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                      Eigene
                    </span>
                  )}
                </div>
                {exercise.nameDe && (
                  <p className="text-xs text-[var(--muted-light)] truncate">
                    ({exercise.nameDe})
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {exercise.equipment.slice(0, 2).map((eq) => (
                    <span
                      key={eq}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted-light)]"
                    >
                      {equipmentLabels[eq] || eq}
                    </span>
                  ))}
                  {exercise.equipment.length > 2 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted-light)]">
                      +{exercise.equipment.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${
                  categoryColors[exercise.category]
                }`}
              >
                {categoryLabels[exercise.category]}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
            </div>
          </motion.div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center mt-4"
        >
          <Search className="w-12 h-12 text-[var(--muted-light)] mx-auto mb-3" />
          <p className="text-[var(--muted)]">Keine Übungen gefunden.</p>
        </motion.div>
      )}

      {/* ========================================================
          MODAL: Exercise Details
          ======================================================== */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="glass-card w-full max-w-sm overflow-hidden z-10 p-6 flex flex-col relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedExercise(null)}
                className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 mt-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block mb-2 ${
                    categoryColors[selectedExercise.category]
                  }`}
                >
                  {categoryLabels[selectedExercise.category]}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  {selectedExercise.nameEn}
                </h2>
                {selectedExercise.nameDe && (
                  <p className="text-sm text-[var(--muted)] mt-0.5">
                    {selectedExercise.nameDe}
                  </p>
                )}
              </div>

              {/* Animated GIF or image preview / YouTube Embed */}
              <div className="w-full aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-[var(--card-border)] overflow-hidden flex items-center justify-center mb-4 relative">
                {selectedExercise.videoUrl && getYouTubeEmbedUrl(selectedExercise.videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedExercise.videoUrl) || ""}
                    title={selectedExercise.nameEn}
                    className="w-full h-full border-0 pointer-events-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : loadingGif ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[var(--muted)]">Lade Demo-GIF...</span>
                  </div>
                ) : currentGifUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentGifUrl}
                    alt={selectedExercise.nameEn}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : selectedExercise.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedExercise.imageUrl}
                    alt={selectedExercise.nameEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4 flex flex-col items-center gap-2">
                    <Dumbbell className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Keine Bildvorschau vorhanden</span>
                  </div>
                )}
              </div>

              {/* Muscles & Equipment */}
              <div className="space-y-3 py-3 border-t border-b border-zinc-100 dark:border-zinc-800/50">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Muskelgruppe
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.primaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="text-xs px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--card-border)] font-mono"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Ausrüstung
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="text-xs px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--card-border)]"
                      >
                        {equipmentLabels[eq] || eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedExercise.description && (
                <div className="my-4 flex-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Anleitung
                  </span>
                  <p className="text-xs text-[var(--muted)] leading-relaxed max-h-[160px] overflow-y-auto pr-1">
                    {selectedExercise.description}
                  </p>
                </div>
              )}

              {/* Custom video URL */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Eigene Video- / Shorts-URL (YouTube)
                </label>
                <input
                  type="text"
                  value={selectedExercise.videoUrl || ""}
                  onChange={(e) => {
                    const url = e.target.value;
                    updateExercise(selectedExercise.id, { videoUrl: url });
                    setSelectedExercise({ ...selectedExercise, videoUrl: url });
                  }}
                  placeholder="Z.B. https://youtube.com/shorts/... oder https://youtu.be/..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[var(--foreground)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
                />
                <p className="text-[9px] text-zinc-400 mt-1">
                  Füge hier ein YouTube-Video oder YouTube-Short ein, um die Animation oben zu ersetzen.
                </p>
              </div>

              {/* Media Fallback YouTube Link */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    selectedExercise.nameEn + " exercise demonstration"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-all font-semibold flex items-center justify-center gap-2 text-xs border border-red-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Video-Demo auf YouTube suchen
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: Add Custom Exercise
          ======================================================== */}
      <AnimatePresence>
        {showAddCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="glass-card w-full max-w-sm overflow-hidden z-10 p-6 flex flex-col relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold mb-4">Eigene Übung erstellen</h2>

              <form onSubmit={handleCreateCustomExercise} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Name (Englisch) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customNameEn}
                    onChange={(e) => setCustomNameEn(e.target.value)}
                    placeholder="e.g. Dumbbell Floor Press"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Name (Deutsch)
                  </label>
                  <input
                    type="text"
                    value={customNameDe}
                    onChange={(e) => setCustomNameDe(e.target.value)}
                    placeholder="e.g. Bodendrücken mit Kurzhanteln"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Kategorie
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ExerciseCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Beanspruchte Muskeln (Komma-getrennt)
                  </label>
                  <input
                    type="text"
                    value={customMuscles}
                    onChange={(e) => setCustomMuscles(e.target.value)}
                    placeholder="e.g. Chest, Triceps, Shoulders"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all font-mono placeholder:font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Benötigtes Equipment (Mehrfachauswahl)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(Object.keys(equipmentLabels) as EquipmentType[]).map((eq) => {
                      const isChecked = customEquipment.includes(eq);
                      return (
                        <label
                          key={eq}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400"
                              : "bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleEquipmentCheckboxChange(eq)}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isChecked ? "border-blue-500 text-blue-500" : "border-zinc-400 text-transparent"
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                          <span>{equipmentLabels[eq]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Beschreibung / Anleitung
                  </label>
                  <textarea
                    rows={3}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Anleitung zur Ausführung..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-accent py-3 mt-2 flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  Übung speichern
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: Equipment Settings
          ======================================================== */}
      <AnimatePresence>
        {showEquipmentSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEquipmentSettingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="glass-card w-full max-w-sm overflow-hidden z-10 p-6 flex flex-col relative max-h-[80vh]"
            >
              <button
                onClick={() => setShowEquipmentSettingsModal(false)}
                className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold mb-1">Meine Ausrüstung</h2>
              <p className="text-xs text-[var(--muted)] mb-4">
                Wähle die Ausrüstung aus, die du zu Hause hast. Übungen werden entsprechend gefiltert.
              </p>

              <div className="space-y-2 overflow-y-auto max-h-[40vh] pr-1 mb-4">
                {(Object.keys(equipmentLabels) as EquipmentType[]).map((eq) => {
                  const isChecked = availableEquipment.includes(eq);
                  return (
                    <label
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400 font-semibold"
                          : "bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]"
                      }`}
                    >
                      <span>{equipmentLabels[eq]}</span>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isChecked ? "border-blue-500 text-blue-500" : "border-zinc-400"
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={() => setShowEquipmentSettingsModal(false)}
                className="w-full btn-accent py-3 flex items-center justify-center gap-2 text-sm"
              >
                Fertig
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
