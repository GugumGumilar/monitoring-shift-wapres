import React from 'react';
import { UPSData } from '../types';
import { Zap, Thermometer, Bell, Clock, FileText, Sparkles, RotateCcw } from 'lucide-react';

interface UPSFormCardProps {
  id: string;
  title: string;
  subTitle?: string;
  data: UPSData;
  onChange: (updated: UPSData) => void;
  defaultLoads?: { r: string; s: string; t: string };
  defaultBackupHours?: string;
  defaultBackupMinutes?: string;
}

export const UPSFormCard: React.FC<UPSFormCardProps> = ({
  id,
  title,
  subTitle,
  data,
  onChange,
}) => {
  const updateField = (field: keyof UPSData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleClearUPS = () => {
    onChange({
      ...data,
      loadR: '',
      loadS: '',
      loadT: '',
      voltRN: '',
      voltSN: '',
      voltTN: '',
      voltRS: '',
      voltRT: '',
      voltST: '',
      temperature: '',
      alarm: 'NORMAL',
      backupHours: '',
      backupMinutes: '',
      backupTotalMinutes: '',
    });
  };

  const handleFillNominal = () => {
    onChange({
      ...data,
      voltRN: '220',
      voltSN: '220',
      voltTN: '220',
      voltRS: '380',
      voltRT: '380',
      voltST: '380',
      temperature: data.temperature || '25',
      alarm: 'NORMAL',
    });
  };

  // Menghitung nilai menit yang ditampilkan pada input
  const getCurrentMinutes = (): string => {
    if (data.backupTotalMinutes !== undefined && data.backupTotalMinutes !== '') {
      return data.backupTotalMinutes;
    }
    const h = data.backupHours ? parseInt(data.backupHours, 10) : NaN;
    const m = data.backupMinutes ? parseInt(data.backupMinutes, 10) : NaN;
    if (!isNaN(h) || !isNaN(m)) {
      const total = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
      return String(total);
    }
    return '';
  };

  const currentMinutes = getCurrentMinutes();

  const handleMinutesChange = (val: string) => {
    // Hanya menerima karakter angka
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits === '') {
      onChange({
        ...data,
        backupTotalMinutes: '',
        backupHours: '',
        backupMinutes: '',
      });
      return;
    }

    const totalMinutes = parseInt(cleanDigits, 10);
    if (isNaN(totalMinutes)) {
      onChange({
        ...data,
        backupTotalMinutes: '',
        backupHours: '',
        backupMinutes: '',
      });
      return;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    onChange({
      ...data,
      backupTotalMinutes: cleanDigits,
      backupHours: String(hours),
      backupMinutes: String(minutes),
    });
  };

  const displayHours = data.backupHours !== '' ? data.backupHours : (currentMinutes !== '' ? String(Math.floor(parseInt(currentMinutes, 10) / 60)) : '0');
  const displayMinutes = data.backupMinutes !== '' ? data.backupMinutes : (currentMinutes !== '' ? String(parseInt(currentMinutes, 10) % 60) : '0');

  return (
    <div id={`ups-card-${id}`} className="glass-panel rounded-2xl p-4 md:p-5 space-y-4 hover:border-cyan-500/40 transition-all shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs glow-cyan">
            <Zap className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base tracking-tight">{title}</h4>
            {subTitle && <p className="text-xs text-slate-400">{subTitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearUPS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
            title="Kosongkan semua inputan pada UPS ini"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Kosongkan
          </button>
          <button
            type="button"
            onClick={handleFillNominal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all cursor-pointer glow-cyan"
            title="Bantu isi nominal tegangan standar 220V/380V"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Tegangan Standar
          </button>
        </div>
      </div>

      {/* Beban UPS (A) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-cyan-400">●</span>
          <span>Beban UPS (Ampere)</span>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-red-950/20 p-2.5 rounded-xl border border-red-500/30 focus-within:border-red-400 transition-all">
            <label htmlFor={`${id}-load-r`} className="text-[11px] font-bold text-red-400 block mb-1">
              Fasa R (A)
            </label>
            <input
              id={`${id}-load-r`}
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={data.loadR}
              onChange={(e) => updateField('loadR', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none"
            />
          </div>

          <div className="bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30 focus-within:border-amber-400 transition-all">
            <label htmlFor={`${id}-load-s`} className="text-[11px] font-bold text-amber-400 block mb-1">
              Fasa S (A)
            </label>
            <input
              id={`${id}-load-s`}
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={data.loadS}
              onChange={(e) => updateField('loadS', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none"
            />
          </div>

          <div className="bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-500/30 focus-within:border-cyan-400 transition-all">
            <label htmlFor={`${id}-load-t`} className="text-[11px] font-bold text-cyan-400 block mb-1">
              Fasa T (A)
            </label>
            <input
              id={`${id}-load-t`}
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={data.loadT}
              onChange={(e) => updateField('loadT', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tegangan UPS (V) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">●</span>
            <span>Tegangan UPS (Volt)</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono font-normal">F-N & F-F</span>
        </label>

        {/* Phase to Neutral */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-cyan-500 transition-all">
            <label htmlFor={`${id}-volt-rn`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              R-N (V)
            </label>
            <input
              id={`${id}-volt-rn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltRN}
              onChange={(e) => updateField('voltRN', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-cyan-500 transition-all">
            <label htmlFor={`${id}-volt-sn`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              S-N (V)
            </label>
            <input
              id={`${id}-volt-sn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltSN}
              onChange={(e) => updateField('voltSN', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-cyan-500 transition-all">
            <label htmlFor={`${id}-volt-tn`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              T-N (V)
            </label>
            <input
              id={`${id}-volt-tn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltTN}
              onChange={(e) => updateField('voltTN', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Phase to Phase */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-emerald-500 transition-all">
            <label htmlFor={`${id}-volt-rs`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              R-S (V)
            </label>
            <input
              id={`${id}-volt-rs`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltRS}
              onChange={(e) => updateField('voltRS', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-emerald-500 transition-all">
            <label htmlFor={`${id}-volt-rt`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              R-T (V)
            </label>
            <input
              id={`${id}-volt-rt`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltRT}
              onChange={(e) => updateField('voltRT', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 focus-within:border-emerald-500 transition-all">
            <label htmlFor={`${id}-volt-st`} className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              S-T (V)
            </label>
            <input
              id={`${id}-volt-st`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltST}
              onChange={(e) => updateField('voltST', e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Temperatur, Alarm, Backup Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Temperatur */}
        <div className="space-y-1.5">
          <label htmlFor={`${id}-temp`} className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            Temperatur UPS
          </label>
          <div className="relative">
            <input
              id={`${id}-temp`}
              type="text"
              inputMode="numeric"
              placeholder="25"
              value={data.temperature}
              onChange={(e) => updateField('temperature', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400 pr-10 shadow-inner"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">°C</span>
          </div>
        </div>

        {/* Alarm UPS Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alarm UPS
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              id={`${id}-alarm-normal`}
              onClick={() => updateField('alarm', 'NORMAL')}
              className={`text-xs py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                data.alarm === 'NORMAL'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              id={`${id}-alarm-alarm`}
              onClick={() => updateField('alarm', 'ALARM')}
              className={`text-xs py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                data.alarm === 'ALARM'
                  ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/30 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALARM
            </button>
          </div>
        </div>

        {/* Backup Time (Hanya Menginput Menit) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-backup-mins`} className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Back Up Time</span>
            </label>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Menit
            </span>
          </div>
          <div className="relative">
            <input
              id={`${id}-backup-mins`}
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 120"
              value={currentMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-indigo-400 pr-16 shadow-inner"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium select-none">Menit</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 pt-0.5">
            <span className="text-[10px] text-slate-500">Konversi:</span>
            <span className="font-semibold text-indigo-300 font-mono">
              {displayHours} Jam {displayMinutes} Menit
            </span>
          </div>
        </div>
      </div>

      {/* Keterangan */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={`${id}-keterangan`} className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Keterangan
          </label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => updateField('keterangan', '-')}
              className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer"
            >
              Preset: -
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  keterangan: 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)',
                  backupTotalMinutes: '0',
                  backupHours: '0',
                  backupMinutes: '0',
                });
              }}
              className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 truncate max-w-[140px] sm:max-w-none transition-colors cursor-pointer"
            >
              Preset: Tidak Terbaca
            </button>
          </div>
        </div>
        <input
          id={`${id}-keterangan`}
          type="text"
          placeholder="Keterangan kondisi atau '-'"
          value={data.keterangan}
          onChange={(e) => updateField('keterangan', e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none shadow-inner"
        />
      </div>
    </div>
  );
};
