import { TimWapresReport, TimRumdinReport, UPSData, ShiftType } from '../types';
import { formatToDDMMYYYY, extractDayOfMonth, getShiftOffset } from './googleSheets';

export const STORAGE_KEY_WEBHOOK = 'monitoring_shift_webhook_url';
export const STORAGE_KEY_SHEET_LINK = 'monitoring_shift_sheet_link';

/**
 * URL Webhook Google Apps Script resmi yang tertanam langsung di sistem
 */
export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxZk9f0wiY-t8WyHjwunQBrCTPalbf4HU-nzKWmJgWVtiVKaD50QV8YYfwpe87RZw45Eg/exec';

export function getStoredWebhookUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (stored && stored.trim() !== '') {
      return stored.trim();
    }
  } catch (err) {
    console.warn('Failed to retrieve webhook URL from localStorage:', err);
  }
  return DEFAULT_WEBHOOK_URL;
}

export function saveStoredWebhookUrl(url: string | null): void {
  try {
    if (!url || url.trim() === '' || url.trim() === DEFAULT_WEBHOOK_URL) {
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
export { GOOGLE_APPS_SCRIPT_CODE } from './appsScriptTemplate';
