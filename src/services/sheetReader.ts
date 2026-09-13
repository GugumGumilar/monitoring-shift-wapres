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
  SheetMissingInfo,
} from '../types';
import {
  formatToDDMMYYYY,
  extractDayOfMonth,
  getShiftOffset,
  extractSpreadsheetId,
  ActiveSpreadsheetInfo,
} from './googleSheets';
import {
  formatIndonesianDate,
  formatIndonesianTime,
  normalizeIndonesianDate,
} from '../utils/formatters';

export interface SheetReadResult {
  success: boolean;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  isBothSubmitted: boolean;
  wapres: TimWapresReport | null;
  rumdin: TimRumdinReport | null;
  missingInfo?: SheetMissingInfo;
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
      if (proxyData.success && (proxyData.isWapresSubmitted || proxyData.isRumdinSubmitted || proxyData.data || proxyData.missingInfo || proxyData.wapres || proxyData.rumdin)) {
        return {
          success: true,
          isWapresSubmitted: Boolean(proxyData.isWapresSubmitted),
          isRumdinSubmitted: Boolean(proxyData.isRumdinSubmitted),
          isBothSubmitted: Boolean(proxyData.isBothSubmitted || (proxyData.isWapresSubmitted && proxyData.isRumdinSubmitted)),
          wapres: proxyData.wapres || (proxyData.data?.wapres) || null,
          rumdin: proxyData.rumdin || (proxyData.data?.rumdin) || null,
          missingInfo: proxyData.missingInfo,
          source: 'server_proxy',
          message: proxyData.message || (proxyData.missingInfo ? proxyData.missingInfo.instructionMessage : 'Data berhasil dimuat dari database spreadsheet.'),
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
            isBothSubmitted: Boolean(d.isBothSubmitted || (d.isWapresSubmitted && d.isRumdinSubmitted)),
            wapres: d.wapres || null,
            rumdin: d.rumdin || null,
            missingInfo: d.missingInfo,
            source: 'webhook',
            message: d.missingInfo?.instructionMessage || 'Data berhasil diambil langsung via Webhook Google Apps Script.',
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
  // Tim Wapres item checks: ACO TM, UPS 30, UPS 40, UPS 60
  const isAcoTmFilled = isRowDataSubmitted(acoTmRow);
  const isUps30Filled = isRowDataSubmitted(ups30Row);
  const isUps40WFilled = isRowDataSubmitted(ups40WRow);
  const isUps60WFilled = isRowDataSubmitted(ups60WRow);

  const wapresFilledItems: string[] = [];
  const wapresEmptyItems: string[] = [];
  if (isAcoTmFilled) wapresFilledItems.push('ACO TM D 126');
  else wapresEmptyItems.push('ACO TM D 126');

  if (isUps30Filled) wapresFilledItems.push('UPS 30 KVA');
  else wapresEmptyItems.push('UPS 30 KVA');

  if (isUps40WFilled) wapresFilledItems.push('UPS 40 KVA');
  else wapresEmptyItems.push('UPS 40 KVA');

  if (isUps60WFilled) wapresFilledItems.push('UPS 60 KVA');
  else wapresEmptyItems.push('UPS 60 KVA');

  const isWapresComplete = wapresEmptyItems.length === 0;
  const isWapresPartial = wapresFilledItems.length > 0 && !isWapresComplete;
  // Sesuai aturan: jika masih ada sheet yang kosong, belum submit
  const isWapresSubmitted = isWapresComplete;

  // Tim Rumdin item checks: ACO TR Dipo, ACO TR ST12, UPS 40 Dipo, UPS 100 ST12
  const isAcoDipoFilled = isRowDataSubmitted(acoDipoRow);
  const isAcoSt12Filled = isRowDataSubmitted(acoSt12Row);
  const isUps40DFilled = isRowDataSubmitted(ups40DRow);
  const isUps100SFilled = isRowDataSubmitted(ups100SRow);

  const rumdinFilledItems: string[] = [];
  const rumdinEmptyItems: string[] = [];
  if (isAcoDipoFilled) rumdinFilledItems.push('ACO TR Dipo');
  else rumdinEmptyItems.push('ACO TR Dipo');

  if (isAcoSt12Filled) rumdinFilledItems.push('ACO TR ST 12');
  else rumdinEmptyItems.push('ACO TR ST 12');

  if (isUps40DFilled) rumdinFilledItems.push('UPS 40 KVA Dipo');
  else rumdinEmptyItems.push('UPS 40 KVA Dipo');

  if (isUps100SFilled) rumdinFilledItems.push('UPS 100 KVA ST 12');
  else rumdinEmptyItems.push('UPS 100 KVA ST 12');

  const isRumdinComplete = rumdinEmptyItems.length === 0;
  const isRumdinPartial = rumdinFilledItems.length > 0 && !isRumdinComplete;
  // Sesuai aturan: jika masih ada sheet yang kosong, belum submit
  const isRumdinSubmitted = isRumdinComplete;

  const isBothSubmitted = isWapresSubmitted && isRumdinSubmitted;

  const unsubmittedTeams: ('WAPRES' | 'RUMDIN')[] = [];
  if (!isWapresSubmitted) unsubmittedTeams.push('WAPRES');
  if (!isRumdinSubmitted) unsubmittedTeams.push('RUMDIN');

  let instructionMessage = '';
  if (!isWapresSubmitted && !isRumdinSubmitted) {
    instructionMessage = 'Data di Google Sheets belum lengkap: Tim Wapres & Tim Rumdin belum submit. Mohon kedua tim segera menginput data shift ini!';
  } else if (!isWapresSubmitted) {
    instructionMessage = `Data di Google Sheets belum lengkap: Tim Wapres belum submit (Bagian kosong: ${wapresEmptyItems.join(', ')}). Mohon Tim Wapres segera menginput data!`;
  } else if (!isRumdinSubmitted) {
    instructionMessage = `Data di Google Sheets belum lengkap: Tim Rumdin belum submit (Bagian kosong: ${rumdinEmptyItems.join(', ')}). Mohon Tim Rumdin segera menginput data!`;
  } else {
    instructionMessage = 'Seluruh data di Google Sheets lengkap terisi (Kedua tim sudah submit).';
  }

  const missingInfo: SheetMissingInfo = {
    isWapresComplete,
    isRumdinComplete,
    isBothComplete: isBothSubmitted,
    isWapresPartial,
    isRumdinPartial,
    wapresEmptyItems,
    rumdinEmptyItems,
    wapresFilledItems,
    rumdinFilledItems,
    unsubmittedTeams,
    instructionMessage,
  };

  let wapres: TimWapresReport | null = null;
  if (wapresFilledItems.length > 0) {
    const officers = parseOfficersFromCell(acoTmRow[1] || ups30Row[1]);
    const inspectionDate = normalizeIndonesianDate(acoTmRow[2] || ups30Row[2]);
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
  if (rumdinFilledItems.length > 0) {
    const officers = parseOfficersFromCell(acoDipoRow[1] || acoSt12Row[1] || ups40DRow[1]);
    const inspectionDate = normalizeIndonesianDate(acoDipoRow[2] || acoSt12Row[2] || ups40DRow[2]);
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
    isBothSubmitted,
    wapres,
    rumdin,
    missingInfo,
    message: instructionMessage,
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

export interface FetchHistoryOptions {
  sheetLink?: string | null;
  spreadsheetId?: string | null;
  year?: number;
  month?: number;
}

export interface SheetHistoryResult {
  success: boolean;
  reports: CombinedShiftReport[];
  count: number;
  message?: string;
  source: 'server_proxy' | 'gviz' | 'none';
}

/**
 * Reads all submitted shift reports in the spreadsheet for the given month
 */
export async function fetchHistoryFromSpreadsheet(
  options: FetchHistoryOptions
): Promise<SheetHistoryResult> {
  const { sheetLink, spreadsheetId, year, month } = options;
  const sheetId = spreadsheetId || (sheetLink ? extractSpreadsheetId(sheetLink) : null);

  if (!sheetId) {
    return {
      success: false,
      reports: [],
      count: 0,
      source: 'none',
      message: 'ID spreadsheet atau link Google Sheets belum dikonfigurasi.',
    };
  }

  // 1. Try server proxy endpoint
  try {
    const res = await fetch('/api/sheets/read-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId: sheetId,
        sheetLink,
        year,
        month,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        return {
          success: true,
          reports: data.reports,
          count: data.reports.length,
          source: 'server_proxy',
        };
      }
    }
  } catch (err) {
    console.warn('Proxy history read failed, attempting direct GVIZ:', err);
  }

  // 2. Fallback: Direct GVIZ
  try {
    const gvizCetak = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK`;
    const gvizUps = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK_UPS`;

    const [rCetak, rUps] = await Promise.all([
      fetch(gvizCetak).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
      fetch(gvizUps).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
    ]);

    const rowsCetak = parseGvizResponseToRows(rCetak);
    const rowsUps = parseGvizResponseToRows(rUps);

    if (rowsCetak.length === 0 && rowsUps.length === 0) {
      return {
        success: false,
        reports: [],
        count: 0,
        source: 'none',
        message: 'Gagal memuat data dari spreadsheet via GVIZ.',
      };
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    const reports: CombinedShiftReport[] = [];
    const shifts: ShiftType[] = ['PAGI', 'SIANG', 'MALAM'];

    for (let day = 1; day <= 31; day++) {
      for (let offset = 0; offset < 3; offset++) {
        const shift = shifts[offset];
        const dateObj = new Date(targetYear, targetMonth - 1, day);
        if (dateObj.getMonth() !== targetMonth - 1) continue;

        const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const displayDate = formatIndonesianDate(dateObj);

        const parsed = parseGvizRowsIntoReports(rowsCetak, rowsUps, day, offset, dateKey, shift);
        if (parsed.isWapresSubmitted || parsed.isRumdinSubmitted) {
          reports.push({
            id: `${dateKey}_${shift}`,
            dateKey,
            displayDate,
            shift,
            wapres: parsed.wapres || undefined,
            rumdin: parsed.rumdin || undefined,
            createdAt: parsed.wapres?.submittedAt || parsed.rumdin?.submittedAt || new Date().toISOString(),
            updatedAt: parsed.wapres?.submittedAt || parsed.rumdin?.submittedAt || new Date().toISOString(),
          });
        }
      }
    }

    // Sort descending
    reports.sort((a, b) => {
      if (a.dateKey !== b.dateKey) {
        return b.dateKey.localeCompare(a.dateKey);
      }
      const shiftOrder: Record<ShiftType, number> = { MALAM: 3, SIANG: 2, PAGI: 1 };
      return (shiftOrder[b.shift] || 0) - (shiftOrder[a.shift] || 0);
    });

    return {
      success: true,
      reports,
      count: reports.length,
      source: 'gviz',
    };
  } catch (err: any) {
    return {
      success: false,
      reports: [],
      count: 0,
      source: 'none',
      message: err.message || 'Gagal membaca history dari spreadsheet.',
    };
  }
}

