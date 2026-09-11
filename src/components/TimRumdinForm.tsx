import React, { useState, useEffect } from 'react';
import { AcoTRDipoData, AcoTRST12Data, TimRumdinReport } from '../types';
import { OfficerSelect } from './OfficerSelect';
import { UPSFormCard } from './UPSFormCard';
import { formatIndonesianDate, formatIndonesianTime } from '../utils/formatters';
import { Power, ShieldCheck, CheckCircle2, AlertTriangle, Building2, Clock, Calendar } from 'lucide-react';

interface TimRumdinFormProps {
  data: TimRumdinReport;
  onChange: (data: TimRumdinReport) => void;
  onSubmit: (data: TimRumdinReport) => void;
  shiftName: string;
  isAlreadySubmitted?: boolean;
}

export const TimRumdinForm: React.FC<TimRumdinFormProps> = ({
  data,
  onChange,
  onSubmit,
  shiftName,
  isAlreadySubmitted = false,
}) => {
  const [liveTime, setLiveTime] = useState<string>(formatIndonesianTime());
  const [liveDate, setLiveDate] = useState<string>(formatIndonesianDate());

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
    if (!data.officers[0] || !data.officers[1]) {
      alert('Peringatan: Harap pilih 2 petugas piket Tim Rumdin terlebih dahulu.');
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

  const hasOfficers = Boolean(data.officers[0] && data.officers[1]);

  return (
    <form id="tim-rumdin-form" onSubmit={handleFormSubmit} className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            FORMULIR INSPEKSI: TIM RUMDIN
          </div>
          <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
            Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo & ST12)
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
            <span>Shift: <strong className="text-blue-300 font-semibold">{shiftName}</strong></span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{liveDate}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1 text-blue-300 font-mono font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
              <Clock className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>{liveTime}</span>
              <span className="text-[10px] text-zinc-400 font-normal ml-0.5">(Real-Time)</span>
            </span>
          </div>
        </div>

        {isAlreadySubmitted && (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-lg font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Telah disubmit ({data.inspectionTime})</span>
          </div>
        )}
      </div>

      {/* 1. Officer Selection */}
      <OfficerSelect
        selectedOfficers={data.officers}
        onChange={(officers) => onChange({ ...data, officers })}
        teamName="Rumdin"
      />

      {/* 2. ACO TR Dipo */}
      <div id="aco-tr-dipo-card" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo)</h3>
            <p className="text-xs text-zinc-400">Gardu T135, Gardu T15N, Alarm, Power & Indikator</p>
          </div>
        </div>

        {/* Status ACO TR: Gardu T135 and Gardu T15N */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gardu T135 */}
          <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 block">Gardu T135 Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-md border border-zinc-800">
              <button
                type="button"
                id="btn-dipo-t135-close"
                onClick={() => setDipoT135Status('CLOSE')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  data.acoTRDipo.garduT135Status === 'CLOSE' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-dipo-t135-open"
                onClick={() => setDipoT135Status('OPEN')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  data.acoTRDipo.garduT135Status === 'OPEN' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>

          {/* Gardu T15N */}
          <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 block">Gardu T15N Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-md border border-zinc-800">
              <button
                type="button"
                id="btn-dipo-t15n-close"
                onClick={() => setDipoT15NStatus('CLOSE')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  data.acoTRDipo.garduT15NStatus === 'CLOSE' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-dipo-t15n-open"
                onClick={() => setDipoT15NStatus('OPEN')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  data.acoTRDipo.garduT15NStatus === 'OPEN' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
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
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Alarm Status</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('alarmStatus', 'NORMAL')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.alarmStatus === 'NORMAL' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                NORMAL
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('alarmStatus', 'ALARM')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.alarmStatus === 'ALARM' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                ALARM
              </button>
            </div>
          </div>

          {/* Status Power ACO TR (Dipo) */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Power ACO TR Dipo</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('powerACO', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.powerACO === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('powerACO', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.powerACO === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Lampu Indikator */}
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Lampu Indikator</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoDipo('lampuIndikator', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.lampuIndikator === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoDipo('lampuIndikator', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRDipo.lampuIndikator === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* Keterangan */}
        <div className="space-y-1">
          <label htmlFor="aco-dipo-keterangan" className="text-xs font-semibold text-zinc-300">
            Keterangan ACO TR Dipo
          </label>
          <input
            id="aco-dipo-keterangan"
            type="text"
            value={data.acoTRDipo.keterangan}
            onChange={(e) => updateAcoDipo('keterangan', e.target.value)}
            placeholder="Catatan atau '-'"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. ACO TR ST12 */}
      <div id="aco-tr-st12-card" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">Pantauan Inspeksi ACO TR Rumdin Wapres (ST12)</h3>
            <p className="text-xs text-zinc-400">Gardu T93, Gardu T10B, Alarm, Power & Indikator</p>
          </div>
        </div>

        {/* Status ACO TR: Gardu T93 and Gardu T10B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gardu T93 */}
          <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 block">Gardu T93 Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-md border border-zinc-800">
              <button
                type="button"
                id="btn-st12-t93-close"
                onClick={() => setST12T93Status('CLOSE')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  (data.acoTRST12.garduT93Status || (data.acoTRST12.penyulangClose?.includes('T93') ? 'CLOSE' : 'CLOSE')) === 'CLOSE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-st12-t93-open"
                onClick={() => setST12T93Status('OPEN')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  (data.acoTRST12.garduT93Status || (data.acoTRST12.penyulangClose?.includes('T93') ? 'CLOSE' : 'CLOSE')) === 'OPEN'
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>

          {/* Gardu T10B */}
          <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 block">Gardu T10B Status</span>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-md border border-zinc-800">
              <button
                type="button"
                id="btn-st12-t10b-close"
                onClick={() => setST12T10BStatus('CLOSE')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  (data.acoTRST12.garduT10BStatus || (data.acoTRST12.penyulangOpen?.includes('T10B') ? 'OPEN' : 'OPEN')) === 'CLOSE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                CLOSE ( // )
              </button>
              <button
                type="button"
                id="btn-st12-t10b-open"
                onClick={() => setST12T10BStatus('OPEN')}
                className={`text-xs py-1.5 font-bold rounded transition-colors ${
                  (data.acoTRST12.garduT10BStatus || (data.acoTRST12.penyulangOpen?.includes('T10B') ? 'OPEN' : 'OPEN')) === 'OPEN'
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                OPEN ( # )
              </button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Alarm Status</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoST12('alarmStatus', 'NORMAL')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.alarmStatus === 'NORMAL' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                NORMAL
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('alarmStatus', 'ALARM')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.alarmStatus === 'ALARM' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                ALARM
              </button>
            </div>
          </div>

          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Status Power ACO ST12</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoST12('powerACO', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.powerACO === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('powerACO', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.powerACO === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-300 block">Lampu Indikator</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                onClick={() => updateAcoST12('lampuIndikator', 'ON')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.lampuIndikator === 'ON' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => updateAcoST12('lampuIndikator', 'OFF')}
                className={`text-[11px] py-1 font-bold rounded ${
                  data.acoTRST12.lampuIndikator === 'OFF' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* Keterangan */}
        <div className="space-y-1">
          <label htmlFor="aco-st12-keterangan" className="text-xs font-semibold text-zinc-300">
            Keterangan ACO TR ST 12
          </label>
          <input
            id="aco-st12-keterangan"
            type="text"
            value={data.acoTRST12.keterangan}
            onChange={(e) => updateAcoST12('keterangan', e.target.value)}
            placeholder="Catatan atau '-'"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none"
          />
        </div>
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

      {/* Submit Button */}
      <div className="sticky bottom-4 z-10 bg-zinc-950/90 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-zinc-400">
          {!hasOfficers ? (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pilih 2 petugas di bagian atas sebelum menyimpan laporan.
            </span>
          ) : (
            <span className="text-blue-400 font-medium">
              Petugas: {data.officers[0].toUpperCase()} & {data.officers[1].toUpperCase()} siap disubmit.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="submit"
            disabled={!hasOfficers}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              hasOfficers
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isAlreadySubmitted ? 'Perbarui Laporan Tim Rumdin' : 'Simpan Laporan Tim Rumdin'}
          </button>
        </div>
      </div>
    </form>
  );
};
