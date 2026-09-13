import { TimWapresReport, TimRumdinReport, UPSData, ShiftType } from '../types';

export interface SheetTabMapping {
  acoTM?: string;
  acoTRDipo?: string;
  acoTRST12?: string;
  ups?: string; // generic fallback or LAPORAN_CETAK_UPS
  ups30Wapres?: string;
  ups40Wapres?: string;
  ups60Wapres?: string;
  ups40Dipo?: string;
  ups100ST12?: string;
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
  if (typeof dateStrOrObj === 'string') {
    const trimmed = dateStrOrObj.trim();
    if (trimmed.includes('/')) return trimmed;
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  const date = dateStrOrObj instanceof Date ? dateStrOrObj : new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function extractDayOfMonth(dateStrOrObj?: string | Date): number {
  if (typeof dateStrOrObj === 'string') {
    const trimmed = dateStrOrObj.trim();
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d) && d >= 1 && d <= 31) return d;
      }
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      const d = parseInt(parts[0], 10);
      if (!isNaN(d) && d >= 1 && d <= 31) return d;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.getDate();
    }
  }
  const date = dateStrOrObj instanceof Date ? dateStrOrObj : new Date();
  return date.getDate();
}

export function getShiftOffset(shift?: string): number {
  const s = String(shift || '').toUpperCase();
  if (s === 'PAGI') return 0;
  if (s === 'SIANG') return 1;
  if (s === 'MALAM') return 2;
  return 0;
}

export function calculateSlotRow(
  dayOfMonth: number,
  shift: string = 'PAGI',
  baseStartRow: number = 6
): number {
  const d = Math.max(1, Math.min(31, dayOfMonth));
  const offset = getShiftOffset(shift);
  return baseStartRow + (d - 1) * 3 + offset;
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
const AMBER_BG_COLOR = { red: 1.0, green: 0.753, blue: 0.0 }; // #FFC000 Golden Yellow (ACO)
const CYAN_BG_COLOR = { red: 0.0, green: 0.69, blue: 0.941 }; // #00B0F0 Vivid Cyan (UPS Header)
const ORANGE_BG_COLOR = { red: 1.0, green: 0.647, blue: 0.0 }; // #FFA500 Golden Orange (UPS Beban Title)
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
 * Header values generator for UPS sheets matching official Istana / Rumdin layout
 */
export function buildUpsHeaderValues(titleText: string, sectionText: string): any[][] {
  return [
    [], // Row 1
    ['', '', '', '', titleText], // Row 2: Centered Underlined Title
    [], // Row 3
    [
      'NO',
      'NAMA PETUGAS',
      'TANGGAL/\nBULAN/\nTAHUN',
      'JAM\nINSPEKSI',
      sectionText, // Row 4 Cols E-M: Merged Beban Title with Orange BG
      '', '', '', '', '', '', '', '',
      'TEMPERAT\nUR UPS',
      'ALARM\nUPS',
      'BACK UP TIME UPS',
      '',
      'KETERANG\nAN',
    ], // Row 4
    [
      '', '', '', '',
      'R', 'S', 'T',
      'R', 'S', 'T',
      'R', 'S', 'T',
      '', '', '', '', '',
    ], // Row 5
    [
      '', '', '', '',
      '(A)', '(A)', '(A)',
      '(R-N)', '(S-N)', '(T-N)',
      '(R-S)', '(R-T)', '(S-T)',
      '', '',
      'HOURS',
      'MINUTES',
      '',
    ], // Row 6
  ];
}

/**
 * Generate styling requests for UPS sheets (Cyan #00B0F0 headers, Orange #FFA500 section header, black borders)
 */
export function buildUpsFormatRequests(sheetId: number): any[] {
  return [
    // Merges for rows 4 to 6 (0-indexed: startRowIndex: 3, endRowIndex: 6)
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 1 }, mergeType: 'MERGE_ALL' } }, // A: NO
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 1, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } }, // B: NAMA PETUGAS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 2, endColumnIndex: 3 }, mergeType: 'MERGE_ALL' } }, // C: TANGGAL/ BULAN/ TAHUN
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 3, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } }, // D: JAM INSPEKSI
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 13 }, mergeType: 'MERGE_ALL' } }, // E-M: BEBAN UPS ... (Row 4 only)
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 13, endColumnIndex: 14 }, mergeType: 'MERGE_ALL' } }, // N: TEMPERATUR UPS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 14, endColumnIndex: 15 }, mergeType: 'MERGE_ALL' } }, // O: ALARM UPS
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 15, endColumnIndex: 17 }, mergeType: 'MERGE_ALL' } }, // P-Q: BACK UP TIME UPS (Rows 4-5)
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 17, endColumnIndex: 18 }, mergeType: 'MERGE_ALL' } }, // R: KETERANGAN

    // Title Row 2 (0-indexed: startRowIndex: 1, endRowIndex: 2, cols 0-18)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 13, underline: true },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)',
      },
    },

    // 1. All header cells (Rows 4-6, Cols A-R) receive Cyan Background (#00B0F0)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: CYAN_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },

    // 2. Row 4, Cols E-M (Beban UPS Title) receives Orange Background (#FFA500)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 13 },
        cell: {
          userEnteredFormat: {
            backgroundColor: ORANGE_BG_COLOR,
            textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0, green: 0, blue: 0 } },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },

    // Borders for header (Rows 4-6, Cols A-R)
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 18 },
        top: BLACK_BORDER,
        bottom: BLACK_BORDER,
        left: BLACK_BORDER,
        right: BLACK_BORDER,
        innerHorizontal: BLACK_BORDER,
        innerVertical: BLACK_BORDER,
      },
    },

    // Default formatting for data rows (Rows 7 to 200, Cols A-R)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 200, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)',
      },
    },

    // Column widths matching reference image
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 45 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 115 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 95 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 13 }, properties: { pixelSize: 75 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 13, endIndex: 14 }, properties: { pixelSize: 85 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 14, endIndex: 15 }, properties: { pixelSize: 85 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 15, endIndex: 16 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 17, endIndex: 18 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
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

  // 1. Create spreadsheet with all monitoring sheets
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
        { properties: { title: 'UPS 30 KVA WAPRES', gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 6 } } },
        { properties: { title: 'UPS 40 KVA WAPRES', gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 6 } } },
        { properties: { title: 'UPS 60 KVA WAPRES', gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 6 } } },
        { properties: { title: 'UPS 40 KVA DIPO', gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 6 } } },
        { properties: { title: 'UPS 100 KVA ST 12', gridProperties: { rowCount: 150, columnCount: 19, frozenRowCount: 6 } } },
        { properties: { title: 'LAPORAN_CETAK_UPS', gridProperties: { rowCount: 200, columnCount: 19, frozenRowCount: 6 } } },
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
  const ups30WapresSheetId = sheets[3]?.properties?.sheetId ?? 3;
  const ups40WapresSheetId = sheets[4]?.properties?.sheetId ?? 4;
  const ups60WapresSheetId = sheets[5]?.properties?.sheetId ?? 5;
  const ups40DipoSheetId = sheets[6]?.properties?.sheetId ?? 6;
  const ups100ST12SheetId = sheets[7]?.properties?.sheetId ?? 7;
  const lapCetakUpsSheetId = sheets[8]?.properties?.sheetId ?? 8;

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Headers for all sheets via batchUpdate values
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
      range: 'UPS 30 KVA WAPRES!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN', 'BEBAN UPS 30 KVA WAKIL PRESIDEN (LT 1)'),
    },
    {
      range: 'UPS 40 KVA WAPRES!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN', 'BEBAN UPS 40 KVA WAKIL PRESIDEN (LT 2)'),
    },
    {
      range: 'UPS 60 KVA WAPRES!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN', 'BEBAN UPS 60 KVA WAKIL PRESIDEN (LT 3)'),
    },
    {
      range: 'UPS 40 KVA DIPO!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)', 'BEBAN UPS 40 KVA RUMAH DINAS (DIPO)'),
    },
    {
      range: 'UPS 100 KVA ST 12!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)', 'BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)'),
    },
    {
      range: 'LAPORAN_CETAK_UPS!A1:R6',
      values: buildUpsHeaderValues('PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN & RUMDIN', 'BEBAN UPS WAPRES & RUMDIN'),
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

  // 3. BatchUpdate for Merges, Colors (Cyan & Orange for UPS, Amber for ACO), Borders, Alignment, and Widths
  const requests: any[] = [
    ...buildAcoTMFormatRequests(tmSheetId),
    ...buildAcoDipoFormatRequests(dipoSheetId),
    ...buildAcoST12FormatRequests(st12SheetId),
    ...buildUpsFormatRequests(ups30WapresSheetId),
    ...buildUpsFormatRequests(ups40WapresSheetId),
    ...buildUpsFormatRequests(ups60WapresSheetId),
    ...buildUpsFormatRequests(ups40DipoSheetId),
    ...buildUpsFormatRequests(ups100ST12SheetId),
    ...buildUpsFormatRequests(lapCetakUpsSheetId),
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
    availableSheets: [
      'ACO TM D 126',
      'ACO TR DIPO',
      'ACO TR ST 12',
      'UPS 30 KVA WAPRES',
      'UPS 40 KVA WAPRES',
      'UPS 60 KVA WAPRES',
      'UPS 40 KVA DIPO',
      'UPS 100 KVA ST 12',
      'LAPORAN_CETAK_UPS',
    ],
    sheetTabs: {
      acoTM: 'ACO TM D 126',
      acoTRDipo: 'ACO TR DIPO',
      acoTRST12: 'ACO TR ST 12',
      ups30Wapres: 'UPS 30 KVA WAPRES',
      ups40Wapres: 'UPS 40 KVA WAPRES',
      ups60Wapres: 'UPS 60 KVA WAPRES',
      ups40Dipo: 'UPS 40 KVA DIPO',
      ups100ST12: 'UPS 100 KVA ST 12',
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
    acoTRDipo: findTab(['ACO TR DIPO', 'DIPO', 'LAPORAN_CETAK', availableTitles[0] || 'Sheet1']),
    acoTRST12: findTab(['ACO TR ST 12', 'ST 12', 'ST12', 'SITUBONDO', 'LAPORAN_CETAK', availableTitles[0] || 'Sheet1']),
    ups: findTab(['LAPORAN_CETAK_UPS', 'LAPORAN_CETAK', 'UPS', 'BEBAN', availableTitles[0] || 'Sheet1']),
    ups30Wapres: findTab(['UPS 30 KVA WAPRES', 'UPS 30 WAPRES', 'UPS 30 KVA', 'UPS 30', 'UPS LT 1', 'LAPORAN_CETAK_UPS']),
    ups40Wapres: findTab(['UPS 40 KVA WAPRES', 'UPS 40 WAPRES', 'UPS 40 KVA', 'UPS 40 LT 2', 'UPS 40']),
    ups60Wapres: findTab(['UPS 60 KVA WAPRES', 'UPS 60 WAPRES', 'UPS 60 KVA', 'UPS 60 LT 3', 'UPS 60']),
    ups40Dipo: findTab(['UPS 40 KVA DIPO', 'UPS 40 DIPO', 'DIPO UPS', 'DIPO']),
    ups100ST12: findTab(['UPS 100 KVA ST 12', 'UPS 100 ST 12', 'UPS 100', 'ST12 UPS', 'ST 12']),
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

export type SheetTabKey =
  | 'acoTM'
  | 'acoTRDipo'
  | 'acoTRST12'
  | 'ups'
  | 'ups30Wapres'
  | 'ups40Wapres'
  | 'ups60Wapres'
  | 'ups40Dipo'
  | 'ups100ST12';

/**
 * Ensure a specific sheet tab exists in an existing spreadsheet; creates and styles it if missing.
 */
export async function ensureSheetTab(
  accessToken: string,
  spreadsheetId: string,
  tabType: SheetTabKey,
  preferredTitle?: string
): Promise<string> {
  // 1. Fetch metadata
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Gagal memeriksa lembar kerja spreadsheet.');
  const data = await res.json();
  const existingSheets: any[] = data.sheets || [];

  const defaultTitles: Record<SheetTabKey, string> = {
    acoTM: 'ACO TM D 126',
    acoTRDipo: 'ACO TR DIPO',
    acoTRST12: 'ACO TR ST 12',
    ups30Wapres: 'UPS 30 KVA WAPRES',
    ups40Wapres: 'UPS 40 KVA WAPRES',
    ups60Wapres: 'UPS 60 KVA WAPRES',
    ups40Dipo: 'UPS 40 KVA DIPO',
    ups100ST12: 'UPS 100 KVA ST 12',
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
  if (tabType === 'acoTM' || tabType === 'acoTRDipo' || tabType === 'acoTRST12') {
    const cetakMatch = existingSheets.find(
      (s) => s.properties?.title?.toLowerCase() === 'laporan_cetak' ||
             s.properties?.title?.toLowerCase() === 'laporan cetak'
    );
    if (cetakMatch) return cetakMatch.properties.title;
  } else {
    // For any UPS tab type (ups, ups30Wapres, ups40Wapres, ups60Wapres, ups40Dipo, ups100ST12)
    const cetakUpsMatch = existingSheets.find((s) => {
      const t = (s.properties?.title || '').toLowerCase().replace(/[\s_]+/g, '');
      return t.includes('laporancetakups') || t.includes('cetakups');
    });
    if (cetakUpsMatch) {
      return cetakUpsMatch.properties.title;
    }

    const upsMatch = existingSheets.find((s) =>
      s.properties?.title?.toLowerCase().includes('ups')
    );
    if (upsMatch) {
      return upsMatch.properties.title;
    }
  }

  // If not found, add the sheet tab with adequate rows (min 600 for UPS)
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
                gridProperties: {
                  rowCount: tabType.startsWith('ups') ? 600 : 350,
                  columnCount: 19,
                  frozenRowCount: tabType.startsWith('ups') ? 6 : 5,
                },
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
  let writeRange = `${encodeURIComponent(targetTitle)}!A1:Q5`;

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
  } else if (tabType === 'ups40Dipo') {
    headerRows = buildUpsHeaderValues(
      'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)',
      'BEBAN UPS 40 KVA RUMAH DINAS (DIPO)'
    );
    formatRequests = buildUpsFormatRequests(newSheetId);
    writeRange = `${encodeURIComponent(targetTitle)}!A1:R6`;
  } else if (tabType === 'ups100ST12') {
    headerRows = buildUpsHeaderValues(
      'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)',
      'BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)'
    );
    formatRequests = buildUpsFormatRequests(newSheetId);
    writeRange = `${encodeURIComponent(targetTitle)}!A1:R6`;
  } else if (tabType === 'ups40Wapres') {
    headerRows = buildUpsHeaderValues(
      'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
      'BEBAN UPS 40 KVA WAKIL PRESIDEN'
    );
    formatRequests = buildUpsFormatRequests(newSheetId);
    writeRange = `${encodeURIComponent(targetTitle)}!A1:R6`;
  } else if (tabType === 'ups60Wapres') {
    headerRows = buildUpsHeaderValues(
      'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
      'BEBAN UPS 60 KVA WAKIL PRESIDEN'
    );
    formatRequests = buildUpsFormatRequests(newSheetId);
    writeRange = `${encodeURIComponent(targetTitle)}!A1:R6`;
  } else {
    // default: ups or ups30Wapres
    headerRows = buildUpsHeaderValues(
      'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
      'BEBAN UPS 30 KVA WAKIL PRESIDEN'
    );
    formatRequests = buildUpsFormatRequests(newSheetId);
    writeRange = `${encodeURIComponent(targetTitle)}!A1:R6`;
  }

  // Write values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
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
 * Append or Update ACO TM Wapres record by (Tanggal + Shift) slot.
 * Ensures data updates in-place and does not pile up downward.
 */
export async function appendAcoWapresRecord(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  wapresReport: TimWapresReport,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowNumber: number }> {
  // Check if LAPORAN_CETAK combined sheet exists
  let targetSheet = sheetName || 'ACO TM D 126';
  let baseStartRow = 6;
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
      if (sheetTitles.includes('LAPORAN_CETAK')) {
        targetSheet = 'LAPORAN_CETAK';
        baseStartRow = 6;
      } else {
        targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTM', sheetName);
        baseStartRow = 6;
      }
    }
  } catch {
    targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTM', sheetName);
  }

  const officers = wapresReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  const timeFormatted = wapresReport.inspectionTime || 'WIB';

  const dayOfMonth = extractDayOfMonth(wapresReport.inspectionDate || new Date());
  const activeShift = shift || (wapresReport as any)?.shift || 'PAGI';
  const shiftOffset = getShiftOffset(activeShift);
  const targetRow = calculateSlotRow(dayOfMonth, activeShift, baseStartRow);

  const rowNoValue = shiftOffset === 0 ? String(dayOfMonth) : '';
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

  // In-place update using PUT on the exact date & shift row
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A${targetRow}:Q${targetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A${targetRow}:Q${targetRow}`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Gagal memperbarui baris ACO TM ke Google Sheets.');
  }

  return { success: true, rowNumber: targetRow };
}

/**
 * Append or Update ACO TR DIPO record by (Tanggal + Shift) slot.
 * Ensures data updates in-place and does not pile up downward.
 */
export async function appendAcoDipoRecord(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'ACO TR DIPO',
  rumdinReport: TimRumdinReport,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowNumber: number }> {
  let targetSheet = sheetName;
  let baseStartRow = 6;
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
      if (sheetTitles.includes('LAPORAN_CETAK')) {
        targetSheet = 'LAPORAN_CETAK';
        baseStartRow = 205; // DIPO table starts at row 205 in LAPORAN_CETAK
      } else {
        targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRDipo', sheetName);
        baseStartRow = 6;
      }
    }
  } catch {
    targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRDipo', sheetName);
  }

  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';

  const dayOfMonth = extractDayOfMonth(rumdinReport.inspectionDate || new Date());
  const activeShift = shift || (rumdinReport as any)?.shift || 'PAGI';
  const shiftOffset = getShiftOffset(activeShift);
  const targetRow = calculateSlotRow(dayOfMonth, activeShift, baseStartRow);

  const rowNoValue = shiftOffset === 0 ? String(dayOfMonth) : '';
  const dipo = rumdinReport.acoTRDipo;

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

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A${targetRow}:Q${targetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A${targetRow}:Q${targetRow}`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Gagal memperbarui baris ACO TR DIPO ke Google Sheets.');
  }

  return { success: true, rowNumber: targetRow };
}

/**
 * Append or Update ACO TR ST 12 (Situbondo 12) record by (Tanggal + Shift) slot.
 * Ensures data updates in-place and does not pile up downward.
 */
export async function appendAcoST12Record(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'ACO TR ST 12',
  rumdinReport: TimRumdinReport,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowNumber: number }> {
  let targetSheet = sheetName;
  let baseStartRow = 6;
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
      if (sheetTitles.includes('LAPORAN_CETAK')) {
        targetSheet = 'LAPORAN_CETAK';
        baseStartRow = 106; // SITUBONDO 12 table starts at row 106 in LAPORAN_CETAK
      } else {
        targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRST12', sheetName);
        baseStartRow = 6;
      }
    }
  } catch {
    targetSheet = await ensureSheetTab(accessToken, spreadsheetId, 'acoTRST12', sheetName);
  }

  const officers = rumdinReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  const dateFormatted = formatToDDMMYYYY(rumdinReport.inspectionDate || new Date());
  const timeFormatted = rumdinReport.inspectionTime || 'WIB';

  const dayOfMonth = extractDayOfMonth(rumdinReport.inspectionDate || new Date());
  const activeShift = shift || (rumdinReport as any)?.shift || 'PAGI';
  const shiftOffset = getShiftOffset(activeShift);
  const targetRow = calculateSlotRow(dayOfMonth, activeShift, baseStartRow);

  const rowNoValue = shiftOffset === 0 ? String(dayOfMonth) : '';
  const st12 = rumdinReport.acoTRST12;

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

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A${targetRow}:Q${targetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A${targetRow}:Q${targetRow}`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Gagal memperbarui baris ACO TR ST 12 ke Google Sheets.');
  }

  return { success: true, rowNumber: targetRow };
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
  if (trimmed.toLowerCase().includes('jam')) return trimmed;
  return `${trimmed} Jam`;
}

function formatMinutes(val?: string): string {
  if (!val || val.trim() === '' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.toLowerCase().includes('menit')) return trimmed;
  return `${trimmed} Menit`;
}

/**
 * Format single UPS row strictly matching the 18 columns in the official template:
 * Col A: NO
 * Col B: NAMA PETUGAS
 * Col C: TANGGAL/ BULAN/ TAHUN
 * Col D: JAM INSPEKSI
 * Col E: R (A)
 * Col F: S (A)
 * Col G: T (A)
 * Col H: R (R-N)
 * Col I: S (S-N)
 * Col J: T (T-N)
 * Col K: R (R-S)
 * Col L: S (R-T)
 * Col M: T (S-T)
 * Col N: TEMPERATUR UPS
 * Col O: ALARM UPS
 * Col P: BACK UP TIME UPS (HOURS)
 * Col Q: BACK UP TIME UPS (MINUTES)
 * Col R: KETERANGAN
 */
export function buildUpsRow(
  noValue: string,
  officersStr: string,
  dateFormatted: string,
  timeFormatted: string,
  ups: UPSData,
  keteranganSuffix?: string
): string[] {
  const ket = [ups.keterangan, keteranganSuffix].filter(Boolean).join(' - ') || '-';

  // Nilai Jam dan Menit untuk spreadsheet
  let hoursVal = ups.backupHours;
  let minutesVal = ups.backupMinutes;
  if ((!hoursVal && !minutesVal) && ups.backupTotalMinutes !== undefined && ups.backupTotalMinutes !== '') {
    const total = parseInt(ups.backupTotalMinutes, 10);
    if (!isNaN(total)) {
      hoursVal = String(Math.floor(total / 60));
      minutesVal = String(total % 60);
    }
  }

  return [
    noValue,
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
    formatVolt(ups.voltRT), // Col L: (R-T)
    formatVolt(ups.voltST), // Col M: (S-T)
    formatTemp(ups.temperature),
    (ups.alarm || 'NORMAL').toUpperCase(),
    formatHours(hoursVal),
    formatMinutes(minutesVal),
    ket,
  ];
}

/**
 * Append or Update single UPS record to its own tab by (Tanggal + Shift) slot.
 */
export async function appendSingleUpsRecord(
  accessToken: string,
  spreadsheetId: string,
  tabType: SheetTabKey,
  targetSheetName: string,
  titleText: string,
  sectionText: string,
  officers: string[],
  inspectionDate: string | Date | undefined,
  inspectionTime: string | undefined,
  ups: UPSData,
  keteranganSuffix?: string,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowNumber: number }> {
  // 1. Fetch metadata to check existing sheets
  let existingSheets: any[] = [];
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      existingSheets = meta.sheets || [];
    }
  } catch (err) {
    console.warn('Could not fetch sheet metadata:', err);
  }

  // Check for combined LAPORAN_CETAK_UPS
  const combinedUpsSheet = existingSheets.find((s) => {
    const t = (s.properties?.title || '').toLowerCase().replace(/[\s_]+/g, '');
    return t.includes('laporancetakups') || t.includes('cetakups');
  });

  // Check for individual sheet
  const individualSheet = existingSheets.find(
    (s) => (s.properties?.title || '').toLowerCase() === (targetSheetName || '').toLowerCase()
  );

  let targetSheet = targetSheetName;
  let baseStartRow = 7;
  let isCombined = false;

  if (combinedUpsSheet && (!individualSheet || targetSheetName.toLowerCase().includes('cetak'))) {
    targetSheet = combinedUpsSheet.properties.title;
    isCombined = true;
  } else if (individualSheet) {
    targetSheet = individualSheet.properties.title;
    isCombined = false;
  } else {
    targetSheet = await ensureSheetTab(accessToken, spreadsheetId, tabType, targetSheetName);
    isCombined = targetSheet.toLowerCase().includes('cetak');
  }

  if (isCombined) {
    // Definisi 5 Bagian Inspeksi UPS pada LAPORAN_CETAK_UPS:
    // 1. Wapres UPS 30              -> baris 7
    // 2. Wapres UPS 40              -> baris 107
    // 3. Wapres UPS 60              -> baris 207
    // 4. Rumdin UPS 40 (Dipo)       -> baris 307
    // 5. Rumdin UPS 100 (ST12)      -> baris 407
    switch (tabType) {
      case 'ups30Wapres': baseStartRow = 7; break;
      case 'ups40Wapres': baseStartRow = 107; break;
      case 'ups60Wapres': baseStartRow = 207; break;
      case 'ups40Dipo': baseStartRow = 307; break;
      case 'ups100ST12': baseStartRow = 407; break;
      default: baseStartRow = 7; break;
    }
  } else {
    baseStartRow = 7;
  }

  const officersClean = officers.filter(Boolean);
  const officersStr =
    officersClean.length > 0
      ? officersClean.map((o) => o.toUpperCase()).join(' , ')
      : '-';

  const dateFormatted = formatToDDMMYYYY(inspectionDate || new Date());
  let timeFormatted = inspectionTime || 'WIB';
  if (!timeFormatted.toUpperCase().includes('WIB')) {
    timeFormatted = `${timeFormatted} WIB`;
  }

  const dayOfMonth = extractDayOfMonth(inspectionDate || new Date());
  const activeShift = shift || 'PAGI';
  const shiftOffset = getShiftOffset(activeShift);
  const targetRow = calculateSlotRow(dayOfMonth, activeShift, baseStartRow);

  // Auto-expand sheet rows if needed so out-of-bounds error never happens
  const currentSheetObj = existingSheets.find(
    (s) => (s.properties?.title || '').toLowerCase() === targetSheet.toLowerCase()
  );
  if (currentSheetObj && (currentSheetObj.properties?.gridProperties?.rowCount || 0) < targetRow + 10) {
    const sheetId = currentSheetObj.properties.sheetId;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            appendDimension: {
              sheetId: sheetId,
              dimension: 'ROWS',
              length: Math.max(50, targetRow + 20 - (currentSheetObj.properties?.gridProperties?.rowCount || 0)),
            },
          },
        ],
      }),
    }).catch(() => {});
  }

  const noValue = shiftOffset === 0 ? String(dayOfMonth) : '';

  const upsRow = buildUpsRow(
    noValue,
    officersStr,
    dateFormatted,
    timeFormatted,
    ups,
    keteranganSuffix
  );

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A${targetRow}:R${targetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A${targetRow}:R${targetRow}`,
        majorDimension: 'ROWS',
        values: [upsRow],
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || `Gagal memperbarui baris UPS ke sheet ${targetSheet}.`);
  }

  // Also update individual sheet if both exist and are distinct
  if (combinedUpsSheet && individualSheet && individualSheet.properties?.sheetId !== combinedUpsSheet.properties?.sheetId) {
    try {
      const indTargetRow = calculateSlotRow(dayOfMonth, activeShift, 7);
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          individualSheet.properties.title
        )}!A${indTargetRow}:R${indTargetRow}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `${individualSheet.properties.title}!A${indTargetRow}:R${indTargetRow}`,
            majorDimension: 'ROWS',
            values: [upsRow],
          }),
        }
      );
    } catch {
      // Non-blocking secondary sync
    }
  }

  return { success: true, rowNumber: targetRow };
}

/**
 * Append or Update UPS Rumdin Records to Google Sheets by (Tanggal + Shift) slot.
 * Ensures UPS 40 KVA DIPO and UPS 100 KVA ST 12 are both updated to their dedicated tabs.
 */
export async function appendRumdinUpsRecords(
  accessToken: string,
  spreadsheetId: string,
  targetSheetOrTabs?: string | SheetTabMapping,
  rumdinReport?: TimRumdinReport,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowsAdded: number }> {
  let tabs: SheetTabMapping | undefined;
  let report: TimRumdinReport | undefined;

  if (typeof targetSheetOrTabs === 'string') {
    tabs = { ups: targetSheetOrTabs, ups40Dipo: targetSheetOrTabs, ups100ST12: targetSheetOrTabs };
    report = rumdinReport;
  } else {
    tabs = targetSheetOrTabs;
    report = rumdinReport;
  }

  if (!report) return { success: false, rowsAdded: 0 };

  const tab40Dipo = tabs?.ups40Dipo || tabs?.ups || 'UPS 40 KVA DIPO';
  const tab100ST12 = tabs?.ups100ST12 || tabs?.ups || 'UPS 100 KVA ST 12';

  // Always update UPS 40 KVA DIPO
  await appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups40Dipo',
    tab40Dipo,
    'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)',
    'BEBAN UPS 40 KVA RUMAH DINAS (DIPO)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups40Dipo,
    'UPS 40 KVA DIPO',
    shift || (report as any)?.shift
  );

  // Always update UPS 100 KVA ST 12
  await appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups100ST12',
    tab100ST12,
    'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)',
    'BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups100ST12,
    'UPS 100 KVA ST 12',
    shift || (report as any)?.shift
  );

  return { success: true, rowsAdded: 2 };
}

/**
 * Append or Update UPS Wapres Records to Google Sheets by (Tanggal + Shift) slot.
 * Ensures UPS 30, UPS 40, and UPS 60 are all updated to their dedicated tabs.
 */
export async function appendWapresUpsRecords(
  accessToken: string,
  spreadsheetId: string,
  targetSheetOrTabs?: string | SheetTabMapping,
  wapresReport?: TimWapresReport,
  shift?: ShiftType | string
): Promise<{ success: boolean; rowsAdded: number }> {
  let tabs: SheetTabMapping | undefined;
  let report: TimWapresReport | undefined;

  if (typeof targetSheetOrTabs === 'string') {
    tabs = { ups: targetSheetOrTabs, ups30Wapres: targetSheetOrTabs, ups40Wapres: targetSheetOrTabs, ups60Wapres: targetSheetOrTabs };
    report = wapresReport;
  } else {
    tabs = targetSheetOrTabs;
    report = wapresReport;
  }

  if (!report) return { success: false, rowsAdded: 0 };

  const tab30 = tabs?.ups30Wapres || tabs?.ups || 'UPS 30 KVA WAPRES';
  const tab40 = tabs?.ups40Wapres || tabs?.ups || 'UPS 40 KVA WAPRES';
  const tab60 = tabs?.ups60Wapres || tabs?.ups || 'UPS 60 KVA WAPRES';

  // 1. UPS 30 KVA Wapres (Lt 1)
  await appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups30Wapres',
    tab30,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 30 KVA WAKIL PRESIDEN (LT 1)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups30,
    'UPS 30 KVA LT 1',
    shift || (report as any)?.shift
  );

  // 2. UPS 40 KVA Wapres (Lt 2)
  await appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups40Wapres',
    tab40,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 40 KVA WAKIL PRESIDEN (LT 2)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups40,
    'UPS 40 KVA LT 2',
    shift || (report as any)?.shift
  );

  // 3. UPS 60 KVA Wapres (Lt 3)
  await appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups60Wapres',
    tab60,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 60 KVA WAKIL PRESIDEN (LT 3)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups60,
    'UPS 60 KVA LT 3',
    shift || (report as any)?.shift
  );

  return { success: true, rowsAdded: 3 };
}

/**
 * Individual UPS sync functions for direct single-card or single-button sync
 */
export async function appendSingleUps30Wapres(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  report: TimWapresReport,
  shift?: ShiftType | string
) {
  return appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups30Wapres',
    targetSheet,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 30 KVA WAKIL PRESIDEN (LT 1)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups30,
    'UPS 30 KVA LT 1',
    shift || (report as any)?.shift
  );
}

export async function appendSingleUps40Wapres(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  report: TimWapresReport,
  shift?: ShiftType | string
) {
  return appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups40Wapres',
    targetSheet,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 40 KVA WAKIL PRESIDEN (LT 2)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups40,
    'UPS 40 KVA LT 2',
    shift || (report as any)?.shift
  );
}

export async function appendSingleUps60Wapres(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  report: TimWapresReport,
  shift?: ShiftType | string
) {
  return appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups60Wapres',
    targetSheet,
    'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    'BEBAN UPS 60 KVA WAKIL PRESIDEN (LT 3)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups60,
    'UPS 60 KVA LT 3',
    shift || (report as any)?.shift
  );
}

export async function appendSingleUps40Dipo(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  report: TimRumdinReport,
  shift?: ShiftType | string
) {
  return appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups40Dipo',
    targetSheet,
    'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)',
    'BEBAN UPS 40 KVA RUMAH DINAS (DIPO)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups40Dipo,
    'UPS 40 KVA DIPO',
    shift || (report as any)?.shift
  );
}

export async function appendSingleUps100ST12(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  report: TimRumdinReport,
  shift?: ShiftType | string
) {
  return appendSingleUpsRecord(
    accessToken,
    spreadsheetId,
    'ups100ST12',
    targetSheet,
    'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)',
    'BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)',
    report.officers,
    report.inspectionDate,
    report.inspectionTime,
    report.ups100ST12,
    'UPS 100 KVA ST 12',
    shift || (report as any)?.shift
  );
}

/**
 * Append all Tim Rumdin data (ACO Dipo + ACO ST12 + UPS 40 & 100) in one sweep
 */
export async function appendAllRumdinRecords(
  accessToken: string,
  spreadsheetId: string,
  rumdinReport: TimRumdinReport,
  tabs?: SheetTabMapping,
  shift?: ShiftType | string
): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];

  // 1. ACO TR Dipo
  try {
    await appendAcoDipoRecord(accessToken, spreadsheetId, tabs?.acoTRDipo || 'ACO TR DIPO', rumdinReport, shift);
    messages.push('ACO TR DIPO');
  } catch (err: any) {
    console.error('DIPO sync error:', err);
    throw new Error(`Gagal sync ACO Dipo: ${err.message}`);
  }

  // 2. ACO TR ST 12
  try {
    await appendAcoST12Record(accessToken, spreadsheetId, tabs?.acoTRST12 || 'ACO TR ST 12', rumdinReport, shift);
    messages.push('ACO TR ST 12');
  } catch (err: any) {
    console.error('ST12 sync error:', err);
    throw new Error(`Gagal sync ACO ST12: ${err.message}`);
  }

  // 3. UPS Rumdin (Dipo & ST12)
  try {
    await appendRumdinUpsRecords(accessToken, spreadsheetId, tabs, rumdinReport, shift);
    messages.push('UPS Rumdin (40 & 100 KVA)');
  } catch (err: any) {
    console.error('UPS Rumdin sync error:', err);
    throw new Error(`Gagal sync UPS Rumdin: ${err.message}`);
  }

  return { success: true, messages };
}

/**
 * Format and tidy all sheets in an existing Google Spreadsheet (standard PLN layout)
 */
export async function formatAndTidyExistingSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal mengakses Google Spreadsheet.');
  }

  const data = await res.json();
  const sheets: any[] = data.sheets || [];
  const requests: any[] = [];

  for (const sheet of sheets) {
    const sheetId = sheet.properties?.sheetId;
    const title = sheet.properties?.title || '';
    const lower = title.toLowerCase();

    if (sheetId === undefined) continue;

    if (lower.includes('d 126') || lower.includes('aco tm') || lower.includes('d126')) {
      requests.push(...buildAcoTMFormatRequests(sheetId));
    } else if (lower.includes('dipo') && (lower.includes('aco') || lower.includes('tr'))) {
      requests.push(...buildAcoDipoFormatRequests(sheetId));
    } else if (
      (lower.includes('st 12') || lower.includes('st12') || lower.includes('situbondo')) &&
      (lower.includes('aco') || lower.includes('tr'))
    ) {
      requests.push(...buildAcoST12FormatRequests(sheetId));
    } else if (lower.includes('ups') || lower.includes('cetak_ups')) {
      requests.push(...buildUpsFormatRequests(sheetId));
    }

    // Also format data rows (rows 6..300) with borders and center alignment
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 5,
          endRowIndex: 300,
          startColumnIndex: 0,
          endColumnIndex: 18,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            textFormat: { fontFamily: 'Arial', fontSize: 10 },
            borders: {
              top: { style: 'SOLID', color: { red: 0.8, green: 0.835, blue: 0.882 } },
              bottom: { style: 'SOLID', color: { red: 0.8, green: 0.835, blue: 0.882 } },
              left: { style: 'SOLID', color: { red: 0.8, green: 0.835, blue: 0.882 } },
              right: { style: 'SOLID', color: { red: 0.8, green: 0.835, blue: 0.882 } },
            },
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat,borders)',
      },
    });
  }

  if (requests.length > 0) {
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!batchRes.ok) {
      const err = await batchRes.json();
      throw new Error(err.error?.message || 'Gagal menerapkan format ke spreadsheet.');
    }
  }

  return {
    success: true,
    message: 'Tampilan semua lembar Google Spreadsheet berhasil dirapikan sesuai standar resmi PLN!',
  };
}

/**
 * Clear a specific shift row slot in Google Sheets without deleting rows or disrupting structure.
 */
export async function clearShiftSlotInGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  targetSheet: string,
  baseStartRow: number,
  dayOfMonth: number,
  shift: ShiftType | string,
  numCols: number = 17
): Promise<{ success: boolean; message: string }> {
  const targetRow = calculateSlotRow(dayOfMonth, shift, baseStartRow);
  const endColChar = String.fromCharCode(64 + numCols); // 17 -> Q, 18 -> R

  // Empty values preserving structure
  const emptyRow = Array(numCols).fill('-');
  // If Pagi (first row of group), keep the day number in Col A
  const shiftOffset = getShiftOffset(shift);
  if (shiftOffset === 0) {
    emptyRow[0] = String(dayOfMonth);
  } else {
    emptyRow[0] = '';
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A${targetRow}:${endColChar}${targetRow}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${targetSheet}!A${targetRow}:${endColChar}${targetRow}`,
        majorDimension: 'ROWS',
        values: [emptyRow],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Gagal mengosongkan baris shift ${shift} di baris ${targetRow}`);
  }

  return {
    success: true,
    message: `Baris slot Tanggal ${dayOfMonth} Shift ${shift} (Baris ${targetRow}) berhasil dikosongkan.`,
  };
}

/**
 * Read shift inspection data and submission status directly from Google Sheets via REST API
 */
export async function readShiftDataFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  dayOfMonth: number,
  shift: ShiftType | string,
  dateKey?: string
): Promise<{
  success: boolean;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
  isBothSubmitted: boolean;
  wapres: TimWapresReport | null;
  rumdin: TimRumdinReport | null;
  message?: string;
}> {
  const s = String(shift || 'PAGI').toUpperCase();
  const offset = getShiftOffset(s);

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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal membaca data shift dari Google Sheets API.');
  }

  const batchData = await res.json();
  const vr = batchData.valueRanges || [];
  const getRow = (idx: number) => vr[idx]?.values?.[0] || [];

  const { buildReportsFromRowArrays } = await import('./sheetReader');
  const result = buildReportsFromRowArrays(
    getRow(0),
    getRow(1),
    getRow(2),
    getRow(3),
    getRow(4),
    getRow(5),
    getRow(6),
    getRow(7),
    dateKey || new Date().toISOString(),
    s as any
  );

  return result as any;
}

