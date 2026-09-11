import React, { useState, useEffect } from 'react';
import { SHIFTS, ShiftType } from '../types';
import {
  Clock,
  Calendar,
  Zap,
  History,
  Send,
  Sparkles,
  ShieldAlert,
  Building,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { formatIndonesianDate, formatIndonesianTime } from '../utils/formatters';

interface HeaderProps {
  selectedShift: ShiftType;
  onSelectShift: (shift: ShiftType) => void;
  selectedTeam: 'WAPRES' | 'RUMDIN';
  onSelectTeam: (team: 'WAPRES' | 'RUMDIN') => void;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  onOpenPreview: () => void;
  onOpenHistory: () => void;
  onLoadSample: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedShift,
  onSelectShift,
  selectedTeam,
  onSelectTeam,
  isWapresSubmitted,
  isRumdinSubmitted,
  onOpenPreview,
  onOpenHistory,
  onLoadSample,
  historyCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(formatIndonesianTime());
  const [currentDate, setCurrentDate] = useState<string>(formatIndonesianDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(formatIndonesianTime(now));
      setCurrentDate(formatIndonesianDate(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBothComplete = isWapresSubmitted && isRumdinSubmitted;

  return (
    <header id="main-header" className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner: Brand, Clock, and Top Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-950">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-100">
                  MONITORING SHIFT KERJA
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Kelistrikan UPS & ACO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gardu D 126 SetWapres & Rumdin Wapres (Dipo & ST12)
              </p>
            </div>
          </div>

          {/* Clock & Action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="font-mono font-bold text-zinc-100">{currentTime}</div>
                <div className="text-[10px] text-zinc-400">{currentDate}</div>
              </div>
            </div>

            {/* Demo Button */}
            <button
              type="button"
              id="btn-load-demo"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
              title="Isi form dengan data contoh sesuai format WhatsApp"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Contoh</span> Demo
            </button>

            {/* Riwayat Button */}
            <button
              type="button"
              id="btn-history"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors relative"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>Riwayat</span>
              {historyCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Preview & Send WA Button */}
            <button
              type="button"
              id="btn-preview-wa"
              onClick={onOpenPreview}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isBothComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lihat / Kirim WA</span>
              {isBothComplete && (
                <span className="w-2 h-2 rounded-full bg-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Second Row: Shift selector + Team Navigation Tabs */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Shift Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">Shift:</span>
            {SHIFTS.map((shift) => {
              const isSelected = selectedShift === shift.type;
              return (
                <button
                  type="button"
                  key={shift.type}
                  id={`shift-tab-${shift.type.toLowerCase()}`}
                  onClick={() => onSelectShift(shift.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-900 shadow-md font-extrabold'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <span>{shift.label}</span>
                  <span className="text-[10px] opacity-75 font-mono hidden sm:inline">
                    ({shift.timeRange})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Team Switcher Tabs */}
          <div className="flex items-center gap-2 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 self-stretch sm:self-auto">
            {/* Tim Wapres */}
            <button
              type="button"
              id="team-tab-wapres"
              onClick={() => onSelectTeam('WAPRES')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectedTeam === 'WAPRES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Tim Wapres</span>
              {isWapresSubmitted ? (
                <span className="w-2 h-2 rounded-full bg-emerald-300" title="Sudah submit"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-600" title="Belum submit"></span>
              )}
            </button>

            {/* Tim Rumdin */}
            <button
              type="button"
              id="team-tab-rumdin"
              onClick={() => onSelectTeam('RUMDIN')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectedTeam === 'RUMDIN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Tim Rumdin</span>
              {isRumdinSubmitted ? (
                <span className="w-2 h-2 rounded-full bg-blue-300" title="Sudah submit"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-600" title="Belum submit"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
