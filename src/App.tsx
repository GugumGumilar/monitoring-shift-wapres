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
  saveReport,
} from './utils/storage';
import { Header } from './components/Header';
import { TimWapresForm } from './components/TimWapresForm';
import { TimRumdinForm } from './components/TimRumdinForm';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ShiftHandoverNotification } from './components/ShiftHandoverNotification';
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
} from 'lucide-react';

export default function App() {
  // Current real-time shift
  const [selectedShift, setSelectedShift] = useState<ShiftType>(() => getCurrentShift());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => getDateKey());
  const [selectedTeam, setSelectedTeam] = useState<'WAPRES' | 'RUMDIN'>('WAPRES');

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

    // If Rumdin hasn't submitted yet, prompt to fill Rumdin or view report
    if (!updatedReport.rumdin) {
      setSelectedTeam('RUMDIN');
    } else {
      setIsPreviewOpen(true);
    }
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
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={Boolean(directWebhookUrl || (currentUser && activeSpreadsheet))}
        onOpenShiftSchedule={() => setIsShiftScheduleOpen(true)}
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950 cursor-pointer"
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
            user={currentUser}
            activeSpreadsheet={activeSpreadsheet}
            autoSyncEnabled={autoSyncEnabled}
            onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
            onQuickSyncAcoToSheets={handleQuickSyncAco}
            onQuickSyncWapresUps={handleQuickSyncWapresUps}
            isSyncingSheets={isSyncingSheets}
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
            autoSyncEnabled={autoSyncEnabled}
            onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
            onQuickSyncDipo={handleQuickSyncDipo}
            onQuickSyncST12={handleQuickSyncST12}
            onQuickSyncRumdinUps={handleQuickSyncRumdinUps}
            onQuickSyncAllRumdin={handleQuickSyncAllRumdin}
            isSyncingSheets={isSyncingSheets}
          />
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

      {/* Shift Handover Toast Notification */}
      <ShiftHandoverNotification
        currentShift={selectedShift}
        isWapresSubmitted={isWapresSubmitted}
        isRumdinSubmitted={isRumdinSubmitted}
        onOpenReport={() => setIsPreviewOpen(true)}
        onSyncSheets={handleQuickSyncAll}
        isSheetsConnected={Boolean(directWebhookUrl || (accessToken && activeSpreadsheet))}
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
    </div>
  );
}
