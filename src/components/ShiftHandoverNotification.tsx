import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Send,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { SHIFTS, ShiftType } from '../types';

interface ShiftHandoverNotificationProps {
  currentShift: ShiftType;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  onOpenReport: () => void;
  onSyncSheets: () => void;
  isSheetsConnected: boolean;
}

// Play pleasant web audio chime
function playShiftChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: 783.99 Hz (G5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.2);
    gain2.gain.setValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.log('Audio playback prevented or unsupported:', err);
  }
}

export const ShiftHandoverNotification: React.FC<ShiftHandoverNotificationProps> = ({
  currentShift,
  isWapresSubmitted,
  isRumdinSubmitted,
  onOpenReport,
  onSyncSheets,
  isSheetsConnected,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shift_alarm_enabled') !== 'false';
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shift_alarm_sound') !== 'false';
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeAlertShift, setActiveAlertShift] = useState<ShiftType>(currentShift);
  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);
  const lastChimeRef = useRef<string>('');

  // Check shift change window every 15 seconds
  const checkShiftHandover = useCallback(() => {
    if (!isEnabled) return;
    const now = new Date();
    const currentTimestamp = now.getTime();
    if (currentTimestamp < snoozeUntil) return;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes; // in minutes from midnight

    // Shift Handover Times:
    // Pagi (08:00 - 15:00) -> handover at 15:00 (900m). Warning window: 14:30 (870m) - 15:15 (915m)
    // Siang (15:00 - 22:00) -> handover at 22:00 (1320m). Warning window: 21:30 (1290m) - 22:15 (1335m)
    // Malam (22:00 - 08:00) -> handover at 08:00 (480m). Warning window: 07:30 (450m) - 08:15 (495m)
    let triggeredShift: ShiftType | null = null;
    let targetEnd = '';

    if (timeVal >= 870 && timeVal <= 915) {
      triggeredShift = 'PAGI';
      targetEnd = '15.00 WIB';
    } else if (timeVal >= 1290 && timeVal <= 1335) {
      triggeredShift = 'SIANG';
      targetEnd = '22.00 WIB';
    } else if ((timeVal >= 450 && timeVal <= 495) || (timeVal >= 1320 && timeVal < 1440)) {
      // 07:30 - 08:15 WIB
      if (timeVal >= 450 && timeVal <= 495) {
        triggeredShift = 'MALAM';
        targetEnd = '08.00 WIB';
      }
    }

    if (triggeredShift) {
      setActiveAlertShift(triggeredShift);
      setIsOpen(true);

      const chimeKey = `${triggeredShift}_${now.toDateString()}_${Math.floor(timeVal / 15)}`;
      if (isSoundEnabled && lastChimeRef.current !== chimeKey) {
        lastChimeRef.current = chimeKey;
        playShiftChime();
      }
    }
  }, [isEnabled, isSoundEnabled, snoozeUntil]);

  useEffect(() => {
    checkShiftHandover();
    const interval = setInterval(checkShiftHandover, 15000);
    return () => clearInterval(interval);
  }, [checkShiftHandover]);

  const handleSnooze = (minutes: number = 10) => {
    setSnoozeUntil(Date.now() + minutes * 60 * 1000);
    setIsOpen(false);
  };

  const handleManualTest = () => {
    setActiveAlertShift(currentShift);
    setIsOpen(true);
    if (isSoundEnabled) {
      playShiftChime();
    }
  };

  const isBothDone = isWapresSubmitted && isRumdinSubmitted;

  if (!isOpen) return null;

  return (
    <div
      id="shift-handover-toast"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-full animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-zinc-900/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 ring-4 ring-amber-500/10 flex flex-col gap-3.5">
        {/* Toast Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-mono">
                  Peringatan Shift
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-zinc-100 mt-0.5">
                Waktu Pergantian Shift Tiba!
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Tutup peringatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">
          Waktu operasional <strong>Shift {activeAlertShift}</strong> segera berakhir. Pastikan pengisian
          data pantauan ACO TM, ACO TR Rumdin, dan Beban UPS telah lengkap sebelum serah terima shift.
        </p>

        {/* Checklist Status Box */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isWapresSubmitted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              <div className="text-[10px] text-zinc-400">Tim Wapres</div>
              <div className={isWapresSubmitted ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-medium'}>
                {isWapresSubmitted ? 'Sudah Submit' : 'Belum Submit'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRumdinSubmitted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              <div className="text-[10px] text-zinc-400">Tim Rumdin</div>
              <div className={isRumdinSubmitted ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-medium'}>
                {isRumdinSubmitted ? 'Sudah Submit' : 'Belum Submit'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {!isBothDone ? (
            <button
              type="button"
              onClick={() => {
                onOpenReport();
                setIsOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition-all cursor-pointer"
            >
              <span>Lengkapi Laporan Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSyncSheets();
                setIsOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sinkron ke Google Sheets</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSnooze(10)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
              title="Ingatkan kembali dalam 10 menit"
            >
              Tunda 10m
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { playShiftChime };
