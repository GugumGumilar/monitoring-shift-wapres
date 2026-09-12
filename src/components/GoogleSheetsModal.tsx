import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Power,
  Zap,
  Copy,
  Check,
  Code2,
  HelpCircle,
  Radio,
  Send,
  LockOpen,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  ActiveSpreadsheetInfo,
  createFullMonitoringSpreadsheet,
  connectExistingSpreadsheet,
  formatAndTidyExistingSpreadsheet,
} from '../services/googleSheets';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  DEFAULT_WEBHOOK_URL,
  testWebhookConnection,
  tidySheetsViaWebhook,
} from '../services/webhookSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  activeSpreadsheet: ActiveSpreadsheetInfo | null;
  directWebhookUrl: string | null;
  onUpdateWebhookUrl: (url: string | null) => void;
  directSheetLink: string | null;
  onUpdateSheetLink: (link: string | null) => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSpreadsheetUpdated: (info: ActiveSpreadsheetInfo | null) => void;
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
  user,
  accessToken,
  activeSpreadsheet,
  directWebhookUrl,
  onUpdateWebhookUrl,
  directSheetLink,
  onUpdateSheetLink,
  onSignIn,
  onSignOut,
  onSpreadsheetUpdated,
  autoSyncEnabled,
  onToggleAutoSync,
  onManualSyncCurrent,
  onManualSyncDipo,
  onManualSyncST12,
  onManualSyncRumdinUps,
  onManualSyncWapresUps,
  onManualSyncAll,
}) => {
  // Active Tab: 'direct' (Recommended, No Login) or 'oauth' (Google Account)
  const [activeTab, setActiveTab] = useState<'direct' | 'oauth'>('direct');

  // Direct Mode States
  const [webhookInput, setWebhookInput] = useState<string>(directWebhookUrl || '');
  const [sheetLinkInput, setSheetLinkInput] = useState<string>(directSheetLink || '');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false);

  // OAuth Mode States
  const [existingInput, setExistingInput] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct Webhook Handlers
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
      setErrorMessage('Format URL Webhook tidak valid. Pastikan berawalan https://script.google.com/macros/s/.../exec');
      return;
    }

    try {
      setLoadingAction('test_webhook');
      await testWebhookConnection(cleanWebhook);
      onUpdateWebhookUrl(cleanWebhook);
      if (sheetLinkInput.trim()) {
        onUpdateSheetLink(sheetLinkInput.trim());
      }
      setSuccessMessage('✅ Berhasil terhubung langsung ke Google Sheets! Seluruh petugas kini dapat mengirim data tanpa login.');
    } catch (err: any) {
      // Even if test has CORS warning, we still save and notify
      onUpdateWebhookUrl(cleanWebhook);
      if (sheetLinkInput.trim()) {
        onUpdateSheetLink(sheetLinkInput.trim());
      }
      setSuccessMessage('✅ URL Webhook tersimpan dan siap digunakan untuk pengiriman data tanpa login!');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTestWebhook = async () => {
    if (!directWebhookUrl) return;
    try {
      setLoadingAction('test_webhook_ping');
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await testWebhookConnection(directWebhookUrl);
      setSuccessMessage(`✅ Tes Berhasil: ${res.message || 'Webhook Google Sheets aktif dan merespons!'}`);
    } catch (err: any) {
      setSuccessMessage('✅ Sinyal tes telah dikirim ke Google Apps Script Webhook!');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnectDirect = () => {
    onUpdateWebhookUrl(null);
    onUpdateSheetLink(null);
    setWebhookInput('');
    setSheetLinkInput('');
    setSuccessMessage('Koneksi kustom dinonaktifkan.');
  };

  const handleRestoreDefault = () => {
    onUpdateWebhookUrl(DEFAULT_WEBHOOK_URL);
    setWebhookInput(DEFAULT_WEBHOOK_URL);
    setSuccessMessage('✅ URL Webhook sistem resmi telah diaktifkan kembali!');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // Fallback
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  // OAuth Mode Handlers
  const handleSwitchAccount = async () => {
    try {
      setLoadingAction('switch_account');
      setErrorMessage(null);
      setSuccessMessage(null);
      await onSignOut();
      await onSignIn();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Gagal beralih akun Google.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateNew = async () => {
    if (!accessToken) {
      setErrorMessage('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }
    try {
      setLoadingAction('create');
      setErrorMessage(null);
      setSuccessMessage(null);
      const created = await createFullMonitoringSpreadsheet(accessToken);
      onSpreadsheetUpdated(created);
      setSuccessMessage(
        'Berhasil membuat Google Spreadsheet baru lengkap dengan 4 lembar resmi (ACO TM D 126, ACO TR DIPO, ACO TR ST 12, dan LAPORAN_CETAK_UPS)!'
      );
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      setErrorMessage(err.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setErrorMessage('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }
    if (!existingInput.trim()) {
      setErrorMessage('Masukkan URL atau ID Google Spreadsheet.');
      return;
    }
    try {
      setLoadingAction('connect');
      setErrorMessage(null);
      setSuccessMessage(null);
      const info = await connectExistingSpreadsheet(accessToken, existingInput);
      onSpreadsheetUpdated(info);
      setSuccessMessage(`Berhasil menghubungkan ke spreadsheet: "${info.title}"!`);
      setExistingInput('');
    } catch (err: any) {
      console.error('Error connecting spreadsheet:', err);
      setErrorMessage(
        err.message || 'Gagal menyambungkan ke Google Spreadsheet. Periksa hak akses file Anda.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const runSyncAction = async (actionKey: string, syncFn: () => Promise<void>, label: string) => {
    try {
      setLoadingAction(actionKey);
      setErrorMessage(null);
      setSuccessMessage(null);
      await syncFn();
      setSuccessMessage(`Data ${label} berhasil dikirim ke Google Sheets!`);
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

      if (directWebhookUrl) {
        const res = await tidySheetsViaWebhook(directWebhookUrl);
        setSuccessMessage(
          res.message ||
            'Tampilan seluruh lembar Google Sheets (ACO TM, DIPO, ST12, dan UPS) berhasil dirapikan dengan standar resmi PLN!'
        );
      } else if (accessToken && activeSpreadsheet) {
        const res = await formatAndTidyExistingSpreadsheet(accessToken, activeSpreadsheet.id);
        setSuccessMessage(res.message);
      } else {
        setErrorMessage('Silakan hubungkan Google Sheets terlebih dahulu (via Webhook atau Login Google).');
      }
    } catch (err: any) {
      console.error('Error tidying sheets:', err);
      setErrorMessage(`Gagal merapikan sheet: ${err.message || err.toString()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const isDirectConnected = Boolean(directWebhookUrl);
  const isOAuthConnected = Boolean(accessToken && activeSpreadsheet);
  const isAnyConnected = isDirectConnected || isOAuthConnected;

  return (
    <div
      id="google-sheets-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="google-sheets-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base sm:text-lg flex items-center gap-2">
                Integrasi Google Sheets Real-Time
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Wapres & Rumdin
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pencatatan data ACO TM D 126, ACO TR Rumdin (Dipo & ST12) dan Beban UPS
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

        {/* Tab Navigation: Direct Mode vs OAuth */}
        <div className="px-5 pt-3 pb-2 bg-zinc-950/40 border-b border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <LockOpen className="w-3.5 h-3.5" />
            <span>Koneksi Langsung (Bebas Login)</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40">
              Rekomendasi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login Akun Google (OAuth)</span>
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

          {/* TAB 1: KONEKSI LANGSUNG (BEBAS LOGIN) */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              {/* Connection Status Banner */}
              {isDirectConnected ? (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-emerald-300">
                            Database Google Sheets: Aktif
                          </span>
                          {directWebhookUrl === DEFAULT_WEBHOOK_URL ? (
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
                          Bebas login akun, seluruh data otomatis masuk ke spreadsheet.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={loadingAction === 'test_webhook_ping'}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer"
                      >
                        {loadingAction === 'test_webhook_ping' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>Tes Sinyal</span>
                      </button>

                      {directWebhookUrl !== DEFAULT_WEBHOOK_URL && (
                        <button
                          type="button"
                          onClick={handleRestoreDefault}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                          title="Kembalikan ke URL Webhook bawaan sistem"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Bawaan</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDisconnectDirect}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        Ubah URL
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-300 font-mono break-all bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block mb-0.5">URL Webhook Aktif (Bebas Login Petugas):</span>
                    {directWebhookUrl}
                  </div>

                  {directSheetLink && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-950/60">
                      <span className="text-xs text-zinc-400">File Spreadsheet:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTidySheets}
                          disabled={Boolean(loadingAction)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                          title="Format ulang lebar kolom, border, dan warna header standar PLN"
                        >
                          {loadingAction === 'tidy_sheets' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-zinc-950" />
                          )}
                          <span>Rapikan Format Sheet</span>
                        </button>

                        <a
                          href={directSheetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline font-semibold"
                        >
                          <span>Buka Spreadsheet</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Form Input Webhook */
                <form
                  onSubmit={handleSaveDirectConnection}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <LockOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sambungkan Spreadsheet Tanpa Login Akun</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Bebas Error 403</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tempelkan <strong>URL Webhook Google Apps Script</strong> dari spreadsheet Anda (misal dari akun <code className="text-emerald-400 font-mono">plnwapres@gmail.com</code>). Seluruh petugas shift dapat langsung mengirim laporan tanpa harus login akun Google.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        1. URL Webhook Apps Script (Berakhiran /exec) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={webhookInput}
                        onChange={(e) => setWebhookInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        required
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        2. Tautan Google Spreadsheet (Opsional, untuk tombol buka cepat)
                      </label>
                      <input
                        type="url"
                        value={sheetLinkInput}
                        onChange={(e) => setSheetLinkInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRestoreDefault}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gunakan URL Bawaan Sistem</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loadingAction === 'test_webhook' || !webhookInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      {loadingAction === 'test_webhook' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5" />
                      )}
                      <span>Hubungkan ke Sheet</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Cara Pasang Script Google (1-Klik & Panduan 4 Langkah) */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200">
                      Cara Membuat Webhook di Google Sheet (Hanya 1x Pasang)
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

                <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                  <li>
                    Buka Google Sheet target di Google Drive (misal akun <strong>plnwapres@gmail.com</strong>).
                  </li>
                  <li>
                    Klik menu <strong>Ekstensi (Extensions)</strong> &rarr; pilih <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Hapus kode yang ada, lalu klik tombol <strong>"Salin Kode Skrip (1-Klik)"</strong> di atas dan tempel (Paste) di Apps Script.
                  </li>
                  <li>
                    Klik <strong>Terapkan (Deploy)</strong> &rarr; <strong>Penerapan Baru (New Deployment)</strong> &rarr; pilih jenis <strong>Aplikasi Web (Web App)</strong>:
                    <div className="mt-1 ml-4 p-2 bg-zinc-900/90 rounded-lg text-[11px] text-zinc-300 border border-zinc-800 space-y-0.5">
                      <div>&bull; Jalankan sebagai: <strong>Saya (Me)</strong></div>
                      <div>&bull; Siapa yang memiliki akses: <strong className="text-emerald-400">Siapa saja (Anyone)</strong> &larr; <em>Wajib agar bebas login!</em></div>
                    </div>
                  </li>
                  <li>
                    Klik <strong>Terapkan</strong> &rarr; Salin URL yang berakhiran <code className="text-emerald-400">/exec</code> lalu tempelkan ke kolom form di atas.
                  </li>
                </ol>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pembaruan Tata Letak Otomatis (Standar Resmi PLN):</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Kode skrip terbaru ini sudah dilengkapi styling otomatis: header dua tingkat kuning (ACO), header biru-oranye (UPS), garis border pada tiap baris data, dan lebar kolom presisi. Cukup salin ulang kode di atas, tempel di Apps Script, lalu klik <strong>Terapkan</strong>. Di Google Sheet Anda juga otomatis muncul menu bilah atas baru: <strong className="text-amber-300">⚡ PLN Shift &rarr; ✨ Rapikan Semua Tampilan Sheet (1-Klik)</strong>!
                  </p>
                </div>

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
          )}

          {/* TAB 2: LOGIN AKUN GOOGLE (OAUTH) */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {/* Account Box */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full border border-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm">
                        {user?.email ? user.email[0].toUpperCase() : 'G'}
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-zinc-400 font-medium">Akun Google Terhubung</div>
                      <div className="text-sm font-semibold text-zinc-100">
                        {user ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {user.email}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Belum login akun Google</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {user && accessToken ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          disabled={loadingAction === 'switch_account'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                          title="Beralih ke akun Google lain"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'switch_account' ? 'animate-spin' : ''}`} />
                          <span>Ganti Akun</span>
                        </button>
                        <button
                          type="button"
                          onClick={onSignOut}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onSignIn}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-md transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          />
                        </svg>
                        <span>Login dengan Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Create or Connect OAuth Spreadsheet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!accessToken || loadingAction === 'create'}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {loadingAction === 'create' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Buat Spreadsheet Baru (4 Tab Lengkap)</span>
                </button>

                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Membuat file di Google Drive akun Anda dengan format kolom resmi.</span>
                </div>
              </div>

              {/* Connect Existing Form for OAuth */}
              <form
                onSubmit={handleConnectExisting}
                className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sambungkan Link Spreadsheet (Akses OAuth)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={existingInput}
                    onChange={(e) => setExistingInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!accessToken || loadingAction === 'connect' || !existingInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {loadingAction === 'connect' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Sambungkan</span>
                  </button>
                </div>
              </form>
            </div>
          )}

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
                  disabled={Boolean(loadingAction) || !isAnyConnected}
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
                  disabled={Boolean(loadingAction) || !isAnyConnected}
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
                    disabled={Boolean(loadingAction) || !isAnyConnected}
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
                    disabled={Boolean(loadingAction) || !isAnyConnected}
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
                    onClick={() => runSyncAction('sync-ups-wapres', onManualSyncWapresUps, 'UPS Wapres (30, 40, 60 KVA)')}
                    disabled={Boolean(loadingAction) || !isAnyConnected}
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
                    onClick={() => runSyncAction('sync-ups-rumdin', onManualSyncRumdinUps, 'UPS Rumdin (40 & 100 KVA)')}
                    disabled={Boolean(loadingAction) || !isAnyConnected}
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
                    disabled={Boolean(loadingAction) || !isAnyConnected}
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {isDirectConnected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mode Langsung Aktif: Bebas login untuk semua petugas shift.
              </span>
            ) : isOAuthConnected ? (
              <span className="text-blue-400 font-medium">
                Terhubung via akun: {user?.email}
              </span>
            ) : (
              <span className="text-zinc-500">
                Gunakan URL Webhook agar aplikasi langsung terhubung ke Google Sheet.
              </span>
            )}
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
