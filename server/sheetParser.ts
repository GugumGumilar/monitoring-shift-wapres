export function extractIdFromUrl(input: string): string | null {
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

export function serverParseGviz(gvizText: string): any[][] {
  try {
    const match = gvizText.match(/setResponse\((.*)\);/s);
    if (!match || !match[1]) return [];
    const json = JSON.parse(match[1]);
    const table = json.table;
    if (!table || !table.rows) return [];

    return table.rows.map((r: any) => {
      if (!r || !r.c) return [];
      return r.c.map((cell: any) => (cell ? cell.f || cell.v || '' : ''));
    });
  } catch {
    return [];
  }
}

function cleanUnit(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str === '-' || str === '""' || str.toLowerCase() === 'null') return '';
  return str
    .replace(/\s*A\b/i, '')
    .replace(/\s*V\b/i, '')
    .replace(/\s*°?C\b/i, '')
    .replace(/\s*Jam\b/i, '')
    .replace(/\s*Menit\b/i, '')
    .trim();
}

function parseOfficers(cell: any): [string, string] {
  if (!cell) return ['', ''];
  const str = String(cell).trim();
  if (!str || str === '-' || str === '""') return ['', ''];
  const parts = str.split(/[,/&]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return ['', ''];
  const cap = (n: string) =>
    n
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  return [cap(parts[0]), parts.length > 1 ? cap(parts[1]) : ''];
}

function isRowFilled(row: any[]): boolean {
  if (!row || row.length < 4) return false;
  const officers = String(row[1] || '').trim();
  const time = String(row[3] || '').trim();
  if (officers && officers !== '-' && officers !== '""' && officers !== 'NAMA PETUGAS') return true;
  if (time && time !== '-' && time !== '""' && time !== 'JAM' && time !== 'WIB') return true;
  for (let i = 4; i < Math.min(row.length, 18); i++) {
    const val = String(row[i] || '').trim();
    if (val && val !== '-' && val !== '0' && val !== '""') return true;
  }
  return false;
}

function parseUpsRow(row: any[]) {
  const alarmRaw = String(row[14] || '').toUpperCase();
  return {
    loadR: cleanUnit(row[4]),
    loadS: cleanUnit(row[5]),
    loadT: cleanUnit(row[6]),
    voltRN: cleanUnit(row[7]),
    voltSN: cleanUnit(row[8]),
    voltTN: cleanUnit(row[9]),
    voltRS: cleanUnit(row[10]),
    voltRT: cleanUnit(row[11]),
    voltST: cleanUnit(row[12]),
    temperature: cleanUnit(row[13]),
    alarm: alarmRaw.includes('ALARM') ? 'ALARM' : 'NORMAL',
    backupHours: cleanUnit(row[15]),
    backupMinutes: cleanUnit(row[16]),
    keterangan: String(row[17] || '-').trim() || '-',
  };
}

export function serverBuildReports(
  acoTmRow: any[],
  acoSt12Row: any[],
  acoDipoRow: any[],
  ups30Row: any[],
  ups40WRow: any[],
  ups60WRow: any[],
  ups40DRow: any[],
  ups100SRow: any[],
  dateKey: string,
  shift: string
) {
  // Tim Wapres checks: ACO TM, UPS 30, UPS 40, UPS 60
  const isAcoTmFilled = isRowFilled(acoTmRow);
  const isUps30Filled = isRowFilled(ups30Row);
  const isUps40WFilled = isRowFilled(ups40WRow);
  const isUps60WFilled = isRowFilled(ups60WRow);

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
  // Sesuai instruksi: Jika masih ada di sheet yang kosong berarti belum submit
  const isWapresSubmitted = isWapresComplete;

  // Tim Rumdin checks: ACO TR Dipo, ACO TR ST12, UPS 40 Dipo, UPS 100 ST12
  const isAcoDipoFilled = isRowFilled(acoDipoRow);
  const isAcoSt12Filled = isRowFilled(acoSt12Row);
  const isUps40DFilled = isRowFilled(ups40DRow);
  const isUps100SFilled = isRowFilled(ups100SRow);

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
  // Sesuai instruksi: Jika masih ada di sheet yang kosong berarti belum submit
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

  const missingInfo = {
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

  let wapres = null;
  if (wapresFilledItems.length > 0) {
    const officers = parseOfficers(acoTmRow[1] || ups30Row[1]);
    const inspectionDate = String(acoTmRow[2] || ups30Row[2] || dateKey).trim();
    let inspectionTime = String(acoTmRow[3] || ups30Row[3] || 'WIB').trim();
    if (!inspectionTime.toUpperCase().includes('WIB')) {
      inspectionTime = `${inspectionTime} WIB`;
    }

    const penyClose = String(acoTmRow[4] || '').trim();
    const penyOpen = String(acoTmRow[5] || '').trim();
    const alarmCol = String(acoTmRow[6] || '').trim().toUpperCase();
    const powerOff = String(acoTmRow[9] || '').trim().toUpperCase();
    const chargeTidak = String(acoTmRow[11] || '').trim().toUpperCase();
    const remoteLocal = String(acoTmRow[12] || '').trim().toUpperCase();
    const lampuOff = String(acoTmRow[15] || '').trim().toUpperCase();

    wapres = {
      officers,
      inspectionDate,
      inspectionTime,
      ups30: parseUpsRow(ups30Row),
      ups40: parseUpsRow(ups40WRow),
      ups60: parseUpsRow(ups60WRow),
      acoTM: {
        penyulangClose: penyClose || 'P HAYAM WURUK GI GAMBIR LAMA',
        penyulangOpen: penyOpen || 'KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)',
        alarmStatus: alarmCol === 'ALARM' ? 'ALARM' : 'NORMAL',
        powerACO: powerOff === 'OFF' ? 'OFF' : 'ON',
        chargingKubikel: chargeTidak === 'TIDAK' ? 'TIDAK' : 'YA',
        remoteKubikel: remoteLocal === 'LOCAL' ? 'LOCAL' : 'AUTO',
        lampuIndikator: lampuOff === 'OFF' ? 'OFF' : 'ON',
        keterangan: String(acoTmRow[16] || '-').trim() || '-',
      },
      submittedAt: new Date().toISOString(),
    };
  }

  let rumdin = null;
  if (rumdinFilledItems.length > 0) {
    const officers = parseOfficers(acoDipoRow[1] || acoSt12Row[1] || ups40DRow[1]);
    const inspectionDate = String(acoDipoRow[2] || acoSt12Row[2] || ups40DRow[2] || dateKey).trim();
    let inspectionTime = String(acoDipoRow[3] || acoSt12Row[3] || ups40DRow[3] || 'WIB').trim();
    if (!inspectionTime.toUpperCase().includes('WIB')) {
      inspectionTime = `${inspectionTime} WIB`;
    }

    // DIPO
    const dipoT15n = String(acoDipoRow[4] || '').trim().toUpperCase();
    const dipoT135 = String(acoDipoRow[5] || '').trim().toUpperCase();
    const dipoAlarm = String(acoDipoRow[6] || '').trim().toUpperCase();
    const dipoPowerOff = String(acoDipoRow[9] || '').trim().toUpperCase();
    const dipoLampuOff = String(acoDipoRow[15] || '').trim().toUpperCase();

    // ST12
    const st12Close = String(acoSt12Row[4] || '').trim();
    const st12Open = String(acoSt12Row[5] || '').trim();
    const st12Alarm = String(acoSt12Row[6] || '').trim().toUpperCase();
    const st12PowerOff = String(acoSt12Row[9] || '').trim().toUpperCase();
    const st12LampuOff = String(acoSt12Row[15] || '').trim().toUpperCase();

    const isT93Close =
      st12Close.toUpperCase().includes('T93') || (!st12Open.toUpperCase().includes('T10B') && !st12Close.toUpperCase().includes('T10B'));

    rumdin = {
      officers,
      inspectionDate,
      inspectionTime,
      acoTRDipo: {
        garduT15NStatus: dipoT15n.includes('OPEN') ? 'OPEN' : 'CLOSE',
        garduT135Status: dipoT135.includes('CLOSE') ? 'CLOSE' : 'OPEN',
        alarmStatus: dipoAlarm === 'ALARM' ? 'ALARM' : 'NORMAL',
        powerACO: dipoPowerOff === 'OFF' ? 'OFF' : 'ON',
        lampuIndikator: dipoLampuOff === 'OFF' ? 'OFF' : 'ON',
        keterangan: String(acoDipoRow[16] || '-').trim() || '-',
      },
      acoTRST12: {
        garduT93Status: isT93Close ? 'CLOSE' : 'OPEN',
        garduT10BStatus: isT93Close ? 'OPEN' : 'CLOSE',
        penyulangClose: st12Close || (isT93Close ? 'GARDU T93' : 'GARDU T10B'),
        penyulangOpen: st12Open || (isT93Close ? 'GARDU T10B' : 'GARDU T93'),
        alarmStatus: st12Alarm === 'ALARM' ? 'ALARM' : 'NORMAL',
        powerACO: st12PowerOff === 'OFF' ? 'OFF' : 'ON',
        lampuIndikator: st12LampuOff === 'OFF' ? 'OFF' : 'ON',
        keterangan: String(acoSt12Row[16] || '-').trim() || '-',
      },
      ups40Dipo: parseUpsRow(ups40DRow),
      ups100ST12: parseUpsRow(ups100SRow),
      submittedAt: new Date().toISOString(),
    };
  }

  return {
    isWapresSubmitted,
    isRumdinSubmitted,
    isBothSubmitted,
    wapres,
    rumdin,
    missingInfo,
  };
}

export function serverParseFullSheets(
  rowsCetak: any[][],
  rowsUps: any[][],
  dayOfMonth: number,
  offset: number,
  shift: string,
  dateKey: string
) {
  const tmIdx = 5 + (dayOfMonth - 1) * 3 + offset;
  const st12Idx = 104 + (dayOfMonth - 1) * 3 + offset;
  const dipoIdx = 203 + (dayOfMonth - 1) * 3 + offset;

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

  return serverBuildReports(
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

export function serverParseRowRanges(
  valueRanges: any[],
  _dayOfMonth: number,
  shift: string,
  dateKey: string
) {
  const getRow = (idx: number) => valueRanges[idx]?.values?.[0] || [];

  return serverBuildReports(
    getRow(0),
    getRow(1),
    getRow(2),
    getRow(3),
    getRow(4),
    getRow(5),
    getRow(6),
    getRow(7),
    dateKey,
    shift
  );
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function serverParseAllHistory(
  rowsCetak: any[][],
  rowsUps: any[][],
  year?: number,
  month?: number
): any[] {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1; // 1-12
  const results: any[] = [];

  const shifts = ['PAGI', 'SIANG', 'MALAM'];

  for (let day = 1; day <= 31; day++) {
    for (let offset = 0; offset < 3; offset++) {
      const shift = shifts[offset];
      const dateObj = new Date(targetYear, targetMonth - 1, day);
      if (dateObj.getMonth() !== targetMonth - 1) continue; // invalid date (e.g. 31 Feb)

      const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayName = DAY_NAMES_ID[dateObj.getDay()];
      const monthName = MONTH_NAMES_ID[targetMonth - 1];
      const displayDate = `${dayName}, ${day} ${monthName} ${targetYear}`;

      const parsed = serverParseFullSheets(rowsCetak, rowsUps, day, offset, shift, dateKey);
      if (parsed.isWapresSubmitted || parsed.isRumdinSubmitted) {
        results.push({
          id: `${dateKey}_${shift}`,
          dateKey,
          displayDate,
          shift,
          wapres: parsed.wapres,
          rumdin: parsed.rumdin,
          isSubmitted: true,
          submittedAt: parsed.wapres?.submittedAt || parsed.rumdin?.submittedAt || new Date().toISOString(),
          source: 'spreadsheet',
        });
      }
    }
  }

  // Sort descending by dateKey and shift
  results.sort((a, b) => {
    if (a.dateKey !== b.dateKey) {
      return b.dateKey.localeCompare(a.dateKey);
    }
    const shiftOrder: Record<string, number> = { MALAM: 3, SIANG: 2, PAGI: 1 };
    return (shiftOrder[b.shift] || 0) - (shiftOrder[a.shift] || 0);
  });

  return results;
}

