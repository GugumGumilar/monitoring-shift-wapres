import React, { useState, useEffect } from 'react';
import { AcoTMData, ACO_TM_PENYULANG_OPTIONS, TimWapresReport, ShiftType } from '../types';
import { OfficerSelect } from './OfficerSelect';
import { UPSFormCard } from './UPSFormCard';
import { ActiveSpreadsheetInfo } from '../services/googleSheets';
import { User } from 'firebase/auth';
import { formatIndonesianDate, formatIndonesianTime, getShiftTimeRange } from '../utils/formatters';
import {
  Radio,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Clock,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Users,
  Edit3,
  Zap,
} from 'lucide-react';

interface TimWapresFormProps {
  data: TimWapresReport;
  onChange: (data: TimWapresReport) => void;
  onSubmit: (data: TimWapresReport) => void;
  shiftName: ShiftType | string;
  isAlreadySubmitted?: boolean;
  user?: User | null;
  activeSpreadsheet?: ActiveSpreadsheetInfo | null;
  hasSheetsConfigured?: boolean;
  autoSyncEnabled?: boolean;
  onOpenGoogleSheets?: () => void;
  onQuickSyncAcoToSheets?: () => void;
  onQuickSyncWapresUps?: () => void;
  isSyncingSheets?: boolean;
  isShiftTimeAllowed?: boolean;
  currentActiveShift?: ShiftType | string;
  onSwitchToActiveShift?: () => void;
}

export const TimWapresForm: React.FC<TimWapresFormProps> = ({
  data,
  onChange,
  onSubmit,
  shiftName,
  isAlreadySubmitted = false,
  user = null,
  activeSpreadsheet = null,
  hasSheetsConfigured = false,
  autoSyncEnabled = true,
  onOpenGoogleSheets,
  onQuickSyncAcoToSheets,
  onQuickSyncWapresUps,
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

  const updateAcoTM = (field: keyof AcoTMData, value: any) => {
    onChange({
      ...data,
      acoTM: {
        ...data.acoTM,
        [field]: value,
      },
    });
  };

  const handleSwapPenyulang = () => {
    onChange({
      ...data,
      acoTM: {
        ...data.acoTM,
        penyulangClose: data.acoTM.penyulangOpen,
        penyulangOpen: data.acoTM.penyulangClose,
      },
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!data.officers[0] || !data.officers[1]) {
      setSubmitError('Harap pilih 2 petugas piket Tim Wapres terlebih dahulu.');
      return;
    }

    const now = new Date();
    const realTimeDate = formatIndonesianDate(now);
    const realTimeTime = formatIndonesianTime(now);

    const updated: TimWapresReport = {
      ...data,
      inspectionDate: realTimeDate,
      inspectionTime: realTimeTime,
      submittedAt: now.toISOString(),
    };
    onSubmit(updated);
  };

  const hasOfficers = Boolean(data.officers[0] && data.officers[1] && data.officers[0] !== data.officers[1]);

  return (
    <form id="tim-wapres-form" onSubmit={handleFormSubmit} className="space-y-6">
      {/* Banner / Info */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            FORMULIR INSPEKSI: TIM WAPRES
          </div>
          <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
            Pantauan UPS Dan ACO TM Gardu D 126 SetWapres
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
            <span>Shift: <strong className="text-emerald-300 font-semibold">{shiftName}</strong></span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{liveDate}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-300 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{liveTime}</span>
              <span className="text-[10px] text-zinc-400 font-normal ml-0.5">(Real-Time)</span>
            </span>
            {hasOfficers && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-zinc-200 bg-zinc-800/90 px-2.5 py-0.5 rounded-md border border-zinc-700/80">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Petugas: <strong className="text-emerald-300 font-semibold">{data.officers[0]} & {data.officers[1]}</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsChangingOfficers(!isChangingOfficers)}
                    className="ml-1 text-[11px] text-zinc-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    {isChangingOfficers ? 'Tutup' : 'Ubah'}
                  </button>
                </span>
              </>
            )}
          </div>
        </div>

        {isAlreadySubmitted && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-lg font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Telah disubmit ({data.inspectionTime})</span>
          </div>
        )}
      </div>

      {/* 1. Pemilihan Petugas (Muncul Sebelum Form Muncul) */}
      {!hasOfficers ? (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-4 text-xs text-zinc-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <Users className="w-4 h-4" />
              <span>Langkah 1: Tentukan 2 Petugas Piket Tim Wapres</span>
            </div>
            <p className="text-zinc-400">
              Silakan pilih 2 petugas piket dari daftar resmi di bawah ini. Formulir inspeksi kelistrikan (ACO TM & UPS) akan otomatis terbuka setelah 2 petugas dipilih.
            </p>
          </div>

          <OfficerSelect
            selectedOfficers={data.officers}
            onChange={(officers) => onChange({ ...data, officers })}
            teamName="Wapres"
            disabled={!isShiftTimeAllowed}
          />

          {/* Placeholder Kunci Form */}
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-700/60">
              <Lock className="w-6 h-6 text-emerald-400/70" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Formulir Inspeksi Kelistrikan Masih Terkunci</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Pilih <strong>Petugas 1</strong> dan <strong>Petugas 2</strong> di atas terlebih dahulu untuk membuka formulir pemantauan ACO TM Gardu D 126 dan beban UPS Tim Wapres.
              </p>
            </div>
          </div>
        </div>
      ) : isChangingOfficers ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Ubah Petugas Piket:</span>
            <button
              type="button"
              onClick={() => setIsChangingOfficers(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
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
            teamName="Wapres"
            disabled={!isShiftTimeAllowed}
          />
        </div>
      ) : null}

      {/* 2. ACO TM & UPS FORMULIR (Hanya muncul jika Petugas sudah dipilih) */}
      {hasOfficers && (
        <>

      {/* 2. ACO TM Gardu D 126 SetWapres */}
      <div id="aco-tm-card" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100 text-base">Pantauan ACO TM Gardu D 126 SetWapres</h3>
                {activeSpreadsheet && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sheets Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">Status penyulang, alarm, remote, dan indikator kubikel</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onQuickSyncAcoToSheets && (
              <button
                type="button"
                id="btn-quick-sync-aco"
                onClick={onQuickSyncAcoToSheets}
                disabled={isSyncingSheets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer shadow-xs"
                title="Kirim status ACO TM ini ke Google Spreadsheet secara langsung"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSyncingSheets ? 'Mengirim...' : 'Kirim Data ke Sheets'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Penyulang Close & Open */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              Pilihan Penyulang ACO TM Gardu D 126:
            </span>
            <button
              type="button"
              id="btn-swap-penyulang-aco"
              onClick={handleSwapPenyulang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors"
              title="Tukar status antara Penyulang Close dan Penyulang Open"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tukar Posisi (Close ⇄ Open)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Close */}
            <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="penyulang-close-select" className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Status Penyulang: CLOSE ( // )</span>
                </label>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                  AKTIF / MASUK
                </span>
              </div>

              {/* Dropdown Select */}
              <div>
                <select
                  id="penyulang-close-select"
                  value={
                    ACO_TM_PENYULANG_OPTIONS.includes(data.acoTM.penyulangClose as any)
                      ? data.acoTM.penyulangClose
                      : 'CUSTOM'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      updateAcoTM('penyulangClose', e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 font-medium focus:outline-none"
                >
                  <option value="" disabled>-- Pilih Penyulang Close ( // ) --</option>
                  {ACO_TM_PENYULANG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {!ACO_TM_PENYULANG_OPTIONS.includes(data.acoTM.penyulangClose as any) && (
                    <option value="CUSTOM">Lainnya: {data.acoTM.penyulangClose || '(Manual)'}</option>
                  )}
                </select>
              </div>

              {/* 4 Quick-Click Options */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block">
                  Klik Cepat 4 Opsi Penyulang:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACO_TM_PENYULANG_OPTIONS.map((opt) => {
                    const isSelected = data.acoTM.penyulangClose === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => updateAcoTM('penyulangClose', opt)}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-xs'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input text fallback */}
              <div className="pt-1">
                <input
                  id="penyulang-close"
                  type="text"
                  value={data.acoTM.penyulangClose}
                  onChange={(e) => updateAcoTM('penyulangClose', e.target.value)}
                  placeholder="Atau ketik custom penyulang..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Open */}
            <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="penyulang-open-select" className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Status Penyulang: OPEN ( # )</span>
                </label>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                  STANDBY / LEPAS
                </span>
              </div>

              {/* Dropdown Select */}
              <div>
                <select
                  id="penyulang-open-select"
                  value={
                    ACO_TM_PENYULANG_OPTIONS.includes(data.acoTM.penyulangOpen as any)
                      ? data.acoTM.penyulangOpen
                      : 'CUSTOM'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      updateAcoTM('penyulangOpen', e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 font-medium focus:outline-none"
                >
                  <option value="" disabled>-- Pilih Penyulang Open ( # ) --</option>
                  {ACO_TM_PENYULANG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {!ACO_TM_PENYULANG_OPTIONS.includes(data.acoTM.penyulangOpen as any) && (
                    <option value="CUSTOM">Lainnya: {data.acoTM.penyulangOpen || '(Manual)'}</option>
                  )}
                </select>
              </div>

              {/* 4 Quick-Click Options */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block">
                  Klik Cepat 4 Opsi Penyulang:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACO_TM_PENYULANG_OPTIONS.map((opt) => {
                    const isSelected = data.acoTM.penyulangOpen === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => updateAcoTM('penyulangOpen', opt)}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-xs'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input text fallback */}
              <div className="pt-1">
                <input
                  id="penyulang-open"
                  type="text"
                  value={data.acoTM.penyulangOpen}
                  onChange={(e) => updateAcoTM('penyulangOpen', e.target.value)}
                  placeholder="Atau ketik custom penyulang..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggles: Alarm Status, Power ACO, Status Charging, Status Remote, Lampu Indikator */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Alarm Status */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Alarm Status</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoTM('alarmStatus', 'NORMAL')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.alarmStatus === 'NORMAL' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                NORMAL
              </button>
              <button
                type="button"
                onClick={() => updateAcoTM('alarmStatus', 'ALARM')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.alarmStatus === 'ALARM' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                ALARM
              </button>
            </div>
          </div>

          {/* Power ACO */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Power ACO</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoTM('powerACO', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.powerACO === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoTM('powerACO', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.powerACO === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Status Charging Kubikel */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Charging Kubikel</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoTM('chargingKubikel', 'YA')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.chargingKubikel === 'YA' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                YA
              </button>
              <button
                type="button"
                onClick={() => updateAcoTM('chargingKubikel', 'TIDAK')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.chargingKubikel === 'TIDAK' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                }`}
              >
                TIDAK
              </button>
            </div>
          </div>

          {/* Status Remote Kubikel */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Remote Kubikel</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoTM('remoteKubikel', 'AUTO')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.remoteKubikel === 'AUTO' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                AUTO
              </button>
              <button
                type="button"
                onClick={() => updateAcoTM('remoteKubikel', 'LOCAL')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.remoteKubikel === 'LOCAL' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                }`}
              >
                LOCAL
              </button>
            </div>
          </div>

          {/* Lampu Indikator */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-zinc-300 block">Lampu Indikator</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoTM('lampuIndikator', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.lampuIndikator === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoTM('lampuIndikator', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTM.lampuIndikator === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* Keterangan ACO TM */}
        <div className="space-y-1">
          <label htmlFor="aco-tm-keterangan" className="text-xs font-semibold text-zinc-300">
            Keterangan ACO TM
          </label>
          <input
            id="aco-tm-keterangan"
            type="text"
            value={data.acoTM.keterangan}
            onChange={(e) => updateAcoTM('keterangan', e.target.value)}
            placeholder="Catatan kondisi operasional atau '-'"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
          />
        </div>
      </div>

      {/* UPS Wapres Header with Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-zinc-800">
        <div>
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Pantauan Beban & Tegangan UPS Wapres (Gardu D 126)</span>
          </h3>
          <p className="text-xs text-zinc-400">
            UPS 30 KVA (Lt. 1), UPS 40 KVA (Lt. 2), dan UPS 60 KVA (Lt. 3)
          </p>
        </div>

        {(activeSpreadsheet || hasSheetsConfigured) && onQuickSyncWapresUps && (
          <button
            type="button"
            onClick={onQuickSyncWapresUps}
            disabled={isSyncingSheets}
            title="Kirim 3 beban UPS Wapres ke Google Sheets (Lembar LAPORAN_CETAK_UPS)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>Kirim UPS Wapres ke Sheets</span>
          </button>
        )}
      </div>

      {/* 3. UPS 30 KVA */}
      <UPSFormCard
        id="wapres-ups-30"
        title="Pantauan Beban UPS 30 KVA"
        subTitle="SetWapres Gardu D 126"
        data={data.ups30}
        onChange={(ups30) => onChange({ ...data, ups30 })}
      />

      {/* 4. UPS 40 KVA */}
      <UPSFormCard
        id="wapres-ups-40"
        title="Pantauan Beban UPS 40 KVA"
        subTitle="SetWapres Gardu D 126"
        data={data.ups40}
        onChange={(ups40) => onChange({ ...data, ups40 })}
      />

      {/* 5. UPS 60 KVA */}
      <UPSFormCard
        id="wapres-ups-60"
        title="Pantauan Beban UPS 60 KVA"
        subTitle="SetWapres Gardu D 126"
        data={data.ups60}
        onChange={(ups60) => onChange({ ...data, ups60 })}
      />

      {/* Submit Button */}
      <div className="sticky bottom-4 z-10 bg-zinc-950/95 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-zinc-800 shadow-xl space-y-2">
        {submitError && (
          <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </span>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {!hasOfficers ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Pilih 2 petugas di bagian atas sebelum menyimpan laporan.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                Petugas: {data.officers[0].toUpperCase()} & {data.officers[1].toUpperCase()} siap disubmit.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={!hasOfficers}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasOfficers
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {isAlreadySubmitted ? 'Perbarui Laporan Tim Wapres' : 'Simpan Laporan Tim Wapres'}
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </form>
  );
};
