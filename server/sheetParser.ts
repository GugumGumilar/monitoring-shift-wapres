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
  const isWapresTmFilled = isRowFilled(acoTmRow);
  const isWapresUpsFilled = isRowFilled(ups30Row) || isRowFilled(ups40WRow) || isRowFilled(ups60WRow);
  const isWapresSubmitted = isWapresTmFilled || isWapresUpsFilled;

  const isRumdinAcoFilled = isRowFilled(acoDipoRow) || isRowFilled(acoSt12Row);
  const isRumdinUpsFilled = isRowFilled(ups40DRow) || isRowFilled(ups100SRow);
  const isRumdinSubmitted = isRumdinAcoFilled || isRumdinUpsFilled;

  let wapres = null;
  if (isWapresSubmitted) {
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
  if (isRumdinSubmitted) {
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
    wapres,
    rumdin,
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
