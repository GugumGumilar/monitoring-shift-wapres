import React, { useState } from 'react';
import { CombinedShiftReport } from '../types';
import { generateWhatsAppReport } from '../utils/formatters';
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
} from 'lucide-react';

interface ReportPreviewModalProps {
  report: CombinedShiftReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullText = generateWhatsAppReport(report);
  const isWapresComplete = Boolean(report.wapres);
  const isRumdinComplete = Boolean(report.rumdin);
  const isBothComplete = isWapresComplete && isRumdinComplete;

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

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(fullText);
    // Open web whatsapp or whatsapp app
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Laporan_Shift_${report.shift}_${report.dateKey}.txt`;
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
                Format Laporan WhatsApp - Shift {report.shift}
              </h3>
              <p className="text-xs text-zinc-400">
                Tanggal: <span className="font-semibold text-zinc-200">{report.displayDate}</span>
              </p>
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
              Tim Wapres: {isWapresComplete ? `Selesai (${report.wapres?.officers.join(', ')})` : 'Belum Submit'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isRumdinComplete
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {isRumdinComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Tim Rumdin: {isRumdinComplete ? `Selesai (${report.rumdin?.officers.join(', ')})` : 'Belum Submit'}
            </span>
          </div>

          <div>
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
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
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
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
              title="Unduh file .txt"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            id="whatsapp-share-btn"
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim ke WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
