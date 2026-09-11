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
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  ActiveSpreadsheetInfo,
  createAcoWapresSpreadsheet,
  connectExistingSpreadsheet,
  extractSpreadsheetId,
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  activeSpreadsheet: ActiveSpreadsheetInfo | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSpreadsheetUpdated: (info: ActiveSpreadsheetInfo | null) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onManualSyncCurrent: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  activeSpreadsheet,
  onSignIn,
  onSignOut,
  onSpreadsheetUpdated,
  autoSyncEnabled,
  onToggleAutoSync,
  onManualSyncCurrent,
}) => {
  const [existingInput, setExistingInput] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNew = async () => {
    if (!accessToken) {
      setErrorMessage('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }
    try {
      setLoadingAction('create');
      setErrorMessage(null);
      setSuccessMessage(null);
      const created = await createAcoWapresSpreadsheet(accessToken);
      onSpreadsheetUpdated(created);
      setSuccessMessage(
        'Berhasil membuat Google Spreadsheet baru dengan format resmi ACO TM Gardu D 126!'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat spreadsheet baru.');
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
      const connected = await connectExistingSpreadsheet(accessToken, existingInput);
      onSpreadsheetUpdated(connected);
      setSuccessMessage(`Berhasil menghubungkan ke spreadsheet: "${connected.title}"`);
      setExistingInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghubungkan spreadsheet.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManualSync = async () => {
    try {
      setLoadingAction('sync');
      setErrorMessage(null);
      setSuccessMessage(null);
      await onManualSyncCurrent();
      setSuccessMessage('Data inspeksi ACO TM saat ini berhasil dikirim ke Google Sheets!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan data.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      id="google-sheets-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="google-sheets-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base sm:text-lg flex items-center gap-2">
                Integrasi Google Sheets Real-Time
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Pantauan ACO Wapres
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Otomatis mengisi baris data Pantauan Inspeksi ACO TM Gardu D 126
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
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Messages */}
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

          {/* Section 1: Google Account Status */}
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
                      <span className="text-zinc-400">Belum terhubung ke Google</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {user && accessToken ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-md transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>Masuk dengan Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Active Spreadsheet */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Spreadsheet Aktif
              </span>
              {activeSpreadsheet && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Tersambung
                </span>
              )}
            </div>

            {activeSpreadsheet ? (
              <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{activeSpreadsheet.title}</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Lembar: <span className="font-mono text-zinc-300 font-semibold">{activeSpreadsheet.sheetName}</span> | ID:{' '}
                      <span className="font-mono text-zinc-500">{activeSpreadsheet.id.slice(0, 16)}...</span>
                    </div>
                  </div>

                  <a
                    href={activeSpreadsheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Auto sync toggle */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => onToggleAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                    />
                    <span className="text-xs text-zinc-300 font-medium">
                      Otomatis input ke Spreadsheet saat petugas klik "Simpan Laporan"
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={loadingAction === 'sync'}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {loadingAction === 'sync' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Data Sekarang</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800 space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-zinc-600 mx-auto" />
                <div className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Belum ada spreadsheet yang terhubung. Buat spreadsheet baru otomatis dengan format
                  resmi ACO TM atau sambungkan spreadsheet yang sudah Anda miliki.
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                <span>Buat Spreadsheet Baru Otomatis</span>
              </button>

              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Format otomatis dibuat persis sesuai tabel Pantauan Inspeksi ACO TM (Kolom A-Q, Header Kuning Emas).</span>
              </div>
            </div>
          </div>

          {/* Section 3: Connect Existing Spreadsheet */}
          <form
            onSubmit={handleConnectExisting}
            className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Gunakan Spreadsheet yang Sudah Ada</span>
            </div>
            <p className="text-xs text-zinc-400">
              Tempel link/URL Google Spreadsheet Anda (contoh: https://docs.google.com/spreadsheets/d/...)
            </p>

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

          {/* Reference Format Info */}
          <div className="bg-zinc-900/90 border border-amber-500/20 rounded-xl p-3.5 text-xs text-zinc-400 space-y-1.5">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Format Kolom Spreadsheet (Sesuai Gambar Pantauan ACO Wapres):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px] text-zinc-300 pt-1">
              <div>A: NO</div>
              <div>B: NAMA PETUGAS</div>
              <div>C: TANGGAL/BLN/THN</div>
              <div>D: JAM INSPEKSI</div>
              <div>E: PENYULANG CLOSE</div>
              <div>F: PENYULANG OPEN</div>
              <div>G-H: ALARM (ALARM/NORMAL)</div>
              <div>I-J: POWER (ON/OFF)</div>
              <div>K-L: CHARGE (YA/TDK)</div>
              <div>M-N: REMOTE (LOCAL/AUTO)</div>
              <div>O-P: LAMPU (ON/OFF)</div>
              <div>Q: KETERANGAN</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Data dikirim langsung ke Google Sheets secara aman menggunakan token akses pengguna.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
