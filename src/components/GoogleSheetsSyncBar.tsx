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
      className={`rounded-2xl p-3.5 border transition-all ${
        isReady
          ? 'glass-panel-green border-emerald-500/40 glow-emerald/15'
          : 'glass-panel border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isReady
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-wide">
                Google Sheets Real-Time
              </span>
              {isReady ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {autoSyncEnabled ? 'Auto-Sync Aktif' : 'Tersambung'}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                  Belum Terhubung
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Kirim ke Sheets</span>
              </button>

              <a
                href={activeSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <span>Buka</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              isReady
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20 glow-emerald'
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
