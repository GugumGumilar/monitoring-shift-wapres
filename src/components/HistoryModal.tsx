import React, { useState } from 'react';
import { CombinedShiftReport, ShiftType } from '../types';
import { generateWhatsAppReport } from '../utils/formatters';
import {
  X,
  History,
  Calendar,
  Send,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CombinedShiftReport[];
  onSelectReport: (report: CombinedShiftReport) => void;
  onDeleteReport: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  onSelectReport,
  onDeleteReport,
}) => {
  const [shiftFilter, setShiftFilter] = useState<'ALL' | ShiftType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredReports = reports.filter((r) => {
    if (shiftFilter !== 'ALL' && r.shift !== shiftFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const dateMatch = r.displayDate.toLowerCase().includes(q) || r.dateKey.includes(q);
      const wapresOfficers = r.wapres?.officers.join(' ').toLowerCase() || '';
      const rumdinOfficers = r.rumdin?.officers.join(' ').toLowerCase() || '';
      return dateMatch || wapresOfficers.includes(q) || rumdinOfficers.includes(q);
    }
    return true;
  });

  const handleSendWA = (r: CombinedShiftReport) => {
    const text = generateWhatsAppReport(r);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="history-modal-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div id="history-modal" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-lg">Riwayat Laporan Shift</h3>
              <p className="text-xs text-zinc-400">Arsip seluruh laporan monitoring yang tersimpan di sistem</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 bg-zinc-950/40 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Shift selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'PAGI', 'SIANG', 'MALAM'] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setShiftFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  shiftFilter === s
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {s === 'ALL' ? 'Semua Shift' : `Shift ${s}`}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari tanggal / petugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-zinc-950">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 space-y-2">
              <Calendar className="w-10 h-10 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-medium">Belum ada riwayat laporan untuk filter ini</p>
              <p className="text-xs text-zinc-600">Laporan yang disubmit akan tersimpan otomatis di sini.</p>
            </div>
          ) : (
            filteredReports.map((r) => {
              const hasWapres = Boolean(r.wapres);
              const hasRumdin = Boolean(r.rumdin);

              return (
                <div
                  key={r.id}
                  id={`history-item-${r.id}`}
                  className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-zinc-100 text-sm">{r.displayDate}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${
                          r.shift === 'PAGI'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : r.shift === 'SIANG'
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                            : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        Shift {r.shift}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectReport(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Format</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWA(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus riwayat Shift ${r.shift} (${r.displayDate})?`)) {
                            onDeleteReport(r.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Team status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Wapres */}
                    <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-start gap-2">
                      <div className="mt-0.5">
                        {hasWapres ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-300">Tim Wapres</div>
                        {hasWapres ? (
                          <div className="text-zinc-400 text-[11px] mt-0.5">
                            Petugas: <span className="text-zinc-200 font-medium">{r.wapres?.officers.join(', ')}</span>{' '}
                            | Jam: <span className="text-zinc-200 font-mono">{r.wapres?.inspectionTime}</span>
                          </div>
                        ) : (
                          <div className="text-zinc-500 text-[11px] mt-0.5">Belum diisi</div>
                        )}
                      </div>
                    </div>

                    {/* Rumdin */}
                    <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-start gap-2">
                      <div className="mt-0.5">
                        {hasRumdin ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-300">Tim Rumdin</div>
                        {hasRumdin ? (
                          <div className="text-zinc-400 text-[11px] mt-0.5">
                            Petugas: <span className="text-zinc-200 font-medium">{r.rumdin?.officers.join(', ')}</span>{' '}
                            | Jam: <span className="text-zinc-200 font-mono">{r.rumdin?.inspectionTime}</span>
                          </div>
                        ) : (
                          <div className="text-zinc-500 text-[11px] mt-0.5">Belum diisi</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
