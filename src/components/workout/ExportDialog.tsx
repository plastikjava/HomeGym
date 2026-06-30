"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clipboard, Check, X, AlertCircle } from "lucide-react";
import { WorkoutSession, Exercise } from "@/types";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format, parseISO } from "date-fns";

interface ExportDialogProps {
  session: WorkoutSession;
  exercises: Exercise[];
  onClose: () => void;
}

export function generateWorkoutExportText(session: WorkoutSession, exercises: Exercise[]): string {
  // If notes is already a pre-saved custom export, return it
  if (session.notes && (session.notes.startsWith("Training") || session.notes.includes("kg x"))) {
    return session.notes;
  }

  const dateStr = session.completedAt
    ? format(parseISO(session.completedAt), "dd.MM.yyyy")
    : format(new Date(), "dd.MM.yyyy");

  const start = new Date(session.startedAt).getTime();
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const durationMin = Math.round((end - start) / 60000);

  let hrDetails = "";
  if (session.avgHeartRate && session.maxHeartRate) {
    hrDetails = ` - Ø Puls: ${session.avgHeartRate} bpm, Max: ${session.maxHeartRate} bpm`;
  }

  const header = `Training ${dateStr} (${durationMin} Min${hrDetails})\n`;

  const exercisesText = session.exercises
    .map((we) => {
      const ex = exercises.find((e) => e.id === we.exerciseId);
      const exName = ex?.nameEn || we.exerciseId;

      const completedSets = we.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return "";

      const warmups = completedSets.filter((s) => s.type === "warmup");
      const workings = completedSets.filter((s) => s.type === "working");

      const warmupStr = warmups
        .map((s, idx) => `W${idx + 1}: ${s.weight} kg x ${s.reps}`)
        .join(" ");

      const workingStr = workings
        .map((s, idx) => `S${idx + 1}: ${s.weight} kg x ${s.reps}`)
        .join(" ");

      const parts = [];
      if (warmupStr) parts.push(warmupStr);
      if (workingStr) parts.push(workingStr);

      return `${exName} ${parts.join(" ")}`;
    })
    .filter(Boolean)
    .join("\n");

  return header + exercisesText;
}

export default function ExportDialog({ session, exercises, onClose }: ExportDialogProps) {
  const updateWorkoutSession = useWorkoutStore((s) => s.updateWorkoutSession);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);

  // Initialize and auto-copy to clipboard
  useEffect(() => {
    const exportText = generateWorkoutExportText(session, exercises);
    setText(exportText);

    if (exportText.trim()) {
      navigator.clipboard.writeText(exportText)
        .then(() => {
          setCopied(true);
          setAutoCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn("Failed to auto-copy to clipboard:", err);
        });
    }
  }, [session, exercises]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        alert("Kopieren fehlgeschlagen.");
      });
  };

  const handleSave = () => {
    updateWorkoutSession(session.id, { notes: text });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl p-5 space-y-4 z-10 flex flex-col overflow-hidden"
      >
        {/* Glowing aura */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm text-zinc-100">Workout exportieren</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/[0.04] text-zinc-400">
            <X size={14} />
          </button>
        </div>

        {/* Explanation */}
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Kopiere deine gemachten Übungen im kompakten W1/S1-Format für deine Notizen oder Chat-Gruppen.
        </p>

        {/* Text Area */}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setAutoCopied(false); // Reset auto-copied toast if user edits manually
            }}
            rows={8}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Auto copied indicator */}
        {autoCopied && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl">
            <Check size={12} />
            <span>Automatisch in die Zwischenablage kopiert!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-zinc-900">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Kopiert!</span>
              </>
            ) : (
              <>
                <Clipboard size={14} />
                Kopieren
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition-colors"
          >
            Kopieren & Speichern
          </button>
        </div>
      </motion.div>
    </div>
  );
}
