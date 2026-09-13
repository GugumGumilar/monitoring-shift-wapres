import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShiftType, TimRumdinReport, TimWapresReport, CombinedShiftReport, SheetMissingInfo } from './types';
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
  saveReport,
} from './utils/storage';
import { Header } from './components/Header';
import { TimWapresForm } from './components/TimWapresForm';
import { TimRumdinForm } from './components/TimRumdinForm';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SpreadsheetViewModal } from './components/SpreadsheetViewModal';
import { ShiftScheduleModal } from './components/ShiftScheduleModal';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, auth, getCachedGoogleUser, getAccessToken } from './services/googleAuth';
import {
  ActiveSpreadsheetInfo,
  getStoredSpreadsheet,
  saveStoredSpreadsheet,
  appendAcoWapresRecord,
  appendAcoDipoRecord,
  appendAcoST12Record,
  appendRumdinUpsRecords,
  appendWapresUpsRecords,
  appendAllRumdinRecords,
  clearShiftSlotInGoogleSheets,
  extractDayOfMonth,
} from './services/googleSheets';
import {
  getStoredWebhookUrl,
  saveStoredWebhookUrl,
  getStoredSheetLink,
  saveStoredSheetLink,
  syncAcoTmViaWebhook,
  syncAcoDipoViaWebhook,
  syncAcoST12ViaWebhook,
  syncUpsWapresViaWebhook,
  syncUpsRumdinViaWebhook,
  syncAllViaWebhook,
  clearShiftViaWebhook,
} from './services/webhookSync';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  RotateCcw,
  Database,
  RefreshCw,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { fetchShiftDataFromSpreadsheet } from './services/sheetReader';
import { validateShiftReport } from './utils/reportValidator';
import { OfficerSelectionScreen } from './components/OfficerSelectionScreen';
import { ShiftDashboardScreen } from './components/ShiftDashboardScreen';

export default function App() {
  // Current real-time shift
  const [selectedShift, setSelectedShift] = useState<ShiftType>(() => getCurrentShift());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => getDateKey());
  const [selectedTeam, setSelectedTeam] = useState<'WAPRES' | 'RUMDIN'>('WAPRES');
  const [liveActiveShift, setLiveActiveShift] = useState<ShiftType>(() => getCurrentShift());

  // Screen workflow state: 'OFFICER_SELECT' -> 'FORM' -> 'DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState<'OFFICER_SELECT' | 'FORM' | 'DASHBOARD'>('OFFICER_SELECT');
  const [selectedOfficers, setSelectedOfficers] = useState<[string, string]>(() => {
    try {
      const saved = localStorage.getItem('monitoring_last_officers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['', ''];
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const live = getCurrentShift();
      setLiveActiveShift(live);
      // Auto-keep selectedShift updated to the real-time active shift if not overridden
      setSelectedShift(live);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isToday = selectedDateKey === getDateKey();
  const isShiftTimeAllowed = true;

  // Reports state
  const [allReports, setAllReports] = useState<CombinedShiftReport[]>(() => getAllReports());

  // Direct Webhook state (No Login Required)
  const [directWebhookUrl, setDirectWebhookUrl] = useState<string | null>(() => getStoredWebhookUrl());
  const [directSheetLink, setDirectSheetLink] = useState<string | null>(() => getStoredSheetLink());

  // Google Auth & Sheets states (OAuth Mode)
  const [currentUser, setCurrentUser] = useState<User | any>(() => auth.currentUser || getCachedGoogleUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('monitoring_shift_google_access_token');
    } catch {
      return null;
    }
  });
  const [activeSpreadsheet, setActiveSpreadsheet] = useState<ActiveSpreadsheetInfo | null>(() =>
    getStoredSpreadsheet()
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('monitoring_aco_auto_sync') !== 'false';
  });
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [isShiftScheduleOpen, setIsShiftScheduleOpen] = useState<boolean>(false);
  const [isSheetTableOpen, setIsSheetTableOpen] = useState<boolean>(false);

  const handleUpdateWebhookUrl = (url: string | null) => {
    setDirectWebhookUrl(url);
    saveStoredWebhookUrl(url);
    if (url) {
      showToast('✅ Webhook Google Sheets terhubung! Semua petugas shift bisa mengirim laporan tanpa login.', 'success');
    }
  };

  const handleUpdateSheetLink = (link: string | null) => {
    setDirectSheetLink(link);
    saveStoredSheetLink(link);
  };

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

  // Status deteksi submit langsung dari database Google Sheets
  const [sheetStatus, setSheetStatus] = useState<{
    isChecking: boolean;
    isWapresSubmitted: boolean;
    isRumdinSubmitted: boolean;
    isBothSubmitted: boolean;
    wapres: TimWapresReport | null;
    rumdin: TimRumdinReport | null;
    missingInfo?: SheetMissingInfo;
    lastChecked: string | null;
    error: string | null;
  }>({
    isChecking: false,
    isWapresSubmitted: false,
    isRumdinSubmitted: false,
    isBothSubmitted: false,
    wapres: null,
    rumdin: null,
    lastChecked: null,
    error: null,
  });

  // Fitur Sinkronisasi Otomatis Google Sheets (setiap 20 detik)
  const [autoSyncSheets, setAutoSyncSheets] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('monitoring_auto_sync_sheets');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const isCheckingSheetRef = useRef<boolean>(false);
  const prevSheetStatusRef = useRef<{ isWapres: boolean; isRumdin: boolean }>({
    isWapres: false,
    isRumdin: false,
  });

  useEffect(() => {
    localStorage.setItem('monitoring_auto_sync_sheets', JSON.stringify(autoSyncSheets));
  }, [autoSyncSheets]);

  const checkSpreadsheetSubmission = async (silent = false) => {
    const hasConnection = Boolean(
      directWebhookUrl || directSheetLink || (accessToken && activeSpreadsheet)
    );
    if (!hasConnection) {
      if (!silent) {
        showToast('Google Sheets belum terhubung. Konfigurasikan Webhook atau login Google terlebih dahulu.', 'info');
        setIsSheetsModalOpen(true);
      }
      return;
    }

    if (isCheckingSheetRef.current) return;
    isCheckingSheetRef.current = true;

    setSheetStatus((prev) => ({ ...prev, isChecking: true, error: null }));
    try {
      const res = await fetchShiftDataFromSpreadsheet({
        dateKey: selectedDateKey,
        shift: selectedShift,
        webhookUrl: directWebhookUrl,
        sheetLink: directSheetLink,
        accessToken,
        activeSpreadsheet,
      });

      if (res.success) {
        const wasWapres = prevSheetStatusRef.current.isWapres;
        const wasRumdin = prevSheetStatusRef.current.isRumdin;

        prevSheetStatusRef.current = {
          isWapres: res.isWapresSubmitted,
          isRumdin: res.isRumdinSubmitted,
        };

        setSheetStatus({
          isChecking: false,
          isWapresSubmitted: res.isWapresSubmitted,
          isRumdinSubmitted: res.isRumdinSubmitted,
          isBothSubmitted: res.isBothSubmitted,
          wapres: res.wapres,
          rumdin: res.rumdin,
          missingInfo: res.missingInfo,
          lastChecked: formatIndonesianTime(new Date()),
          error: null,
        });

        // Sinkronkan ke local report jika ada data dari spreadsheet
        let updated = false;
        if (res.wapres) {
          submitWapresToShift(selectedDateKey, selectedShift, res.wapres);
          if (!(currentScreen === 'FORM' && selectedTeam === 'WAPRES')) {
            setWapresData(res.wapres);
          }
          updated = true;
        }
        if (res.rumdin) {
          submitRumdinToShift(selectedDateKey, selectedShift, res.rumdin);
          if (!(currentScreen === 'FORM' && selectedTeam === 'RUMDIN')) {
            setRumdinData(res.rumdin);
          }
          updated = true;
        }
        if (updated) {
          setAllReports(getAllReports());
        }

        if (silent) {
          // Notifikasi lembut saat background sync mendeteksi laporan baru masuk dari Google Sheets
          if (res.isBothSubmitted && (!wasWapres || !wasRumdin)) {
            showToast('🔔 Terdeteksi update otomatis: Laporan Tim Wapres & Tim Rumdin lengkap di Google Sheets! Tombol WhatsApp siap digunakan.', 'success');
          } else if (res.isWapresSubmitted && !wasWapres) {
            showToast('🔔 Terdeteksi update otomatis: Laporan Tim Wapres telah disubmit di Google Sheets!', 'success');
          } else if (res.isRumdinSubmitted && !wasRumdin) {
            showToast('🔔 Terdeteksi update otomatis: Laporan Tim Rumdin telah disubmit di Google Sheets!', 'success');
          }
        } else {
          if (res.isBothSubmitted) {
            showToast('✅ Kedua tim (Wapres & Rumdin) terdeteksi SUDAH submit di database Google Sheets!', 'success');
          } else if (res.missingInfo?.instructionMessage) {
            showToast(`ℹ️ ${res.missingInfo.instructionMessage}`, 'info');
          } else if (res.isWapresSubmitted) {
            showToast('✅ Tim Wapres SUDAH submit. Tim Rumdin masih belum submit.', 'info');
          } else if (res.isRumdinSubmitted) {
            showToast('✅ Tim Rumdin SUDAH submit. Tim Wapres masih belum submit.', 'info');
          } else {
            showToast('ℹ️ Data shift ini belum diisi di Google Sheets (Belum Submit).', 'info');
          }
        }
      } else {
        setSheetStatus((prev) => ({ ...prev, isChecking: false, error: res.message || 'Gagal membaca sheet' }));
        if (!silent) {
          showToast(`Status Sheets: ${res.message || 'Gagal terhubung'}`, 'info');
        }
      }
    } catch (err: any) {
      console.warn('Check sheet error:', err);
      setSheetStatus((prev) => ({ ...prev, isChecking: false, error: err.message }));
      if (!silent) {
        showToast(`Gagal membaca status Google Sheets: ${err.message}`, 'info');
      }
    } finally {
      isCheckingSheetRef.current = false;
    }
  };

  // Otomatis cek database Google Sheets setiap kali tanggal atau shift berubah
  useEffect(() => {
    if (directWebhookUrl || directSheetLink || (accessToken && activeSpreadsheet)) {
      checkSpreadsheetSubmission(true);
    }
  }, [selectedDateKey, selectedShift, directWebhookUrl, directSheetLink, accessToken, activeSpreadsheet]);

  // Sinkronisasi otomatis berkala setiap 20 detik saat jendela aktif
  useEffect(() => {
    if (!autoSyncSheets) return;

    const hasConnection = Boolean(
      directWebhookUrl || directSheetLink || (accessToken && activeSpreadsheet)
    );
    if (!hasConnection) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSpreadsheetSubmission(true);
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [autoSyncSheets, selectedDateKey, selectedShift, directWebhookUrl, directSheetLink, accessToken, activeSpreadsheet]);

  // Sinkronisasi saat pengguna kembali ke tab browser (window focus / visibility change)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && autoSyncSheets) {
        checkSpreadsheetSubmission(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [autoSyncSheets, selectedDateKey, selectedShift, directWebhookUrl, directSheetLink, accessToken, activeSpreadsheet]);

  // Sinkronisasi otomatis saat masuk ke layar Dashboard
  useEffect(() => {
    if (currentScreen === 'DASHBOARD' && autoSyncSheets) {
      checkSpreadsheetSubmission(true);
    }
  }, [currentScreen, autoSyncSheets]);

  // Firebase auth state listener with localStorage session recovery
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setCurrentUser(u);
        setAccessToken(token);
      },
      () => {
        const storedToken = localStorage.getItem('monitoring_shift_google_access_token');
        const storedUser = getCachedGoogleUser();
        if (storedToken && storedUser) {
          setCurrentUser(storedUser);
          setAccessToken(storedToken);
        } else {
          setCurrentUser(auth.currentUser);
        }
      }
    );
    return () => unsubscribe();
  }, []);

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

  // Google Sheets & Auth Actions
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      setCurrentUser(res.user);
      setAccessToken(res.accessToken);
      showToast(`✅ Berhasil masuk sebagai ${res.user.email}`);
    } catch (err: any) {
      showToast(`Gagal login Google: ${err.message}`, 'info');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setAccessToken(null);
      showToast('Telah keluar dari akun Google.');
    } catch (err: any) {
      showToast(`Gagal logout: ${err.message}`, 'info');
    }
  };

  const handleSpreadsheetUpdated = (info: ActiveSpreadsheetInfo | null) => {
    setActiveSpreadsheet(info);
    saveStoredSpreadsheet(info);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem('monitoring_aco_auto_sync', enabled ? 'true' : 'false');
    showToast(
      enabled
        ? 'Real-Time Sync Aktif: Data ACO otomatis masuk ke Google Sheets saat submit.'
        : 'Real-Time Sync Google Sheets dinonaktifkan.',
      'info'
    );
  };

  const handleQuickSyncAco = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncAcoTmViaWebhook(directWebhookUrl, wapresData, selectedShift);
        showToast('📊 Status ACO TM Gardu D 126 berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync ACO TM error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }

    try {
      setIsSyncingSheets(true);
      const targetSheet = activeSpreadsheet.sheetTabs?.acoTM || activeSpreadsheet.sheetName || 'ACO TM D 126';
      await appendAcoWapresRecord(
        accessToken,
        activeSpreadsheet.id,
        targetSheet,
        wapresData,
        selectedShift
      );
      showToast('📊 Status ACO TM Gardu D 126 berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync ACO TM error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncDipo = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncAcoDipoViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        showToast('📊 Status ACO TR DIPO berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync Dipo error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      const targetSheet = activeSpreadsheet.sheetTabs?.acoTRDipo || 'ACO TR DIPO';
      await appendAcoDipoRecord(
        accessToken,
        activeSpreadsheet.id,
        targetSheet,
        rumdinData,
        selectedShift
      );
      showToast('📊 Status ACO TR DIPO berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync Dipo error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncST12 = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncAcoST12ViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        showToast('📊 Status ACO TR ST 12 berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync ST12 error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      const targetSheet = activeSpreadsheet.sheetTabs?.acoTRST12 || 'ACO TR ST 12';
      await appendAcoST12Record(
        accessToken,
        activeSpreadsheet.id,
        targetSheet,
        rumdinData,
        selectedShift
      );
      showToast('📊 Status ACO TR ST 12 berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync ST12 error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncRumdinUps = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncUpsRumdinViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        showToast('⚡ Beban UPS Rumdin (Dipo & ST12) berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync UPS Rumdin error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      await appendRumdinUpsRecords(
        accessToken,
        activeSpreadsheet.id,
        activeSpreadsheet.sheetTabs || activeSpreadsheet.sheetTabs?.ups || 'LAPORAN_CETAK_UPS',
        rumdinData,
        selectedShift
      );
      showToast('⚡ Beban UPS Rumdin (Dipo & ST12) berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync UPS Rumdin error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncWapresUps = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncUpsWapresViaWebhook(directWebhookUrl, wapresData, selectedShift);
        showToast('⚡ Beban UPS Wapres (30, 40, 60 KVA) berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync UPS Wapres error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      await appendWapresUpsRecords(
        accessToken,
        activeSpreadsheet.id,
        activeSpreadsheet.sheetTabs || activeSpreadsheet.sheetTabs?.ups || 'LAPORAN_CETAK_UPS',
        wapresData,
        selectedShift
      );
      showToast('⚡ Beban UPS Wapres (30, 40, 60 KVA) berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync UPS Wapres error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncAllRumdin = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncAcoDipoViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        await syncAcoST12ViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        await syncUpsRumdinViaWebhook(directWebhookUrl, rumdinData, selectedShift);
        showToast('🚀 Semua data Tim Rumdin (Dipo, ST12, UPS) berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync all Rumdin error:', err);
        showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      await appendAllRumdinRecords(
        accessToken,
        activeSpreadsheet.id,
        rumdinData,
        activeSpreadsheet.sheetTabs,
        selectedShift
      );
      showToast('🚀 Semua data Tim Rumdin (Dipo, ST12, UPS) berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync all Rumdin error:', err);
      showToast(`Gagal kirim ke Google Sheets: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleQuickSyncAll = async () => {
    if (directWebhookUrl) {
      try {
        setIsSyncingSheets(true);
        await syncAllViaWebhook(directWebhookUrl, wapresData, rumdinData, selectedShift);
        showToast('✨ Seluruh data shift (Wapres & Rumdin) berhasil diperbarui di Google Sheets!');
      } catch (err: any) {
        console.error('Webhook sync all error:', err);
        showToast(`Gagal sync semua data: ${err.message}`, 'info');
      } finally {
        setIsSyncingSheets(false);
      }
      return;
    }

    if (!accessToken || !activeSpreadsheet) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      setIsSyncingSheets(true);
      // Sync Wapres ACO TM
      const tmSheet = activeSpreadsheet.sheetTabs?.acoTM || activeSpreadsheet.sheetName || 'ACO TM D 126';
      await appendAcoWapresRecord(accessToken, activeSpreadsheet.id, tmSheet, wapresData, selectedShift);
      // Sync Wapres UPS
      const upsSheet = activeSpreadsheet.sheetTabs?.ups || 'LAPORAN_CETAK_UPS';
      await appendWapresUpsRecords(accessToken, activeSpreadsheet.id, upsSheet, wapresData, selectedShift);
      // Sync All Rumdin (Dipo, ST12, UPS)
      await appendAllRumdinRecords(accessToken, activeSpreadsheet.id, rumdinData, activeSpreadsheet.sheetTabs, selectedShift);
      showToast('✨ Seluruh data shift (Wapres & Rumdin) berhasil diperbarui di Google Sheets!');
    } catch (err: any) {
      console.error('Quick sync all error:', err);
      showToast(`Gagal sync semua data: ${err.message}`, 'info');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Submission handlers
  const handleWapresSubmit = async (submittedData: TimWapresReport) => {
    const updatedReport = submitWapresToShift(selectedDateKey, selectedShift, submittedData);
    setAllReports(getAllReports());
    showToast(`✅ Laporan Tim Wapres berhasil disimpan pada ${submittedData.inspectionTime}!`);

    // Real-time synchronization to Google Sheets
    if (autoSyncEnabled) {
      if (directWebhookUrl) {
        try {
          setIsSyncingSheets(true);
          await syncAcoTmViaWebhook(directWebhookUrl, submittedData, selectedShift);
          await syncUpsWapresViaWebhook(directWebhookUrl, submittedData, selectedShift);
          showToast('📊 Data ACO TM & UPS Wapres otomatis diperbarui di Google Sheets!');
        } catch (err: any) {
          console.error('Webhook auto sync Wapres failed:', err);
        } finally {
          setIsSyncingSheets(false);
        }
      } else if (accessToken && activeSpreadsheet) {
        try {
          setIsSyncingSheets(true);
          const tmSheet = activeSpreadsheet.sheetTabs?.acoTM || activeSpreadsheet.sheetName || 'ACO TM D 126';
          await appendAcoWapresRecord(
            accessToken,
            activeSpreadsheet.id,
            tmSheet,
            submittedData,
            selectedShift
          );
          // Also sync Wapres UPS if filled
          const upsSheet = activeSpreadsheet.sheetTabs?.ups || 'LAPORAN_CETAK_UPS';
          await appendWapresUpsRecords(
            accessToken,
            activeSpreadsheet.id,
            upsSheet,
            submittedData,
            selectedShift
          );
          showToast('📊 Data ACO TM & UPS Wapres otomatis diperbarui di Google Sheets!');
        } catch (err: any) {
          console.error('Auto sync to Google Sheets failed:', err);
          showToast(`⚠️ Laporan disimpan lokal. Sync Sheets gagal: ${err.message}`, 'info');
        } finally {
          setIsSyncingSheets(false);
        }
      }
    }

    // Setelah simpan, data tersimpan terpisah per tim secara independen.
    // Otomatis dialihkan ke halaman Dashboard yang menampilkan status shift aktif.
    setCurrentScreen('DASHBOARD');
  };

  const handleRumdinSubmit = async (submittedData: TimRumdinReport) => {
    const updatedReport = submitRumdinToShift(selectedDateKey, selectedShift, submittedData);
    setAllReports(getAllReports());
    showToast(`✅ Laporan Tim Rumdin berhasil disimpan pada ${submittedData.inspectionTime}!`);

    // Real-time synchronization to Google Sheets
    if (autoSyncEnabled) {
      if (directWebhookUrl) {
        try {
          setIsSyncingSheets(true);
          await syncAcoDipoViaWebhook(directWebhookUrl, submittedData, selectedShift);
          await syncAcoST12ViaWebhook(directWebhookUrl, submittedData, selectedShift);
          await syncUpsRumdinViaWebhook(directWebhookUrl, submittedData, selectedShift);
          showToast('📊 Data ACO Dipo, ST12, & UPS Rumdin otomatis diperbarui di Google Sheets!');
        } catch (err: any) {
          console.error('Webhook auto sync Rumdin failed:', err);
        } finally {
          setIsSyncingSheets(false);
        }
      } else if (accessToken && activeSpreadsheet) {
        try {
          setIsSyncingSheets(true);
          await appendAllRumdinRecords(
            accessToken,
            activeSpreadsheet.id,
            submittedData,
            activeSpreadsheet.sheetTabs,
            selectedShift
          );
          showToast('📊 Data ACO Dipo, ST12, & UPS Rumdin otomatis diperbarui di Google Sheets!');
        } catch (err: any) {
          console.error('Auto sync Rumdin to Google Sheets failed:', err);
          showToast(`⚠️ Laporan disimpan lokal. Sync Sheets gagal: ${err.message}`, 'info');
        } finally {
          setIsSyncingSheets(false);
        }
      }
    }

    // Setelah simpan, data tersimpan terpisah per tim secara independen.
    // Otomatis dialihkan ke halaman Dashboard yang menampilkan status shift aktif.
    setCurrentScreen('DASHBOARD');
  };

  const handleProceedFromOfficerSelection = (
    officer1: string,
    officer2: string,
    team: 'WAPRES' | 'RUMDIN'
  ) => {
    setSelectedOfficers([officer1, officer2]);
    try {
      localStorage.setItem('monitoring_last_officers', JSON.stringify([officer1, officer2]));
    } catch {}
    setSelectedTeam(team);

    if (team === 'WAPRES') {
      setWapresData((prev) => ({
        ...prev,
        officers: [officer1, officer2],
      }));
    } else {
      setRumdinData((prev) => ({
        ...prev,
        officers: [officer1, officer2],
      }));
    }

    setCurrentScreen('FORM');
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

  const handleDeleteReport = async (id: string) => {
    const all = getAllReports();
    const reportToDelete = all.find((r) => r.id === id);

    deleteReport(id);
    setAllReports(getAllReports());
    showToast('Laporan riwayat telah dihapus', 'info');

    // Also clear the slot in Google Sheets if connected, maintaining table integrity
    if (reportToDelete) {
      const shift = reportToDelete.shift;
      const dateVal = reportToDelete.dateKey;
      if (directWebhookUrl) {
        try {
          await clearShiftViaWebhook(directWebhookUrl, dateVal, shift, 'ALL');
          showToast(`Baris shift ${shift} (${reportToDelete.displayDate}) di Google Sheets berhasil dikosongkan.`, 'info');
        } catch (e) {
          console.error('Failed to clear sheet via webhook:', e);
        }
      } else if (accessToken && activeSpreadsheet) {
        try {
          const day = extractDayOfMonth(dateVal);
          const tmSheet = activeSpreadsheet.sheetTabs?.acoTM || activeSpreadsheet.sheetName || 'ACO TM D 126';
          await clearShiftSlotInGoogleSheets(accessToken, activeSpreadsheet.id, tmSheet, 6, day, shift, 17);
          showToast(`Baris shift ${shift} (${reportToDelete.displayDate}) di Google Sheets berhasil dikosongkan.`, 'info');
        } catch (e) {
          console.error('Failed to clear sheet via API:', e);
        }
      }
    }
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

  const handleRefreshReportTimestamp = () => {
    const now = new Date();
    const curDate = formatIndonesianDate(now);
    const curTime = formatIndonesianTime(now);

    if (currentReport) {
      if (currentReport.wapres) {
        currentReport.wapres.inspectionDate = curDate;
        currentReport.wapres.inspectionTime = curTime;
        setWapresData({ ...currentReport.wapres });
      }
      if (currentReport.rumdin) {
        currentReport.rumdin.inspectionDate = curDate;
        currentReport.rumdin.inspectionTime = curTime;
        setRumdinData({ ...currentReport.rumdin });
      }
      currentReport.displayDate = curDate;
      currentReport.updatedAt = now.toISOString();
      saveReport(currentReport);
      setAllReports(getAllReports());
      showToast(`Waktu laporan WA disinkronkan ke jam sekarang: ${curTime}`);
    }
  };

  // Active shift validation (combines sheet data or local form/saved data)
  const activeCombinedForValidation: CombinedShiftReport = useMemo(() => {
    const base = currentReport || getOrCreateShiftReport(selectedDateKey, selectedShift);
    return {
      ...base,
      wapres: sheetStatus.wapres || base.wapres || (wapresData.officers[0] ? wapresData : null),
      rumdin: sheetStatus.rumdin || base.rumdin || (rumdinData.officers[0] ? rumdinData : null),
    };
  }, [currentReport, selectedDateKey, selectedShift, sheetStatus.wapres, sheetStatus.rumdin, wapresData, rumdinData]);

  const shiftValidation = useMemo(() => {
    return validateShiftReport(activeCombinedForValidation);
  }, [activeCombinedForValidation]);

  // Sesuai instruksi: Jika masih ada data di spreadsheet yang kosong, berarti BELUM SUBMIT.
  const isWapresSubmitted = useMemo(() => {
    if (sheetStatus.missingInfo) {
      return Boolean(sheetStatus.missingInfo.isWapresComplete);
    }
    if (sheetStatus.lastChecked) {
      return Boolean(sheetStatus.isWapresSubmitted);
    }
    return Boolean(shiftValidation.wapres.isComplete && currentReport?.wapres);
  }, [sheetStatus.missingInfo, sheetStatus.lastChecked, sheetStatus.isWapresSubmitted, shiftValidation.wapres.isComplete, currentReport?.wapres]);

  const isRumdinSubmitted = useMemo(() => {
    if (sheetStatus.missingInfo) {
      return Boolean(sheetStatus.missingInfo.isRumdinComplete);
    }
    if (sheetStatus.lastChecked) {
      return Boolean(sheetStatus.isRumdinSubmitted);
    }
    return Boolean(shiftValidation.rumdin.isComplete && currentReport?.rumdin);
  }, [sheetStatus.missingInfo, sheetStatus.lastChecked, sheetStatus.isRumdinSubmitted, shiftValidation.rumdin.isComplete, currentReport?.rumdin]);

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
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={Boolean(directWebhookUrl || (currentUser && activeSpreadsheet))}
        onOpenShiftSchedule={() => setIsShiftScheduleOpen(true)}
        onOpenSheetTable={() => setIsSheetTableOpen(true)}
      />

      {/* Workflow Navigation Bar */}
      <div id="workflow-nav-bar" className="bg-zinc-900/95 border-b border-zinc-800 shadow-xs relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
            {/* Step 1: Officer Selection */}
            <button
              type="button"
              id="nav-step-officers"
              onClick={() => setCurrentScreen('OFFICER_SELECT')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentScreen === 'OFFICER_SELECT'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'OFFICER_SELECT' ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
              }`}>1</span>
              <span className="hidden sm:inline">1. Pilih Petugas & Tim</span>
              <span className="sm:hidden">1. Petugas</span>
            </button>

            <span className="text-zinc-600 text-xs">→</span>

            {/* Step 2: Form */}
            <button
              type="button"
              id="nav-step-form"
              onClick={() => setCurrentScreen('FORM')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentScreen === 'FORM'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'FORM' ? 'bg-emerald-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
              }`}>2</span>
              <span className="hidden sm:inline">2. Form {selectedTeam === 'WAPRES' ? 'Tim Wapres' : 'Tim Rumdin'}</span>
              <span className="sm:hidden">2. Form {selectedTeam === 'WAPRES' ? 'Wapres' : 'Rumdin'}</span>
            </button>

            <span className="text-zinc-600 text-xs">→</span>

            {/* Step 3: Dashboard */}
            <button
              type="button"
              id="nav-step-dashboard"
              onClick={() => setCurrentScreen('DASHBOARD')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentScreen === 'DASHBOARD'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'DASHBOARD' ? 'bg-blue-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
              }`}>3</span>
              <span className="hidden sm:inline">3. Dashboard Shift</span>
              <span className="sm:hidden">3. Dashboard</span>
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
            {/* Live Auto-Sync with Google Sheets Pill */}
            <div
              title={autoSyncSheets ? 'Live Sync Google Sheets: Aktif otomatis setiap 20 detik' : 'Live Sync Google Sheets: Nonaktif'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                autoSyncSheets
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoSyncSheets ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="font-semibold">{autoSyncSheets ? 'Live Sync:' : 'Sync:'}</span>
              <span className="font-mono text-[10px] text-zinc-300">
                {sheetStatus.isChecking ? 'Sync...' : sheetStatus.lastChecked ? sheetStatus.lastChecked : 'Siap'}
              </span>
              <button
                type="button"
                onClick={() => checkSpreadsheetSubmission(false)}
                disabled={sheetStatus.isChecking}
                className="ml-0.5 p-0.5 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Klik untuk sinkronkan status sekarang"
              >
                <RefreshCw className={`w-3 h-3 ${sheetStatus.isChecking ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: Halaman Pertama - Pilih Petugas & Deteksi Shift & Pilih Tim */}
        {currentScreen === 'OFFICER_SELECT' && (
          <OfficerSelectionScreen
            currentOfficers={selectedOfficers}
            selectedTeam={selectedTeam}
            onSelectOfficers={(offs) => {
              setSelectedOfficers(offs);
              try {
                localStorage.setItem('monitoring_last_officers', JSON.stringify(offs));
              } catch {}
            }}
            onSelectTeam={(team) => setSelectedTeam(team)}
            onProceedToForm={handleProceedFromOfficerSelection}
            onGoToDashboard={() => setCurrentScreen('DASHBOARD')}
            isWapresSubmitted={isWapresSubmitted}
            isRumdinSubmitted={isRumdinSubmitted}
          />
        )}

        {/* VIEW 2: Dashboard Status Shift Aktif & Tombol Gabung Laporan */}
        {currentScreen === 'DASHBOARD' && (
          <ShiftDashboardScreen
            currentReport={currentReport}
            activeShift={selectedShift}
            wapresData={activeCombinedForValidation.wapres || wapresData}
            rumdinData={activeCombinedForValidation.rumdin || rumdinData}
            isWapresSubmitted={isWapresSubmitted}
            isRumdinSubmitted={isRumdinSubmitted}
            shiftValidation={shiftValidation}
            sheetMissingInfo={sheetStatus.missingInfo}
            onGoToOfficers={() => setCurrentScreen('OFFICER_SELECT')}
            onGoToForm={(team) => {
              setSelectedTeam(team);
              setCurrentScreen('FORM');
            }}
            onOpenReportPreview={() => setIsPreviewOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onRefreshSheetStatus={() => checkSpreadsheetSubmission(false)}
            isCheckingSheet={sheetStatus.isChecking}
            sheetStatusError={sheetStatus.error}
            sourceIndicator={
              sheetStatus.isWapresSubmitted || sheetStatus.isRumdinSubmitted
                ? 'Google Sheets'
                : undefined
            }
            lastCheckedTime={sheetStatus.lastChecked}
            autoSyncEnabled={autoSyncSheets}
            onToggleAutoSync={() => setAutoSyncSheets((prev) => !prev)}
            isWapresFromSheet={Boolean(sheetStatus.isWapresSubmitted)}
            isRumdinFromSheet={Boolean(sheetStatus.isRumdinSubmitted)}
          />
        )}

        {/* VIEW 3: Pengisian Formulir Tim Sesuai Pilihan */}
        {currentScreen === 'FORM' && (
          <>
            {/* Top Return Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('OFFICER_SELECT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span>← Ganti Petugas / Tim</span>
                </button>
                <div className="text-xs text-zinc-400">
                  Petugas:{' '}
                  <span className="font-bold text-zinc-200">
                    {selectedOfficers.filter(Boolean).join(', ') || 'Belum dipilih'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('DASHBOARD')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Lihat Dashboard Shift →</span>
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-400">Status Shift:</span>

                  {/* Wapres Status Badge */}
                  {(() => {
                    const hasWapresStarted = Boolean(
                      activeCombinedForValidation.wapres?.officers?.[0] ||
                      activeCombinedForValidation.wapres?.acoTM?.penyulangClose ||
                      activeCombinedForValidation.wapres?.ups30?.loadR ||
                      activeCombinedForValidation.wapres?.ups40?.loadR ||
                      activeCombinedForValidation.wapres?.ups60?.loadR
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('WAPRES')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          shiftValidation.wapres.isComplete
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : hasWapresStarted
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {shiftValidation.wapres.isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          Tim Wapres:{' '}
                          {shiftValidation.wapres.isComplete
                            ? `Sudah Selesai (${activeCombinedForValidation.wapres?.inspectionTime || 'Lengkap'})`
                            : hasWapresStarted
                            ? `Belum Selesai (${shiftValidation.wapres.detailedMissingText})`
                            : 'Belum Diisi'}
                        </span>
                      </button>
                    );
                  })()}

                  {/* Rumdin Status Badge */}
                  {(() => {
                    const hasRumdinStarted = Boolean(
                      activeCombinedForValidation.rumdin?.officers?.[0] ||
                      activeCombinedForValidation.rumdin?.acoTRDipo?.garduT135Status ||
                      activeCombinedForValidation.rumdin?.acoTRST12?.garduT93Status ||
                      activeCombinedForValidation.rumdin?.ups40Dipo?.loadR ||
                      activeCombinedForValidation.rumdin?.ups100ST12?.loadR
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('RUMDIN')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          shiftValidation.rumdin.isComplete
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
                            : hasRumdinStarted
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {shiftValidation.rumdin.isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          Tim Rumdin:{' '}
                          {shiftValidation.rumdin.isComplete
                            ? `Sudah Selesai (${activeCombinedForValidation.rumdin?.inspectionTime || 'Lengkap'})`
                            : hasRumdinStarted
                            ? `Belum Selesai (${shiftValidation.rumdin.detailedMissingText})`
                            : 'Belum Diisi'}
                        </span>
                      </button>
                    );
                  })()}

                  {/* Cek Database Sheets Button */}
                  <button
                    type="button"
                    onClick={() => checkSpreadsheetSubmission(false)}
                    disabled={sheetStatus.isChecking}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                    title="Periksa database Google Sheets apakah laporan shift ini sudah disubmit"
                  >
                    <RefreshCw className={`w-3 h-3 ${sheetStatus.isChecking ? 'animate-spin' : ''}`} />
                    <span>{sheetStatus.isChecking ? 'Mengecek Sheets...' : 'Cek Status Sheets'}</span>
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
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('DASHBOARD')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
                  >
                    <span>Ke Dashboard Shift</span>
                  </button>
                </div>
              </div>

              {/* Database Sheets verification banner if submitted in sheet */}
              {(sheetStatus.isWapresSubmitted || sheetStatus.isRumdinSubmitted) && (
                <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>Terdeteksi di Database Sheets:</strong>{' '}
                      {sheetStatus.isBothSubmitted
                        ? 'Laporan Tim Wapres & Tim Rumdin sudah tersimpan lengkap di Google Sheets.'
                        : sheetStatus.isWapresSubmitted
                        ? 'Laporan Tim Wapres sudah tersimpan di Google Sheets.'
                        : 'Laporan Tim Rumdin sudah tersimpan di Google Sheets.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sheetStatus.wapres) {
                          setWapresData(sheetStatus.wapres);
                          submitWapresToShift(selectedDateKey, selectedShift, sheetStatus.wapres);
                        }
                        if (sheetStatus.rumdin) {
                          setRumdinData(sheetStatus.rumdin);
                          submitRumdinToShift(selectedDateKey, selectedShift, sheetStatus.rumdin);
                        }
                        setAllReports(getAllReports());
                        showToast('Data dari Google Sheets berhasil dimuat ke formulir!');
                      }}
                      className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors cursor-pointer"
                    >
                      Muat Data Sheets ke Formulir
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                    >
                      Buka Format WA
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Team Form */}
            {selectedTeam === 'WAPRES' ? (
              <TimWapresForm
                data={wapresData}
                onChange={handleWapresChange}
                onSubmit={handleWapresSubmit}
                shiftName={selectedShift}
                isAlreadySubmitted={isWapresSubmitted}
                user={currentUser}
                activeSpreadsheet={activeSpreadsheet}
                hasSheetsConfigured={Boolean(directWebhookUrl || activeSpreadsheet)}
                autoSyncEnabled={autoSyncEnabled}
                onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
                onQuickSyncAcoToSheets={handleQuickSyncAco}
                onQuickSyncWapresUps={handleQuickSyncWapresUps}
                isSyncingSheets={isSyncingSheets}
                isShiftTimeAllowed={isShiftTimeAllowed}
                currentActiveShift={liveActiveShift}
                onSwitchToActiveShift={() => {
                  setSelectedDateKey(getDateKey());
                  setSelectedShift(liveActiveShift);
                }}
              />
            ) : (
              <TimRumdinForm
                data={rumdinData}
                onChange={handleRumdinChange}
                onSubmit={handleRumdinSubmit}
                shiftName={selectedShift}
                isAlreadySubmitted={isRumdinSubmitted}
                user={currentUser}
                activeSpreadsheet={activeSpreadsheet}
                hasSheetsConfigured={Boolean(directWebhookUrl || activeSpreadsheet)}
                autoSyncEnabled={autoSyncEnabled}
                onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
                onQuickSyncDipo={handleQuickSyncDipo}
                onQuickSyncST12={handleQuickSyncST12}
                onQuickSyncRumdinUps={handleQuickSyncRumdinUps}
                onQuickSyncAllRumdin={handleQuickSyncAllRumdin}
                isSyncingSheets={isSyncingSheets}
                isShiftTimeAllowed={isShiftTimeAllowed}
                currentActiveShift={liveActiveShift}
                onSwitchToActiveShift={() => {
                  setSelectedDateKey(getDateKey());
                  setSelectedShift(liveActiveShift);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Floating WhatsApp Action button on mobile when both ready */}
      {isBothSubmitted && (
        <div className="fixed bottom-20 right-4 z-20 sm:hidden">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950 flex items-center justify-center animate-bounce cursor-pointer"
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
        onRefreshTimestamp={handleRefreshReportTimestamp}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        activeSpreadsheet={activeSpreadsheet}
        directWebhookUrl={directWebhookUrl}
        directSheetLink={directSheetLink}
        accessToken={accessToken}
        onLoadFromSheet={(w, r) => {
          if (w) {
            submitWapresToShift(selectedDateKey, selectedShift, w);
            setWapresData(w);
          }
          if (r) {
            submitRumdinToShift(selectedDateKey, selectedShift, r);
            setRumdinData(r);
          }
          setAllReports(getAllReports());
          setSheetStatus((prev) => ({
            ...prev,
            isWapresSubmitted: Boolean(w || prev.isWapresSubmitted),
            isRumdinSubmitted: Boolean(r || prev.isRumdinSubmitted),
            isBothSubmitted: Boolean((w || prev.isWapresSubmitted) && (r || prev.isRumdinSubmitted)),
            wapres: w || prev.wapres,
            rumdin: r || prev.rumdin,
          }));
        }}
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
        sheetLink={directSheetLink}
        spreadsheetId={activeSpreadsheet?.id || null}
        onMergeSheetReports={(sheetReports) => {
          sheetReports.forEach((sr) => {
            saveReport(sr);
          });
          setAllReports(getAllReports());
          showToast(`✅ ${sheetReports.length} laporan shift dari Google Sheets disinkronkan ke riwayat!`);
        }}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        directWebhookUrl={directWebhookUrl}
        onUpdateWebhookUrl={handleUpdateWebhookUrl}
        directSheetLink={directSheetLink}
        onUpdateSheetLink={handleUpdateSheetLink}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
        onManualSyncCurrent={handleQuickSyncAco}
        onManualSyncDipo={handleQuickSyncDipo}
        onManualSyncST12={handleQuickSyncST12}
        onManualSyncRumdinUps={handleQuickSyncRumdinUps}
        onManualSyncWapresUps={handleQuickSyncWapresUps}
        onManualSyncAll={handleQuickSyncAll}
      />

      {/* Shift Schedule & Handover Settings Modal */}
      <ShiftScheduleModal
        isOpen={isShiftScheduleOpen}
        onClose={() => setIsShiftScheduleOpen(false)}
        currentShift={selectedShift}
        onTriggerTestToast={() => {
          showToast('🔔 Peringatan pergantian shift aktif! Periksa notifikasi visual di sudut layar.', 'info');
        }}
      />

      {/* Format Official Google Sheets Table Modal */}
      <SpreadsheetViewModal
        isOpen={isSheetTableOpen}
        onClose={() => setIsSheetTableOpen(false)}
        allReports={allReports}
        currentWapresData={activeCombinedForValidation.wapres || wapresData}
        currentRumdinData={activeCombinedForValidation.rumdin || rumdinData}
        currentDateKey={selectedDateKey}
        currentShift={selectedShift}
        directSheetLink={directSheetLink}
        activeSpreadsheetUrl={activeSpreadsheet?.url || null}
      />
    </div>
  );
}
