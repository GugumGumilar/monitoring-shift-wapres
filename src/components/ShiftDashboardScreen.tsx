import React, { useState, useEffect } from 'react';
import { CombinedShiftReport, ShiftType, TimWapresReport, TimRumdinReport, SheetMissingInfo } from '../types';
import { ShiftValidationResult } from '../utils/reportValidator';
import {
  getCurrentShift,
  getShiftTimeRange,
  formatIndonesianDate,
  formatIndonesianTime,
} from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Send,
  Zap,
  Building2,
  Lock,
  Edit3,
  PlusCircle,
  FileSpreadsheet,
  History,
  RefreshCw,
  Users,
  Settings,
  ShieldCheck,
  Eye,
  XCircle,
  MessageSquare,
} from 'lucide-react';

interface ShiftDashboardScreenProps {
  currentReport: CombinedShiftReport;
  activeShift: ShiftType;
  wapresData: TimWapresReport;
  rumdinData: TimRumdinReport;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  shiftValidation?: ShiftValidationResult;
  sheetMissingInfo?: SheetMissingInfo;
  onGoToOfficers: () => void;
  onGoToForm: (team: 'WAPRES' | 'RUMDIN') => void;
  onEditSubmittedReport?: (team: 'WAPRES' | 'RUMDIN') => void;
  onOpenReportPreview: () => void;
  onOpenHistory: () => void;
  onOpenSheetsModal: () => void;
  onRefreshSheetStatus: () => void;
  onGoToBriefing?: () => void;
  isCheckingSheet?: boolean;
  sheetStatusError?: string | null;
  sourceIndicator?: string;
  lastCheckedTime?: string | null;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  isWapresFromSheet?: boolean;
  isRumdinFromSheet?: boolean;
}

export const ShiftDashboardScreen: React.FC<ShiftDashboardScreenProps> = ({
  currentReport,
  activeShift,
  wapresData,
  rumdinData,
  isWapresSubmitted,
  isRumdinSubmitted,
  shiftValidation,
  sheetMissingInfo,
  onGoToOfficers,
  onGoToForm,
  onEditSubmittedReport,
  onOpenReportPreview,
  onOpenHistory,
  onOpenSheetsModal,
  onRefreshSheetStatus,
  onGoToBriefing,
  isCheckingSheet = false,
  sheetStatusError = null,
  sourceIndicator,
  lastCheckedTime = null,
  autoSyncEnabled = true,
  onToggleAutoSync,
  isWapresFromSheet = false,
  isRumdinFromSheet = false,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => formatIndonesianTime());
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => formatIndonesianDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(formatIndonesianTime(now));
      setCurrentDateStr(formatIndonesianDate(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBothSubmitted = isWapresSubmitted && isRumdinSubmitted;
  const shiftRange = getShiftTimeRange(activeShift);

  // Missing items computation per team for clear feedback
  const wapresMissingItems =
    sheetMissingInfo?.wapresEmptyItems && sheetMissingInfo.wapresEmptyItems.length > 0
      ? sheetMissingInfo.wapresEmptyItems
      : shiftValidation?.wapres?.missingSummary && shiftValidation.wapres.missingSummary.length > 0
      ? shiftValidation.wapres.missingSummary
      : ['ACO TM D 126', 'UPS 30 KVA', 'UPS 40 KVA', 'UPS 60 KVA'];

  const rumdinMissingItems =
    sheetMissingInfo?.rumdinEmptyItems && sheetMissingInfo.rumdinEmptyItems.length > 0
      ? sheetMissingInfo.rumdinEmptyItems
      : shiftValidation?.rumdin?.missingSummary && shiftValidation.rumdin.missingSummary.length > 0
      ? shiftValidation.rumdin.missingSummary
      : ['ACO TR Dipo', 'ACO TR ST 12', 'UPS 40 KVA Dipo', 'UPS 100 KVA ST 12'];

  const wapresFilledItems = sheetMissingInfo?.wapresFilledItems || [];
  const rumdinFilledItems = sheetMissingInfo?.rumdinFilledItems || [];

  return (
    <div id="shift-dashboard-screen" className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Ringkas Dashboard Shift */}
      <div className="glass-panel-cyan rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cyan-500/30 shadow-xl glow-cyan/15">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              DASHBOARD SHIFT {activeShift}
            </h1>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-3 py-0.5 rounded-full border border-amber-500/40 shadow-xs">
              {shiftRange}
            </span>
            {sourceIndicator && (
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                {sourceIndicator}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>{currentDateStr}</span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{currentTimeStr}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="dashboard-btn-refresh-sheet"
            onClick={onRefreshSheetStatus}
            disabled={isCheckingSheet}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Sinkronisasi status terbaru dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSheet ? 'animate-spin text-emerald-400' : 'text-cyan-400'}`} />
            <span>{isCheckingSheet ? 'Menyinkronkan...' : 'Sinkron Sheet'}</span>
          </button>
        </div>
      </div>

      {sheetStatusError && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Koneksi spreadsheet: {sheetStatusError}</span>
        </div>
      )}

      {/* Grid: 2 Team Submission Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Tim Wapres */}
        <div
          id="dashboard-wapres-card"
          className={`glass-panel rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all border ${
            isWapresSubmitted
              ? 'border-emerald-500/60 bg-emerald-950/15 glow-emerald/20'
              : 'border-rose-500/50 bg-rose-950/15 glow-rose/10'
          }`}
        >
          <div className="space-y-4">
            {/* Header Tim Wapres */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isWapresSubmitted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-lg">Tim Wapres</h2>
                  <p className="text-xs text-slate-400">UPS 30, 40, 60 KVA & ACO TM D 126</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isWapresSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>SUDAH SUBMIT</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md">
                    <XCircle className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>BELUM SUBMIT</span>
                  </span>
                )}
                {isWapresFromSheet && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Tersinkron di Sheets
                  </span>
                )}
              </div>
            </div>

            {/* Content Summary Tim Wapres */}
            {isWapresSubmitted ? (
              <div className="space-y-3 text-xs">
                <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Petugas Piket:</span>
                    <span className="font-bold text-slate-200">
                      {wapresData.officers.filter(Boolean).join(' & ') || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Jam Inspeksi:</span>
                    <span className="font-mono font-bold text-emerald-400">{wapresData.inspectionTime || '-'}</span>
                  </div>
                </div>

                <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Ringkasan Pengukuran Beban UPS:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold">UPS 30 KVA</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {wapresData.ups30.loadR || '-'}/{wapresData.ups30.loadS || '-'}/{wapresData.ups30.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold">UPS 40 KVA</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {wapresData.ups40.loadR || '-'}/{wapresData.ups40.loadS || '-'}/{wapresData.ups40.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold">UPS 60 KVA</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {wapresData.ups60.loadR || '-'}/{wapresData.ups60.loadS || '-'}/{wapresData.ups60.loadT || '-'} A
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                    <span>ACO TM Gardu D 126:</span>
                    <span className="font-bold text-slate-200 truncate max-w-[180px]">
                      CLOSE: {wapresData.acoTM.penyulangClose || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel-subtle p-5 rounded-xl border border-dashed border-amber-500/40 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
                  <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-amber-300">Tim Wapres: Belum Submit</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wapresFilledItems.length > 0
                      ? 'Baru terisi sebagian di spreadsheet. Masih ada komponen yang kosong!'
                      : 'Data di Google Sheets masih kosong untuk shift ini (belum submit).'}
                  </p>
                </div>

                {/* Breakdown Komponen Yang Belum Diinput */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 text-left space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Komponen Yang Belum Diisi / Kosong:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wapresMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>{item}</span>
                        <span className="text-[10px] text-amber-400/80 ml-1 font-mono uppercase">Belum Diisi</span>
                      </span>
                    ))}
                  </div>

                  {wapresFilledItems.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Sudah terisi:</span>
                      {wapresFilledItems.map((fItem, fIdx) => (
                        <span key={fIdx} className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 font-medium">
                          ✓ {fItem}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 text-left font-medium shadow-xs">
                  📢 <strong>Instruksi Petugas:</strong> Petugas Tim Wapres disuruh segera menginput data komponen di atas agar laporan shift {activeShift} lengkap!
                </div>
              </div>
            )}
          </div>

          {/* Action button for Tim Wapres */}
          <div className="mt-5 pt-3.5 border-t border-slate-800">
            {isWapresSubmitted ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Formulir Input Baru Terkunci (Shift {activeShift})
                  </span>
                  <span className="text-slate-400">Mode Edit Tersedia</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-edit-wapres-submitted"
                    onClick={() => (onEditSubmittedReport ? onEditSubmittedReport('WAPRES') : onGoToForm('WAPRES'))}
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    title="Buka data yang sudah disubmit untuk mengedit dan mengupdate"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Buka & Edit Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Lihat riwayat laporan shift"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Riwayat Laporan</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="action-wapres-btn"
                onClick={() => onGoToForm('WAPRES')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Isi Form Tim Wapres Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Tim Rumdin */}
        <div
          id="dashboard-rumdin-card"
          className={`glass-panel rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all border ${
            isRumdinSubmitted
              ? 'border-emerald-500/60 bg-emerald-950/15 glow-emerald/20'
              : 'border-rose-500/50 bg-rose-950/15 glow-rose/10'
          }`}
        >
          <div className="space-y-4">
            {/* Header Tim Rumdin */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isRumdinSubmitted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-lg">Tim Rumdin</h2>
                  <p className="text-xs text-slate-400">UPS 40 Dipo, 100 ST12, & ACO TR</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isRumdinSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    <span>SUDAH SUBMIT</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md">
                    <XCircle className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>BELUM SUBMIT</span>
                  </span>
                )}
                {isRumdinFromSheet && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Tersinkron di Sheets
                  </span>
                )}
              </div>
            </div>

            {/* Content Summary Tim Rumdin */}
            {isRumdinSubmitted ? (
              <div className="space-y-3 text-xs">
                <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Petugas Piket:</span>
                    <span className="font-bold text-slate-200">
                      {rumdinData.officers.filter(Boolean).join(' & ') || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Jam Inspeksi:</span>
                    <span className="font-mono font-bold text-emerald-400">{rumdinData.inspectionTime || '-'}</span>
                  </div>
                </div>

                <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Ringkasan Pengukuran Beban UPS & ACO TR:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold">UPS 40 KVA Dipo</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {rumdinData.ups40Dipo.loadR || '-'}/{rumdinData.ups40Dipo.loadS || '-'}/{rumdinData.ups40Dipo.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold">UPS 100 KVA ST12</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {rumdinData.ups100ST12.loadR || '-'}/{rumdinData.ups100ST12.loadS || '-'}/{rumdinData.ups100ST12.loadT || '-'} A
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                    <span>ACO TR ST12:</span>
                    <span className="font-bold text-slate-200 truncate max-w-[180px]">
                      CLOSE: {rumdinData.acoTRST12.penyulangClose || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel-subtle p-5 rounded-xl border border-dashed border-cyan-500/40 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-inner">
                  <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-cyan-300">Tim Rumdin: Belum Submit</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rumdinFilledItems.length > 0
                      ? 'Baru terisi sebagian di spreadsheet. Masih ada komponen yang kosong!'
                      : 'Data di Google Sheets masih kosong untuk shift ini (belum submit).'}
                  </p>
                </div>

                {/* Breakdown Komponen Yang Belum Diinput */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 text-left space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Komponen Yang Belum Diisi / Kosong:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rumdinMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>{item}</span>
                        <span className="text-[10px] text-cyan-400/80 ml-1 font-mono uppercase">Belum Diisi</span>
                      </span>
                    ))}
                  </div>

                  {rumdinFilledItems.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Sudah terisi:</span>
                      {rumdinFilledItems.map((fItem, fIdx) => (
                        <span key={fIdx} className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 font-medium">
                          ✓ {fItem}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 text-left font-medium shadow-xs">
                  📢 <strong>Instruksi Petugas:</strong> Petugas Tim Rumdin disuruh segera menginput data komponen di atas agar laporan shift {activeShift} lengkap!
                </div>
              </div>
            )}
          </div>

          {/* Action button for Tim Rumdin */}
          <div className="mt-5 pt-3.5 border-t border-slate-800">
            {isRumdinSubmitted ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Formulir Input Baru Terkunci (Shift {activeShift})
                  </span>
                  <span className="text-slate-400">Mode Edit Tersedia</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-edit-rumdin-submitted"
                    onClick={() => (onEditSubmittedReport ? onEditSubmittedReport('RUMDIN') : onGoToForm('RUMDIN'))}
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
                    title="Buka data yang sudah disubmit untuk mengedit dan mengupdate"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Buka & Edit Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Lihat riwayat laporan shift"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Riwayat Laporan</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="action-rumdin-btn"
                onClick={() => onGoToForm('RUMDIN')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Isi Form Tim Rumdin Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Feature: Gabung Laporan (Active ONLY if both teams submitted) */}
      <div
        id="gabung-laporan-card"
        className={`rounded-2xl p-5 sm:p-7 border shadow-2xl transition-all ${
          isBothSubmitted
            ? 'glass-panel-green border-emerald-500/60 ring-1 ring-emerald-500/30 glow-emerald'
            : 'glass-panel border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <span className="font-extrabold text-lg sm:text-xl text-white">
                Gabung Laporan Shift & Kirim WhatsApp
              </span>
              {isBothSubmitted ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-0.5 rounded-full border border-emerald-500/40 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Lengkap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-800/90 px-3 py-0.5 rounded-full border border-slate-700">
                  <Lock className="w-3 h-3 text-slate-500" /> Terkunci
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isBothSubmitted
                ? 'Kedua tim (Wapres & Rumdin) sudah menyelesaikan laporan. Laporan gabungan siap digenerate dan dikirim langsung ke grup WhatsApp.'
                : !isWapresSubmitted && !isRumdinSubmitted
                ? '⚠️ Tombol terkunci: Tim Wapres & Tim Rumdin belum submit. Mohon kedua tim segera mengisi komponen yang masih kosong di sheet/form.'
                : !isWapresSubmitted
                ? `⚠️ Tombol terkunci: Tim Wapres belum submit (Masih kosong: ${wapresMissingItems.join(', ')}). Mohon Tim Wapres segera mengisi!`
                : `⚠️ Tombol terkunci: Tim Rumdin belum submit (Masih kosong: ${rumdinMissingItems.join(', ')}). Mohon Tim Rumdin segera mengisi!`}
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {isBothSubmitted ? (
              <button
                type="button"
                id="gabung-laporan-btn"
                onClick={onOpenReportPreview}
                className="w-full md:w-auto px-7 py-4 rounded-xl font-black text-sm sm:text-base bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer glow-emerald"
              >
                <Send className="w-5 h-5 stroke-[2.5]" />
                <span>Gabung Laporan & Kirim WhatsApp</span>
              </button>
            ) : (
              <button
                type="button"
                id="gabung-laporan-btn-disabled"
                disabled
                className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900/80 text-slate-500 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
                title="Tombol ini otomatis aktif begitu kedua tim (Tim Wapres dan Tim Rumdin) selesai menginput"
              >
                <Lock className="w-4 h-4 text-slate-600" />
                <span>Gabung Laporan (Terkunci)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Riwayat Laporan Shift</span>
          </button>

          <button
            type="button"
            onClick={onOpenSheetsModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets & Webhook</span>
          </button>

          {onGoToBriefing && (
            <button
              type="button"
              id="dashboard-btn-briefing"
              onClick={onGoToBriefing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-500/60 transition-all active:scale-95 shadow-sm cursor-pointer"
              title="Buka Shift Briefing: Pilih Petugas Piket & Format WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Shift Briefing</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Monitoring Shift Listrik • Istana Wapres & Rumdin
        </div>
      </div>
    </div>
  );
};

