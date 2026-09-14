import React, { useState, useEffect } from 'react';
import { ShiftType } from '../types';
import {
  Clock,
  Zap,
  History,
  Send,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';
import { formatIndonesianDate, formatIndonesianTime } from '../utils/formatters';

interface HeaderProps {
  selectedShift?: ShiftType;
  onSelectShift?: (shift: ShiftType) => void;
  selectedTeam?: 'WAPRES' | 'RUMDIN';
  onSelectTeam?: (team: 'WAPRES' | 'RUMDIN') => void;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  onOpenPreview: () => void;
  onOpenHistory: () => void;
  onLoadSample: () => void;
  historyCount: number;
  onOpenGoogleSheets: () => void;
  isSheetsConnected: boolean;
  onOpenShiftSchedule: () => void;
  onOpenSheetTable?: () => void;
  onOpenBriefing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isWapresSubmitted,
  isRumdinSubmitted,
  onOpenPreview,
  onOpenHistory,
  onLoadSample,
  historyCount,
  onOpenGoogleSheets,
  isSheetsConnected,
  onOpenShiftSchedule,
  onOpenSheetTable,
  onOpenBriefing,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand & Clock */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-950/50 shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-100">
                    MONITORING WAPRES & RUMDIN
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    UPS & ACO
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[260px] sm:max-w-md">
                  Gardu D 126 SetWapres & Rumdin (Dipo & ST12)
                </p>
              </div>
            </div>

            {/* Live Clock (Compact on mobile, full on desktop) */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <div className="text-right sm:text-left">
                <div className="font-mono font-bold text-zinc-100 text-xs sm:text-sm leading-none sm:leading-normal">
                  {currentTime}
                </div>
                <div className="text-[10px] text-zinc-400 hidden sm:block">
                  {currentDate}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons toolbar - scrollable or wrap nicely on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Google Sheets Sync Button */}
            <button
              type="button"
              id="btn-header-sheets"
              onClick={onOpenGoogleSheets}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isSheetsConnected
                  ? 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
              title="Kelola Integrasi Real-Time Google Sheets (ACO Wapres)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sheets</span>
              {isSheetsConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            {/* Shift Briefing Button */}
            {onOpenBriefing && (
              <button
                type="button"
                id="btn-header-briefing"
                onClick={onOpenBriefing}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                title="Shift Briefing: Pilih Petugas per Lokasi & Kirim WA"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Briefing</span>
              </button>
            )}

            {/* Riwayat Button */}
            <button
              type="button"
              id="btn-history"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors whitespace-nowrap cursor-pointer shrink-0 relative"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>Riwayat</span>
              {historyCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Preview & Send WA Button */}
            <button
              type="button"
              id="btn-preview-wa"
              onClick={onOpenPreview}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isBothComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
              {isBothComplete && (
                <span className="w-2 h-2 rounded-full bg-white"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
