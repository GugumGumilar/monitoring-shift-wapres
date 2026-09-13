import React, { useState, useEffect } from 'react';
import { CombinedShiftReport, ShiftType } from '../types';
import { generateWhatsAppReport } from '../utils/formatters';
import { fetchHistoryFromSpreadsheet } from '../services/sheetReader';
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
  RefreshCw,
  FileSpreadsheet,
  Download,
  AlertCircle,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CombinedShiftReport[];
  onSelectReport: (report: CombinedShiftReport) => void;
  onDeleteReport: (id: string) => void;
  sheetLink?: string | null;
  spreadsheetId?: string | null;
  onMergeSheetReports?: (sheetReports: CombinedShiftReport[]) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  onSelectReport,
  onDeleteReport,
  sheetLink,
  spreadsheetId,
  onMergeSheetReports,
}) => {
  const [shiftFilter, setShiftFilter] = useState<'ALL' | ShiftType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetFetchMessage, setSheetFetchMessage] = useState<string | null>(null);
  const [sheetReports, setSheetReports] = useState<CombinedShiftReport[]>([]);

  // Function to load history from Google Sheets
  const handleLoadFromSpreadsheet = async () => {
    if (!sheetLink && !spreadsheetId) {
      setSheetFetchMessage('Link spreadsheet belum dikonfigurasi.');
      return;
    }

    setIsFetchingSheet(true);
    setSheetFetchMessage(null);

    try {
      const res = await fetchHistoryFromSpreadsheet({
        sheetLink,
        spreadsheetId,
      });

      if (res.success && res.reports.length > 0) {
        setSheetReports(res.reports);
        setSheetFetchMessage(`✅ Berhasil memuat ${res.count} laporan shift dari Google Sheets!`);
        if (onMergeSheetReports) {
          onMergeSheetReports(res.reports);
        }
      } else {
        setSheetFetchMessage(res.message || 'Tidak ada riwayat shift ditemukan di spreadsheet.');
      }
    } catch (err: any) {
      setSheetFetchMessage(`Gagal memuat: ${err.message}`);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Auto-fetch from spreadsheet on initial open if not yet fetched
  useEffect(() => {
    if (isOpen && (sheetLink || spreadsheetId) && sheetReports.length === 0) {
      handleLoadFromSpreadsheet();
    }
  }, [isOpen, sheetLink, spreadsheetId]);

  if (!isOpen) return null;

  // Combine reports from local and spreadsheet, merging duplicates by ID
  const allCombinedMap = new Map<string, CombinedShiftReport>();

  // Add sheet reports first
  sheetReports.forEach((r) => {
    allCombinedMap.set(r.id, r);
  });

  // Local reports override or add
  reports.forEach((r) => {
    const existing = allCombinedMap.get(r.id);
    if (existing) {
      allCombinedMap.set(r.id, {
        ...existing,
        ...r,
        wapres: r.wapres || existing.wapres,
        rumdin: r.rumdin || existing.rumdin,
      });
    } else {
      allCombinedMap.set(r.id, r);
    }
  });

  const mergedReports = Array.from(allCombinedMap.values()).sort((a, b) => {
    if (a.dateKey !== b.dateKey) {
      return b.dateKey.localeCompare(a.dateKey);
    }
    const shiftOrder: Record<ShiftType, number> = { MALAM: 3, SIANG: 2, PAGI: 1 };
    return (shiftOrder[b.shift] || 0) - (shiftOrder[a.shift] || 0);
  });

  const filteredReports = mergedReports.filter((r) => {
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
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100 text-lg">Riwayat Laporan Shift</h3>
                <span className="text-[11px] font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                  {mergedReports.length} Laporan
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Membaca arsip lokal & database Google Sheets secara sinkron
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadFromSpreadsheet}
              disabled={isFetchingSheet || (!sheetLink && !spreadsheetId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all disabled:opacity-40"
              title="Sinkronkan seluruh baris shift dari Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isFetchingSheet ? 'Membaca Sheet...' : 'Sinkronkan dari Spreadsheet'}
              </span>
              <span className="sm:hidden">Sync Sheets</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {sheetFetchMessage && (
          <div className="px-5 py-2 text-xs bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{sheetFetchMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSheetFetchMessage(null)}
              className="text-zinc-500 hover:text-zinc-300 ml-2"
            >
              ✕
            </button>
          </div>
        )}

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
            <div className="text-center py-12 text-zinc-500 space-y-3">
              <Calendar className="w-10 h-10 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-medium">Belum ada riwayat laporan untuk filter ini</p>
              <p className="text-xs text-zinc-600">
                Laporan yang disubmit atau tersimpan di Google Sheets akan muncul di sini.
              </p>
              {(sheetLink || spreadsheetId) && !isFetchingSheet && (
                <button
                  type="button"
                  onClick={handleLoadFromSpreadsheet}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tarik Riwayat dari Google Sheets</span>
                </button>
              )}
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
                    <div className="flex items-center gap-2.5 flex-wrap">
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
                      {hasWapres && hasRumdin && (
                        <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          Kedua Tim Lengkap
                        </span>
                      )}
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
                        title="Hapus riwayat lokal"
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
                            Petugas:{' '}
                            <span className="text-zinc-200 font-medium">
                              {r.wapres?.officers.filter(Boolean).join(', ') || '-'}
                            </span>{' '}
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
                            Petugas:{' '}
                            <span className="text-zinc-200 font-medium">
                              {r.rumdin?.officers.filter(Boolean).join(', ') || '-'}
                            </span>{' '}
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
