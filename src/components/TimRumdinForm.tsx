import React, { useState, useEffect } from 'react';
import { AcoTRDipoData, AcoTRST12Data, TimRumdinReport, ShiftType } from '../types';
import { OfficerSelect } from './OfficerSelect';
import { UPSFormCard } from './UPSFormCard';
import { ActiveSpreadsheetInfo } from '../services/googleSheets';
import { User } from 'firebase/auth';
import { formatIndonesianDate, formatIndonesianTime, getShiftTimeRange } from '../utils/formatters';
import {
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Zap,
  Lock,
  Users,
  Edit3,
  History,
  ArrowRight,
} from 'lucide-react';

interface TimRumdinFormProps {
  data: TimRumdinReport;
  onChange: (data: TimRumdinReport) => void;
  onSubmit: (data: TimRumdinReport) => void;
  shiftName: ShiftType | string;
  isAlreadySubmitted?: boolean;
  isEditMode?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onOpenHistory?: () => void;
  onGoToDashboard?: () => void;
  user?: User | null;
  activeSpreadsheet?: ActiveSpreadsheetInfo | null;
  hasSheetsConfigured?: boolean;
  autoSyncEnabled?: boolean;
  onOpenGoogleSheets?: () => void;
  onQuickSyncDipo?: () => void;
  onQuickSyncST12?: () => void;
  onQuickSyncRumdinUps?: () => void;
  onQuickSyncAllRumdin?: () => void;
  isSyncingSheets?: boolean;
  isShiftTimeAllowed?: boolean;
  currentActiveShift?: ShiftType | string;
  onSwitchToActiveShift?: () => void;
}

export const TimRumdinForm: React.FC<TimRumdinFormProps> = ({
  data,
  onChange,
  onSubmit,
  shiftName,
  isAlreadySubmitted = false,
  isEditMode = false,
  onStartEdit,
  onCancelEdit,
  onOpenHistory,
  onGoToDashboard,
  user = null,
  activeSpreadsheet = null,
  hasSheetsConfigured = false,
  autoSyncEnabled = true,
  onOpenGoogleSheets,
  onQuickSyncDipo,
  onQuickSyncST12,
  onQuickSyncRumdinUps,
  onQuickSyncAllRumdin,
  isSyncingSheets = false,
  isShiftTimeAllowed = true,
  currentActiveShift = 'PAGI',
  onSwitchToActiveShift,
}) => {
  const [liveTime, setLiveTime] = useState<string>(formatIndonesianTime());
  const [liveDate, setLiveDate] = useState<string>(formatIndonesianDate());
  const [isChangingOfficers, setIsChangingOfficers] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(formatIndonesianTime());
      setLiveDate(formatIndonesianDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateAcoDipo = (field: keyof AcoTRDipoData, value: any) => {
    onChange({
      ...data,
      acoTRDipo: {
        ...data.acoTRDipo,
        [field]: value,
      },
    });
  };

  const setDipoT135Status = (status: 'CLOSE' | 'OPEN') => {
    onChange({
      ...data,
      acoTRDipo: {
        ...data.acoTRDipo,
        garduT135Status: status,
        garduT15NStatus: status === 'CLOSE' ? 'OPEN' : 'CLOSE',
      },
    });
  };

  const setDipoT15NStatus = (status: 'CLOSE' | 'OPEN') => {
    onChange({
      ...data,
      acoTRDipo: {
        ...data.acoTRDipo,
        garduT15NStatus: status,
        garduT135Status: status === 'CLOSE' ? 'OPEN' : 'CLOSE',
      },
    });
  };

  const updateAcoST12 = (field: keyof AcoTRST12Data, value: any) => {
    onChange({
      ...data,
      acoTRST12: {
        ...data.acoTRST12,
        [field]: value,
      },
    });
  };

  const setST12T93Status = (status: 'CLOSE' | 'OPEN') => {
    onChange({
      ...data,
      acoTRST12: {
        ...data.acoTRST12,
        garduT93Status: status,
        garduT10BStatus: status === 'CLOSE' ? 'OPEN' : 'CLOSE',
        penyulangClose: status === 'CLOSE' ? 'GARDU T93' : 'GARDU T10B',
        penyulangOpen: status === 'CLOSE' ? 'GARDU T10B' : 'GARDU T93',
      },
    });
  };

  const setST12T10BStatus = (status: 'CLOSE' | 'OPEN') => {
    onChange({
      ...data,
      acoTRST12: {
        ...data.acoTRST12,
        garduT10BStatus: status,
        garduT93Status: status === 'CLOSE' ? 'OPEN' : 'CLOSE',
        penyulangClose: status === 'CLOSE' ? 'GARDU T10B' : 'GARDU T93',
        penyulangOpen: status === 'CLOSE' ? 'GARDU T93' : 'GARDU T10B',
      },
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!data.officers[0] || !data.officers[1]) {
      setSubmitError('Harap pilih 2 petugas piket Tim Rumdin terlebih dahulu.');
      return;
    }

    const now = new Date();
    const realTimeDate = formatIndonesianDate(now);
    const realTimeTime = formatIndonesianTime(now);

    const updated: TimRumdinReport = {
      ...data,
      inspectionDate: realTimeDate,
      inspectionTime: realTimeTime,
      submittedAt: now.toISOString(),
    };
    onSubmit(updated);
  };

  const hasOfficers = Boolean(data.officers[0] && data.officers[1] && data.officers[0] !== data.officers[1]);

  return (
    <form id="tim-rumdin-form" onSubmit={handleFormSubmit} className="space-y-6">
      {/* Banner */}
      <div className="glass-panel-cyan rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xl border border-cyan-500/30 glow-cyan/20">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            FORMULIR INSPEKSI: TIM RUMDIN
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
            Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo & ST12)
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-400">
            <span>Shift: <strong className="text-cyan-300 font-semibold">{shiftName}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{liveDate}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-cyan-300 font-mono font-bold bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 shadow-xs">
              <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>{liveTime}</span>
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Real-Time)</span>
            </span>
            {hasOfficers && (
              <>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-slate-200 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Petugas: <strong className="text-cyan-300 font-semibold">{data.officers[0]} & {data.officers[1]}</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsChangingOfficers(!isChangingOfficers)}
                    className="ml-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    {isChangingOfficers ? 'Tutup' : 'Ubah'}
                  </button>
                </span>
              </>
            )}
          </div>
        </div>

        {isAlreadySubmitted && !isEditMode && (
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs px-3.5 py-2 rounded-xl font-semibold shadow-xs">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Formulir Terkunci ({data.inspectionTime})</span>
          </div>
        )}
      </div>

      {/* JIKA SUDAH DISUBMIT DAN BUKAN MODE EDIT: KUNCI FORM */}
      {isAlreadySubmitted && !isEditMode ? (
        <div id="rumdin-locked-screen" className="glass-panel rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 border border-cyan-500/50 glow-cyan/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0 shadow-inner">
                <Lock className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    Formulir Terkunci (Sudah Disubmit)
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Shift {shiftName}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Laporan Tim Rumdin Telah Selesai Disubmit
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Sistem mengunci formulir ini untuk shift yang sama agar petugas tidak melakukan input ulang ganda.
                </p>
              </div>
            </div>
          </div>

          {/* Rincian Data Terkirim */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Data Tersimpan di Laporan Shift:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[11px]">Petugas Pelapor:</div>
                <div className="font-bold text-slate-200 text-sm">
                  {data.officers.filter(Boolean).join(' & ') || '-'}
                </div>
              </div>

              <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[11px]">Waktu Inspeksi:</div>
                <div className="font-bold text-slate-200 text-sm">
                  <span className="font-mono text-cyan-400 font-bold">{data.inspectionTime || '-'}</span> • {data.inspectionDate || '-'}
                </div>
              </div>

              <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[11px]">ACO TR Dipo:</div>
                <div className="font-bold text-slate-200">
                  T-135: <span className={data.acoTRDipo.garduT135Status === 'CLOSE' ? 'text-emerald-400' : 'text-slate-400'}>{data.acoTRDipo.garduT135Status}</span> | T-15N: <span className={data.acoTRDipo.garduT15NStatus === 'CLOSE' ? 'text-emerald-400' : 'text-slate-400'}>{data.acoTRDipo.garduT15NStatus}</span>
                </div>
              </div>

              <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[11px]">ACO TR ST 12:</div>
                <div className="font-bold text-slate-200">
                  T-93: <span className={data.acoTRST12.garduT93Status === 'CLOSE' ? 'text-emerald-400' : 'text-slate-400'}>{data.acoTRST12.garduT93Status}</span> | T-10B: <span className={data.acoTRST12.garduT10BStatus === 'CLOSE' ? 'text-emerald-400' : 'text-slate-400'}>{data.acoTRST12.garduT10BStatus}</span>
                </div>
              </div>

              <div className="glass-panel-subtle p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                <div className="text-slate-500 text-[11px]">UPS 40 KVA Dipo & UPS 100 KVA ST12:</div>
                <div className="font-mono text-slate-200 text-[11px]">
                  UPS 40: R={data.ups40Dipo.loadR || '-'}A, S={data.ups40Dipo.loadS || '-'}A, T={data.ups40Dipo.loadT || '-'}A | UPS 100: R={data.ups100ST12.loadR || '-'}A, S={data.ups100ST12.loadS || '-'}A, T={data.ups100ST12.loadT || '-'}A
                </div>
              </div>
            </div>
          </div>

          {/* Petunjuk Koreksi */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 space-y-1.5 shadow-xs">
            <div className="font-bold flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ingin Melakukan Koreksi atau Pembaruan Data?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Buka menu <strong>Riwayat Laporan</strong>, lalu klik tombol <strong>Edit & Update</strong> pada laporan shift ini. Setelah edit disimpan, data di arsip spreadsheet bulanan akan otomatis diperbarui.
            </p>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onStartEdit && (
              <button
                type="button"
                id="btn-start-edit-rumdin-locked"
                onClick={onStartEdit}
                className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Buka Data untuk Mengedit & Mengupdate</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                type="button"
                id="btn-open-history-rumdin-locked"
                onClick={onOpenHistory}
                className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <History className="w-4 h-4 text-cyan-400" />
                <span>Menu Riwayat Laporan</span>
              </button>
            )}

            {onGoToDashboard && (
              <button
                type="button"
                id="btn-back-dashboard-rumdin-locked"
                onClick={onGoToDashboard}
                className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>Kembali ke Dashboard Shift</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mode Edit Banner */}
          {isEditMode && (
            <div id="rumdin-edit-banner" className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg border border-amber-500/40 glow-amber/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <span>MODE EDIT & KOREKSI RIWAYAT: TIM RUMDIN</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-black">
                      Shift {shiftName}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5">
                    Lakukan koreksi data yang diperlukan. Setelah disimpan, data di arsip spreadsheet bulanan akan otomatis diperbarui.
                  </p>
                </div>
              </div>
              {onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Batal Edit
                </button>
              )}
            </div>
          )}

      {/* 1. Pemilihan Petugas (Muncul Sebelum Form Muncul) */}
      {!hasOfficers ? (
        <div className="space-y-4">
          <div className="glass-panel-cyan rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-1.5 border border-cyan-500/30">
            <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
              <Users className="w-4 h-4" />
              <span>Langkah 1: Tentukan 2 Petugas Piket Tim Rumdin</span>
            </div>
            <p className="text-slate-400">
              Silakan pilih 2 petugas piket dari daftar resmi di bawah ini. Formulir inspeksi kelistrikan (ACO TR & UPS Rumdin) akan otomatis terbuka setelah 2 petugas dipilih.
            </p>
          </div>

          <OfficerSelect
            selectedOfficers={data.officers}
            onChange={(officers) => onChange({ ...data, officers })}
            teamName="Rumdin"
            disabled={!isShiftTimeAllowed}
          />

          {/* Placeholder Kunci Form */}
          <div className="glass-panel rounded-2xl p-8 text-center space-y-3 border border-dashed border-slate-800">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700/60 shadow-inner">
              <Lock className="w-6 h-6 text-cyan-400/80" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Formulir Inspeksi Kelistrikan Masih Terkunci</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Pilih <strong>Petugas 1</strong> dan <strong>Petugas 2</strong> di atas terlebih dahulu untuk membuka formulir pemantauan ACO TR (Dipo & ST12) dan beban UPS Rumdin Wapres.
              </p>
            </div>
          </div>
        </div>
      ) : isChangingOfficers ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Ubah Petugas Piket:</span>
            <button
              type="button"
              onClick={() => setIsChangingOfficers(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <OfficerSelect
            selectedOfficers={data.officers}
            onChange={(officers) => {
              onChange({ ...data, officers });
              if (officers[0] && officers[1] && officers[0] !== officers[1]) {
                setIsChangingOfficers(false);
              }
            }}
            teamName="Rumdin"
            disabled={!isShiftTimeAllowed}
          />
        </div>
      ) : null}

      {/* FORMULIR LENGKAP: Hanya muncul setelah Petugas Dipilih */}
      {hasOfficers && (
        <>

      {/* 2. ACO TR Dipo */}
      <div id="aco-tr-dipo-card" className="glass-panel rounded-2xl p-4 md:p-6 space-y-5 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 glow-cyan">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo)</h3>
              <p className="text-xs text-slate-400">Gardu T135, Gardu T15N, Alarm, Power & Indikator</p>
            </div>
          </div>

          {(activeSpreadsheet || hasSheetsConfigured) && onQuickSyncDipo && (
            <button
              type="button"
              onClick={onQuickSyncDipo}
              disabled={isSyncingSheets}
              title="Kirim data inspeksi ACO TR DIPO ke Google Sheets"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Kirim Dipo ke Sheets</span>
              <span className="sm:hidden">Sync Dipo</span>
            </button>
          )}
        </div>

        {/* Status ACO TR: Gardu T135 and Gardu T15N */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gardu T135 */}
          <div className="glass-panel-subtle p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Gardu T135 Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-dipo-t135-close"
                onClick={() => setDipoT135Status('CLOSE')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.garduT135Status === 'CLOSE' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-dipo-t135-open"
                onClick={() => setDipoT135Status('OPEN')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.garduT135Status === 'OPEN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>

          {/* Gardu T15N */}
          <div className="glass-panel-subtle p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Gardu T15N Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-dipo-t15n-close"
                onClick={() => setDipoT15NStatus('CLOSE')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.garduT15NStatus === 'CLOSE' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-dipo-t15n-open"
                onClick={() => setDipoT15NStatus('OPEN')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.garduT15NStatus === 'OPEN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>
        </div>

        {/* Alarm, Power, Lampu Indikator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Alarm Status */}
          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Alarm Status</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('alarmStatus', 'NORMAL')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.alarmStatus === 'NORMAL' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                NORMAL
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('alarmStatus', 'ALARM')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.alarmStatus === 'ALARM' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ALARM
              </button>
            </div>
          </div>

          {/* Status Power ACO TR (Dipo) */}
          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Power ACO TR Dipo</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('powerACO', 'ON')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.powerACO === 'ON' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('powerACO', 'OFF')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.powerACO === 'OFF' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Lampu Indikator */}
          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Lampu Indikator</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('lampuIndikator', 'ON')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.lampuIndikator === 'ON' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('lampuIndikator', 'OFF')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRDipo.lampuIndikator === 'OFF' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* Keterangan */}
        <div className="space-y-1.5">
          <label htmlFor="aco-dipo-keterangan" className="text-xs font-semibold text-slate-300">
            Keterangan ACO TR Dipo
          </label>
          <input
            id="aco-dipo-keterangan"
            type="text"
            value={data.acoTRDipo.keterangan}
            onChange={(e) => updateAcoDipo('keterangan', e.target.value)}
            placeholder="Catatan atau '-'"
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* 3. ACO TR ST12 */}
      <div id="aco-tr-st12-card" className="glass-panel rounded-2xl p-4 md:p-6 space-y-5 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 glow-cyan">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pantauan Inspeksi ACO TR Rumdin Wapres (ST12)</h3>
              <p className="text-xs text-slate-400">Gardu T93, Gardu T10B, Alarm, Power & Indikator</p>
            </div>
          </div>

          {(activeSpreadsheet || hasSheetsConfigured) && onQuickSyncST12 && (
            <button
              type="button"
              onClick={onQuickSyncST12}
              disabled={isSyncingSheets}
              title="Kirim data inspeksi ACO TR ST 12 ke Google Sheets"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Kirim ST12 ke Sheets</span>
              <span className="sm:hidden">Sync ST12</span>
            </button>
          )}
        </div>

        {/* Status ACO TR: Gardu T93 and Gardu T10B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gardu T93 */}
          <div className="glass-panel-subtle p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Gardu T93 Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-st12-t93-close"
                onClick={() => setST12T93Status('CLOSE')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  (data.acoTRST12.garduT93Status || (data.acoTRST12.penyulangClose?.includes('T93') ? 'CLOSE' : 'CLOSE')) === 'CLOSE'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-st12-t93-open"
                onClick={() => setST12T93Status('OPEN')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  (data.acoTRST12.garduT93Status || (data.acoTRST12.penyulangClose?.includes('T93') ? 'CLOSE' : 'CLOSE')) === 'OPEN'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>

          {/* Gardu T10B */}
          <div className="glass-panel-subtle p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 block">Gardu T10B Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-st12-t10b-close"
                onClick={() => setST12T10BStatus('CLOSE')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  (data.acoTRST12.garduT10BStatus || (data.acoTRST12.penyulangOpen?.includes('T10B') ? 'OPEN' : 'OPEN')) === 'CLOSE'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-st12-t10b-open"
                onClick={() => setST12T10BStatus('OPEN')}
                className={`text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
                  (data.acoTRST12.garduT10BStatus || (data.acoTRST12.penyulangOpen?.includes('T10B') ? 'OPEN' : 'OPEN')) === 'OPEN'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Alarm Status</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoST12('alarmStatus', 'NORMAL')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.alarmStatus === 'NORMAL' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                NORMAL
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('alarmStatus', 'ALARM')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.alarmStatus === 'ALARM' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ALARM
              </button>
            </div>
          </div>

          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Status Power ACO ST12</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoST12('powerACO', 'ON')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.powerACO === 'ON' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('powerACO', 'OFF')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.powerACO === 'OFF' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="glass-panel-subtle p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">Lampu Indikator</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => updateAcoST12('lampuIndikator', 'ON')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.lampuIndikator === 'ON' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('lampuIndikator', 'OFF')}
                className={`text-[11px] py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                  data.acoTRST12.lampuIndikator === 'OFF' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* Keterangan */}
        <div className="space-y-1.5">
          <label htmlFor="aco-st12-keterangan" className="text-xs font-semibold text-slate-300">
            Keterangan ACO TR ST 12
          </label>
          <input
            id="aco-st12-keterangan"
            type="text"
            value={data.acoTRST12.keterangan}
            onChange={(e) => updateAcoST12('keterangan', e.target.value)}
            placeholder="Catatan atau '-'"
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* 4 & 5. Section Header UPS Rumdin with Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-800">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Pantauan Beban & Tegangan UPS Rumdin</span>
          </h3>
          <p className="text-xs text-slate-400">
            UPS 40 KVA Rumdin (Dipo) & UPS 100 KVA Rumdin (ST12)
          </p>
        </div>

        {(activeSpreadsheet || hasSheetsConfigured) && onQuickSyncRumdinUps && (
          <button
            type="button"
            onClick={onQuickSyncRumdinUps}
            disabled={isSyncingSheets}
            title="Kirim kedua beban UPS Rumdin ke Google Sheets (Lembar LAPORAN_CETAK_UPS)"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>Kirim UPS Rumdin ke Sheets</span>
          </button>
        )}
      </div>

      {/* 4. UPS 40 KVA Rumdin (Dipo) */}
      <UPSFormCard
        id="rumdin-ups-40"
        title="Pantauan Beban UPS 40 KVA RUMDIN (Dipo)"
        subTitle="Rumah Dinas Wapres (Dipo)"
        data={data.ups40Dipo}
        onChange={(ups40Dipo) => onChange({ ...data, ups40Dipo })}
      />

      {/* 5. UPS 100 KVA Rumdin (ST12) */}
      <UPSFormCard
        id="rumdin-ups-100"
        title="Pantauan Beban UPS 100 KVA RUMDIN (ST12)"
        subTitle="Rumah Dinas Wapres (ST12)"
        data={data.ups100ST12}
        onChange={(ups100ST12) => onChange({ ...data, ups100ST12 })}
      />

      {/* Submit Button Sticky */}
      <div className="sticky bottom-4 z-10 glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl space-y-2 glow-cyan/10">
        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </span>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
            {!hasOfficers ? (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Pilih 2 petugas di bagian atas sebelum menyimpan laporan.
              </span>
            ) : (
              <span className="text-cyan-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Petugas: {data.officers[0].toUpperCase()} & {data.officers[1].toUpperCase()} siap disubmit.
              </span>
            )}

            {(activeSpreadsheet || hasSheetsConfigured) && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                <FileSpreadsheet className="w-3 h-3" />
                <span>{autoSyncEnabled ? 'Auto-Sync Sheets Aktif' : 'Tersambung ke Sheets'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(activeSpreadsheet || hasSheetsConfigured) && onQuickSyncAllRumdin && (
              <button
                type="button"
                onClick={onQuickSyncAllRumdin}
                disabled={isSyncingSheets || !hasOfficers}
                title="Kirim ACO Dipo, ACO ST12 & UPS sekaligus ke Google Sheets"
                className="px-3.5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Sync Semua ke Sheets</span>
                <span className="md:hidden">Sync Sheets</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!hasOfficers}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                hasOfficers
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 glow-cyan'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              {isEditMode
                ? 'Simpan Koreksi & Update ke Arsip Spreadsheet'
                : isAlreadySubmitted
                ? 'Perbarui Laporan Tim Rumdin'
                : 'Simpan Laporan Tim Rumdin'}
            </button>
          </div>
        </div>
      </div>
          </>
        )}
        </>
      )}
    </form>
  );
};
