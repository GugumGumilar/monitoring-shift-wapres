import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SHIFTS, ShiftType } from '../types';
import { playShiftChime } from './ShiftHandoverNotification';

interface ShiftScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: ShiftType;
  onTriggerTestToast: () => void;
}

export const ShiftScheduleModal: React.FC<ShiftScheduleModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  onTriggerTestToast,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shift_alarm_enabled') !== 'false';
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shift_alarm_sound') !== 'false';
  });
  const [testSent, setTestSent] = useState(false);

  const toggleEnabled = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    localStorage.setItem('shift_alarm_enabled', next ? 'true' : 'false');
  };

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    localStorage.setItem('shift_alarm_sound', next ? 'true' : 'false');
    if (next) {
      playShiftChime();
    }
  };

  const handleTestNotification = () => {
    onTriggerTestToast();
    if (isSoundEnabled) {
      playShiftChime();
    }
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="shift-schedule-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="shift-schedule-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">Jadwal Shift & Peringatan Otomatis</h3>
              <p className="text-xs text-zinc-400">Pengingat visual pelaporan saat waktu pergantian shift tiba</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Shift Timetable Cards */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-300">Jadwal Jam Kerja & Waktu Handover</div>
            <div className="grid grid-cols-1 gap-2">
              {SHIFTS.map((s) => {
                const isCurrent = currentShift === s.type;
                let handoverNotice = '';
                if (s.type === 'PAGI') handoverNotice = 'Peringatan handover aktif: 14.30 - 15.15 WIB';
                if (s.type === 'SIANG') handoverNotice = 'Peringatan handover aktif: 21.30 - 22.15 WIB';
                if (s.type === 'MALAM') handoverNotice = 'Peringatan handover aktif: 07.30 - 08.15 WIB';

                return (
                  <div
                    key={s.type}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100">{s.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-500 text-zinc-950 font-bold px-2 py-0.2 rounded-full">
                            Shift Aktif
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-200">{s.timeRange}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                      <BellRing className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{handoverNotice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200">Peringatan Visual Pergantian Shift</div>
                <div className="text-[11px] text-zinc-400">
                  Munculkan toast otomatis 30 menit sebelum shift berakhir
                </div>
              </div>
              <button
                type="button"
                onClick={toggleEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200">Suara Bel Notifikasi (Chime)</div>
                <div className="text-[11px] text-zinc-400">Bunyikan nada lembut saat peringatan handover muncul</div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSoundEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testSent ? '✅ Notifikasi Muncul!' : 'Uji Peringatan Shift Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
