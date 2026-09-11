import { TimWapresReport, TimRumdinReport, UPSData, ShiftType } from '../types';
import { formatToDDMMYYYY, extractDayOfMonth, getShiftOffset } from './googleSheets';

export const STORAGE_KEY_WEBHOOK = 'monitoring_shift_webhook_url';
export const STORAGE_KEY_SHEET_LINK = 'monitoring_shift_sheet_link';

export function getStoredWebhookUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_WEBHOOK);
  } catch {
    return null;
  }
}

export function saveStoredWebhookUrl(url: string | null): void {
  try {
    if (!url) {
      localStorage.removeItem(STORAGE_KEY_WEBHOOK);
    } else {
      localStorage.setItem(STORAGE_KEY_WEBHOOK, url.trim());
    }
  } catch (err) {
    console.warn('Failed to save webhook URL to localStorage:', err);
  }
}

export function getStoredSheetLink(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_SHEET_LINK);
  } catch {
    return null;
  }
}

export function saveStoredSheetLink(url: string | null): void {
  try {
    if (!url) {
      localStorage.removeItem(STORAGE_KEY_SHEET_LINK);
    } else {
      localStorage.setItem(STORAGE_KEY_SHEET_LINK, url.trim());
    }
  } catch (err) {
    console.warn('Failed to save sheet link to localStorage:', err);
  }
}

function formatAmpere(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.toUpperCase().endsWith('A')) return trimmed;
  return `${trimmed} A`;
}

function formatVolt(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.toUpperCase().endsWith('V')) return trimmed;
  return `${trimmed} V`;
}

function formatTemp(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.includes('°C') || trimmed.toUpperCase().endsWith('C')) return trimmed;
  return `${trimmed} °C`;
}

function formatHours(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.toLowerCase().endsWith('jam')) return trimmed;
  return `${trimmed} Jam`;
}

function formatMinutes(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.toLowerCase().endsWith('menit')) return trimmed;
  return `${trimmed} Menit`;
}

export function buildUpsRowData(
  officersStr: string,
  dateFormatted: string,
  timeFormatted: string,
  ups: UPSData,
  keteranganSuffix?: string
): string[] {
  const ket = [ups.keterangan, keteranganSuffix].filter(Boolean).join(' - ') || '-';
  return [
    '', // NO will be calculated by script
    officersStr,
    dateFormatted,
    timeFormatted,
    formatAmpere(ups.loadR),
    formatAmpere(ups.loadS),
    formatAmpere(ups.loadT),
    formatVolt(ups.voltRN),
    formatVolt(ups.voltSN),
    formatVolt(ups.voltTN),
    formatVolt(ups.voltRS),
    formatVolt(ups.voltRT),
    formatVolt(ups.voltST),
    formatTemp(ups.temperature),
    (ups.alarm || 'NORMAL').toUpperCase(),
    formatHours(ups.backupHours),
    formatMinutes(ups.backupMinutes),
    ket,
  ];
}

export function buildAcoTmRowData(wapresReport: TimWapresReport) {
  const officers = wapresReport.officers.filter(Boolean);
  const officersStr = officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';
  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  const timeFormatted = wapresReport.inspectionTime || 'WIB';
  const aco = wapresReport.acoTM;

  return [
    '', // NO auto
    officersStr,
    dateFormatted,
    timeFormatted,
    aco.penyulangClose || '-',
    aco.penyulangOpen || '-',
    aco.alarmStatus === 'ALARM' ? 'ALARM' : '-',
    aco.alarmStatus === 'NORMAL' ? 'NORMAL' : '-',
    aco.powerACO === 'ON' ? 'ON' : '-',
    aco.powerACO === 'OFF' ? 'OFF' : '-',
    aco.chargingKubikel === 'YA' ? 'YA' : '-',
    aco.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-',
    aco.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-',
    aco.remoteKubikel === 'AUTO' ? 'AUTO' : '-',
    aco.lampuIndikator === 'ON' ? 'ON' : '-',
    aco.lampuIndikator === 'OFF' ? 'OFF' : '-',
    aco.keterangan || '-',
  ];
}

export function buildAcoDipoRowData(rumdinReport: TimRumdinReport) {
  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr = officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';
  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';
  const dipo = rumdinReport.acoTRDipo;

  return [
    '', // NO auto
    officersStr,
    dateFormatted,
    timeFormatted,
    dipo.garduT15NStatus || 'CLOSE',
    dipo.garduT135Status || 'OPEN',
    dipo.alarmStatus === 'ALARM' ? 'ALARM' : '-',
    dipo.alarmStatus === 'NORMAL' ? 'NORMAL' : '-',
    dipo.powerACO === 'ON' ? 'ON' : '-',
    dipo.powerACO === 'OFF' ? 'OFF' : '-',
    '-',
    '-',
    '-',
    '-',
    dipo.lampuIndikator === 'ON' ? 'ON' : '-',
    dipo.lampuIndikator === 'OFF' ? 'OFF' : '-',
    dipo.keterangan || '-',
  ];
}

export function buildAcoST12RowData(rumdinReport: TimRumdinReport) {
  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr = officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';
  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';
  const st12 = rumdinReport.acoTRST12;

  const isT93Close = st12.garduT93Status === 'CLOSE' || (!st12.garduT93Status && st12.garduT10BStatus !== 'CLOSE');
  const penyulangClose = isT93Close ? 'GARDU T93' : 'GARDU T10B';
  const penyulangOpen = isT93Close ? 'GARDU T10B' : 'GARDU T93';

  return [
    '', // NO auto
    officersStr,
    dateFormatted,
    timeFormatted,
    st12.penyulangClose || penyulangClose,
    st12.penyulangOpen || penyulangOpen,
    st12.alarmStatus === 'ALARM' ? 'ALARM' : '-',
    st12.alarmStatus === 'NORMAL' ? 'NORMAL' : '-',
    st12.powerACO === 'ON' ? 'ON' : '-',
    st12.powerACO === 'OFF' ? 'OFF' : '-',
    '-',
    '-',
    '-',
    '-',
    st12.lampuIndikator === 'ON' ? 'ON' : '-',
    st12.lampuIndikator === 'OFF' ? 'OFF' : '-',
    st12.keterangan || '-',
  ];
}

export function buildUpsWapresRowsData(wapresReport: TimWapresReport): string[][] {
  const officers = wapresReport.officers.filter(Boolean);
  const officersStr = officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';
  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  let timeFormatted = wapresReport.inspectionTime || 'WIB';
  if (!timeFormatted.toUpperCase().includes('WIB')) {
    timeFormatted = `${timeFormatted} WIB`;
  }

  return [
    buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapresReport.ups30, 'UPS 30 KVA LT 1'),
    buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapresReport.ups40, 'UPS 40 KVA LT 2'),
    buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapresReport.ups60, 'UPS 60 KVA LT 3'),
  ];
}

export function buildUpsRumdinRowsData(rumdinReport: TimRumdinReport): string[][] {
  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr = officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';
  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  let timeFormatted = rumdinReport.inspectionTime || 'WIB';
  if (!timeFormatted.toUpperCase().includes('WIB')) {
    timeFormatted = `${timeFormatted} WIB`;
  }

  return [
    buildUpsRowData(officersStr, dateFormatted, timeFormatted, rumdinReport.ups40Dipo, 'UPS 40 KVA DIPO'),
    buildUpsRowData(officersStr, dateFormatted, timeFormatted, rumdinReport.ups100ST12, 'UPS 100 KVA ST 12'),
  ];
}

/**
 * Dispatch payload to Google Apps Script Webhook
 * Handles CORS and returns status
 */
export async function sendToWebhook(
  webhookUrl: string,
  payload: any
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('URL Webhook Google Sheets tidak valid. Silakan periksa di menu Google Sheets.');
  }

  try {
    // We send via standard fetch. Google Apps Script returns a redirect (302)
    // To support standard browser cross-origin without CORS failure, we send text/plain or no-cors
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const resJson = await response.json();
        return { success: true, message: resJson.message || 'Data berhasil dikirim ke Google Sheets!' };
      } catch {
        return { success: true, message: 'Data berhasil dikirim ke Google Sheets!' };
      }
    } else {
      // Fallback with no-cors if server doesn't send CORS headers
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return { success: true, message: 'Data berhasil disinkronkan ke Google Sheets!' };
    }
  } catch (err: any) {
    // If standard fetch fails due to CORS, retry with mode: 'no-cors'
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return { success: true, message: 'Data berhasil disinkronkan ke Google Sheets!' };
    } catch (noCorsErr: any) {
      console.error('Webhook error:', err, noCorsErr);
      throw new Error(`Gagal mengirim ke Webhook: ${err.message || 'Periksa koneksi internet atau URL webhook'}`);
    }
  }
}

export async function testWebhookConnection(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  return sendToWebhook(webhookUrl, { action: 'PING', timestamp: new Date().toISOString() });
}

export async function syncAcoTmViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(wapres.inspectionDate);
  const row = buildAcoTmRowData(wapres);
  return sendToWebhook(webhookUrl, {
    action: 'ACO_TM',
    sheetName: 'ACO TM D 126',
    row,
    inspectionDate: formatToDDMMYYYY(wapres.inspectionDate),
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncAcoDipoViaWebhook(
  webhookUrl: string,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (rumdin as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(rumdin.inspectionDate);
  const row = buildAcoDipoRowData(rumdin);
  return sendToWebhook(webhookUrl, {
    action: 'ACO_DIPO',
    sheetName: 'ACO TR DIPO',
    row,
    inspectionDate: formatToDDMMYYYY(rumdin.inspectionDate),
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncAcoST12ViaWebhook(
  webhookUrl: string,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (rumdin as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(rumdin.inspectionDate);
  const row = buildAcoST12RowData(rumdin);
  return sendToWebhook(webhookUrl, {
    action: 'ACO_ST12',
    sheetName: 'ACO TR ST 12',
    row,
    inspectionDate: formatToDDMMYYYY(rumdin.inspectionDate),
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncUpsWapresViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(wapres.inspectionDate);
  const rows = buildUpsWapresRowsData(wapres);
  return sendToWebhook(webhookUrl, {
    action: 'UPS_WAPRES',
    sheetName: 'UPS 30 KVA WAPRES',
    rows,
    inspectionDate: formatToDDMMYYYY(wapres.inspectionDate),
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncUpsRumdinViaWebhook(
  webhookUrl: string,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (rumdin as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(rumdin.inspectionDate);
  const rows = buildUpsRumdinRowsData(rumdin);
  return sendToWebhook(webhookUrl, {
    action: 'UPS_RUMDIN',
    sheetName: 'UPS 40 KVA DIPO',
    rows,
    inspectionDate: formatToDDMMYYYY(rumdin.inspectionDate),
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncSingleUps30ViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(wapres.inspectionDate);
  const dateFormatted = formatToDDMMYYYY(wapres.inspectionDate || new Date());
  const timeFormatted = wapres.inspectionTime ? (wapres.inspectionTime.includes('WIB') ? wapres.inspectionTime : `${wapres.inspectionTime} WIB`) : 'WIB';
  const officersStr = wapres.officers.filter(Boolean).map((o) => o.toUpperCase()).join(' , ') || '-';
  const row = buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapres.ups30, 'UPS 30 KVA LT 1');
  return sendToWebhook(webhookUrl, {
    action: 'UPS_30',
    sheetName: 'UPS 30 KVA WAPRES',
    row,
    inspectionDate: dateFormatted,
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncSingleUps40WapresViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(wapres.inspectionDate);
  const dateFormatted = formatToDDMMYYYY(wapres.inspectionDate || new Date());
  const timeFormatted = wapres.inspectionTime ? (wapres.inspectionTime.includes('WIB') ? wapres.inspectionTime : `${wapres.inspectionTime} WIB`) : 'WIB';
  const officersStr = wapres.officers.filter(Boolean).map((o) => o.toUpperCase()).join(' , ') || '-';
  const row = buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapres.ups40, 'UPS 40 KVA LT 2');
  return sendToWebhook(webhookUrl, {
    action: 'UPS_40_WAPRES',
    sheetName: 'UPS 40 KVA WAPRES',
    row,
    inspectionDate: dateFormatted,
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncSingleUps60WapresViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(wapres.inspectionDate);
  const dateFormatted = formatToDDMMYYYY(wapres.inspectionDate || new Date());
  const timeFormatted = wapres.inspectionTime ? (wapres.inspectionTime.includes('WIB') ? wapres.inspectionTime : `${wapres.inspectionTime} WIB`) : 'WIB';
  const officersStr = wapres.officers.filter(Boolean).map((o) => o.toUpperCase()).join(' , ') || '-';
  const row = buildUpsRowData(officersStr, dateFormatted, timeFormatted, wapres.ups60, 'UPS 60 KVA LT 3');
  return sendToWebhook(webhookUrl, {
    action: 'UPS_60_WAPRES',
    sheetName: 'UPS 60 KVA WAPRES',
    row,
    inspectionDate: dateFormatted,
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncSingleUps40DipoViaWebhook(
  webhookUrl: string,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (rumdin as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(rumdin.inspectionDate);
  const dateFormatted = formatToDDMMYYYY(rumdin.inspectionDate || new Date());
  const timeFormatted = rumdin.inspectionTime ? (rumdin.inspectionTime.includes('WIB') ? rumdin.inspectionTime : `${rumdin.inspectionTime} WIB`) : 'WIB';
  const officersStr = rumdin.officers.filter(Boolean).map((o) => o.toUpperCase()).join(' , ') || '-';
  const row = buildUpsRowData(officersStr, dateFormatted, timeFormatted, rumdin.ups40Dipo, 'UPS 40 KVA DIPO');
  return sendToWebhook(webhookUrl, {
    action: 'UPS_40_DIPO',
    sheetName: 'UPS 40 KVA DIPO',
    row,
    inspectionDate: dateFormatted,
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncSingleUps100ST12ViaWebhook(
  webhookUrl: string,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (rumdin as any)?.shift || 'PAGI';
  const dayOfMonth = extractDayOfMonth(rumdin.inspectionDate);
  const dateFormatted = formatToDDMMYYYY(rumdin.inspectionDate || new Date());
  const timeFormatted = rumdin.inspectionTime ? (rumdin.inspectionTime.includes('WIB') ? rumdin.inspectionTime : `${rumdin.inspectionTime} WIB`) : 'WIB';
  const officersStr = rumdin.officers.filter(Boolean).map((o) => o.toUpperCase()).join(' , ') || '-';
  const row = buildUpsRowData(officersStr, dateFormatted, timeFormatted, rumdin.ups100ST12, 'UPS 100 KVA ST 12');
  return sendToWebhook(webhookUrl, {
    action: 'UPS_100_ST12',
    sheetName: 'UPS 100 KVA ST 12',
    row,
    inspectionDate: dateFormatted,
    shift: activeShift,
    dayOfMonth,
  });
}

export async function syncAllViaWebhook(
  webhookUrl: string,
  wapres: TimWapresReport,
  rumdin: TimRumdinReport,
  shift?: ShiftType | string
) {
  const activeShift = shift || (wapres as any)?.shift || (rumdin as any)?.shift || 'PAGI';
  const dateVal = wapres.inspectionDate || rumdin.inspectionDate;
  const dayOfMonth = extractDayOfMonth(dateVal);
  const acoTmRow = buildAcoTmRowData(wapres);
  const acoDipoRow = buildAcoDipoRowData(rumdin);
  const acoST12Row = buildAcoST12RowData(rumdin);
  const upsWapresRows = buildUpsWapresRowsData(wapres);
  const upsRumdinRows = buildUpsRumdinRowsData(rumdin);

  return sendToWebhook(webhookUrl, {
    action: 'SYNC_ALL',
    inspectionDate: formatToDDMMYYYY(dateVal),
    shift: activeShift,
    dayOfMonth,
    acoTmRow,
    acoDipoRow,
    acoST12Row,
    upsRows: [...upsWapresRows, ...upsRumdinRows],
  });
}

export async function clearShiftViaWebhook(
  webhookUrl: string,
  inspectionDate: string,
  shift: ShiftType | string,
  target: 'ACO_TM' | 'ACO_DIPO' | 'ACO_ST12' | 'UPS' | 'ALL' = 'ALL'
): Promise<{ success: boolean; message: string }> {
  const dayOfMonth = extractDayOfMonth(inspectionDate);
  return sendToWebhook(webhookUrl, {
    action: 'CLEAR_SHIFT',
    inspectionDate: formatToDDMMYYYY(inspectionDate),
    shift,
    dayOfMonth,
    target,
  });
}

export async function tidySheetsViaWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  return sendToWebhook(webhookUrl, {
    action: 'TIDY_SHEETS',
  });
}

/**
 * Complete Google Apps Script template ready to be pasted into Extensions > Apps Script
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ========================================================================
 * SKRIP RESMI WEBHOOK: MONITORING SHIFT KELISTRIKAN PLN WAPRES & RUMDIN
 * ========================================================================
 * Skrip ini menerima laporan langsung dari aplikasi & otomatis merapikan
 * tabel dengan standar format resmi PLN (Warna Amber & Cyan, Header 2-3 Tingkat,
 * Border Rapi, Lebar Kolom Presisi, Alignment Tengah, dan Header Beku).
 *
 * LEMBAR KERJA RESMI:
 * 1. ACO TM D 126 (Istana Wapres)
 * 2. ACO TR DIPO (Rumdin Dipo)
 * 3. ACO TR ST 12 (Rumdin Situbondo 12)
 * 4. LAPORAN_CETAK_UPS (Beban UPS Wapres & Rumdin)
 *
 * CARA PASANG (HANYA 1 KALI):
 * 1. Buka Google Sheet Anda (misal di akun plnwapres@gmail.com).
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus semua kode bawaan, lalu TEMPEL seluruh kode ini.
 * 4. Klik ikon Simpan (Disk / Ctrl+S).
 * 5. Klik tombol biru 'Terapkan' (Deploy) di kanan atas -> 'Penerapan Baru' (New Deployment).
 * 6. Klik ikon gerigi (Select type) -> pilih 'Aplikasi Web' (Web App).
 * 7. Konfigurasi:
 *    - Deskripsi: Webhook Monitoring Shift PLN
 *    - Jalankan sebagai (Execute as): 'Saya' (Me)
 *    - Siapa yang memiliki akses (Who has access): 'Siapa saja' (Anyone)  <-- WAJIB!
 * 8. Klik 'Terapkan' (Deploy) -> 'Beri Akses' (Authorize Access).
 * 9. Salin URL Aplikasi Web (/exec) dan tempelkan ke kolom Webhook di aplikasi.
 * 10. SELESAI! Seluruh petugas shift bisa mengirim laporan langsung tanpa login.
 */

// Membuat menu khusus di bilah atas Google Sheets saat dokumen dibuka
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ PLN Shift")
    .addItem("✨ Rapikan Semua Tampilan Sheet (1-Klik)", "rapikanSemuaSheet")
    .addToUi();
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === "PING") {
      return responseSuccess("Koneksi Webhook Google Sheets Berhasil dan Aktif!");
    }

    // Tombol 'Rapikan Sheet' dari aplikasi
    if (data.action === "TIDY_SHEETS" || data.action === "FORMAT_ALL") {
      rapikanSemuaSheet(ss);
      return responseSuccess("Seluruh lembar Google Sheets (ACO TM, DIPO, ST12, UPS) berhasil dirapikan dengan standar resmi PLN!");
    }

    if (data.action === "ACO_TM" && data.row) {
      upsertAcoRow(ss, "ACO TM D 126", data.row, data.inspectionDate, "ACO_TM", data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TM D 126 (Tgl " + data.inspectionDate + ", Shift " + (data.shift || "Pagi") + ") berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "ACO_DIPO" && data.row) {
      upsertAcoRow(ss, "ACO TR DIPO", data.row, data.inspectionDate, "ACO_DIPO", data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TR DIPO (Tgl " + data.inspectionDate + ", Shift " + (data.shift || "Pagi") + ") berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "ACO_ST12" && data.row) {
      upsertAcoRow(ss, "ACO TR ST 12", data.row, data.inspectionDate, "ACO_ST12", data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TR ST 12 (Tgl " + data.inspectionDate + ", Shift " + (data.shift || "Pagi") + ") berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_WAPRES" && data.rows) {
      if (data.rows[0]) upsertUpsRows(ss, "UPS 30 KVA WAPRES", [data.rows[0]], data.inspectionDate, data.shift, data.dayOfMonth);
      if (data.rows[1]) upsertUpsRows(ss, "UPS 40 KVA WAPRES", [data.rows[1]], data.inspectionDate, data.shift, data.dayOfMonth);
      if (data.rows[2]) upsertUpsRows(ss, "UPS 60 KVA WAPRES", [data.rows[2]], data.inspectionDate, data.shift, data.dayOfMonth);
      if (ss.getSheetByName("LAPORAN_CETAK_UPS")) {
        upsertUpsRows(ss, "LAPORAN_CETAK_UPS", data.rows, data.inspectionDate, data.shift, data.dayOfMonth);
      }
      return responseSuccess("Data UPS Wapres (30, 40, 60 KVA) (Tgl " + data.inspectionDate + ", Shift " + (data.shift || "Pagi") + ") berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_RUMDIN" && data.rows) {
      if (data.rows[0]) upsertUpsRows(ss, "UPS 40 KVA DIPO", [data.rows[0]], data.inspectionDate, data.shift, data.dayOfMonth);
      if (data.rows[1]) upsertUpsRows(ss, "UPS 100 KVA ST 12", [data.rows[1]], data.inspectionDate, data.shift, data.dayOfMonth);
      if (ss.getSheetByName("LAPORAN_CETAK_UPS")) {
        upsertUpsRows(ss, "LAPORAN_CETAK_UPS", data.rows, data.inspectionDate, data.shift, data.dayOfMonth);
      }
      return responseSuccess("Data UPS Rumdin (40 & 100 KVA) (Tgl " + data.inspectionDate + ", Shift " + (data.shift || "Pagi") + ") berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_30" && data.row) {
      upsertUpsRows(ss, "UPS 30 KVA WAPRES", [data.row], data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 30 KVA Wapres berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_40_WAPRES" && data.row) {
      upsertUpsRows(ss, "UPS 40 KVA WAPRES", [data.row], data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 40 KVA Wapres berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_60_WAPRES" && data.row) {
      upsertUpsRows(ss, "UPS 60 KVA WAPRES", [data.row], data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 60 KVA Wapres berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_40_DIPO" && data.row) {
      upsertUpsRows(ss, "UPS 40 KVA DIPO", [data.row], data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 40 KVA Dipo berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "UPS_100_ST12" && data.row) {
      upsertUpsRows(ss, "UPS 100 KVA ST 12", [data.row], data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 100 KVA ST 12 berhasil diperbarui di baris yang sesuai!");
    }

    if (data.action === "CLEAR_SHIFT") {
      clearShiftRow(ss, data.target || "ALL", data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data shift Tanggal " + data.inspectionDate + " (" + (data.shift || "Pagi") + ") berhasil dikosongkan dari Google Sheets tanpa merusak tabel!");
    }

    if (data.action === "SYNC_ALL") {
      if (data.acoTmRow) upsertAcoRow(ss, "ACO TM D 126", data.acoTmRow, data.inspectionDate, "ACO_TM", data.shift, data.dayOfMonth);
      if (data.acoDipoRow) upsertAcoRow(ss, "ACO TR DIPO", data.acoDipoRow, data.inspectionDate, "ACO_DIPO", data.shift, data.dayOfMonth);
      if (data.acoST12Row) upsertAcoRow(ss, "ACO TR ST 12", data.acoST12Row, data.inspectionDate, "ACO_ST12", data.shift, data.dayOfMonth);
      if (data.upsRows && data.upsRows.length > 0) {
        if (data.upsRows[0]) upsertUpsRows(ss, "UPS 30 KVA WAPRES", [data.upsRows[0]], data.inspectionDate, data.shift, data.dayOfMonth);
        if (data.upsRows[1]) upsertUpsRows(ss, "UPS 40 KVA WAPRES", [data.upsRows[1]], data.inspectionDate, data.shift, data.dayOfMonth);
        if (data.upsRows[2]) upsertUpsRows(ss, "UPS 60 KVA WAPRES", [data.upsRows[2]], data.inspectionDate, data.shift, data.dayOfMonth);
        if (data.upsRows[3]) upsertUpsRows(ss, "UPS 40 KVA DIPO", [data.upsRows[3]], data.inspectionDate, data.shift, data.dayOfMonth);
        if (data.upsRows[4]) upsertUpsRows(ss, "UPS 100 KVA ST 12", [data.upsRows[4]], data.inspectionDate, data.shift, data.dayOfMonth);
        if (ss.getSheetByName("LAPORAN_CETAK_UPS")) {
          upsertUpsRows(ss, "LAPORAN_CETAK_UPS", data.upsRows, data.inspectionDate, data.shift, data.dayOfMonth);
        }
      }
      return responseSuccess("Semua data monitoring shift berhasil disimpan & diperbarui di baris tanggal & shift yang sesuai!");
    }

    return responseSuccess("Data diterima");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return responseSuccess("Webhook Monitoring Shift PLN Aktif dan Siap Digunakan!");
}

function responseSuccess(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================================================
// FUNGSI UTAMA MERAPIKAN SEMUA SHEET (STANDAR RESMI PLN)
// ========================================================================
function rapikanSemuaSheet(spreadsheet) {
  var ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();

  setupAcoSheetLayout(ss, "ACO TM D 126", "ACO_TM");
  setupAcoSheetLayout(ss, "ACO TR DIPO", "ACO_DIPO");
  setupAcoSheetLayout(ss, "ACO TR ST 12", "ACO_ST12");
  setupUpsSheetLayout(ss, "UPS 30 KVA WAPRES");
  setupUpsSheetLayout(ss, "UPS 40 KVA WAPRES");
  setupUpsSheetLayout(ss, "UPS 60 KVA WAPRES");
  setupUpsSheetLayout(ss, "UPS 40 KVA DIPO");
  setupUpsSheetLayout(ss, "UPS 100 KVA ST 12");

  if (ss.getSheetByName("LAPORAN_CETAK_UPS")) {
    setupUpsSheetLayout(ss, "LAPORAN_CETAK_UPS");
  }

  try {
    ss.toast("Tampilan semua lembar Google Sheets (ACO TM, DIPO, ST12, UPS 30, 40, 60, 100) berhasil ditata rapi!", "✨ Berhasil", 4);
  } catch (e) {}
}

// ========================================================================
// FORMAT DAN TATA LETAK TABEL ACO (TM / DIPO / ST12)
// ========================================================================
function setupAcoSheetLayout(ss, sheetName, type) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // 1. Bersihkan penggabungan header lama agar tidak tumpang tindih
  try {
    sheet.getRange("A1:Q5").breakApart();
  } catch (e) {}

  // 2. Judul Utama (Baris 2)
  var titleText = "PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )";
  var powerTitle = "STATUS POWER ACO TM D 126";
  var subPenyulang1 = "CLOSE";
  var subPenyulang2 = "OPEN";

  if (type === "ACO_DIPO") {
    titleText = "PANTAUAN INSPEKSI ACO TR RUMAH DINAS (DIPO)";
    powerTitle = "STATUS POWER ACO TR DIPO";
    subPenyulang1 = "GARDU T15N";
    subPenyulang2 = "GARDU T135";
  } else if (type === "ACO_ST12") {
    titleText = "PANTAUAN INSPEKSI ACO TR RUMAH DINAS (SITUBONDO 12)";
    powerTitle = "STATUS POWER ACO TR ST 12";
    subPenyulang1 = "CLOSE";
    subPenyulang2 = "OPEN";
  }

  sheet.getRange("A2:Q2").merge();
  sheet.getRange("A2").setValue(titleText)
    .setFontFamily("Arial")
    .setFontSize(13)
    .setFontWeight("bold")
    .setUnderline(true)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(2, 36);

  // 3. Sub-Judul Bulan (Baris 3)
  var currentMonth = Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");
  sheet.getRange("B3").setValue("Bulan : " + currentMonth)
    .setFontFamily("Arial")
    .setFontSize(11)
    .setFontWeight("bold");
  sheet.setRowHeight(3, 24);

  // 4. Header Baris 4 & 5 (Dua Tingkat)
  var headerRow4 = [
    "NO", "NAMA PETUGAS", "TANGGAL/\\nBULAN/\\nTAHUN", "JAM\\nINSPEKSI",
    "STATUS PENYULANG", "", "ALARM STATUS", "",
    powerTitle, "",
    "STATUS CHARGING KUBIKEL", "", "STATUS REMOTE KUBIKEL", "",
    "LAMPU INDIKATOR", "", "KETERANGAN"
  ];

  var headerRow5 = [
    "", "", "", "",
    subPenyulang1, subPenyulang2,
    "ALARM", "NORMAL",
    "ON", "OFF",
    "YA", "TIDAK",
    "LOCAL", "AUTO",
    "ON", "OFF",
    ""
  ];

  sheet.getRange("A4:Q4").setValues([headerRow4]);
  sheet.getRange("A5:Q5").setValues([headerRow5]);

  // Gabungkan sel bertingkat
  sheet.getRange("A4:A5").merge(); // NO
  sheet.getRange("B4:B5").merge(); // NAMA PETUGAS
  sheet.getRange("C4:C5").merge(); // TANGGAL
  sheet.getRange("D4:D5").merge(); // JAM
  sheet.getRange("E4:F4").merge(); // STATUS PENYULANG
  sheet.getRange("G4:H4").merge(); // ALARM STATUS
  sheet.getRange("I4:J4").merge(); // STATUS POWER
  sheet.getRange("K4:L4").merge(); // CHARGING
  sheet.getRange("M4:N4").merge(); // REMOTE
  sheet.getRange("O4:P4").merge(); // LAMPU
  sheet.getRange("Q4:Q5").merge(); // KETERANGAN

  // Format Header (Amber Gold PLN #FFC000)
  var headerRange = sheet.getRange("A4:Q5");
  headerRange
    .setBackground("#FFC000")
    .setFontColor("#000000")
    .setFontFamily("Arial")
    .setFontSize(10)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(4, 28);
  sheet.setRowHeight(5, 26);

  // 5. Atur Lebar Kolom Presisi (Tidak Ada Teks Terpotong)
  sheet.setColumnWidth(1, 45);   // A: NO
  sheet.setColumnWidth(2, 180);  // B: NAMA PETUGAS
  sheet.setColumnWidth(3, 130);  // C: TANGGAL
  sheet.setColumnWidth(4, 95);   // D: JAM
  sheet.setColumnWidth(5, 275);  // E: PENYULANG CLOSE
  sheet.setColumnWidth(6, 275);  // F: PENYULANG OPEN
  sheet.setColumnWidth(7, 75);   // G: ALARM
  sheet.setColumnWidth(8, 75);   // H: NORMAL
  sheet.setColumnWidth(9, 75);   // I: POWER ON
  sheet.setColumnWidth(10, 75);  // J: POWER OFF
  sheet.setColumnWidth(11, 75);  // K: CHARGING YA
  sheet.setColumnWidth(12, 75);  // L: CHARGING TIDAK
  sheet.setColumnWidth(13, 75);  // M: REMOTE LOCAL
  sheet.setColumnWidth(14, 75);  // N: REMOTE AUTO
  sheet.setColumnWidth(15, 75);  // O: LAMPU ON
  sheet.setColumnWidth(16, 75);  // P: LAMPU OFF
  sheet.setColumnWidth(17, 160); // Q: KETERANGAN

  // 6. Bekukan Baris Header & Aktifkan Garis Kisi
  sheet.setFrozenRows(5);
  sheet.setHiddenGridlines(false);

  // 7. Format dan Tata Seluruh 31 Hari (93 Baris Data A6:Q98) Persis Format Resmi
  // Gabungkan Kolom A (NO) & Kolom C (TANGGAL) per 3 Shift (Pagi, Siang, Malam)
  var curDate = new Date();
  var curMonthNum = ("0" + (curDate.getMonth() + 1)).slice(-2);
  var curYearNum = curDate.getFullYear();

  for (var d = 1; d <= 31; d++) {
    var startR = 6 + (d - 1) * 3;
    var dayPadded = ("0" + d).slice(-2);
    var fullDateStr = dayPadded + "/" + curMonthNum + "/" + curYearNum;

    // Merge Kolom A (NO)
    try {
      var noRange = sheet.getRange(startR, 1, 3, 1);
      noRange.merge();
      if (!sheet.getRange(startR, 1).getValue()) {
        sheet.getRange(startR, 1).setValue(d);
      }
    } catch (e) {}

    // Merge Kolom C (TANGGAL)
    try {
      var dateRange = sheet.getRange(startR, 3, 3, 1);
      dateRange.merge();
      if (!sheet.getRange(startR, 3).getValue()) {
        sheet.getRange(startR, 3).setValue(fullDateStr);
      }
    } catch (e) {}
  }

  // Border Hitam Solid, Font Times New Roman 10, Alignment Tengah untuk Seluruh Data
  var allDataRange = sheet.getRange("A6:Q98");
  allDataRange
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Times New Roman")
    .setFontSize(10)
    .setFontColor("#000000")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange("B6:B98").setWrap(true);
  sheet.getRange("Q6:Q98").setWrap(true);

  for (var r = 6; r <= 98; r++) {
    sheet.setRowHeight(r, 26);
  }

  return sheet;
}

// ========================================================================
// FORMAT DAN TATA LETAK TABEL UPS (LAPORAN_CETAK_UPS)
// ========================================================================
function setupUpsSheetLayout(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // 1. Bersihkan penggabungan header lama
  try {
    sheet.getRange("A1:R6").breakApart();
  } catch (e) {}

  // 2. Judul Utama (Baris 2) & Beban Subtitle
  var title = "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN & RUMDIN";
  var bebanTitle = "BEBAN UPS WAPRES & RUMDIN";
  if (sheetName.indexOf("30") !== -1 && sheetName.indexOf("WAPRES") !== -1) {
    title = "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN";
    bebanTitle = "BEBAN UPS 30 KVA WAKIL PRESIDEN (LT 1)";
  } else if (sheetName.indexOf("40") !== -1 && sheetName.indexOf("WAPRES") !== -1) {
    title = "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN";
    bebanTitle = "BEBAN UPS 40 KVA WAKIL PRESIDEN (LT 2)";
  } else if (sheetName.indexOf("60") !== -1 && sheetName.indexOf("WAPRES") !== -1) {
    title = "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN";
    bebanTitle = "BEBAN UPS 60 KVA WAKIL PRESIDEN (LT 3)";
  } else if (sheetName.indexOf("DIPO") !== -1) {
    title = "PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)";
    bebanTitle = "BEBAN UPS 40 KVA RUMAH DINAS (DIPO)";
  } else if (sheetName.indexOf("ST 12") !== -1 || sheetName.indexOf("ST12") !== -1) {
    title = "PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)";
    bebanTitle = "BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)";
  }

  sheet.getRange("A2:R2").merge();
  sheet.getRange("A2").setValue(title)
    .setFontFamily("Arial")
    .setFontSize(13)
    .setFontWeight("bold")
    .setUnderline(true)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(2, 36);

  // 3. Sub-Judul Bulan (Baris 3)
  var currentMonth = Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");
  sheet.getRange("B3").setValue("Bulan : " + currentMonth)
    .setFontFamily("Arial")
    .setFontSize(11)
    .setFontWeight("bold");
  sheet.setRowHeight(3, 24);

  // 4. Header Baris 4, 5, 6 (Tiga Tingkat)
  var headerRow4 = [
    "NO", "NAMA PETUGAS", "TANGGAL/\\nBULAN/\\nTAHUN", "JAM\\nINSPEKSI",
    bebanTitle, "", "", "", "", "", "", "", "",
    "TEMPERAT\\nUR UPS", "ALARM\\nUPS", "BACK UP TIME UPS", "", "KETERANGAN & LOKASI"
  ];

  var headerRow5 = [
    "", "", "", "",
    "R", "S", "T", "R", "S", "T", "R", "S", "T",
    "", "", "", "", ""
  ];

  var headerRow6 = [
    "", "", "", "",
    "(A)", "(A)", "(A)",
    "(R-N)", "(S-N)", "(T-N)",
    "(R-S)", "(R-T)", "(S-T)",
    "", "",
    "HOURS", "MINUTES",
    ""
  ];

  sheet.getRange("A4:R4").setValues([headerRow4]);
  sheet.getRange("A5:R5").setValues([headerRow5]);
  sheet.getRange("A6:R6").setValues([headerRow6]);

  // Gabungkan sel bertingkat
  sheet.getRange("A4:A6").merge(); // NO
  sheet.getRange("B4:B6").merge(); // NAMA PETUGAS
  sheet.getRange("C4:C6").merge(); // TANGGAL
  sheet.getRange("D4:D6").merge(); // JAM
  sheet.getRange("E4:M4").merge(); // BEBAN UPS
  sheet.getRange("N4:N6").merge(); // TEMPERATUR UPS
  sheet.getRange("O4:O6").merge(); // ALARM UPS
  sheet.getRange("P4:Q5").merge(); // BACK UP TIME
  sheet.getRange("R4:R6").merge(); // KETERANGAN & LOKASI

  // Format Warna Header: Cyan (#00B0F0) dan Beban Orange (#FFA500)
  var headerRange = sheet.getRange("A4:R6");
  headerRange
    .setBackground("#00B0F0")
    .setFontColor("#000000")
    .setFontFamily("Arial")
    .setFontSize(10)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  // Warna Khusus Bagian Beban UPS (Orange Gold #FFA500)
  sheet.getRange("E4:M4").setBackground("#FFA500");

  sheet.setRowHeight(4, 28);
  sheet.setRowHeight(5, 24);
  sheet.setRowHeight(6, 24);

  // 5. Atur Lebar Kolom Presisi
  sheet.setColumnWidth(1, 45);   // A: NO
  sheet.setColumnWidth(2, 180);  // B: NAMA PETUGAS
  sheet.setColumnWidth(3, 120);  // C: TANGGAL
  sheet.setColumnWidth(4, 95);   // D: JAM
  sheet.setColumnWidth(5, 75);   // E: LOAD R
  sheet.setColumnWidth(6, 75);   // F: LOAD S
  sheet.setColumnWidth(7, 75);   // G: LOAD T
  sheet.setColumnWidth(8, 75);   // H: VOLT R-N
  sheet.setColumnWidth(9, 75);   // I: VOLT S-N
  sheet.setColumnWidth(10, 75);  // J: VOLT T-N
  sheet.setColumnWidth(11, 75);  // K: VOLT R-S
  sheet.setColumnWidth(12, 75);  // L: VOLT R-T
  sheet.setColumnWidth(13, 75);  // M: VOLT S-T
  sheet.setColumnWidth(14, 90);  // N: SUHU
  sheet.setColumnWidth(15, 85);  // O: ALARM
  sheet.setColumnWidth(16, 75);  // P: HOURS
  sheet.setColumnWidth(17, 75);  // Q: MINUTES
  sheet.setColumnWidth(18, 190); // R: KETERANGAN & LOKASI

  // 6. Bekukan Baris Header (Baris 6)
  sheet.setFrozenRows(6);
  sheet.setHiddenGridlines(false);

  // 7. Format dan Tata Seluruh 31 Hari (93 Baris Data A7:R99) Persis Format Resmi
  // Gabungkan Kolom A (NO) & Kolom C (TANGGAL) per 3 Shift (Pagi, Siang, Malam)
  var curDate = new Date();
  var curMonthNum = ("0" + (curDate.getMonth() + 1)).slice(-2);
  var curYearNum = curDate.getFullYear();

  for (var d = 1; d <= 31; d++) {
    var startR = 7 + (d - 1) * 3;
    var dayPadded = ("0" + d).slice(-2);
    var fullDateStr = dayPadded + "/" + curMonthNum + "/" + curYearNum;

    // Merge Kolom A (NO)
    try {
      var noRange = sheet.getRange(startR, 1, 3, 1);
      noRange.merge();
      if (!sheet.getRange(startR, 1).getValue()) {
        sheet.getRange(startR, 1).setValue(d);
      }
    } catch (e) {}

    // Merge Kolom C (TANGGAL)
    try {
      var dateRange = sheet.getRange(startR, 3, 3, 1);
      dateRange.merge();
      if (!sheet.getRange(startR, 3).getValue()) {
        sheet.getRange(startR, 3).setValue(fullDateStr);
      }
    } catch (e) {}
  }

  // Border Hitam Solid, Font Times New Roman 10, Alignment Tengah untuk Seluruh Data
  var allDataRange = sheet.getRange("A7:R99");
  allDataRange
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Times New Roman")
    .setFontSize(10)
    .setFontColor("#000000")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange("B7:B99").setWrap(true);
  sheet.getRange("R7:R99").setWrap(true);

  for (var r = 7; r <= 99; r++) {
    sheet.setRowHeight(r, 26);
  }

  return sheet;
}

// ========================================================================
// MENCARI / MENGHITUNG BARIS SLOT TANGGAL & SHIFT (ANTI TERTUMPUK)
// ========================================================================
function findOrCalculateAcoRow(ss, sheetName, inspectionDate, shift, dayOfMonth, type) {
  var sheet = ss.getSheetByName(sheetName);
  var baseStartRow = 6;

  // Cek apakah menggunakan sheet gabungan LAPORAN_CETAK
  var lapCetak = ss.getSheetByName("LAPORAN_CETAK");
  if (lapCetak) {
    sheet = lapCetak;
    if (type === "ACO_TM" || (sheetName && sheetName.indexOf("TM") !== -1)) {
      baseStartRow = 6;
    } else if (type === "ACO_ST12" || (sheetName && sheetName.indexOf("ST 12") !== -1)) {
      baseStartRow = 106;
    } else if (type === "ACO_DIPO" || (sheetName && sheetName.indexOf("DIPO") !== -1)) {
      baseStartRow = 205;
    }
  } else if (!sheet) {
    sheet = setupAcoSheetLayout(ss, sheetName, type || "ACO_TM");
    baseStartRow = 6;
  }

  // Hitung tanggal 1..31
  var d = parseInt(dayOfMonth);
  if (isNaN(d) || d < 1 || d > 31) {
    if (inspectionDate) {
      var parts = String(inspectionDate).split(/[\\/\\-]/);
      if (parts.length >= 3) {
        d = parseInt(parts[0].length === 4 ? parts[2] : parts[0]);
      }
    }
    if (isNaN(d) || d < 1 || d > 31) d = new Date().getDate();
  }

  // Offset shift: Pagi = 0, Siang = 1, Malam = 2
  var s = String(shift || "").toUpperCase();
  var offset = 0;
  if (s.indexOf("SIANG") !== -1) offset = 1;
  else if (s.indexOf("MALAM") !== -1) offset = 2;

  var targetRow = baseStartRow + (d - 1) * 3 + offset;
  return { sheet: sheet, targetRow: targetRow, dayOfMonth: d, offset: offset, baseStartRow: baseStartRow };
}

function upsertAcoRow(ss, sheetName, rowData, inspectionDate, type, shift, dayOfMonth) {
  var slot = findOrCalculateAcoRow(ss, sheetName, inspectionDate, shift, dayOfMonth, type);
  var sheet = slot.sheet;
  var targetRow = slot.targetRow;
  var startR = slot.baseStartRow + (slot.dayOfMonth - 1) * 3;

  if (slot.offset === 0) {
    // Shift Pagi (Baris 1 dari tanggal ini)
    rowData[0] = String(slot.dayOfMonth);
    if (inspectionDate) rowData[2] = String(inspectionDate);
    var rowRange = sheet.getRange(targetRow, 1, 1, rowData.length);
    rowRange.setValues([rowData]);
  } else {
    // Shift Siang atau Malam: Update Petugas (B), Jam (D), dan Hasil Inspeksi (E..Q)
    // Jangan menimpa Kolom A & C agar sel gabungan (merge) 3 baris tetap utuh
    if (rowData[1]) sheet.getRange(targetRow, 2).setValue(rowData[1]);
    if (rowData[3]) sheet.getRange(targetRow, 4).setValue(rowData[3]);
    if (rowData.length > 4) {
      sheet.getRange(targetRow, 5, 1, rowData.length - 4).setValues([rowData.slice(4)]);
    }
  }

  // Pastikan penggabungan (merge) Kolom A dan C untuk 3 baris tanggal ini tetap rapi
  try {
    sheet.getRange(startR, 1, 3, 1).merge();
    sheet.getRange(startR, 3, 3, 1).merge();
  } catch (e) {}

  // Format Rapi: Border Hitam Solid, Font Times New Roman 10, Alignment Tengah
  var rowRange = sheet.getRange(targetRow, 1, 1, 17);
  rowRange
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Times New Roman")
    .setFontSize(10)
    .setFontColor("#000000")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(targetRow, 2).setWrap(true);
  sheet.getRange(targetRow, 17).setWrap(true);
  sheet.setRowHeight(targetRow, 26);
}

function findOrCalculateUpsRow(ss, sheetName, inspectionDate, shift, dayOfMonth) {
  var targetName = sheetName || "UPS 30 KVA WAPRES";
  var sheet = ss.getSheetByName(targetName);
  if (!sheet) {
    sheet = ss.getSheetByName("LAPORAN_CETAK_UPS") || setupUpsSheetLayout(ss, targetName);
  }

  var d = parseInt(dayOfMonth);
  if (isNaN(d) || d < 1 || d > 31) {
    if (inspectionDate) {
      var parts = String(inspectionDate).split(/[\\/\\-]/);
      if (parts.length >= 3) {
        d = parseInt(parts[0].length === 4 ? parts[2] : parts[0]);
      }
    }
    if (isNaN(d) || d < 1 || d > 31) d = new Date().getDate();
  }

  var s = String(shift || "").toUpperCase();
  var offset = 0;
  if (s.indexOf("SIANG") !== -1) offset = 1;
  else if (s.indexOf("MALAM") !== -1) offset = 2;

  var targetRow = 7 + (d - 1) * 3 + offset;
  return { sheet: sheet, targetRow: targetRow, dayOfMonth: d, offset: offset };
}

function upsertUpsRows(ss, sheetName, rowsData, inspectionDate, shift, dayOfMonth) {
  var slot = findOrCalculateUpsRow(ss, sheetName, inspectionDate, shift, dayOfMonth);
  var sheet = slot.sheet;
  var targetRow = slot.targetRow;
  var startR = 7 + (slot.dayOfMonth - 1) * 3;

  for (var r = 0; r < rowsData.length; r++) {
    var currentRow = targetRow + r;
    if (slot.offset === 0 && r === 0) {
      rowsData[r][0] = String(slot.dayOfMonth);
      if (inspectionDate) rowsData[r][2] = String(inspectionDate);
      sheet.getRange(currentRow, 1, 1, rowsData[r].length).setValues([rowsData[r]]);
    } else {
      if (rowsData[r][1]) sheet.getRange(currentRow, 2).setValue(rowsData[r][1]);
      if (rowsData[r][3]) sheet.getRange(currentRow, 4).setValue(rowsData[r][3]);
      if (rowsData[r].length > 4) {
        sheet.getRange(currentRow, 5, 1, rowsData[r].length - 4).setValues([rowsData[r].slice(4)]);
      }
    }

    // Pastikan merge Kolom A & C tetap terjaga
    try {
      sheet.getRange(startR, 1, 3, 1).merge();
      sheet.getRange(startR, 3, 3, 1).merge();
    } catch (e) {}

    var rowRange = sheet.getRange(currentRow, 1, 1, 18);
    rowRange
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setFontFamily("Times New Roman")
      .setFontSize(10)
      .setFontColor("#000000")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(currentRow, 2).setWrap(true);
    sheet.getRange(currentRow, 18).setWrap(true);
    sheet.setRowHeight(currentRow, 26);
  }
}

// Mengosongkan data baris tanggal & shift tertentu tanpa merusak layout
function clearShiftRow(ss, target, inspectionDate, shift, dayOfMonth) {
  var targets = target === "ALL" ? ["ACO_TM", "ACO_DIPO", "ACO_ST12", "UPS"] : [target];
  for (var i = 0; i < targets.length; i++) {
    var t = targets[i];
    try {
      if (t === "ACO_TM" || t === "ACO_DIPO" || t === "ACO_ST12") {
        var shName = t === "ACO_TM" ? "ACO TM D 126" : (t === "ACO_DIPO" ? "ACO TR DIPO" : "ACO TR ST 12");
        var slot = findOrCalculateAcoRow(ss, shName, inspectionDate, shift, dayOfMonth, t);
        var emptyAco = new Array(17).fill("-");
        emptyAco[0] = (slot.offset === 0) ? String(slot.dayOfMonth) : "";
        slot.sheet.getRange(slot.targetRow, 1, 1, 17).setValues([emptyAco]);
      } else if (t === "UPS") {
        var upsSlot = findOrCalculateUpsRow(ss, "LAPORAN_CETAK_UPS", inspectionDate, shift, dayOfMonth);
        var emptyUps = new Array(18).fill("-");
        emptyUps[0] = (upsSlot.offset === 0) ? String(upsSlot.dayOfMonth) : "";
        upsSlot.sheet.getRange(upsSlot.targetRow, 1, 1, 18).setValues([emptyUps]);
      }
    } catch (e) {}
  }
}
`;

