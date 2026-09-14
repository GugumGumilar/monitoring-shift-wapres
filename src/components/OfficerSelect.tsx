import React, { useState } from 'react';
import { STAFF_LIST, StaffName } from '../types';
import { Users, Check, AlertCircle, Edit3 } from 'lucide-react';

interface OfficerSelectProps {
  selectedOfficers: [string, string];
  onChange: (officers: [string, string]) => void;
  teamName: string;
  disabled?: boolean;
}

export const OfficerSelect: React.FC<OfficerSelectProps> = ({
  selectedOfficers,
  onChange,
  teamName,
  disabled = false,
}) => {
  const [officer1, officer2] = selectedOfficers;
  const isComplete = Boolean(officer1 && officer2 && officer1 !== officer2);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isComplete);

  const handleSelect1 = (name: string) => {
    onChange([name, officer2]);
    if (name && officer2 && name !== officer2) {
      setIsCollapsed(true);
    }
  };

  const handleSelect2 = (name: string) => {
    onChange([officer1, name]);
    if (officer1 && name && officer1 !== name) {
      setIsCollapsed(true);
    }
  };

  if (isComplete && isCollapsed) {
    return (
      <div
        id={`officer-select-${teamName.toLowerCase().replace(/\s+/g, '-')}`}
        className="glass-panel-subtle rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-emerald-500/30 glow-emerald/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Petugas {teamName} Terpilih</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white mt-0.5 tracking-tight">
              {officer1} <span className="text-slate-500 font-normal">&</span> {officer2}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 cursor-pointer self-start sm:self-auto transition-all active:scale-95 shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ubah Petugas</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id={`officer-select-${teamName.toLowerCase().replace(/\s+/g, '-')}`}
      className="glass-panel rounded-xl p-4 md:p-5 space-y-4 shadow-lg border border-slate-800"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Petugas {teamName}</h3>
            <p className="text-xs text-slate-400">Pilih 2 orang petugas piket dari daftar resmi</p>
          </div>
        </div>

        <div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              {officer1.toUpperCase()} & {officer2.toUpperCase()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Pilih 2 Petugas
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Officer 1 */}
        <div className="space-y-1.5">
          <label htmlFor={`officer-1-${teamName}`} className="block text-xs font-medium text-slate-300">
            Petugas 1 <span className="text-rose-400">*</span>
          </label>
          <select
            id={`officer-1-${teamName}`}
            value={officer1}
            disabled={disabled}
            onChange={(e) => handleSelect1(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Pilih Petugas 1 --</option>
            {STAFF_LIST.map((name) => (
              <option key={name} value={name} disabled={name === officer2 || disabled}>
                {name} {name === officer2 ? '(Sudah dipilih sebagai Petugas 2)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Officer 2 */}
        <div className="space-y-1.5">
          <label htmlFor={`officer-2-${teamName}`} className="block text-xs font-medium text-slate-300">
            Petugas 2 <span className="text-rose-400">*</span>
          </label>
          <select
            id={`officer-2-${teamName}`}
            value={officer2}
            disabled={disabled}
            onChange={(e) => handleSelect2(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Pilih Petugas 2 --</option>
            {STAFF_LIST.map((name) => (
              <option key={name} value={name} disabled={name === officer1 || disabled}>
                {name} {name === officer1 ? '(Sudah dipilih sebagai Petugas 1)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Select Chips */}
      <div>
        <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Klik cepat nama petugas:</div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950/70 rounded-xl border border-slate-800">
          {STAFF_LIST.map((name) => {
            const isP1 = officer1 === name;
            const isP2 = officer2 === name;
            const isSelected = isP1 || isP2;

            return (
              <button
                type="button"
                key={name}
                id={`chip-${teamName}-${name.toLowerCase()}`}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (isP1) {
                    onChange(['', officer2]);
                  } else if (isP2) {
                    onChange([officer1, '']);
                  } else if (!officer1) {
                    onChange([name, officer2]);
                    if (officer2 && name !== officer2) setIsCollapsed(true);
                  } else if (!officer2) {
                    onChange([officer1, name]);
                    if (officer1 && name !== officer1) setIsCollapsed(true);
                  } else {
                    onChange([officer1, name]);
                    setIsCollapsed(true);
                  }
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/50 shadow-sm'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {name}
                {isP1 && <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">P1</span>}
                {isP2 && <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">P2</span>}
              </button>
            );
          })}
        </div>
      </div>

      {isComplete && (
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Selesai Memilih Petugas</span>
          </button>
        </div>
      )}
    </div>
  );
};
