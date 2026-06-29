'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  Upload,
  Clock,
  Dumbbell,
  Cloud,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { defaultEquipment } from '@/data/defaultPlans';
import { EquipmentType } from '@/types';
import { triggerGoogleAuth, downloadBackupFromGoogleDrive, uploadBackupToGoogleDrive } from '@/lib/googleDrive';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, setRestTimer, toggleEquipment, setGoogleClientId, setLastGoogleSync } = useSettingsStore();
  const [googleIdInput, setGoogleIdInput] = useState(settings.googleClientId || '');
  const [activeTab, setActiveTab] = useState<'general' | 'backup'>('general');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Local JSON Backup / Restore ───────────────────────────────────

  const handleExportBackup = () => {
    try {
      const backupData = {
        exercises: localStorage.getItem('homegym-exercises'),
        plans: localStorage.getItem('homegym-plans'),
        settings: localStorage.getItem('homegym-settings'),
        workouts: localStorage.getItem('homegym-workouts'),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `homegym_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Backup-Export fehlgeschlagen.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        if (!parsed.plans && !parsed.workouts && !parsed.settings) {
          throw new Error('Ungültiges Backup-Format.');
        }

        // Restore keys
        if (parsed.exercises) localStorage.setItem('homegym-exercises', parsed.exercises);
        if (parsed.plans) localStorage.setItem('homegym-plans', parsed.plans);
        if (parsed.settings) localStorage.setItem('homegym-settings', parsed.settings);
        if (parsed.workouts) localStorage.setItem('homegym-workouts', parsed.workouts);

        setImportStatus({
          type: 'success',
          message: 'Erfolgreich eingelesen! App lädt neu...',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Fehler beim Einlesen: Ungültige Backup-Datei.',
        });
      }
    };
    reader.readAsText(file);
  };

  // ─── Google Drive Manual Restore ───────────────────────────────────

  const handleSaveClientId = () => {
    setGoogleClientId(googleIdInput.trim());
    alert('Google Client-ID gespeichert.');
  };

  const handleGoogleRestore = async () => {
    if (!settings.googleClientId) {
      alert('Bitte trage zuerst eine Google Client-ID ein.');
      return;
    }

    setSyncLoading(true);
    try {
      // Trigger OAuth redirect, but we need token.
      // To trigger a restore flow, we can use the triggerGoogleAuth.
      // When redirected back, it will trigger the import automatically.
      // We will save a flag in sessionStorage to trigger 'restore' rather than 'backup' after OAuth.
      sessionStorage.setItem('google_drive_sync_action', 'restore');
      triggerGoogleAuth(settings.googleClientId);
    } catch (err) {
      console.error(err);
      setSyncLoading(false);
    }
  };

  const handleGoogleBackup = () => {
    if (!settings.googleClientId) {
      alert('Bitte trage zuerst eine Google Client-ID ein.');
      return;
    }
    sessionStorage.setItem('google_drive_sync_action', 'backup');
    triggerGoogleAuth(settings.googleClientId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Card Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-2xl z-10"
      >
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-900">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Einstellungen & Backup
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-900 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Allgemein
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Backup & Sync
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-5">
          {activeTab === 'general' ? (
            <>
              {/* ─── Rest Timer Configuration ────────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Pausen-Timer
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Aufwärmsatz Pause (Sek.)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRestTimer({ warmupSeconds: Math.max(10, settings.restTimer.warmupSeconds - 10) })}
                        className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono text-zinc-200 text-sm font-bold flex-1 text-center">
                        {settings.restTimer.warmupSeconds}s
                      </span>
                      <button
                        onClick={() => setRestTimer({ warmupSeconds: settings.restTimer.warmupSeconds + 10 })}
                        className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Arbeitssatz Pause (Sek.)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRestTimer({ workingSeconds: Math.max(10, settings.restTimer.workingSeconds - 15) })}
                        className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono text-zinc-200 text-sm font-bold flex-1 text-center">
                        {settings.restTimer.workingSeconds}s
                      </span>
                      <button
                        onClick={() => setRestTimer({ workingSeconds: settings.restTimer.workingSeconds + 15 })}
                        className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Equipment Configuration ────────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  Verfügbare Geräte
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {defaultEquipment.map((eq) => {
                    const isSelected = settings.availableEquipment.includes(eq.id as EquipmentType);
                    return (
                      <button
                        key={eq.id}
                        onClick={() => toggleEquipment(eq.id as EquipmentType)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/5'
                            : 'bg-white/[0.01] border-white/[0.04] text-zinc-500 hover:border-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={4} />}
                        </div>
                        <span className="text-xs font-medium truncate">{eq.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ─── Local JSON Backup / Restore ─────────────────────── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  Lokale Datensicherung (JSON)
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportBackup}
                    className="flex flex-col items-center gap-2 bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-colors p-4 rounded-2xl text-center text-zinc-300"
                  >
                    <Download className="w-6 h-6 text-blue-400" />
                    <span className="text-xs font-bold">Backup herunterladen</span>
                    <span className="text-[10px] text-zinc-500">Sichert Pläne & Historie als JSON-Datei</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-colors p-4 rounded-2xl text-center text-zinc-300"
                  >
                    <Upload className="w-6 h-6 text-emerald-400" />
                    <span className="text-xs font-bold">Backup einlesen</span>
                    <span className="text-[10px] text-zinc-500">Lädt Daten aus einer JSON-Datei hoch</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  accept=".json"
                  className="hidden"
                />

                {/* Import Status Alert */}
                {importStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 p-3 rounded-xl text-xs ${
                      importStatus.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{importStatus.message}</span>
                  </motion.div>
                )}
              </div>

              {/* ─── Google Drive Cloud Sync ─────────────────────────── */}
              <div className="space-y-3 border-t border-zinc-900 pt-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  Google Drive Cloud-Sync
                </h3>

                <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-4">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Sichere deine Trainingsdaten sicher auf deinem eigenen Google Drive. Da die App privat läuft, musst du in der Google Console einmalig eine Client-ID erstellen.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Google Client-ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={googleIdInput}
                        onChange={(e) => setGoogleIdInput(e.target.value)}
                        placeholder="Z.B. 12345-abcde.apps.googleusercontent.com"
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleSaveClientId}
                        className="btn-accent px-4 py-2 text-xs font-bold rounded-xl"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>

                  {settings.googleClientId && (
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500">Letzter Sync:</span>
                        <span className="font-mono text-zinc-300">
                          {settings.lastGoogleSync
                            ? new Date(settings.lastGoogleSync).toLocaleString('de-DE')
                            : 'Nie'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={handleGoogleBackup}
                          disabled={syncLoading}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-40"
                        >
                          <Cloud className="w-4 h-4" />
                          Jetzt sichern
                        </button>
                        <button
                          onClick={handleGoogleRestore}
                          disabled={syncLoading}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
                        >
                          <Upload className="w-4 h-4" />
                          Laden (Restore)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Sync Tutorial Trigger */}
                  <div className="flex gap-2 items-start p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 text-[10px] text-zinc-400">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-zinc-300 mb-0.5">So erstellst du eine Client-ID:</p>
                      <ol className="list-decimal list-inside space-y-0.5">
                        <li>Google Cloud Console öffnen.</li>
                        <li>Neues Projekt erstellen und Drive API aktivieren.</li>
                        <li>Unter OAuth-Consent-Screen Webapplikation wählen.</li>
                        <li>OAuth-Client-ID erstellen mit JavaScript-Herkunft: <code className="text-blue-400 font-mono text-[9px]">{window.location.origin}</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
