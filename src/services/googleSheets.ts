import { TimWapresReport, TimRumdinReport, UPSData } from '../types';

export interface SheetTabMapping {
  acoTM?: string;
  acoTRDipo?: string;
  acoTRST12?: string;
  ups?: string;
}

export interface ActiveSpreadsheetInfo {
  id: string;
  url: string;
  title: string;
  sheetName: string; // default or primary
  sheetId?: number;
  availableSheets?: string[];
  sheetTabs?: SheetTabMapping;
}

const STORAGE_KEY_SPREADSHEET = 'monitoring_shift_active_spreadsheet';

export function getStoredSpreadsheet(): ActiveSpreadsheetInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPREADSHEET);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSpreadsheet(info: ActiveSpreadsheetInfo | null): void {
  if (!info) {
    localStorage.removeItem(STORAGE_KEY_SPREADSHEET);
  } else {
    localStorage.setItem(STORAGE_KEY_SPREADSHEET, JSON.stringify(info));
  }
}

export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function formatToDDMMYYYY(dateStrOrObj?: string | Date): string {
  const date = dateStrOrObj instanceof Date ? dateStrOrObj : new Date();
  if (typeof dateStrOrObj === 'string' && dateStrOrObj.includes('/')) {
    return dateStrOrObj;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getIndonesianMonthYear(date: Date = new Date()): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Styling Constants
const AMBER_BG_COLOR = { red: 1.0, green: 0.753, blue: 0.0 }; // #FFC000 Golden Yellow
const BLACK_BORDER = {
  style: 'SOLID',
  width: 1,
  color: { red: 0, green: 0, blue: 0 },
};

/**
 * Generate styling requests for ACO TM Gardu D 126
 */
function buildAcoTMFormatRequests(sheetId: number): any[] {
  return [
    // Merges
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: 3 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 6 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 6, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 10 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 10, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 12, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 14, endColumnIndex: 16 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 16, endColumnIndex: 17 }, mergeType: 'MERGE_ALL' } },
    // Format Header
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        cell: {
          userEnteredFormat: {
            backgroundColor: AMBER_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Borders
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        top: BLACK_BORDER, bottom: BLACK_BORDER, left: BLACK_BORDER, right: BLACK_BORDER,
        innerHorizontal: BLACK_BORDER, innerVertical: BLACK_BORDER,
      },
    },
    // Title
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 17 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13, underline: true }, horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },
    // Month
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 } } },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    // Column widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 6 }, properties: { pixelSize: 280 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 16 }, properties: { pixelSize: 75 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
  ];
}

/**
 * Generate styling requests for ACO TR DIPO
 */
function buildAcoDipoFormatRequests(sheetId: number): any[] {
  return [
    // Merges
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: 3 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 6 }, mergeType: 'MERGE_ALL' } }, // STATUS PENYULANG
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 6, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } }, // ALARM STATUS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 10 }, mergeType: 'MERGE_ALL' } }, // STATUS POWER ACO TR DIPO
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 10, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } }, // CHARGING
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 12, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } }, // REMOTE
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 14, endColumnIndex: 16 }, mergeType: 'MERGE_ALL' } }, // LAMPU
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 16, endColumnIndex: 17 }, mergeType: 'MERGE_ALL' } }, // KETERANGAN
    // Format Header
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        cell: {
          userEnteredFormat: {
            backgroundColor: AMBER_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Borders
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        top: BLACK_BORDER, bottom: BLACK_BORDER, left: BLACK_BORDER, right: BLACK_BORDER,
        innerHorizontal: BLACK_BORDER, innerVertical: BLACK_BORDER,
      },
    },
    // Title
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 17 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13, underline: true }, horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },
    // Month
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 } } },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    // Widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 6 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 16 }, properties: { pixelSize: 75 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
  ];
}

/**
 * Generate styling requests for ACO TR ST 12 (Situbondo 12)
 */
function buildAcoST12FormatRequests(sheetId: number): any[] {
  return [
    // Merges
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: 3 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 6 }, mergeType: 'MERGE_ALL' } }, // STATUS PENYULANG
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 6, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } }, // ALARM STATUS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 10 }, mergeType: 'MERGE_ALL' } }, // STATUS POWER ACO TR ST 12
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 10, endColumnIndex: 12 }, mergeType: 'MERGE_ALL' } }, // CHARGING
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 12, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } }, // REMOTE
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 14, endColumnIndex: 16 }, mergeType: 'MERGE_ALL' } }, // LAMPU
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 16, endColumnIndex: 17 }, mergeType: 'MERGE_ALL' } }, // KETERANGAN
    // Format Header
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        cell: {
          userEnteredFormat: {
            backgroundColor: AMBER_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Borders
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 17 },
        top: BLACK_BORDER, bottom: BLACK_BORDER, left: BLACK_BORDER, right: BLACK_BORDER,
        innerHorizontal: BLACK_BORDER, innerVertical: BLACK_BORDER,
      },
    },
    // Title
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 17 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13, underline: true }, horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },
    // Month
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 } } },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    // Widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 6 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 16 }, properties: { pixelSize: 75 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
  ];
}

/**
 * Generate styling requests for LAPORAN_CETAK_UPS
 */
function buildUpsFormatRequests(sheetId: number): any[] {
  return [
    // Merges
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: 3 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 4, endColumnIndex: 5 }, mergeType: 'MERGE_ALL' } }, // LOKASI / UNIT
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 5, endColumnIndex: 8 }, mergeType: 'MERGE_ALL' } }, // BEBAN ARUS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 11 }, mergeType: 'MERGE_ALL' } }, // TEGANGAN FASA-NETRAL
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 11, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } }, // TEGANGAN ANTAR-FASA
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 14, endColumnIndex: 15 }, mergeType: 'MERGE_ALL' } }, // SUHU
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 15, endColumnIndex: 16 }, mergeType: 'MERGE_ALL' } }, // STATUS ALARM
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 16, endColumnIndex: 17 }, mergeType: 'MERGE_ALL' } }, // BACKUP TIME
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 17, endColumnIndex: 18 }, mergeType: 'MERGE_ALL' } }, // KETERANGAN
    // Format Header
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: AMBER_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Borders
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 18 },
        top: BLACK_BORDER, bottom: BLACK_BORDER, left: BLACK_BORDER, right: BLACK_BORDER,
        innerHorizontal: BLACK_BORDER, innerVertical: BLACK_BORDER,
      },
    },
    // Title
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 18 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13, underline: true }, horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },
    // Month
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 11 } } },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    // Widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 190 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 14 }, properties: { pixelSize: 70 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 14, endIndex: 15 }, properties: { pixelSize: 85 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 15, endIndex: 16 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 115 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 17, endIndex: 18 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
  ];
}

/**
 * Creates the complete multi-sheet Google Spreadsheet with all official monitoring tables:
 * 1. ACO TM D 126 (Istana Wapres)
 * 2. ACO TR DIPO (Rumah Dinas Dipo)
 * 3. ACO TR ST 12 (Rumah Dinas Situbondo 12)
 * 4. LAPORAN_CETAK_UPS (Beban UPS Dipo, ST12, Wapres)
 */
export async function createFullMonitoringSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<ActiveSpreadsheetInfo> {
  const currentMonthYear = getIndonesianMonthYear();
  const title =
    customTitle ||
    `PANTAUAN INSPEKSI KELISTRIKAN WAPRES & RUMDIN - ${new Date().getFullYear()}`;

  // 1. Create spreadsheet with all 4 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'ACO TM D 126', gridProperties: { rowCount: 150, columnCount: 18, frozenRowCount: 5 } } },
        { properties: { title: 'ACO TR DIPO', gridProperties: { rowCount: 150, columnCount: 18, frozenRowCount: 5 } } },
        { properties: { title: 'ACO TR ST 12', gridProperties: { rowCount: 150, columnCount: 18, frozenRowCount: 5 } } },
        { properties: { title: 'LAPORAN_CETAK_UPS', gridProperties: { rowCount: 200, columnCount: 19, frozenRowCount: 5 } } },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const sheets = createdData.sheets || [];

  const tmSheetId = sheets[0]?.properties?.sheetId ?? 0;
  const dipoSheetId = sheets[1]?.properties?.sheetId ?? 1;
  const st12SheetId = sheets[2]?.properties?.sheetId ?? 2;
  const upsSheetId = sheets[3]?.properties?.sheetId ?? 3;

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Headers for all 4 sheets via batchUpdate values
  const dataValueRanges = [
    {
      range: 'ACO TM D 126!A1:Q5',
      values: [
        [],
        ['', '', 'PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )'],
        ['', `Bulan :${currentMonthYear}`],
        [
          'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
          'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TM D 126', '',
          'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
          'KETERANGAN',
        ],
        ['', '', '', '', 'CLOSE', 'OPEN', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
      ],
    },
    {
      range: 'ACO TR DIPO!A1:Q5',
      values: [
        [],
        ['', '', 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (DIPO)'],
        ['', `Bulan :${currentMonthYear}`],
        [
          'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
          'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TR DIPO', '',
          'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
          'KETERANGAN',
        ],
        ['', '', '', '', 'GARDU T15N', 'GARDU T135', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
      ],
    },
    {
      range: 'ACO TR ST 12!A1:Q5',
      values: [
        [],
        ['', '', 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (SITUBONDO 12)'],
        ['', `Bulan :${currentMonthYear}`],
        [
          'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
          'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TR ST 12', '',
          'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
          'KETERANGAN',
        ],
        ['', '', '', '', 'CLOSE', 'OPEN', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
      ],
    },
    {
      range: 'LAPORAN_CETAK_UPS!A1:R5',
      values: [
        [],
        ['', '', 'PANTAUAN INSPEKSI BEBAN DAN TEGANGAN UPS (RUMAH DINAS & ISTANA WAPRES)'],
        ['', `Bulan :${currentMonthYear}`],
        [
          'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI', 'LOKASI / UNIT UPS',
          'BEBAN ARUS (A)', '', '', 'TEGANGAN FASA-NETRAL (V)', '', '', 'TEGANGAN ANTAR-FASA (V)', '', '',
          'SUHU', 'ALARM STATUS', 'BACKUP TIME', 'KETERANGAN',
        ],
        ['', '', '', '', '', 'R', 'S', 'T', 'R-N', 'S-N', 'T-N', 'R-S', 'S-T', 'R-T', '(°C)', 'NORMAL/ALARM', 'JAM/MENIT', ''],
      ],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataValueRanges,
    }),
  });

  // 3. BatchUpdate for Merges, Golden Header Background, Borders, Alignment, and Column Widths on all 4 sheets
  const requests: any[] = [
    ...buildAcoTMFormatRequests(tmSheetId),
    ...buildAcoDipoFormatRequests(dipoSheetId),
    ...buildAcoST12FormatRequests(st12SheetId),
    ...buildUpsFormatRequests(upsSheetId),
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  const result: ActiveSpreadsheetInfo = {
    id: spreadsheetId,
    url: spreadsheetUrl,
    title,
    sheetName: 'ACO TM D 126',
    sheetId: tmSheetId,
    availableSheets: ['ACO TM D 126', 'ACO TR DIPO', 'ACO TR ST 12', 'LAPORAN_CETAK_UPS'],
    sheetTabs: {
      acoTM: 'ACO TM D 126',
      acoTRDipo: 'ACO TR DIPO',
      acoTRST12: 'ACO TR ST 12',
      ups: 'LAPORAN_CETAK_UPS',
    },
  };

  saveStoredSpreadsheet(result);
  return result;
}

// Alias for backwards compatibility
export const createAcoWapresSpreadsheet = createFullMonitoringSpreadsheet;

/**
 * Connect to an existing spreadsheet and automatically discover sheet tabs
 */
export async function connectExistingSpreadsheet(
  accessToken: string,
  spreadsheetIdOrUrl: string
): Promise<ActiveSpreadsheetInfo> {
  const id = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!id) {
    throw new Error('ID atau URL Google Spreadsheet tidak valid.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.error?.message ||
        'Gagal mengakses spreadsheet. Pastikan link benar dan akun Anda memiliki izin edit.'
    );
  }

  const data = await res.json();
  const title = data.properties?.title || 'Spreadsheet Pantauan ACO & UPS';
  const sheetsList: any[] = data.sheets || [];
  const availableTitles: string[] = sheetsList.map((s) => s.properties?.title || '').filter(Boolean);

  // Map sheet tabs intelligently
  const findTab = (candidates: string[]): string | undefined => {
    for (const c of candidates) {
      const found = availableTitles.find((t) => t.toLowerCase().includes(c.toLowerCase()));
      if (found) return found;
    }
    return undefined;
  };

  const sheetTabs: SheetTabMapping = {
    acoTM: findTab(['TM D 126', 'ACO TM', 'D 126', 'D126', 'LAPORAN_CETAK', availableTitles[0] || 'Sheet1']),
    acoTRDipo: findTab(['DIPO', 'ACO TR DIPO', 'LAPORAN_CETAK', availableTitles[0] || 'Sheet1']),
    acoTRST12: findTab(['ST 12', 'ST12', 'SITUBONDO', 'ACO TR ST 12', 'LAPORAN_CETAK', availableTitles[0] || 'Sheet1']),
    ups: findTab(['LAPORAN_CETAK_UPS', 'UPS', 'BEBAN', availableTitles[0] || 'Sheet1']),
  };

  const firstSheet = sheetsList[0];
  const defaultSheetName = sheetTabs.acoTM || firstSheet?.properties?.title || 'Sheet1';
  const sheetId = firstSheet?.properties?.sheetId || 0;
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;

  const info: ActiveSpreadsheetInfo = {
    id,
    url,
    title,
    sheetName: defaultSheetName,
    sheetId,
    availableSheets: availableTitles,
    sheetTabs,
  };

  saveStoredSpreadsheet(info);
  return info;
}

/**
 * Ensure a specific sheet tab exists in an existing spreadsheet; creates and styles it if missing.
 */
export async function ensureSheetTab(
  accessToken: string,
  spreadsheetId: string,
  tabType: 'acoTM' | 'acoTRDipo' | 'acoTRST12' | 'ups',
  preferredTitle?: string
): Promise<string> {
  // 1. Fetch metadata
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Gagal memeriksa lembar kerja spreadsheet.');
  const data = await res.json();
  const existingSheets: any[] = data.sheets || [];

  const defaultTitles: Record<string, string> = {
    acoTM: 'ACO TM D 126',
    acoTRDipo: 'ACO TR DIPO',
    acoTRST12: 'ACO TR ST 12',
    ups: 'LAPORAN_CETAK_UPS',
  };

  const targetTitle = preferredTitle || defaultTitles[tabType];
  const matched = existingSheets.find(
    (s) => s.properties?.title?.toLowerCase() === targetTitle.toLowerCase()
  );

  if (matched) {
    return matched.properties.title;
  }

  // Check if there is a general LAPORAN_CETAK tab that user might want to use
  if (tabType !== 'ups') {
    const cetakMatch = existingSheets.find(
      (s) => s.properties?.title?.toLowerCase() === 'laporan_cetak'
    );
    if (cetakMatch) return cetakMatch.properties.title;
  } else {
    const upsMatch = existingSheets.find((s) =>
      s.properties?.title?.toLowerCase().includes('ups')
    );
    if (upsMatch) return upsMatch.properties.title;
  }

  // If not found, add the sheet tab
  const addRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: targetTitle,
                gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 5 },
              },
            },
          },
        ],
      }),
    }
  );

  if (!addRes.ok) {
    // If adding failed, return the first existing sheet title
    return existingSheets[0]?.properties?.title || 'Sheet1';
  }

  const addData = await addRes.json();
  const newSheetId = addData.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
  const currentMonthYear = getIndonesianMonthYear();

  // Populate headers and styling
  let headerRows: any[] = [];
  let formatRequests: any[] = [];

  if (tabType === 'acoTM') {
    headerRows = [
      [],
      ['', '', 'PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )'],
      ['', `Bulan :${currentMonthYear}`],
      [
        'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
        'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TM D 126', '',
        'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
        'KETERANGAN',
      ],
      ['', '', '', '', 'CLOSE', 'OPEN', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
    ];
    formatRequests = buildAcoTMFormatRequests(newSheetId);
  } else if (tabType === 'acoTRDipo') {
    headerRows = [
      [],
      ['', '', 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (DIPO)'],
      ['', `Bulan :${currentMonthYear}`],
      [
        'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
        'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TR DIPO', '',
        'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
        'KETERANGAN',
      ],
      ['', '', '', '', 'GARDU T15N', 'GARDU T135', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
    ];
    formatRequests = buildAcoDipoFormatRequests(newSheetId);
  } else if (tabType === 'acoTRST12') {
    headerRows = [
      [],
      ['', '', 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (SITUBONDO 12)'],
      ['', `Bulan :${currentMonthYear}`],
      [
        'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI',
        'STATUS PENYULANG', '', 'ALARM STATUS', '', 'STATUS POWER ACO TR ST 12', '',
        'STATUS CHARGING KUBIKEL', '', 'STATUS REMOTE KUBIKEL', '', 'LAMPU INDIKATOR', '',
        'KETERANGAN',
      ],
      ['', '', '', '', 'CLOSE', 'OPEN', 'ALARM', 'NORMAL', 'ON', 'OFF', 'YA', 'TIDAK', 'LOCAL', 'AUTO', 'ON', 'OFF', ''],
    ];
    formatRequests = buildAcoST12FormatRequests(newSheetId);
  } else {
    headerRows = [
      [],
      ['', '', 'PANTAUAN INSPEKSI BEBAN DAN TEGANGAN UPS (RUMAH DINAS & ISTANA WAPRES)'],
      ['', `Bulan :${currentMonthYear}`],
      [
        'NO', 'NAMA PETUGAS', 'TANGGAL/BULAN/TAHUN', 'JAM INSPEKSI', 'LOKASI / UNIT UPS',
        'BEBAN ARUS (A)', '', '', 'TEGANGAN FASA-NETRAL (V)', '', '', 'TEGANGAN ANTAR-FASA (V)', '', '',
        'SUHU', 'ALARM STATUS', 'BACKUP TIME', 'KETERANGAN',
      ],
      ['', '', '', '', '', 'R', 'S', 'T', 'R-N', 'S-N', 'T-N', 'R-S', 'S-T', 'R-T', '(°C)', 'NORMAL/ALARM', 'JAM/MENIT', ''],
    ];
    formatRequests = buildUpsFormatRequests(newSheetId);
  }

  // Write values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetTitle
    )}!A1:R5?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: headerRows }),
    }
  );

  // Apply styles
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: formatRequests }),
    }
  );

  return targetTitle;
}

/**
 * Read existing rows to determine sequence number and day groupings.
 */
export async function getExistingSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  startRow: number = 6,
  endCol: string = 'Q'
): Promise<{ rows: string[][]; nextRowIndex: number; calculatedNo: number }> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetName
      )}!A${startRow}:${endCol}1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return { rows: [], nextRowIndex: startRow, calculatedNo: 1 };
    }

    const data = await res.json();
    const rows = (data.values || []) as string[][];

    let maxNo = 0;
    for (const row of rows) {
      const colA = parseInt(row[0] || '0', 10);
      if (!isNaN(colA) && colA > maxNo) {
        maxNo = colA;
      }
    }

    const calculatedNo = maxNo > 0 ? maxNo + 1 : 1;
    const nextRowIndex = startRow + rows.length;

    return { rows, nextRowIndex, calculatedNo };
  } catch {
    return { rows: [], nextRowIndex: startRow, calculatedNo: 1 };
  }
}

/**
 * Append ACO TM Wapres record to the spreadsheet.
 */
export async function appendAcoWapresRecord(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  wapresReport: TimWapresReport,
  customNo?: number
): Promise<{ success: boolean; rowNumber: number }> {
  const targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTM', sheetName);
  const { rows, nextRowIndex, calculatedNo } = await getExistingSheetRows(
    accessToken,
    spreadsheetId,
    targetSheet,
    6,
    'Q'
  );

  const officers = wapresReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  const timeFormatted = wapresReport.inspectionTime || 'WIB';

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastDate = lastRow ? lastRow[2] : null;
  const isSameDateAsLast = lastDate === dateFormatted;

  let rowNoValue = '';
  if (customNo !== undefined) {
    rowNoValue = String(customNo);
  } else if (!isSameDateAsLast) {
    rowNoValue = String(calculatedNo);
  } else {
    rowNoValue = '';
  }

  const aco = wapresReport.acoTM;

  const rowValues = [
    rowNoValue,
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

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A6:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A6:Q`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan baris ACO TM ke Google Sheets.');
  }

  return { success: true, rowNumber: nextRowIndex };
}

/**
 * Append ACO TR DIPO record to Google Sheets (Image 2 format).
 */
export async function appendAcoDipoRecord(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'ACO TR DIPO',
  rumdinReport: TimRumdinReport
): Promise<{ success: boolean; rowNumber: number }> {
  const targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRDipo', sheetName);
  const { rows, nextRowIndex, calculatedNo } = await getExistingSheetRows(
    accessToken,
    spreadsheetId,
    targetSheet,
    6,
    'Q'
  );

  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastDate = lastRow ? lastRow[2] : null;
  const isSameDateAsLast = lastDate === dateFormatted;

  const rowNoValue = !isSameDateAsLast ? String(calculatedNo) : '';

  const dipo = rumdinReport.acoTRDipo;

  // In Image 2:
  // Col E: GARDU T15N (CLOSE or OPEN)
  // Col F: GARDU T135 (OPEN or CLOSE)
  const rowValues = [
    rowNoValue, // A: NO
    officersStr, // B: NAMA PETUGAS
    dateFormatted, // C: TANGGAL/BULAN/TAHUN
    timeFormatted, // D: JAM INSPEKSI
    dipo.garduT15NStatus || 'CLOSE', // E: STATUS GARDU T15N
    dipo.garduT135Status || 'OPEN', // F: STATUS GARDU T135
    dipo.alarmStatus === 'ALARM' ? 'ALARM' : '-', // G: ALARM
    dipo.alarmStatus === 'NORMAL' ? 'NORMAL' : '-', // H: NORMAL
    dipo.powerACO === 'ON' ? 'ON' : '-', // I: POWER ON
    dipo.powerACO === 'OFF' ? 'OFF' : '-', // J: POWER OFF
    '-', // K: CHARGING YA
    '-', // L: CHARGING TIDAK
    '-', // M: REMOTE LOCAL
    '-', // N: REMOTE AUTO
    dipo.lampuIndikator === 'ON' ? 'ON' : '-', // O: LAMPU ON
    dipo.lampuIndikator === 'OFF' ? 'OFF' : '-', // P: LAMPU OFF
    dipo.keterangan || '-', // Q: KETERANGAN
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A6:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A6:Q`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan baris ACO TR DIPO ke Google Sheets.');
  }

  return { success: true, rowNumber: nextRowIndex };
}

/**
 * Append ACO TR ST 12 (Situbondo 12) record to Google Sheets (Image 1 format).
 */
export async function appendAcoST12Record(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'ACO TR ST 12',
  rumdinReport: TimRumdinReport
): Promise<{ success: boolean; rowNumber: number }> {
  const targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRST12', sheetName);
  const { rows, nextRowIndex, calculatedNo } = await getExistingSheetRows(
    accessToken,
    spreadsheetId,
    targetSheet,
    6,
    'Q'
  );

  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastDate = lastRow ? lastRow[2] : null;
  const isSameDateAsLast = lastDate === dateFormatted;

  const rowNoValue = !isSameDateAsLast ? String(calculatedNo) : '';

  const st12 = rumdinReport.acoTRST12;

  // In Image 1:
  // Col E: CLOSE (e.g. GARDU T93)
  // Col F: OPEN (e.g. GARDU T10B)
  const isT93Close = st12.garduT93Status === 'CLOSE' || (!st12.garduT93Status && st12.garduT10BStatus !== 'CLOSE');
  const penyulangClose = isT93Close ? 'GARDU T93' : 'GARDU T10B';
  const penyulangOpen = isT93Close ? 'GARDU T10B' : 'GARDU T93';

  const rowValues = [
    rowNoValue, // A: NO
    officersStr, // B: NAMA PETUGAS
    dateFormatted, // C: TANGGAL/BULAN/TAHUN
    timeFormatted, // D: JAM INSPEKSI
    st12.penyulangClose || penyulangClose, // E: STATUS PENYULANG CLOSE
    st12.penyulangOpen || penyulangOpen, // F: STATUS PENYULANG OPEN
    st12.alarmStatus === 'ALARM' ? 'ALARM' : '-', // G: ALARM
    st12.alarmStatus === 'NORMAL' ? 'NORMAL' : '-', // H: NORMAL
    st12.powerACO === 'ON' ? 'ON' : '-', // I: POWER ON
    st12.powerACO === 'OFF' ? 'OFF' : '-', // J: POWER OFF
    '-', // K: CHARGING YA
    '-', // L: CHARGING TIDAK
    '-', // M: REMOTE LOCAL
    '-', // N: REMOTE AUTO
    st12.lampuIndikator === 'ON' ? 'ON' : '-', // O: LAMPU ON
    st12.lampuIndikator === 'OFF' ? 'OFF' : '-', // P: LAMPU OFF
    st12.keterangan || '-', // Q: KETERANGAN
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A6:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A6:Q`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan baris ACO TR ST 12 ke Google Sheets.');
  }

  return { success: true, rowNumber: nextRowIndex };
}

/**
 * Format single UPS row
 */
function buildUpsRow(
  noValue: string,
  officersStr: string,
  dateFormatted: string,
  timeFormatted: string,
  unitLabel: string,
  ups: UPSData
): string[] {
  const backupStr =
    ups.backupHours || ups.backupMinutes
      ? `${ups.backupHours || '0'} Jam ${ups.backupMinutes || '0'} Menit`
      : '-';

  return [
    noValue,
    officersStr,
    dateFormatted,
    timeFormatted,
    unitLabel,
    ups.loadR || '-',
    ups.loadS || '-',
    ups.loadT || '-',
    ups.voltRN || '-',
    ups.voltSN || '-',
    ups.voltTN || '-',
    ups.voltRS || '-',
    ups.voltST || '-',
    ups.voltRT || '-',
    ups.temperature ? `${ups.temperature} °C` : '-',
    ups.alarm || 'NORMAL',
    backupStr,
    ups.keterangan || '-',
  ];
}

/**
 * Append UPS Rumdin Records (UPS 40 Dipo & UPS 100 ST12) to LAPORAN_CETAK_UPS.
 */
export async function appendRumdinUpsRecords(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'LAPORAN_CETAK_UPS',
  rumdinReport: TimRumdinReport
): Promise<{ success: boolean; rowsAdded: number }> {
  const targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'ups', sheetName);
  const { rows, calculatedNo } = await getExistingSheetRows(
    accessToken,
    spreadsheetId,
    targetSheet,
    6,
    'R'
  );

  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const isSameDateAsLast = lastRow ? lastRow[2] === dateFormatted : false;
  const noValue = !isSameDateAsLast ? String(calculatedNo) : '';

  const upsRows = [
    buildUpsRow(
      noValue,
      officersStr,
      dateFormatted,
      timeFormatted,
      'UPS 40 KVA RUMDIN (DIPO)',
      rumdinReport.ups40Dipo
    ),
    buildUpsRow(
      '',
      officersStr,
      dateFormatted,
      timeFormatted,
      'UPS 100 KVA RUMDIN (ST12)',
      rumdinReport.ups100ST12
    ),
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A6:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A6:R`,
        majorDimension: 'ROWS',
        values: upsRows,
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan data UPS Rumdin ke Google Sheets.');
  }

  return { success: true, rowsAdded: upsRows.length };
}

/**
 * Append UPS Wapres Records (UPS 30, 40, 60 KVA) to LAPORAN_CETAK_UPS.
 */
export async function appendWapresUpsRecords(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'LAPORAN_CETAK_UPS',
  wapresReport: TimWapresReport
): Promise<{ success: boolean; rowsAdded: number }> {
  const targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'ups', sheetName);
  const { rows, calculatedNo } = await getExistingSheetRows(
    accessToken,
    spreadsheetId,
    targetSheet,
    6,
    'R'
  );

  const officers = wapresReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  const timeFormatted = wapresReport.inspectionTime || 'WIB';

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const isSameDateAsLast = lastRow ? lastRow[2] === dateFormatted : false;
  const noValue = !isSameDateAsLast ? String(calculatedNo) : '';

  const upsRows = [
    buildUpsRow(
      noValue,
      officersStr,
      dateFormatted,
      timeFormatted,
      'UPS 30 KVA WAPRES (LANTAI 1)',
      wapresReport.ups30
    ),
    buildUpsRow(
      '',
      officersStr,
      dateFormatted,
      timeFormatted,
      'UPS 40 KVA WAPRES (LANTAI 2)',
      wapresReport.ups40
    ),
    buildUpsRow(
      '',
      officersStr,
      dateFormatted,
      timeFormatted,
      'UPS 60 KVA WAPRES (LANTAI 3)',
      wapresReport.ups60
    ),
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A6:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A6:R`,
        majorDimension: 'ROWS',
        values: upsRows,
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan data UPS Wapres ke Google Sheets.');
  }

  return { success: true, rowsAdded: upsRows.length };
}

/**
 * Append all Tim Rumdin data (ACO Dipo + ACO ST12 + UPS 40 & 100) in one sweep
 */
export async function appendAllRumdinRecords(
  accessToken: string,
  spreadsheetId: string,
  rumdinReport: TimRumdinReport,
  tabs?: SheetTabMapping
): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];

  // 1. ACO TR Dipo
  try {
    await appendAcoDipoRecord(accessToken, spreadsheetId, tabs?.acoTRDipo || 'ACO TR DIPO', rumdinReport);
    messages.push('ACO TR DIPO');
  } catch (err: any) {
    console.error('DIPO sync error:', err);
    throw new Error(`Gagal sync ACO Dipo: ${err.message}`);
  }

  // 2. ACO TR ST 12
  try {
    await appendAcoST12Record(accessToken, spreadsheetId, tabs?.acoTRST12 || 'ACO TR ST 12', rumdinReport);
    messages.push('ACO TR ST 12');
  } catch (err: any) {
    console.error('ST12 sync error:', err);
    throw new Error(`Gagal sync ACO ST12: ${err.message}`);
  }

  // 3. UPS Rumdin (Dipo & ST12)
  try {
    await appendRumdinUpsRecords(accessToken, spreadsheetId, tabs?.ups || 'LAPORAN_CETAK_UPS', rumdinReport);
    messages.push('UPS Rumdin (40 & 100 KVA)');
  } catch (err: any) {
    console.error('UPS Rumdin sync error:', err);
    throw new Error(`Gagal sync UPS Rumdin: ${err.message}`);
  }

  return { success: true, messages };
}
