import {
  TimWapresReport,
  TimRumdinReport,
  UPSData,
  AcoTMData,
  AcoTRDipoData,
  AcoTRST12Data,
  ShiftType,
  CombinedShiftReport,
  ACO_TM_PENYULANG_OPTIONS,
} from '../types';
import {
  formatToDDMMYYYY,
  extractDayOfMonth,
  getShiftOffset,
  extractSpreadsheetId,
  ActiveSpreadsheetInfo,
} from './googleSheets';
import { formatIndonesianDate, formatIndonesianTime } from '../utils/formatters';

export interface SheetReadResult {
  success: boolean;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  isBothSubmitted: boolean;
  wapres: TimWapresReport | null;
  rumdin: TimRumdinReport | null;
  source: 'server_proxy' | 'sheets_api' | 'webhook' | 'gviz' | 'none';
  message?: string;
  fetchedAt: string;
}

export interface FetchShiftOptions {
  dateKey: string; // YYYY-MM-DD
  shift: ShiftType;
  webhookUrl?: string | null;
  sheetLink?: string | null;
  accessToken?: string | null;
  activeSpreadsheet?: ActiveSpreadsheetInfo | null;
}

/**
 * Clean up numerical value strings extracted from spreadsheet cells (e.g. "3.1 A" -> "3.1")
 */
export function cleanUnitValue(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str === '-' || str === '""' || str.toLowerCase() === 'null') return '';

  // Remove trailing units like A, V, °C, Jam, Menit if attached
  const cleaned = str
    .replace(/\s*A\b/i, '')
    .replace(/\s*V\b/i, '')
    .replace(/\s*°?C\b/i, '')
    .replace(/\s*Jam\b/i, '')
    .replace(/\s*Menit\b/i, '')
    .trim();

  return cleaned === '-' ? '' : cleaned;
}

/**
 * Parses officer string from sheet cell like "GUGUM , FAJAR" or "GUGUM / FAJAR" into [name1, name2]
 */
export function parseOfficersFromCell(cellValue: any): [string, string] {
  if (!cellValue) return ['', ''];
  const str = String(cellValue).trim();
  if (!str || str === '-' || str === '""') return ['', ''];

  const parts = str.split(/[,/&]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return ['', ''];

  // Normalize case (capitalize each word)
  const formatName = (n: string) =>
    n
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const off1 = formatName(parts[0]);
  const off2 = parts.length > 1 ? formatName(parts[1]) : '';
  return [off1, off2];
}

/**
 * Checks if a given spreadsheet row array contains actual submitted inspection data
 */
export function isRowDataSubmitted(row: any[]): boolean {
  if (!row || row.length < 4) return false;

  const officers = String(row[1] || '').trim();
  const time = String(row[3] || '').trim();

  // If officer name or inspection time is filled with real content
  if (officers && officers !== '-' && officers !== '""' && officers !== 'NAMA PETUGAS') return true;
  if (time && time !== '-' && time !== '""' && time !== 'JAM' && time !== 'WIB') return true;

  // Or if any measurement or operational cell has real data
  for (let c = 4; c < Math.min(row.length, 18); c++) {
    const val = String(row[c] || '').trim();
    if (val && val !== '-' && val !== '0' && val !== '""') {
      return true;
    }
  }

  return false;
}

/**
 * Parse an 18-column UPS row into UPSData interface
 */
export function parseUpsDataFromRow(row: any[]): UPSData {
  if (!row || row.length === 0) {
    return {
      loadR: '',
      loadS: '',
      loadT: '',
      voltRN: '',
      voltSN: '',
      voltTN: '',
      voltRS: '',
      voltRT: '',
      voltST: '',
      temperature: '',
      alarm: 'NORMAL',
      backupHours: '',
      backupMinutes: '',
      keterangan: '-',
    };
  }

  const alarmRaw = String(row[14] || '').toUpperCase();
  const alarm: 'NORMAL' | 'ALARM' = alarmRaw.includes('ALARM') ? 'ALARM' : 'NORMAL';

  return {
    loadR: cleanUnitValue(row[4]),
    loadS: cleanUnitValue(row[5]),
    loadT: cleanUnitValue(row[6]),
    voltRN: cleanUnitValue(row[7]),
    voltSN: cleanUnitValue(row[8]),
    voltTN: cleanUnitValue(row[9]),
    voltRS: cleanUnitValue(row[10]),
    voltRT: cleanUnitValue(row[11]),
    voltST: cleanUnitValue(row[12]),
    temperature: cleanUnitValue(row[13]),
    alarm,
    backupHours: cleanUnitValue(row[15]),
    backupMinutes: cleanUnitValue(row[16]),
    keterangan: String(row[17] || '-').trim() || '-',
  };
}

/**
 * Parse ACO TM row (17 columns) into AcoTMData
 */
export function parseAcoTMDataFromRow(row: any[]): AcoTMData {
  if (!row || row.length === 0) {
    return {
      penyulangClose: ACO_TM_PENYULANG_OPTIONS[0],
      penyulangOpen: ACO_TM_PENYULANG_OPTIONS[2],
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      chargingKubikel: 'YA',
      remoteKubikel: 'AUTO',
      lampuIndikator: 'ON',
      keterangan: '-',
    };
  }

  const penyClose = String(row[4] || '').trim();
  const penyOpen = String(row[5] || '').trim();
  const alarmCol = String(row[6] || '').trim().toUpperCase();
  const normalCol = String(row[7] || '').trim().toUpperCase();
  const powerOn = String(row[8] || '').trim().toUpperCase();
  const powerOff = String(row[9] || '').trim().toUpperCase();
  const chargeYa = String(row[10] || '').trim().toUpperCase();
  const chargeTidak = String(row[11] || '').trim().toUpperCase();
  const remoteLocal = String(row[12] || '').trim().toUpperCase();
  const remoteAuto = String(row[13] || '').trim().toUpperCase();
  const lampuOn = String(row[14] || '').trim().toUpperCase();
  const lampuOff = String(row[15] || '').trim().toUpperCase();
  const keterangan = String(row[16] || '-').trim() || '-';

  return {
    penyulangClose: penyClose || ACO_TM_PENYULANG_OPTIONS[0],
    penyulangOpen: penyOpen || ACO_TM_PENYULANG_OPTIONS[2],
    alarmStatus: alarmCol === 'ALARM' ? 'ALARM' : 'NORMAL',
    powerACO: powerOff === 'OFF' ? 'OFF' : 'ON',
    chargingKubikel: chargeTidak === 'TIDAK' ? 'TIDAK' : 'YA',
    remoteKubikel: remoteLocal === 'LOCAL' ? 'LOCAL' : 'AUTO',
    lampuIndikator: lampuOff === 'OFF' ? 'OFF' : 'ON',
    keterangan,
  };
}

/**
 * Parse ACO TR Dipo row (17 columns) into AcoTRDipoData
 */
export function parseAcoDipoDataFromRow(row: any[]): AcoTRDipoData {
  if (!row || row.length === 0) {
    return {
      garduT135Status: 'OPEN',
      garduT15NStatus: 'CLOSE',
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      lampuIndikator: 'ON',
      keterangan: '-',
    };
  }

  const t15n = String(row[4] || '').trim().toUpperCase();
  const t135 = String(row[5] || '').trim().toUpperCase();
  const alarmCol = String(row[6] || '').trim().toUpperCase();
  const powerOff = String(row[9] || '').trim().toUpperCase();
  const lampuOff = String(row[15] || '').trim().toUpperCase();
  const keterangan = String(row[16] || '-').trim() || '-';

  return {
    garduT15NStatus: t15n.includes('OPEN') ? 'OPEN' : 'CLOSE',
    garduT135Status: t135.includes('CLOSE') ? 'CLOSE' : 'OPEN',
    alarmStatus: alarmCol === 'ALARM' ? 'ALARM' : 'NORMAL',
    powerACO: powerOff === 'OFF' ? 'OFF' : 'ON',
    lampuIndikator: lampuOff === 'OFF' ? 'OFF' : 'ON',
    keterangan,
  };
}

/**
 * Parse ACO TR ST 12 row (17 columns) into AcoTRST12Data
 */
export function parseAcoST12DataFromRow(row: any[]): AcoTRST12Data {
  if (!row || row.length === 0) {
    return {
      garduT93Status: 'CLOSE',
      garduT10BStatus: 'OPEN',
      penyulangClose: 'GARDU T93',
      penyulangOpen: 'GARDU T10B',
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      lampuIndikator: 'ON',
      keterangan: '-',
    };
  }

  const closeVal = String(row[4] || '').trim();
  const openVal = String(row[5] || '').trim();
  const alarmCol = String(row[6] || '').trim().toUpperCase();
  const powerOff = String(row[9] || '').trim().toUpperCase();
  const lampuOff = String(row[15] || '').trim().toUpperCase();
  const keterangan = String(row[16] || '-').trim() || '-';

  const isT93Close =
    closeVal.toUpperCase().includes('T93') || (!openVal.toUpperCase().includes('T10B') && !closeVal.toUpperCase().includes('T10B'));

  return {
    garduT93Status: isT93Close ? 'CLOSE' : 'OPEN',
    garduT10BStatus: isT93Close ? 'OPEN' : 'CLOSE',
    penyulangClose: closeVal || (isT93Close ? 'GARDU T93' : 'GARDU T10B'),
    penyulangOpen: openVal || (isT93Close ? 'GARDU T10B' : 'GARDU T93'),
    alarmStatus: alarmCol === 'ALARM' ? 'ALARM' : 'NORMAL',
    powerACO: powerOff === 'OFF' ? 'OFF' : 'ON',
    lampuIndikator: lampuOff === 'OFF' ? 'OFF' : 'ON',
    keterangan,
  };
}

/**
 * Parse GVIZ JSON response text from Google Sheets into structured 2D string array
 */
export function parseGvizResponseToRows(gvizText: string): any[][] {
  try {
    // Format: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const match = gvizText.match(/setResponse\((.*)\);/s);
    if (!match || !match[1]) return [];
    const json = JSON.parse(match[1]);
    const table = json.table;
    if (!table || !table.rows) return [];

    return table.rows.map((r: any) => {
      if (!r || !r.c) return [];
      return r.c.map((cell: any) => (cell ? cell.f || cell.v || '' : ''));
    });
  } catch (err) {
    console.warn('Failed to parse GVIZ response:', err);
    return [];
  }
}

/**
 * Parse Google Sheets API v4 batchGet response
 */
export function parseBatchGetValues(batchData: any): Record<string, any[][]> {
  const result: Record<string, any[][]> = {};
  if (!batchData || !batchData.valueRanges) return result;

  for (const vr of batchData.valueRanges) {
    const range = vr.range || '';
    result[range] = vr.values || [];
  }
  return result;
}

/**
 * Main Fetcher: Query database from Google Sheets via all available channels
 * Priority:
 * 1. Express backend proxy (/api/sheets/read-shift)
 * 2. Direct Webhook call (Apps Script action: GET_SHIFT_DATA)
 * 3. Google Sheets API v4 (if OAuth accessToken present)
 * 4. Google Sheets Public GVIZ (if spreadsheetId available)
 */
export async function fetchShiftDataFromSpreadsheet(
  options: FetchShiftOptions
): Promise<SheetReadResult> {
  const { dateKey, shift, webhookUrl, sheetLink, accessToken, activeSpreadsheet } = options;
  const dayOfMonth = extractDayOfMonth(dateKey);
  const offset = getShiftOffset(shift);
  const spreadsheetId =
    (activeSpreadsheet && activeSpreadsheet.id) ||
    extractSpreadsheetId(sheetLink || '') ||
    null;

  const nowStr = new Date().toISOString();

  // 1. Try Express Server Proxy first
  try {
    const proxyRes = await fetch('/api/sheets/read-shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateKey,
        dayOfMonth,
        shift,
        webhookUrl: webhookUrl || null,
        spreadsheetId,
        sheetLink: sheetLink || null,
        accessToken: accessToken || null,
      }),
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.success && (proxyData.isWapresSubmitted || proxyData.isRumdinSubmitted || proxyData.data)) {
        return {
          success: true,
          isWapresSubmitted: Boolean(proxyData.isWapresSubmitted),
          isRumdinSubmitted: Boolean(proxyData.isRumdinSubmitted),
          isBothSubmitted: Boolean(proxyData.isWapresSubmitted && proxyData.isRumdinSubmitted),
          wapres: proxyData.wapres || (proxyData.data?.wapres) || null,
          rumdin: proxyData.rumdin || (proxyData.data?.rumdin) || null,
          source: 'server_proxy',
          message: proxyData.message || 'Data berhasil dimuat dari database spreadsheet.',
          fetchedAt: nowStr,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Server proxy /api/sheets/read-shift bypassed or failed, trying direct channels:', proxyErr);
  }

  // 2. Try Direct Google Apps Script Webhook
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com/')) {
    try {
      const whRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'GET_SHIFT_DATA',
          inspectionDate: formatToDDMMYYYY(dateKey),
          shift,
          dayOfMonth,
        }),
      });

      if (whRes.ok) {
        const whJson = await whRes.json();
        if (whJson.status === 'success' && whJson.data) {
          const d = whJson.data;
          return {
            success: true,
            isWapresSubmitted: Boolean(d.isWapresSubmitted),
            isRumdinSubmitted: Boolean(d.isRumdinSubmitted),
            isBothSubmitted: Boolean(d.isWapresSubmitted && d.isRumdinSubmitted),
            wapres: d.wapres || null,
            rumdin: d.rumdin || null,
            source: 'webhook',
            message: 'Data berhasil diambil langsung via Webhook Google Apps Script.',
            fetchedAt: nowStr,
          };
        }
      }
    } catch (whErr) {
      console.warn('Direct webhook GET_SHIFT_DATA failed:', whErr);
    }
  }

  // 3. Try Google Sheets API v4 (when user is logged in via OAuth)
  if (accessToken && spreadsheetId) {
    try {
      const tmRow = 6 + (dayOfMonth - 1) * 3 + offset;
      const st12Row = 105 + (dayOfMonth - 1) * 3 + offset;
      const dipoRow = 204 + (dayOfMonth - 1) * 3 + offset;

      const ups30Row = 7 + (dayOfMonth - 1) * 3 + offset;
      const ups40WRow = 107 + (dayOfMonth - 1) * 3 + offset;
      const ups60WRow = 207 + (dayOfMonth - 1) * 3 + offset;
      const ups40DRow = 307 + (dayOfMonth - 1) * 3 + offset;
      const ups100SRow = 407 + (dayOfMonth - 1) * 3 + offset;

      const ranges = [
        `LAPORAN_CETAK!A${tmRow}:Q${tmRow}`,
        `LAPORAN_CETAK!A${st12Row}:Q${st12Row}`,
        `LAPORAN_CETAK!A${dipoRow}:Q${dipoRow}`,
        `LAPORAN_CETAK_UPS!A${ups30Row}:R${ups30Row}`,
        `LAPORAN_CETAK_UPS!A${ups40WRow}:R${ups40WRow}`,
        `LAPORAN_CETAK_UPS!A${ups60WRow}:R${ups60WRow}`,
        `LAPORAN_CETAK_UPS!A${ups40DRow}:R${ups40DRow}`,
        `LAPORAN_CETAK_UPS!A${ups100SRow}:R${ups100SRow}`,
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
        .map((r) => `ranges=${encodeURIComponent(r)}`)
        .join('&')}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const batchData = await res.json();
        const parsed = parseShiftRowsIntoReports(batchData.valueRanges || [], dateKey, shift);
        return {
          ...parsed,
          source: 'sheets_api',
          fetchedAt: nowStr,
        };
      }
    } catch (apiErr) {
      console.warn('Google Sheets API batchGet error:', apiErr);
    }
  }

  // 4. Try Google Sheets GVIZ (if spreadsheetId exists and sheet is viewable)
  if (spreadsheetId) {
    try {
      const gvizLapCetakUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK`;
      const gvizLapUpsUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK_UPS`;

      const [resCetak, resUps] = await Promise.all([
        fetch(gvizLapCetakUrl).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
        fetch(gvizLapUpsUrl).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
      ]);

      const rowsCetak = parseGvizResponseToRows(resCetak);
      const rowsUps = parseGvizResponseToRows(resUps);

      if (rowsCetak.length > 0 || rowsUps.length > 0) {
        const parsed = parseGvizRowsIntoReports(rowsCetak, rowsUps, dayOfMonth, offset, dateKey, shift);
        return {
          ...parsed,
          source: 'gviz',
          fetchedAt: nowStr,
        };
      }
    } catch (gvizErr) {
      console.warn('Google Sheets GVIZ fetch error:', gvizErr);
    }
  }

  return {
    success: false,
    isWapresSubmitted: false,
    isRumdinSubmitted: false,
    isBothSubmitted: false,
    wapres: null,
    rumdin: null,
    source: 'none',
    message: 'Tidak dapat membaca data dari Google Sheets. Pastikan spreadsheet atau webhook terhubung.',
    fetchedAt: nowStr,
  };
}

/**
 * Reconstruct reports from Google Sheets API batchGet valueRanges
 */
function parseShiftRowsIntoReports(
  valueRanges: any[],
  dateKey: string,
  shift: ShiftType
): Omit<SheetReadResult, 'source' | 'fetchedAt'> {
  const getRow = (idx: number) => {
    return valueRanges[idx]?.values?.[0] || [];
  };

  const acoTmRow = getRow(0);
  const acoSt12Row = getRow(1);
  const acoDipoRow = getRow(2);
  const ups30Row = getRow(3);
  const ups40WRow = getRow(4);
  const ups60WRow = getRow(5);
  const ups40DRow = getRow(6);
  const ups100SRow = getRow(7);

  return buildReportsFromRowArrays(
    acoTmRow,
    acoSt12Row,
    acoDipoRow,
    ups30Row,
    ups40WRow,
    ups60WRow,
    ups40DRow,
    ups100SRow,
    dateKey,
    shift
  );
}

/**
 * Reconstruct reports from GVIZ full sheet rows
 */
function parseGvizRowsIntoReports(
  rowsCetak: any[][],
  rowsUps: any[][],
  dayOfMonth: number,
  offset: number,
  dateKey: string,
  shift: ShiftType
): Omit<SheetReadResult, 'source' | 'fetchedAt'> {
  // Target row indices in 0-based array:
  // Row 6 in sheet is index 5
  const tmIdx = 5 + (dayOfMonth - 1) * 3 + offset;
  const st12Idx = 104 + (dayOfMonth - 1) * 3 + offset;
  const dipoIdx = 203 + (dayOfMonth - 1) * 3 + offset;

  // Row 7 in sheet is index 6
  const ups30Idx = 6 + (dayOfMonth - 1) * 3 + offset;
  const ups40WIdx = 106 + (dayOfMonth - 1) * 3 + offset;
  const ups60WIdx = 206 + (dayOfMonth - 1) * 3 + offset;
  const ups40DIdx = 306 + (dayOfMonth - 1) * 3 + offset;
  const ups100SIdx = 406 + (dayOfMonth - 1) * 3 + offset;

  const acoTmRow = rowsCetak[tmIdx] || [];
  const acoSt12Row = rowsCetak[st12Idx] || [];
  const acoDipoRow = rowsCetak[dipoIdx] || [];

  const ups30Row = rowsUps[ups30Idx] || [];
  const ups40WRow = rowsUps[ups40WIdx] || [];
  const ups60WRow = rowsUps[ups60WIdx] || [];
  const ups40DRow = rowsUps[ups40DIdx] || [];
  const ups100SRow = rowsUps[ups100SIdx] || [];

  return buildReportsFromRowArrays(
    acoTmRow,
    acoSt12Row,
    acoDipoRow,
    ups30Row,
    ups40WRow,
    ups60WRow,
    ups40DRow,
    ups100SRow,
    dateKey,
    shift
  );
}

/**
 * Core Assembler: build TimWapresReport & TimRumdinReport from raw arrays
 */
export function buildReportsFromRowArrays(
  acoTmRow: any[],
  acoSt12Row: any[],
  acoDipoRow: any[],
  ups30Row: any[],
  ups40WRow: any[],
  ups60WRow: any[],
  ups40DRow: any[],
  ups100SRow: any[],
  dateKey: string,
  shift: ShiftType
): Omit<SheetReadResult, 'source' | 'fetchedAt'> {
  const isWapresTmFilled = isRowDataSubmitted(acoTmRow);
  const isWapresUpsFilled =
    isRowDataSubmitted(ups30Row) || isRowDataSubmitted(ups40WRow) || isRowDataSubmitted(ups60WRow);
  const isWapresSubmitted = isWapresTmFilled || isWapresUpsFilled;

  const isRumdinAcoFilled = isRowDataSubmitted(acoDipoRow) || isRowDataSubmitted(acoSt12Row);
  const isRumdinUpsFilled = isRowDataSubmitted(ups40DRow) || isRowDataSubmitted(ups100SRow);
  const isRumdinSubmitted = isRumdinAcoFilled || isRumdinUpsFilled;

  let wapres: TimWapresReport | null = null;
  if (isWapresSubmitted) {
    const officers = parseOfficersFromCell(acoTmRow[1] || ups30Row[1]);
    const inspectionDate =
      String(acoTmRow[2] || ups30Row[2] || formatIndonesianDate()).trim();
    let inspectionTime = String(acoTmRow[3] || ups30Row[3] || formatIndonesianTime()).trim();
    if (!inspectionTime.toUpperCase().includes('WIB')) {
      inspectionTime = `${inspectionTime} WIB`;
    }

    wapres = {
      officers,
      inspectionDate,
      inspectionTime,
      ups30: parseUpsDataFromRow(ups30Row),
      ups40: parseUpsDataFromRow(ups40WRow),
      ups60: parseUpsDataFromRow(ups60WRow),
      acoTM: parseAcoTMDataFromRow(acoTmRow),
      submittedAt: new Date().toISOString(),
    };
  }

  let rumdin: TimRumdinReport | null = null;
  if (isRumdinSubmitted) {
    const officers = parseOfficersFromCell(acoDipoRow[1] || acoSt12Row[1] || ups40DRow[1]);
    const inspectionDate =
      String(acoDipoRow[2] || acoSt12Row[2] || ups40DRow[2] || formatIndonesianDate()).trim();
    let inspectionTime = String(acoDipoRow[3] || acoSt12Row[3] || ups40DRow[3] || formatIndonesianTime()).trim();
    if (!inspectionTime.toUpperCase().includes('WIB')) {
      inspectionTime = `${inspectionTime} WIB`;
    }

    rumdin = {
      officers,
      inspectionDate,
      inspectionTime,
      acoTRDipo: parseAcoDipoDataFromRow(acoDipoRow),
      acoTRST12: parseAcoST12DataFromRow(acoSt12Row),
      ups40Dipo: parseUpsDataFromRow(ups40DRow),
      ups100ST12: parseUpsDataFromRow(ups100SRow),
      submittedAt: new Date().toISOString(),
    };
  }

  return {
    success: true,
    isWapresSubmitted,
    isRumdinSubmitted,
    isBothSubmitted: isWapresSubmitted && isRumdinSubmitted,
    wapres,
    rumdin,
    message: isWapresSubmitted && isRumdinSubmitted
      ? 'Data Tim Wapres & Tim Rumdin ditemukan lengkap di Google Sheets.'
      : isWapresSubmitted
      ? 'Data Tim Wapres ditemukan di Google Sheets (Tim Rumdin belum submit).'
      : isRumdinSubmitted
      ? 'Data Tim Rumdin ditemukan di Google Sheets (Tim Wapres belum submit).'
      : 'Belum ada data submit di Google Sheets untuk shift ini.',
  };
}

/**
 * Builds a CombinedShiftReport incorporating freshly fetched sheet data
 */
export function buildCombinedReportFromSheet(
  sheetResult: SheetReadResult,
  fallbackReport: CombinedShiftReport
): CombinedShiftReport {
  return {
    ...fallbackReport,
    wapres: sheetResult.wapres || fallbackReport.wapres,
    rumdin: sheetResult.rumdin || fallbackReport.rumdin,
    updatedAt: new Date().toISOString(),
  };
}
