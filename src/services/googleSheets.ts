import { TimWapresReport } from '../types';

export interface ActiveSpreadsheetInfo {
  id: string;
  url: string;
  title: string;
  sheetName: string;
  sheetId?: number;
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
  // Check if it's already an ID (letters, numbers, underscores, hyphens, min 25 chars)
  if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
    return trimmed;
  }
  // Check URL match: https://docs.google.com/spreadsheets/d/{id}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Format date string to DD/MM/YYYY
 */
export function formatToDDMMYYYY(dateStrOrObj?: string | Date): string {
  const date = dateStrOrObj instanceof Date ? dateStrOrObj : new Date();
  if (typeof dateStrOrObj === 'string' && dateStrOrObj.includes('/')) {
    // If already DD/MM/YYYY
    return dateStrOrObj;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get indonesian month and year name (e.g. "September 2026")
 */
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

/**
 * Create a new spreadsheet with the exact header format from the reference image.
 */
export async function createAcoWapresSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<ActiveSpreadsheetInfo> {
  const currentMonthYear = getIndonesianMonthYear();
  const title =
    customTitle ||
    `PANTAUAN INSPEKSI ACO TM GARDU D 126 (ISTANA WAPRES) - ${new Date().getFullYear()}`;

  // 1. Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'ACO TM D 126',
            gridProperties: {
              rowCount: 100,
              columnCount: 18,
              frozenRowCount: 5,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const sheetId = createdData.sheets?.[0]?.properties?.sheetId ?? 0;
  const sheetName = createdData.sheets?.[0]?.properties?.title ?? 'ACO TM D 126';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Set title and header values (Rows 2, 3, 4, 5)
  const headerValues = [
    // Row 1: empty
    [],
    // Row 2: Title in Col C (or A to Q)
    ['', '', 'PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )'],
    // Row 3: Month info in Col B
    ['', `Bulan :${currentMonthYear}`],
    // Row 4: Tier-1 Headers
    [
      'NO',
      'NAMA PETUGAS',
      'TANGGAL/BULAN/TAHUN',
      'JAM INSPEKSI',
      'STATUS PENYULANG',
      '',
      'ALARM STATUS',
      '',
      'STATUS POWER ACO TM D 126',
      '',
      'STATUS CHARGING KUBIKEL',
      '',
      'STATUS REMOTE KUBIKEL',
      '',
      'LAMPU INDIKATOR',
      '',
      'KETERANGAN',
    ],
    // Row 5: Tier-2 Sub-headers
    [
      '',
      '',
      '',
      '',
      'CLOSE',
      'OPEN',
      'ALARM',
      'NORMAL',
      'ON',
      'OFF',
      'YA',
      'TIDAK',
      'LOCAL',
      'AUTO',
      'ON',
      'OFF',
      '',
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A1:Q5?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: headerValues,
      }),
    }
  );

  // 3. BatchUpdate for Merges, Golden Header Background, Borders, Alignment, and Column Widths
  const amberBgColor = { red: 1.0, green: 0.753, blue: 0.0 }; // #FFC000 (Golden Yellow as in screenshot)
  const blackBorder = {
    style: 'SOLID',
    width: 1,
    color: { red: 0, green: 0, blue: 0 },
  };

  const requests: any[] = [
    // Merges for Row 4 & 5 (0-indexed: row 3 is 4, row 4 is 5, endRowIndex is exclusive)
    // A4:A5 -> startRow: 3, endRow: 5, startCol: 0, endCol: 1
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 },
        mergeType: 'MERGE_ALL',
      },
    },
    // B4:B5 -> NAMA PETUGAS
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 1, endColumnIndex: 2 },
        mergeType: 'MERGE_ALL',
      },
    },
    // C4:C5 -> TANGGAL/BULAN/TAHUN
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: 3 },
        mergeType: 'MERGE_ALL',
      },
    },
    // D4:D5 -> JAM INSPEKSI
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 3, endColumnIndex: 4 },
        mergeType: 'MERGE_ALL',
      },
    },
    // E4:F4 -> STATUS PENYULANG
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 6 },
        mergeType: 'MERGE_ALL',
      },
    },
    // G4:H4 -> ALARM STATUS
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 6, endColumnIndex: 8 },
        mergeType: 'MERGE_ALL',
      },
    },
    // I4:J4 -> STATUS POWER ACO TM D 126
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 8, endColumnIndex: 10 },
        mergeType: 'MERGE_ALL',
      },
    },
    // K4:L4 -> STATUS CHARGING KUBIKEL
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 10, endColumnIndex: 12 },
        mergeType: 'MERGE_ALL',
      },
    },
    // M4:N4 -> STATUS REMOTE KUBIKEL
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 12, endColumnIndex: 14 },
        mergeType: 'MERGE_ALL',
      },
    },
    // O4:P4 -> LAMPU INDIKATOR
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 14, endColumnIndex: 16 },
        mergeType: 'MERGE_ALL',
      },
    },
    // Q4:Q5 -> KETERANGAN
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 5, startColumnIndex: 16, endColumnIndex: 17 },
        mergeType: 'MERGE_ALL',
      },
    },
    // Format Row 4 & 5 Headers (A4:Q5)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 3,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 17,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: amberBgColor,
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 0, green: 0, blue: 0 },
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // Borders on A4:Q5
    {
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 3,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 17,
        },
        top: blackBorder,
        bottom: blackBorder,
        left: blackBorder,
        right: blackBorder,
        innerHorizontal: blackBorder,
        innerVertical: blackBorder,
      },
    },
    // Title style in Row 2 (index 1)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 17,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true,
              fontSize: 13,
              underline: true,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
      },
    },
    // Month style in Row 3 (index 2)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 1,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true,
              fontSize: 11,
            },
          },
        },
        fields: 'userEnteredFormat(textFormat)',
      },
    },
    // Column widths
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 1,
        },
        properties: { pixelSize: 45 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 1,
          endIndex: 2,
        },
        properties: { pixelSize: 150 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 2,
          endIndex: 3,
        },
        properties: { pixelSize: 130 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 3,
          endIndex: 4,
        },
        properties: { pixelSize: 100 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 4,
          endIndex: 6,
        },
        properties: { pixelSize: 280 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 6,
          endIndex: 16,
        },
        properties: { pixelSize: 75 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 16,
          endIndex: 17,
        },
        properties: { pixelSize: 130 },
        fields: 'pixelSize',
      },
    },
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
    sheetName,
    sheetId,
  };

  saveStoredSpreadsheet(result);
  return result;
}

/**
 * Verify and connect an existing spreadsheet ID.
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
  const title = data.properties?.title || 'Spreadsheet Pantauan ACO';
  const firstSheet = data.sheets?.[0];
  const sheetName = firstSheet?.properties?.title || 'Sheet1';
  const sheetId = firstSheet?.properties?.sheetId || 0;
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;

  const info: ActiveSpreadsheetInfo = {
    id,
    url,
    title,
    sheetName,
    sheetId,
  };

  saveStoredSpreadsheet(info);
  return info;
}

/**
 * Read existing rows to determine sequence number and day groupings.
 */
export async function getExistingAcoRows(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<{ rows: string[][]; nextRowIndex: number; calculatedNo: number }> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetName
      )}!A6:Q1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return { rows: [], nextRowIndex: 6, calculatedNo: 1 };
    }

    const data = await res.json();
    const rows = (data.values || []) as string[][];

    // Find highest NO in column A
    let maxNo = 0;
    for (const row of rows) {
      const colA = parseInt(row[0] || '0', 10);
      if (!isNaN(colA) && colA > maxNo) {
        maxNo = colA;
      }
    }

    const calculatedNo = maxNo > 0 ? maxNo + 1 : 1;
    const nextRowIndex = 6 + rows.length;

    return { rows, nextRowIndex, calculatedNo };
  } catch {
    return { rows: [], nextRowIndex: 6, calculatedNo: 1 };
  }
}

/**
 * Append ACO Wapres record to the spreadsheet in real time.
 */
export async function appendAcoWapresRecord(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  wapresReport: TimWapresReport,
  customNo?: number
): Promise<{ success: boolean; rowNumber: number }> {
  const { rows, nextRowIndex, calculatedNo } = await getExistingAcoRows(
    accessToken,
    spreadsheetId,
    sheetName
  );

  const officers = wapresReport.officers.filter(Boolean);
  const officersStr =
    officers.length > 0 ? officers.map((o) => o.toUpperCase()).join(' , ') : '-';

  // Format date: DD/MM/YYYY
  const dateFormatted = formatToDDMMYYYY(wapresReport.inspectionDate || new Date());
  const timeFormatted = wapresReport.inspectionTime || 'WIB';

  // In the reference screenshot:
  // If the previous row on the same day already exists, the screenshot either leaves NO blank or groups it.
  // We provide the day sequence number or sequential count.
  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const lastDate = lastRow ? lastRow[2] : null;
  const isSameDateAsLast = lastDate === dateFormatted;

  let rowNoValue = '';
  if (customNo !== undefined) {
    rowNoValue = String(customNo);
  } else if (!isSameDateAsLast) {
    rowNoValue = String(calculatedNo);
  } else {
    // If same date in reference, col A can be empty or same day number
    rowNoValue = '';
  }

  const aco = wapresReport.acoTM;

  const rowValues = [
    rowNoValue, // A: NO
    officersStr, // B: NAMA PETUGAS
    dateFormatted, // C: TANGGAL/BULAN/TAHUN
    timeFormatted, // D: JAM INSPEKSI
    aco.penyulangClose || '-', // E: STATUS PENYULANG CLOSE
    aco.penyulangOpen || '-', // F: STATUS PENYULANG OPEN
    aco.alarmStatus === 'ALARM' ? 'ALARM' : '-', // G: ALARM STATUS ALARM
    aco.alarmStatus === 'NORMAL' ? 'NORMAL' : '-', // H: ALARM STATUS NORMAL
    aco.powerACO === 'ON' ? 'ON' : '-', // I: STATUS POWER ON
    aco.powerACO === 'OFF' ? 'OFF' : '-', // J: STATUS POWER OFF
    aco.chargingKubikel === 'YA' ? 'YA' : '-', // K: STATUS CHARGING YA
    aco.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-', // L: STATUS CHARGING TIDAK
    aco.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-', // M: STATUS REMOTE LOCAL
    aco.remoteKubikel === 'AUTO' ? 'AUTO' : '-', // N: STATUS REMOTE AUTO
    aco.lampuIndikator === 'ON' ? 'ON' : '-', // O: LAMPU INDIKATOR ON
    aco.lampuIndikator === 'OFF' ? 'OFF' : '-', // P: LAMPU INDIKATOR OFF
    aco.keterangan || '-', // Q: KETERANGAN
  ];

  // Append row
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A6:Q:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A6:Q`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Gagal menambahkan baris ke Google Sheets.');
  }

  return { success: true, rowNumber: nextRowIndex };
}
