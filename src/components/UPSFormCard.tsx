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

  return (
    <div id={`ups-card-${id}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 space-y-4 shadow-sm hover:border-zinc-700/80 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-100 text-base">{title}</h4>
            {subTitle && <p className="text-xs text-zinc-400">{subTitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearUPS}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors cursor-pointer"
            title="Kosongkan semua inputan pada UPS ini"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Kosongkan
          </button>
          <button
            type="button"
            onClick={handleFillNominal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
            title="Bantu isi nominal tegangan standar 220V/380V"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Tegangan Standar
          </button>
        </div>
      </div>

      {/* Beban UPS (A) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>Beban UPS (Ampere)</span>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 focus-within:border-amber-500">
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
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-base focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 focus-within:border-amber-500">
            <label htmlFor={`${id}-load-s`} className="text-[11px] font-bold text-yellow-400 block mb-1">
              Fasa S (A)
            </label>
            <input
              id={`${id}-load-s`}
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={data.loadS}
              onChange={(e) => updateField('loadS', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-base focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 focus-within:border-amber-500">
            <label htmlFor={`${id}-load-t`} className="text-[11px] font-bold text-sky-400 block mb-1">
              Fasa T (A)
            </label>
            <input
              id={`${id}-load-t`}
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={data.loadT}
              onChange={(e) => updateField('loadT', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-base focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tegangan UPS (V) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
          <span>Tegangan UPS (Volt)</span>
          <span className="text-[11px] text-zinc-500 font-normal lowercase">fasa-netral & fasa-fasa</span>
        </label>

        {/* Phase to Neutral */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-rn`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              R-N (V)
            </label>
            <input
              id={`${id}-volt-rn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltRN}
              onChange={(e) => updateField('voltRN', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-sn`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              S-N (V)
            </label>
            <input
              id={`${id}-volt-sn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltSN}
              onChange={(e) => updateField('voltSN', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-tn`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              T-N (V)
            </label>
            <input
              id={`${id}-volt-tn`}
              type="text"
              inputMode="numeric"
              placeholder="220"
              value={data.voltTN}
              onChange={(e) => updateField('voltTN', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Phase to Phase */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-rs`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              R-S (V)
            </label>
            <input
              id={`${id}-volt-rs`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltRS}
              onChange={(e) => updateField('voltRS', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-rt`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              R-T (V)
            </label>
            <input
              id={`${id}-volt-rt`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltRT}
              onChange={(e) => updateField('voltRT', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>

          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 focus-within:border-emerald-500">
            <label htmlFor={`${id}-volt-st`} className="text-[11px] font-semibold text-zinc-400 block mb-0.5">
              S-T (V)
            </label>
            <input
              id={`${id}-volt-st`}
              type="text"
              inputMode="numeric"
              placeholder="380"
              value={data.voltST}
              onChange={(e) => updateField('voltST', e.target.value)}
              className="w-full bg-transparent text-zinc-100 font-mono font-semibold text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Temperatur, Alarm, Backup Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Temperatur */}
        <div className="space-y-1">
          <label htmlFor={`${id}-temp`} className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono font-semibold focus:outline-none focus:border-cyan-500 pr-10"
            />
            <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-medium">°C</span>
          </div>
        </div>

        {/* Alarm UPS Toggle */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alarm UPS
          </label>
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              id={`${id}-alarm-normal`}
              onClick={() => updateField('alarm', 'NORMAL')}
              className={`text-xs py-1.5 font-bold rounded-md transition-all ${
                data.alarm === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              id={`${id}-alarm-alarm`}
              onClick={() => updateField('alarm', 'ALARM')}
              className={`text-xs py-1.5 font-bold rounded-md transition-all ${
                data.alarm === 'ALARM'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALARM
            </button>
          </div>
        </div>

        {/* Backup Time */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Back Up Time
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                id={`${id}-backup-hours`}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={data.backupHours}
                onChange={(e) => updateField('backupHours', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-zinc-100 font-mono font-semibold focus:outline-none focus:border-indigo-500 pr-9"
              />
              <span className="absolute right-2 top-2.5 text-[10px] text-zinc-400">Jam</span>
            </div>
            <div className="relative">
              <input
                id={`${id}-backup-mins`}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={data.backupMinutes}
                onChange={(e) => updateField('backupMinutes', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-zinc-100 font-mono font-semibold focus:outline-none focus:border-indigo-500 pr-9"
              />
              <span className="absolute right-2 top-2.5 text-[10px] text-zinc-400">Mnt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Keterangan */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={`${id}-keterangan`} className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            Keterangan
          </label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => updateField('keterangan', '-')}
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              Preset: -
            </button>
            <button
              type="button"
              onClick={() =>
                updateField('keterangan', 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)')
              }
              className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 truncate max-w-[140px] sm:max-w-none"
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
          className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
        />
      </div>
    </div>
  );
};
