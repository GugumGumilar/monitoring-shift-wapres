import React from 'react';
import { FileSpreadsheet, ExternalLink, Settings, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { ActiveSpreadsheetInfo } from '../services/googleSheets';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncBarProps {
  user: User | null;
  activeSpreadsheet: ActiveSpreadsheetInfo | null;
  autoSyncEnabled: boolean;
  onOpenSettings: () => void;
  onQuickSync: () => void;
  isSyncing?: boolean;
}

export const GoogleSheetsSyncBar: React.FC<GoogleSheetsSyncBarProps> = ({
  user,
  activeSpreadsheet,
  autoSyncEnabled,
  onOpenSettings,
  onQuickSync,
  isSyncing = false,
}) => {
  const isReady = Boolean(user && activeSpreadsheet);

  return (
    <div
      id="google-sheets-sync-bar"
      className={`rounded-xl p-3 border transition-all ${
        isReady
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-zinc-900/80 border-zinc-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isReady
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200">
                Google Sheets Real-Time
              </span>
              {isReady ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {autoSyncEnabled ? 'Auto-Sync Aktif' : 'Tersambung'}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                  Belum Terhubung
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 truncate max-w-md">
              {isReady
                ? `Spreadsheet: "${activeSpreadsheet?.title}"`
                : 'Hubungkan Google Sheets untuk mencatat input ACO TM secara real-time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isReady && activeSpreadsheet && (
            <>
              <button
                type="button"
                onClick={onQuickSync}
                disabled={isSyncing}
                title="Kirim data inspeksi ACO saat ini ke Google Sheets"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Kirim ke Sheets</span>
              </button>

              <a
                href={activeSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <span>Buka</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isReady
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isReady ? 'Kelola' : 'Sambungkan Sheets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
