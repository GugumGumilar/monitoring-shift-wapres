import React, { useState, useEffect } from 'react';
import { CombinedShiftReport, TimWapresReport, TimRumdinReport } from '../types';
import { generateWhatsAppReport, formatIndonesianTime } from '../utils/formatters';
import { ActiveSpreadsheetInfo } from '../services/googleSheets';
import { fetchShiftDataFromSpreadsheet } from '../services/sheetReader';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  Clock,
  RotateCw,
  FileSpreadsheet,
  ExternalLink,
  Database,
  RefreshCw,
} from 'lucide-react';

interface ReportPreviewModalProps {
  report: CombinedShiftReport;
  isOpen: boolean;
  onClose: () => void;
  onRefreshTimestamp?: () => void;
  onOpenGoogleSheets?: () => void;
  activeSpreadsheet?: ActiveSpreadsheetInfo | null;
  directWebhookUrl?: string | null;
  directSheetLink?: string | null;
  accessToken?: string | null;
  onLoadFromSheet?: (fetchedWapres: TimWapresReport | null, fetchedRumdin: TimRumdinReport | null) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  report,
  isOpen,
  onClose,
  onRefreshTimestamp,
  onOpenGoogleSheets,
  activeSpreadsheet,
  directWebhookUrl,
  directSheetLink,
  accessToken,
  onLoadFromSheet,
}) => {
  const [copied, setCopied] = useState(false);
  const [sheetReport, setSheetReport] = useState<CombinedShiftReport | null>(null);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [dataSource, setDataSource] = useState<'spreadsheet' | 'local'>('local');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [sheetFetchNotice, setSheetFetchNotice] = useState<string | null>(null);

  // Automatically fetch fresh data from Google Sheets when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadDataFromSpreadsheet = async () => {
      const hasConnection = Boolean(
        directWebhookUrl || directSheetLink || (accessToken && activeSpreadsheet)
      );
      if (!hasConnection) {
        setDataSource('local');
        return;
      }

      setIsFetchingSheet(true);
      setSheetFetchNotice('Menghubungkan ke database Google Sheets...');
      try {
        const res = await fetchShiftDataFromSpreadsheet({
          dateKey: report.dateKey,
          shift: report.shift,
          webhookUrl: directWebhookUrl,
          sheetLink: directSheetLink,
          accessToken,
          activeSpreadsheet,
        });

        if (res.success && (res.wapres || res.rumdin)) {
          const merged: CombinedShiftReport = {
            ...report,
            wapres: res.wapres || report.wapres,
            rumdin: res.rumdin || report.rumdin,
            updatedAt: new Date().toISOString(),
          };
          setSheetReport(merged);
          setDataSource('spreadsheet');
          setLastFetchedTime(formatIndonesianTime(new Date()));
          setSheetFetchNotice(res.message || 'Data berhasil diambil dari database Google Sheets!');
          if (onLoadFromSheet) {
            onLoadFromSheet(res.wapres, res.rumdin);
          }
        } else {
          setDataSource('local');
          setSheetFetchNotice('Belum ada data baru di Spreadsheet, menampilkan data lokal.');
        }
      } catch (err: any) {
        console.warn('Gagal membaca dari spreadsheet:', err);
        setDataSource('local');
        setSheetFetchNotice('Gagal mengambil dari Google Sheets, menggunakan data formulir.');
      } finally {
        setIsFetchingSheet(false);
      }
    };

    loadDataFromSpreadsheet();
  }, [isOpen, report.dateKey, report.shift, directWebhookUrl, directSheetLink, accessToken, activeSpreadsheet]);

  if (!isOpen) return null;

  const activeReport = (dataSource === 'spreadsheet' && sheetReport) ? sheetReport : report;
  const fullText = generateWhatsAppReport(activeReport);
  const isWapresComplete = Boolean(activeReport.wapres);
  const isRumdinComplete = Boolean(activeReport.rumdin);
  const isBothComplete = isWapresComplete && isRumdinComplete;

  const handleManualRefreshFromSheet = async () => {
    setIsFetchingSheet(true);
    setSheetFetchNotice('Menyegarkan dari database Google Sheets...');
    try {
      const res = await fetchShiftDataFromSpreadsheet({
        dateKey: report.dateKey,
        shift: report.shift,
        webhookUrl: directWebhookUrl,
        sheetLink: directSheetLink,
        accessToken,
        activeSpreadsheet,
      });

      if (res.success && (res.wapres || res.rumdin)) {
        const merged: CombinedShiftReport = {
          ...report,
          wapres: res.wapres || report.wapres,
          rumdin: res.rumdin || report.rumdin,
          updatedAt: new Date().toISOString(),
        };
        setSheetReport(merged);
        setDataSource('spreadsheet');
        setLastFetchedTime(formatIndonesianTime(new Date()));
        setSheetFetchNotice('Data WhatsApp berhasil diperbarui dari database Google Sheets!');
        if (onLoadFromSheet) {
          onLoadFromSheet(res.wapres, res.rumdin);
        }
      } else {
        setSheetFetchNotice(res.message || 'Tidak ada perubahan data di spreadsheet.');
      }
    } catch (err: any) {
      setSheetFetchNotice(`Gagal membaca spreadsheet: ${err.message}`);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = async () => {
    // Before sending, if not fetched yet, try a quick refresh
    let textToSend = fullText;
    if (dataSource !== 'spreadsheet' && (directWebhookUrl || directSheetLink || accessToken)) {
      try {
        setIsFetchingSheet(true);
        const res = await fetchShiftDataFromSpreadsheet({
          dateKey: report.dateKey,
          shift: report.shift,
          webhookUrl: directWebhookUrl,
          sheetLink: directSheetLink,
          accessToken,
          activeSpreadsheet,
        });
        if (res.success && (res.wapres || res.rumdin)) {
          const merged: CombinedShiftReport = {
            ...report,
            wapres: res.wapres || report.wapres,
            rumdin: res.rumdin || report.rumdin,
            updatedAt: new Date().toISOString(),
          };
          setSheetReport(merged);
          setDataSource('spreadsheet');
          textToSend = generateWhatsAppReport(merged);
        }
      } catch (e) {
        console.warn('Quick fetch before WA send failed:', e);
      } finally {
        setIsFetchingSheet(false);
      }
    }

    const encoded = encodeURIComponent(textToSend);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Laporan_Shift_${activeReport.shift}_${activeReport.dateKey}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="report-preview-modal-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div id="report-preview-modal" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-lg">
                Format Laporan WhatsApp - Shift {activeReport.shift}
              </h3>
              <p className="text-xs text-zinc-400">
                Tanggal: <span className="font-semibold text-zinc-200">{activeReport.displayDate}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sumber Data Banner (Spreadsheet vs Local) */}
        <div className="px-5 py-2.5 bg-emerald-950/30 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-emerald-300">
                {dataSource === 'spreadsheet'
                  ? 'Data Format WA Diambil Langsung dari Database Spreadsheet'
                  : 'Data Format WA Menggunakan Data Formulir'}
              </span>
              {lastFetchedTime && (
                <span className="text-zinc-400 text-[11px] bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                  Update: {lastFetchedTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefreshFromSheet}
              disabled={isFetchingSheet}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Ambil data paling mutakhir dari Google Sheets untuk teks WA"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingSheet ? 'Mengambil...' : 'Segarkan dari Spreadsheet'}</span>
            </button>
          </div>
        </div>

        {/* Status completion badges */}
        <div className="px-5 py-3 bg-zinc-950/30 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isWapresComplete
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {isWapresComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Tim Wapres: {isWapresComplete ? `Selesai (${activeReport.wapres?.inspectionTime || '-'})` : 'Belum Submit'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isRumdinComplete
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {isRumdinComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Tim Rumdin: {isRumdinComplete ? `Selesai (${activeReport.rumdin?.inspectionTime || '-'})` : 'Belum Submit'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshTimestamp && (
              <button
                type="button"
                onClick={onRefreshTimestamp}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                title="Perbarui jam inspeksi di teks laporan WA ke jam sekarang saat ini"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Perbarui Jam Sekarang</span>
              </button>
            )}

            {isBothComplete ? (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                ✅ Siap Kirim (Kedua Tim Lengkap)
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                ⚠️ Pengisian Tim Belum Lengkap
              </span>
            )}
          </div>
        </div>

        {/* Formatted Text Box */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-zinc-950">
          <div className="relative">
            <pre className="font-mono text-xs sm:text-sm text-zinc-200 bg-zinc-900 p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap leading-relaxed select-all">
              {fullText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Teks Laporan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
              title="Unduh file .txt"
            >
              <Download className="w-4 h-4" />
            </button>

            {onOpenGoogleSheets && (
              <button
                type="button"
                id="modal-sheets-btn"
                onClick={onOpenGoogleSheets}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                title="Lihat / Kelola Spreadsheet Pantauan ACO"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>
            )}
          </div>

          <button
            type="button"
            id="whatsapp-share-btn"
            onClick={handleSendWhatsApp}
            disabled={isFetchingSheet}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{isFetchingSheet ? 'Mengambil Data Sheets...' : 'Kirim ke WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

