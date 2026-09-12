import React from 'react';
import { STAFF_LIST, StaffName } from '../types';
import { Users, Check, AlertCircle } from 'lucide-react';

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

  const handleSelect1 = (name: string) => {
    onChange([name, officer2]);
  };

  const handleSelect2 = (name: string) => {
    onChange([officer1, name]);
  };

  const isComplete = Boolean(officer1 && officer2 && officer1 !== officer2);

  return (
    <div id={`officer-select-${teamName.toLowerCase().replace(/\s+/g, '-')}`} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-base">Petugas {teamName}</h3>
            <p className="text-xs text-zinc-400">Pilih 2 orang petugas piket dari daftar resmi</p>
          </div>
        </div>

        <div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              {officer1.toUpperCase()} & {officer2.toUpperCase()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Pilih 2 Petugas
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Officer 1 */}
        <div className="space-y-1.5">
          <label htmlFor={`officer-1-${teamName}`} className="block text-xs font-medium text-zinc-300">
            Petugas 1 <span className="text-rose-400">*</span>
          </label>
          <select
            id={`officer-1-${teamName}`}
            value={officer1}
            disabled={disabled}
            onChange={(e) => handleSelect1(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-600 focus:border-emerald-500 rounded-lg px-3 py-2.5 text-sm text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <label htmlFor={`officer-2-${teamName}`} className="block text-xs font-medium text-zinc-300">
            Petugas 2 <span className="text-rose-400">*</span>
          </label>
          <select
            id={`officer-2-${teamName}`}
            value={officer2}
            disabled={disabled}
            onChange={(e) => handleSelect2(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-600 focus:border-emerald-500 rounded-lg px-3 py-2.5 text-sm text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="text-[11px] text-zinc-400 mb-1.5 font-medium">Klik cepat nama petugas:</div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
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
                  } else if (!officer2) {
                    onChange([officer1, name]);
                  } else {
                    // Replace Petugas 2 by default if both full
                    onChange([officer1, name]);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {name}
                {isP1 && <span className="text-[10px] bg-emerald-800 px-1 rounded">1</span>}
                {isP2 && <span className="text-[10px] bg-emerald-800 px-1 rounded">2</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
