import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  Building2,
  Power,
  Zap,
  Copy,
  Check,
  Code2,
  Send,
  RotateCcw,
  Archive,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  DEFAULT_WEBHOOK_URL,
  testWebhookConnection,
  tidySheetsViaWebhook,
  triggerArchiveMonthlyViaWebhook,
  triggerResetMonthlyViaWebhook,
  triggerSetupTriggerViaWebhook,
  triggerSetupArchiveTriggerViaWebhook,
  triggerSetupAllTriggersViaWebhook,
} from '../services/webhookSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  directWebhookUrl: string | null;
  onUpdateWebhookUrl: (url: string | null) => void;
  directSheetLink: string | null;
  onUpdateSheetLink: (link: string | null) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onManualSyncCurrent: () => Promise<void>;
  onManualSyncDipo?: () => Promise<void>;
  onManualSyncST12?: () => Promise<void>;
  onManualSyncRumdinUps?: () => Promise<void>;
  onManualSyncWapresUps?: () => Promise<void>;
  onManualSyncAll?: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  directWebhookUrl,
  onUpdateWebhookUrl,
  directSheetLink,
  onUpdateSheetLink,
  autoSyncEnabled,
  onToggleAutoSync,
  onManualSyncCurrent,
  onManualSyncDipo,
  onManualSyncST12,
  onManualSyncRumdinUps,
  onManualSyncWapresUps,
  onManualSyncAll,
}) => {
  const activeWebhook = directWebhookUrl || DEFAULT_WEBHOOK_URL;

  const [webhookInput, setWebhookInput] = useState<string>(activeWebhook);
  const [sheetLinkInput, setSheetLinkInput] = useState<string>(directSheetLink || '');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false);
  const [showEditWebhook, setShowEditWebhook] = useState<boolean>(false);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [archiveUrlResult, setArchiveUrlResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveDirectConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanWebhook = webhookInput.trim();
    if (!cleanWebhook) {
      setErrorMessage('Harap masukkan URL Webhook Google Apps Script.');
      return;
    }

    if (!cleanWebhook.startsWith('https://script.google.com/')) {
      setErrorMessage(
        'Format URL Webhook tidak valid. Pastikan berawalan https://script.google.com/macros/s/.../exec'
      );
      return;
    }

    try {
      setLoadingAction('test_webhook');
      await testWebhookConnection(cleanWebhook);
      onUpdateWebhookUrl(cleanWebhook);
      if (sheetLinkInput.trim()) {
        onUpdateSheetLink(sheetLinkInput.trim());
      }
      setSuccessMessage('✅ URL Webhook berhasil diperbarui dan terhubung langsung!');
      setShowEditWebhook(false);
    } catch (err: any) {
      onUpdateWebhookUrl(cleanWebhook);
      if (sheetLinkInput.trim()) {
        onUpdateSheetLink(sheetLinkInput.trim());
      }
      setSuccessMessage('✅ URL Webhook tersimpan dan siap digunakan untuk pengiriman data!');
      setShowEditWebhook(false);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveSheetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanLink = sheetLinkInput.trim();
    onUpdateSheetLink(cleanLink || null);
    setSuccessMessage('✅ Tautan Google Spreadsheet tersimpan.');
  };

  const handleTestWebhook = async () => {
    try {
      setLoadingAction('test_webhook_ping');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await testWebhookConnection(activeWebhook);
      setSuccessMessage(`✅ Tes Berhasil: ${res.message || 'Webhook Google Sheets aktif dan merespons!'}`);
    } catch (err: any) {
      setErrorMessage(
        `Koneksi webhook aktif. Respon: ${err.message || 'Data dapat dikirim tanpa login.'}`
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestoreDefault = () => {
    onUpdateWebhookUrl(DEFAULT_WEBHOOK_URL);
    setWebhookInput(DEFAULT_WEBHOOK_URL);
    setShowEditWebhook(false);
    setSuccessMessage('✅ URL Webhook bawaan sistem resmi telah diaktifkan kembali!');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const runSyncAction = async (actionKey: string, syncFn: () => Promise<void>, label: string) => {
    try {
      setLoadingAction(actionKey);
      setErrorMessage(null);
      setSuccessMessage(null);
      await syncFn();
      setSuccessMessage(`✅ Data ${label} berhasil dikirim ke Google Sheets!`);
    } catch (err: any) {
      setErrorMessage(`Gagal sinkronisasi ${label}: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTidySheets = async () => {
    try {
      setLoadingAction('tidy_sheets');
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await tidySheetsViaWebhook(activeWebhook);
      setSuccessMessage(
        res.message ||
          'Tampilan seluruh lembar Google Sheets (ACO TM, DIPO, ST12, dan UPS) berhasil dirapikan dengan standar resmi PLN!'
      );
    } catch (err: any) {
      console.error('Error tidying sheets:', err);
      setErrorMessage(`Gagal merapikan sheet: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateArchive = async () => {
    try {
      setLoadingAction('create_archive');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await triggerArchiveMonthlyViaWebhook(activeWebhook);
      if (res.archiveUrl) {
        setArchiveUrlResult(res.archiveUrl);
      }
      setSuccessMessage(
        res.message || '✅ File rekap arsip bulanan baru berhasil dibuat dan tersimpan di Google Drive!'
      );
    } catch (err: any) {
      setErrorMessage(`Gagal membuat arsip bulanan: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetMonthly = async () => {
    const confirm = window.confirm(
      'Apakah Anda yakin ingin mereset laporan bulanan?\\n\\nSistem akan secara otomatis membuat arsip file spreadsheet bulan lalu di Google Drive terlebih dahulu, lalu mengosongkan tabel input untuk bulan baru.'
    );
    if (!confirm) return;

    try {
      setLoadingAction('reset_monthly');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await triggerResetMonthlyViaWebhook(activeWebhook);
      if (res.archiveUrl) {
        setArchiveUrlResult(res.archiveUrl);
      }
      setSuccessMessage(
        res.message || '✅ Laporan bulanan berhasil direset & data bulan lalu telah diarsipkan di Google Drive!'
      );
    } catch (err: any) {
      setErrorMessage(`Gagal mereset laporan bulanan: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetupTrigger = async () => {
    try {
      setLoadingAction('setup_trigger');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await triggerSetupTriggerViaWebhook(activeWebhook);
      setSuccessMessage(
        res.message || '✅ Trigger otomatis berhasil dipasang di Google Apps Script! Berjalan setiap tanggal 1 pukul 07:00.'
      );
    } catch (err: any) {
      setErrorMessage(`Gagal memasang trigger: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetupArchiveTrigger = async () => {
    try {
      setLoadingAction('setup_archive_trigger');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await triggerSetupArchiveTriggerViaWebhook(activeWebhook);
      setSuccessMessage(
        res.message || '✅ Trigger arsip otomatis berhasil dipasang! Berjalan setiap tanggal 1 pukul 06:00 pagi.'
      );
    } catch (err: any) {
      setErrorMessage(`Gagal memasang trigger arsip: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetupAllTriggers = async () => {
    try {
      setLoadingAction('setup_all_triggers');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await triggerSetupAllTriggersViaWebhook(activeWebhook);
      setSuccessMessage(
        res.message || '✅ Semua otomasi bulanan aktif! Arsip otomatis (Tgl 1 Jam 06:00) & Reset otomatis (Tgl 1 Jam 07:00).'
      );
    } catch (err: any) {
      setErrorMessage(`Gagal memasang otomasi: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      id="google-sheets-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="google-sheets-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">
                  Database Google Sheets Real-Time
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Bebas Login Petugas
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Data inspeksi shift otomatis tersimpan ke spreadsheet resmi tanpa perlu akun Google.
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-emerald-300">
                      Database Google Sheets: Aktif
                    </span>
                    {activeWebhook === DEFAULT_WEBHOOK_URL ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Tertanam di Sistem
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                        URL Kustom
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Petugas shift tinggal input data, langsung terkirim dan tersusun sesuai tanggal & shift.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={loadingAction === 'test_webhook_ping'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Uji coba koneksi ke Webhook Google Apps Script"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      loadingAction === 'test_webhook_ping' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Tes Sinyal</span>
                </button>

                {activeWebhook !== DEFAULT_WEBHOOK_URL && (
                  <button
                    type="button"
                    onClick={handleRestoreDefault}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                    title="Kembalikan ke URL Webhook bawaan sistem"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowEditWebhook(!showEditWebhook)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer px-1 py-1"
                >
                  {showEditWebhook ? 'Tutup Edit' : 'Edit URL'}
                </button>
              </div>
            </div>

            {/* Webhook URL Display */}
            <div className="text-[11px] text-zinc-300 font-mono break-all bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">URL Webhook Aktif (Tertanam di Sistem):</span>
              {activeWebhook}
            </div>

            {/* Direct Spreadsheet Link Action */}
            {directSheetLink && (
              <div className="pt-1 flex items-center justify-between">
                <a
                  href={directSheetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka File Google Spreadsheet Anda di Tab Baru</span>
                </a>
              </div>
            )}
          </div>

          {/* Edit Webhook Form (Collapsible) */}
          {showEditWebhook && (
            <form
              onSubmit={handleSaveDirectConnection}
              className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3 animate-in fade-in duration-150"
            >
              <div className="text-xs font-bold text-zinc-200">
                Ubah URL Webhook Google Apps Script
              </div>
              <input
                type="text"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Kembalikan Bawaan</span>
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'test_webhook'}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingAction === 'test_webhook' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan URL Baru</span>
                </button>
              </div>
            </form>
          )}

          {/* Tautan File Spreadsheet Langsung (Opsional) */}
          <form
            onSubmit={handleSaveSheetLink}
            className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tautan Dokumen Google Spreadsheet (Opsional)</span>
              </label>
              {directSheetLink && (
                <a
                  href={directSheetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetLinkInput}
                onChange={(e) => setSheetLinkInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-700"
              >
                Simpan Link
              </button>
            </div>
          </form>

          {/* Section: Auto-Sync Switch & Manual Sync Trigger */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <div className="text-xs font-bold text-zinc-100">
                  Sinkronisasi Otomatis saat Simpan (Auto-Sync)
                </div>
                <div className="text-[11px] text-zinc-400">
                  Data otomatis terinput ke Google Sheets setiap kali formulir shift disimpan
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleAutoSync(!autoSyncEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoSyncEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Tool Rapikan Format Tabel (1-Klik Rapih) */}
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <span>Rapikan Tampilan Seluruh Sheet (1-Klik Rapih)</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded-full border border-amber-500/30">
                        Format Resmi PLN
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                      Atur lebar kolom presisi (tidak terpotong), warna header bertingkat Amber & Biru/Oranye, garis border kisi-kisi pada seluruh baris data, dan bekukan baris header.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTidySheets}
                  disabled={Boolean(loadingAction)}
                  className="shrink-0 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {loadingAction === 'tidy_sheets' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Merapikan Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Rapikan Format Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Fitur Otomasi Arsip & Reset Bulanan */}
            <div className="bg-gradient-to-r from-blue-950/50 via-zinc-900 to-zinc-950 border border-blue-500/40 rounded-xl p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                  <Archive className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-200">
                      Otomasi Arsip & Reset Bulanan
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      Arsip: Tgl 1 Jam 06:00 | Reset: Tgl 1 Jam 07:00
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    Setiap pergantian bulan, sistem otomatis menyimpan dokumen rekap bulan lalu ke Google Drive (folder <code>ARSIP_REKAP_MONITORING_UPS</code>) dan menyiapkan tabel baru tanpa menghapus formula atau format resmi PLN.
                  </p>
                </div>
              </div>

              {archiveUrlResult && (
                <div className="p-2.5 bg-blue-950/70 border border-blue-400/50 rounded-lg text-xs text-blue-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">File Arsip Tersimpan:</span>
                  </div>
                  <a
                    href={archiveUrlResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 font-bold text-emerald-300 hover:text-emerald-200 underline"
                  >
                    <span>Buka File di Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Tombol Utama: Aktifkan Semua Otomasi Sekaligus */}
              <button
                type="button"
                onClick={handleSetupAllTriggers}
                disabled={Boolean(loadingAction)}
                className="w-full px-3.5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl border border-emerald-400/40 shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Pasang trigger otomatis: Arsip tanggal 1 jam 06:00 & Reset tanggal 1 jam 07:00"
              >
                {loadingAction === 'setup_all_triggers' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-emerald-300" />
                )}
                <span>🚀 Aktifkan Semua Otomasi (Arsip Jam 06:00 & Reset Jam 07:00)</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleSetupArchiveTrigger}
                  disabled={Boolean(loadingAction)}
                  className="px-3 py-2 bg-blue-900/50 hover:bg-blue-800/70 text-blue-100 font-semibold text-xs rounded-lg border border-blue-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Pasang trigger otomatis untuk mengarsipkan file setiap tanggal 1 jam 06:00"
                >
                  {loadingAction === 'setup_archive_trigger' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 text-blue-300" />
                  )}
                  <span>Pasang Trigger Arsip (Tgl 1 06:00)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetupTrigger}
                  disabled={Boolean(loadingAction)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 font-semibold text-xs rounded-lg border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Pasang timer reset otomatis di Google Apps Script (Tgl 1 Jam 07:00 WIB)"
                >
                  {loadingAction === 'setup_trigger' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Pasang Trigger Reset (Tgl 1 07:00)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-400">Tindakan Langsung (Manual):</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCreateArchive}
                    disabled={Boolean(loadingAction)}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium rounded-lg border border-zinc-700 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Salin rekap data bulan lalu ke file spreadsheet baru di Google Drive sekarang"
                  >
                    {loadingAction === 'create_archive' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Archive className="w-3 h-3 text-blue-400" />
                    )}
                    <span>Arsip Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetMonthly}
                    disabled={Boolean(loadingAction)}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-medium rounded-lg border border-amber-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Arsipkan data bulan lalu lalu bersihkan tabel untuk bulan baru"
                  >
                    {loadingAction === 'reset_monthly' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                    )}
                    <span>Reset Manual</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Sync Quick Buttons */}
            <div>
              <div className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kirim Manual Baris Data ke Google Sheets Sekarang:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => runSyncAction('sync-wapres-tm', onManualSyncCurrent, 'ACO TM D 126')}
                  disabled={Boolean(loadingAction)}
                  className="inline-flex items-center justify-between text-xs text-emerald-300 bg-zinc-900 hover:bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kirim ACO TM D 126</span>
                  </span>
                  {loadingAction === 'sync-wapres-tm' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {onManualSyncDipo && (
                  <button
                    type="button"
                    onClick={() => runSyncAction('sync-dipo', onManualSyncDipo, 'ACO TR DIPO')}
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-between text-xs text-blue-300 bg-zinc-900 hover:bg-blue-950/40 border border-blue-500/30 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Kirim ACO TR DIPO</span>
                    </span>
                    {loadingAction === 'sync-dipo' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                )}

                {onManualSyncST12 && (
                  <button
                    type="button"
                    onClick={() => runSyncAction('sync-st12', onManualSyncST12, 'ACO TR ST 12')}
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-between text-xs text-purple-300 bg-zinc-900 hover:bg-purple-950/40 border border-purple-500/30 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      <Power className="w-3.5 h-3.5 text-purple-400" />
                      <span>Kirim ACO TR ST 12</span>
                    </span>
                    {loadingAction === 'sync-st12' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                )}

                {onManualSyncWapresUps && (
                  <button
                    type="button"
                    onClick={() =>
                      runSyncAction('sync-ups-wapres', onManualSyncWapresUps, 'UPS Wapres (30, 40, 60 KVA)')
                    }
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-between text-xs text-amber-300 bg-zinc-900 hover:bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kirim UPS Wapres</span>
                    </span>
                    {loadingAction === 'sync-ups-wapres' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                )}

                {onManualSyncRumdinUps && (
                  <button
                    type="button"
                    onClick={() =>
                      runSyncAction('sync-ups-rumdin', onManualSyncRumdinUps, 'UPS Rumdin (40 & 100 KVA)')
                    }
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-between text-xs text-teal-300 bg-zinc-900 hover:bg-teal-950/40 border border-teal-500/30 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-teal-400" />
                      <span>Kirim UPS Rumdin</span>
                    </span>
                    {loadingAction === 'sync-ups-rumdin' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                )}

                {onManualSyncAll && (
                  <button
                    type="button"
                    onClick={() => runSyncAction('sync-all', onManualSyncAll, 'Semua Tim Rumdin & Wapres')}
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-between text-xs text-white bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-500/50 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Kirim Semua Data Shift</span>
                    </span>
                    {loadingAction === 'sync-all' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Backup Panduan & Salin Skrip */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Cadangan Kode Google Apps Script
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Skrip (1-Klik)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Skrip di Google Sheets Anda sudah terpasang dan aktif. Tombol salin kode di atas disediakan jika Anda ingin melihat isi skrip atau memasangnya di file spreadsheet lain di masa depan.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCodePreview(!showCodePreview)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                {showCodePreview ? 'Sembunyikan tampilan kode' : 'Lihat tampilan kode skrip Apps Script'}
              </button>
              {showCodePreview && (
                <pre className="mt-2 p-3 bg-zinc-950 rounded-xl text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-48 border border-zinc-800">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Database Terhubung: Bebas login untuk semua petugas shift.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
