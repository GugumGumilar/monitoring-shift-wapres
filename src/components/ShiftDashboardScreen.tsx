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
  onOpenReportPreview: () => void;
  onOpenHistory: () => void;
  onOpenSheetsModal: () => void;
  onRefreshSheetStatus: () => void;
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
  onOpenReportPreview,
  onOpenHistory,
  onOpenSheetsModal,
  onRefreshSheetStatus,
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
      {/* Top Bar: Shift Berjalan Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Zap className="w-7 h-7 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Shift Aktif Berjalan
                </span>
                {sourceIndicator && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Sumber: {sourceIndicator}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                  SHIFT {activeShift}
                </h1>
                <span className="text-base sm:text-lg font-bold text-amber-400 font-mono">
                  ({shiftRange})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {currentDateStr} • <span className="font-mono text-zinc-200 font-bold">{currentTimeStr}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="dashboard-btn-refresh-sheet"
              onClick={onRefreshSheetStatus}
              disabled={isCheckingSheet}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              title="Periksa sinkronisasi status terbaru di Google Sheets sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSheet ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isCheckingSheet ? 'Menyinkronkan...' : 'Sinkron Sekarang'}</span>
            </button>

            <button
              type="button"
              id="dashboard-btn-switch-officers"
              onClick={onGoToOfficers}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all hover:border-zinc-600 cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Ganti Petugas / Tim</span>
            </button>
          </div>
        </div>

        {/* Real-time Google Sheets Auto-Sync Control Bar */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-bold text-zinc-200">
                {autoSyncEnabled ? 'Auto-Sync Google Sheets: AKTIF' : 'Auto-Sync Google Sheets: NONAKTIF'}
              </span>
            </div>

            <span className="text-zinc-600">•</span>

            <span className="text-zinc-400">
              Sinkronisasi status riil otomatis berkala (setiap 20 detik)
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] text-zinc-400">
              Terakhir diperiksa:{' '}
              <span className="font-mono text-zinc-200 font-semibold">
                {isCheckingSheet ? 'Sedang memeriksa...' : lastCheckedTime || 'Baru saja'}
              </span>
            </span>

            {onToggleAutoSync && (
              <button
                type="button"
                id="btn-toggle-auto-sync"
                onClick={onToggleAutoSync}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  autoSyncEnabled
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
                title={autoSyncEnabled ? 'Klik untuk jeda sinkronisasi otomatis' : 'Klik untuk aktifkan sinkronisasi otomatis'}
              >
                {autoSyncEnabled ? 'Jeda' : 'Aktifkan'}
              </button>
            )}
          </div>
        </div>

        {sheetStatusError && (
          <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Koneksi spreadsheet: {sheetStatusError}</span>
          </div>
        )}
      </div>

      {/* Indikator Visual Status Tim Shift Berjalan (HIJAU = Sudah Submit, MERAH = Belum Submit) */}
      <div id="shift-submission-status-indicators" className="bg-zinc-900 border-2 border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200">
              Indikator Status Penyerahan Laporan Shift {activeShift}
            </h2>
          </div>
          <div className="text-xs font-semibold">
            {isBothSubmitted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                Semua Tim Selesai Submit ({activeShift})
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1.5 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-500/40">
                <XCircle className="w-4 h-4" />
                Laporan Belum Lengkap ({!isWapresSubmitted && !isRumdinSubmitted ? 'Wapres & Rumdin Belum' : !isWapresSubmitted ? 'Wapres Belum' : 'Rumdin Belum'})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Status Tim Wapres: Hijau jika sudah, Merah jika belum */}
          <div
            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
              isWapresSubmitted
                ? 'bg-emerald-950/30 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/30 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  isWapresSubmitted
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                    : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                }`}
              >
                {isWapresSubmitted ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base text-zinc-100">Tim Wapres</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isWapresSubmitted
                        ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {isWapresSubmitted ? '✓ SUDAH SUBMIT' : '✕ BELUM SUBMIT'}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 mt-1">
                  {isWapresSubmitted ? (
                    <span className="text-emerald-400 font-medium">
                      Terkunci • Disubmit {wapresData.inspectionTime || '-'} ({wapresData.officers.filter(Boolean).join(' & ') || 'Petugas'})
                    </span>
                  ) : (
                    <span className="text-rose-300 font-medium">
                      Petugas belum input laporan untuk Shift {activeShift}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isWapresSubmitted ? (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Buka menu Riwayat untuk edit & update"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Koreksi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onGoToForm('WAPRES')}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Isi Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tim Rumdin: Hijau jika sudah, Merah jika belum */}
          <div
            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
              isRumdinSubmitted
                ? 'bg-emerald-950/30 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/30 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  isRumdinSubmitted
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                    : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                }`}
              >
                {isRumdinSubmitted ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <XCircle className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base text-zinc-100">Tim Rumdin</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isRumdinSubmitted
                        ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {isRumdinSubmitted ? '✓ SUDAH SUBMIT' : '✕ BELUM SUBMIT'}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 mt-1">
                  {isRumdinSubmitted ? (
                    <span className="text-emerald-400 font-medium">
                      Terkunci • Disubmit {rumdinData.inspectionTime || '-'} ({rumdinData.officers.filter(Boolean).join(' & ') || 'Petugas'})
                    </span>
                  ) : (
                    <span className="text-rose-300 font-medium">
                      Petugas belum input laporan untuk Shift {activeShift}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isRumdinSubmitted ? (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Buka menu Riwayat untuk edit & update"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Koreksi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onGoToForm('RUMDIN')}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Isi Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Peringatan & Keterangan Belum Submit Jika Masih Ada Data Kosong */}
      {!isBothSubmitted && (
        <div
          id="missing-submission-alert-banner"
          className="bg-zinc-900/95 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-amber-300 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Data Belum Lengkap Terisi (Belum Submit)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    Menunggu Pengisian Tim
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                  {sheetMissingInfo?.instructionMessage ||
                    'Masih ada data di spreadsheet yang kosong untuk shift ini. Berdasarkan aturan, baris yang masih kosong berarti BELUM SUBMIT.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Status Tim Wapres */}
            {!isWapresSubmitted ? (
              <div className="bg-zinc-950/80 border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <h3 className="font-extrabold text-amber-400 text-sm">Tim Wapres: BELUM SUBMIT</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {wapresMissingItems.length} Komponen Kosong
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-zinc-400 font-semibold text-[11px]">Komponen yang belum diisi di Sheet:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {wapresMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-amber-200/90 font-medium">
                    📢 <strong>Instruksi:</strong> Petugas Tim Wapres disuruh untuk segera menginput data shift {activeShift}!
                  </p>
                  <button
                    type="button"
                    onClick={() => onGoToForm('WAPRES')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Isi Form Tim Wapres</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/60 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-emerald-400 text-sm">Tim Wapres: SUDAH SUBMIT</h3>
                    <p className="text-xs text-zinc-400">Seluruh komponen Tim Wapres telah terisi lengkap di database Google Sheets.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Box Status Tim Rumdin */}
            {!isRumdinSubmitted ? (
              <div className="bg-zinc-950/80 border border-blue-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                    <h3 className="font-extrabold text-blue-400 text-sm">Tim Rumdin: BELUM SUBMIT</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {rumdinMissingItems.length} Komponen Kosong
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-zinc-400 font-semibold text-[11px]">Komponen yang belum diisi di Sheet:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {rumdinMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-blue-200/90 font-medium">
                    📢 <strong>Instruksi:</strong> Petugas Tim Rumdin disuruh untuk segera menginput data shift {activeShift}!
                  </p>
                  <button
                    type="button"
                    onClick={() => onGoToForm('RUMDIN')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Isi Form Tim Rumdin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/60 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-emerald-400 text-sm">Tim Rumdin: SUDAH SUBMIT</h3>
                    <p className="text-xs text-zinc-400">Seluruh komponen Tim Rumdin telah terisi lengkap di database Google Sheets.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: 2 Team Submission Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Tim Wapres */}
        <div
          id="dashboard-wapres-card"
          className={`border-2 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all ${
            isWapresSubmitted
              ? 'border-emerald-500/80 bg-emerald-950/20 shadow-emerald-950/20'
              : 'border-rose-500/70 bg-rose-950/15 shadow-rose-950/20'
          }`}
        >
          <div className="space-y-4">
            {/* Header Tim Wapres */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl border ${
                  isWapresSubmitted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-zinc-100 text-lg">Tim Wapres</h2>
                  <p className="text-xs text-zinc-400">UPS 30, 40, 60 KVA & ACO TM D 126</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isWapresSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-zinc-950 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                    <span>SUDAH SUBMIT</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md">
                    <XCircle className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>BELUM SUBMIT</span>
                  </span>
                )}
                {isWapresFromSheet && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Tersinkron di Sheets
                  </span>
                )}
              </div>
            </div>

            {/* Content Summary Tim Wapres */}
            {isWapresSubmitted ? (
              <div className="space-y-3 text-xs">
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Petugas Piket:</span>
                    <span className="font-bold text-zinc-200">
                      {wapresData.officers.filter(Boolean).join(' & ') || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Jam Inspeksi:</span>
                    <span className="font-mono font-bold text-zinc-200">{wapresData.inspectionTime || '-'}</span>
                  </div>
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <div className="font-bold text-zinc-300 uppercase tracking-wide text-[11px]">
                    Ringkasan Pengukuran Beban UPS:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-500 text-[10px]">UPS 30 KVA</div>
                      <div className="font-mono font-bold text-zinc-200">
                        {wapresData.ups30.loadR || '-'}/{wapresData.ups30.loadS || '-'}/{wapresData.ups30.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-500 text-[10px]">UPS 40 KVA</div>
                      <div className="font-mono font-bold text-zinc-200">
                        {wapresData.ups40.loadR || '-'}/{wapresData.ups40.loadS || '-'}/{wapresData.ups40.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-500 text-[10px]">UPS 60 KVA</div>
                      <div className="font-mono font-bold text-zinc-200">
                        {wapresData.ups60.loadR || '-'}/{wapresData.ups60.loadS || '-'}/{wapresData.ups60.loadT || '-'} A
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between">
                    <span>ACO TM Gardu D 126:</span>
                    <span className="font-bold text-zinc-200 truncate max-w-[180px]">
                      CLOSE: {wapresData.acoTM.penyulangClose || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/70 p-5 rounded-xl border border-dashed border-amber-500/40 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-amber-300">Tim Wapres: Belum Submit</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {wapresFilledItems.length > 0
                      ? 'Baru terisi sebagian di spreadsheet. Masih ada komponen yang kosong!'
                      : 'Data di Google Sheets masih kosong untuk shift ini (belum submit).'}
                  </p>
                </div>

                {/* Breakdown Komponen Yang Belum Diinput */}
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 text-left space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                    Komponen Yang Belum Diisi / Kosong:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wapresMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{item}</span>
                        <span className="text-[10px] text-amber-400/70 ml-1 font-mono uppercase">Belum Diisi</span>
                      </span>
                    ))}
                  </div>

                  {wapresFilledItems.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase">Sudah terisi:</span>
                      {wapresFilledItems.map((fItem, fIdx) => (
                        <span key={fIdx} className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          ✓ {fItem}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 text-left font-medium">
                  📢 <strong>Instruksi Petugas:</strong> Petugas Tim Wapres disuruh segera menginput data komponen di atas agar laporan shift {activeShift} lengkap!
                </div>
              </div>
            )}
          </div>

          {/* Action button for Tim Wapres */}
          <div className="mt-5 pt-3 border-t border-zinc-800/80">
            {isWapresSubmitted ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Formulir Terkunci (Shift {activeShift})
                  </span>
                  <span className="text-zinc-500">Edit via Menu Riwayat</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Buka menu Riwayat untuk koreksi data & perbarui ke spreadsheet"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit via Riwayat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGoToForm('WAPRES')}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Form</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="action-wapres-btn"
                onClick={() => onGoToForm('WAPRES')}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Isi Form Tim Wapres Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Tim Rumdin */}
        <div
          id="dashboard-rumdin-card"
          className={`border-2 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all ${
            isRumdinSubmitted
              ? 'border-emerald-500/80 bg-emerald-950/20 shadow-emerald-950/20'
              : 'border-rose-500/70 bg-rose-950/15 shadow-rose-950/20'
          }`}
        >
          <div className="space-y-4">
            {/* Header Tim Rumdin */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl border ${
                  isRumdinSubmitted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-zinc-100 text-lg">Tim Rumdin</h2>
                  <p className="text-xs text-zinc-400">UPS 40 Dipo, 100 ST12, & ACO TR</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isRumdinSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-zinc-950 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                    <span>SUDAH SUBMIT</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md">
                    <XCircle className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>BELUM SUBMIT</span>
                  </span>
                )}
                {isRumdinFromSheet && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    Tersinkron di Sheets
                  </span>
                )}
              </div>
            </div>

            {/* Content Summary Tim Rumdin */}
            {isRumdinSubmitted ? (
              <div className="space-y-3 text-xs">
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Petugas Piket:</span>
                    <span className="font-bold text-zinc-200">
                      {rumdinData.officers.filter(Boolean).join(' & ') || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Jam Inspeksi:</span>
                    <span className="font-mono font-bold text-zinc-200">{rumdinData.inspectionTime || '-'}</span>
                  </div>
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <div className="font-bold text-zinc-300 uppercase tracking-wide text-[11px]">
                    Ringkasan Pengukuran Beban UPS & ACO TR:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-500 text-[10px]">UPS 40 KVA Dipo</div>
                      <div className="font-mono font-bold text-zinc-200">
                        {rumdinData.ups40Dipo.loadR || '-'}/{rumdinData.ups40Dipo.loadS || '-'}/{rumdinData.ups40Dipo.loadT || '-'} A
                      </div>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-500 text-[10px]">UPS 100 KVA ST12</div>
                      <div className="font-mono font-bold text-zinc-200">
                        {rumdinData.ups100ST12.loadR || '-'}/{rumdinData.ups100ST12.loadS || '-'}/{rumdinData.ups100ST12.loadT || '-'} A
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60 flex justify-between">
                    <span>ACO TR ST12:</span>
                    <span className="font-bold text-zinc-200 truncate max-w-[180px]">
                      CLOSE: {rumdinData.acoTRST12.penyulangClose || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/70 p-5 rounded-xl border border-dashed border-blue-500/40 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-blue-300">Tim Rumdin: Belum Submit</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {rumdinFilledItems.length > 0
                      ? 'Baru terisi sebagian di spreadsheet. Masih ada komponen yang kosong!'
                      : 'Data di Google Sheets masih kosong untuk shift ini (belum submit).'}
                  </p>
                </div>

                {/* Breakdown Komponen Yang Belum Diinput */}
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 text-left space-y-2">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                    Komponen Yang Belum Diisi / Kosong:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rumdinMissingItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-md border border-blue-500/30 font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>{item}</span>
                        <span className="text-[10px] text-blue-400/70 ml-1 font-mono uppercase">Belum Diisi</span>
                      </span>
                    ))}
                  </div>

                  {rumdinFilledItems.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase">Sudah terisi:</span>
                      {rumdinFilledItems.map((fItem, fIdx) => (
                        <span key={fIdx} className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          ✓ {fItem}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200 text-left font-medium">
                  📢 <strong>Instruksi Petugas:</strong> Petugas Tim Rumdin disuruh segera menginput data komponen di atas agar laporan shift {activeShift} lengkap!
                </div>
              </div>
            )}
          </div>

          {/* Action button for Tim Rumdin */}
          <div className="mt-5 pt-3 border-t border-zinc-800/80">
            {isRumdinSubmitted ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Formulir Terkunci (Shift {activeShift})
                  </span>
                  <span className="text-zinc-500">Edit via Menu Riwayat</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Buka menu Riwayat untuk koreksi data & perbarui ke spreadsheet"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit via Riwayat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGoToForm('RUMDIN')}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Form</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="action-rumdin-btn"
                onClick={() => onGoToForm('RUMDIN')}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Isi Form Tim Rumdin Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Feature: Gabung Laporan (Active ONLY if both teams submitted) */}
      <div
        id="gabung-laporan-card"
        className={`rounded-2xl p-5 sm:p-6 border shadow-2xl transition-all ${
          isBothSubmitted
            ? 'bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/60 border-emerald-500/60 ring-2 ring-emerald-500/30'
            : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-zinc-100">
                Gabung Laporan Shift & Kirim WhatsApp
              </span>
              {isBothSubmitted ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  <Lock className="w-3 h-3 text-zinc-500" /> Terkunci
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
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
                className="w-full md:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Send className="w-5 h-5" />
                <span>Gabung Laporan & Kirim WhatsApp</span>
              </button>
            ) : (
              <button
                type="button"
                id="gabung-laporan-btn-disabled"
                disabled
                className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed flex items-center justify-center gap-2"
                title="Tombol ini otomatis aktif begitu kedua tim (Tim Wapres dan Tim Rumdin) selesai menginput"
              >
                <Lock className="w-4 h-4 text-zinc-500" />
                <span>Gabung Laporan (Terkunci)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Riwayat Laporan Shift</span>
          </button>

          <button
            type="button"
            onClick={onOpenSheetsModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets & Webhook</span>
          </button>
        </div>

        <div className="text-xs text-zinc-500">
          Monitoring Shift Listrik • Istana Wapres & Rumdin
        </div>
      </div>
    </div>
  );
};

