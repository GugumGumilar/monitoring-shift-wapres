import React, { useState, useEffect, useMemo } from 'react';
import { ShiftType, TimRumdinReport, TimWapresReport, CombinedShiftReport } from './types';
import {
  createDefaultRumdinData,
  createDefaultWapresData,
  formatIndonesianDate,
  formatIndonesianTime,
  getCurrentShift,
  getDateKey,
  generateSampleReport,
} from './utils/formatters';
import {
  getAllReports,
  getOrCreateShiftReport,
  saveDraftRumdin,
  saveDraftWapres,
  getDraftRumdin,
  getDraftWapres,
  submitRumdinToShift,
  submitWapresToShift,
  deleteReport,
} from './utils/storage';
import { Header } from './components/Header';
import { TimWapresForm } from './components/TimWapresForm';
import { TimRumdinForm } from './components/TimRumdinForm';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Current real-time shift
  const [selectedShift, setSelectedShift] = useState<ShiftType>(() => getCurrentShift());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => getDateKey());
  const [selectedTeam, setSelectedTeam] = useState<'WAPRES' | 'RUMDIN'>('WAPRES');

  // Reports state
  const [allReports, setAllReports] = useState<CombinedShiftReport[]>(() => getAllReports());

  // Current active combined report
  const currentReport = useMemo(() => {
    return (
      allReports.find((r) => r.id === `${selectedDateKey}_${selectedShift}`) ||
      getOrCreateShiftReport(selectedDateKey, selectedShift)
    );
  }, [allReports, selectedDateKey, selectedShift]);

  // Form states initialized with draft or existing report or default
  const [wapresData, setWapresData] = useState<TimWapresReport>(() => {
    if (currentReport?.wapres) return currentReport.wapres;
    const draft = getDraftWapres(selectedDateKey, selectedShift);
    return draft || createDefaultWapresData();
  });

  const [rumdinData, setRumdinData] = useState<TimRumdinReport>(() => {
    if (currentReport?.rumdin) return currentReport.rumdin;
    const draft = getDraftRumdin(selectedDateKey, selectedShift);
    return draft || createDefaultRumdinData();
  });

  // UI modals & toast
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  // Sync forms when selected shift or report changes
  useEffect(() => {
    if (currentReport?.wapres) {
      setWapresData(currentReport.wapres);
    } else {
      const draft = getDraftWapres(selectedDateKey, selectedShift);
      setWapresData(draft || createDefaultWapresData());
    }

    if (currentReport?.rumdin) {
      setRumdinData(currentReport.rumdin);
    } else {
      const draft = getDraftRumdin(selectedDateKey, selectedShift);
      setRumdinData(draft || createDefaultRumdinData());
    }
  }, [selectedShift, selectedDateKey, currentReport]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Draft auto-save
  const handleWapresChange = (updated: TimWapresReport) => {
    setWapresData(updated);
    if (!currentReport?.wapres) {
      saveDraftWapres(selectedDateKey, selectedShift, updated);
    }
  };

  const handleRumdinChange = (updated: TimRumdinReport) => {
    setRumdinData(updated);
    if (!currentReport?.rumdin) {
      saveDraftRumdin(selectedDateKey, selectedShift, updated);
    }
  };

  // Submission handlers
  const handleWapresSubmit = (submittedData: TimWapresReport) => {
    const updatedReport = submitWapresToShift(selectedDateKey, selectedShift, submittedData);
    setAllReports(getAllReports());
    showToast(`✅ Laporan Tim Wapres berhasil disimpan pada ${submittedData.inspectionTime}!`);

    // If Rumdin hasn't submitted yet, prompt to fill Rumdin or view report
    if (!updatedReport.rumdin) {
      setSelectedTeam('RUMDIN');
    } else {
      setIsPreviewOpen(true);
    }
  };

  const handleRumdinSubmit = (submittedData: TimRumdinReport) => {
    const updatedReport = submitRumdinToShift(selectedDateKey, selectedShift, submittedData);
    setAllReports(getAllReports());
    showToast(`✅ Laporan Tim Rumdin berhasil disimpan pada ${submittedData.inspectionTime}!`);

    // If both complete, show preview modal
    if (updatedReport.wapres) {
      setIsPreviewOpen(true);
    }
  };

  const handleLoadSample = () => {
    const sample = generateSampleReport(selectedShift);
    const dateKey = sample.dateKey;
    setSelectedDateKey(dateKey);
    submitWapresToShift(dateKey, selectedShift, sample.wapres!);
    submitRumdinToShift(dateKey, selectedShift, sample.rumdin!);
    setAllReports(getAllReports());
    setWapresData(sample.wapres!);
    setRumdinData(sample.rumdin!);
    showToast('✨ Contoh data monitoring shift berhasil dimuat lengkap!', 'info');
    setIsPreviewOpen(true);
  };

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    setAllReports(getAllReports());
    showToast('Laporan riwayat telah dihapus', 'info');
  };

  const handleResetActiveForm = () => {
    if (selectedTeam === 'WAPRES') {
      const blank = createDefaultWapresData();
      setWapresData(blank);
      saveDraftWapres(selectedDateKey, selectedShift, blank);
      showToast('Formulir Tim Wapres berhasil dikosongkan.');
    } else {
      const blank = createDefaultRumdinData();
      setRumdinData(blank);
      saveDraftRumdin(selectedDateKey, selectedShift, blank);
      showToast('Formulir Tim Rumdin berhasil dikosongkan.');
    }
  };

  const isWapresSubmitted = Boolean(currentReport?.wapres);
  const isRumdinSubmitted = Boolean(currentReport?.rumdin);
  const isBothSubmitted = isWapresSubmitted && isRumdinSubmitted;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* App Header */}
      <Header
        selectedShift={selectedShift}
        onSelectShift={setSelectedShift}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
        isWapresSubmitted={isWapresSubmitted}
        isRumdinSubmitted={isRumdinSubmitted}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLoadSample={handleLoadSample}
        historyCount={allReports.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">Status Pengisian Shift Ini:</span>

            {/* Wapres Status Badge */}
            <button
              type="button"
              onClick={() => setSelectedTeam('WAPRES')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isWapresSubmitted
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {isWapresSubmitted ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>
                Tim Wapres: {isWapresSubmitted ? `Selesai (${currentReport?.wapres?.inspectionTime})` : 'Belum Submit'}
              </span>
            </button>

            {/* Rumdin Status Badge */}
            <button
              type="button"
              onClick={() => setSelectedTeam('RUMDIN')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isRumdinSubmitted
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {isRumdinSubmitted ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>
                Tim Rumdin: {isRumdinSubmitted ? `Selesai (${currentReport?.rumdin?.inspectionTime})` : 'Belum Submit'}
              </span>
            </button>

            {/* Quick reset active form button */}
            <button
              type="button"
              onClick={handleResetActiveForm}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-full transition-colors cursor-pointer ml-1"
              title="Kosongkan nilai input pada tim aktif saat ini"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Kosongkan Form</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isBothSubmitted ? (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Laporan Siap Kirim WA</span>
              </button>
            ) : (
              <div className="text-xs text-amber-400/90 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Isi kedua formulir tim untuk menggabungkan laporan utuh</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Team Form */}
        {selectedTeam === 'WAPRES' ? (
          <TimWapresForm
            data={wapresData}
            onChange={handleWapresChange}
            onSubmit={handleWapresSubmit}
            shiftName={selectedShift}
            isAlreadySubmitted={isWapresSubmitted}
          />
        ) : (
          <TimRumdinForm
            data={rumdinData}
            onChange={handleRumdinChange}
            onSubmit={handleRumdinSubmit}
            shiftName={selectedShift}
            isAlreadySubmitted={isRumdinSubmitted}
          />
        )}
      </main>

      {/* Floating WhatsApp Action button on mobile when both ready */}
      {isBothSubmitted && (
        <div className="fixed bottom-20 right-4 z-20 sm:hidden">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950 flex items-center justify-center animate-bounce"
            title="Kirim ke WhatsApp"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <ReportPreviewModal
        report={currentReport}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reports={allReports}
        onSelectReport={(report) => {
          setSelectedDateKey(report.dateKey);
          setSelectedShift(report.shift);
          setIsHistoryOpen(false);
          setIsPreviewOpen(true);
        }}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
}
