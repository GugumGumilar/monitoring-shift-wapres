import { CombinedShiftReport, ShiftType, TimRumdinReport, TimWapresReport, UPSData } from '../types';

export const MONTH_NAMES = [
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

export function getShiftOperationalDate(date: Date = new Date()): Date {
  const opDate = new Date(date.getTime());
  const hour = opDate.getHours();
  // Shift Malam (22.00 - 07.59 WIB):
  // Jika diakses/input data setelah lewat tengah malam (00.00 - 07.59 WIB),
  // tanggal yang digunakan tetap mengacu pada tanggal shift dimulai (hari sebelumnya / kemarin).
  if (hour < 8) {
    opDate.setDate(opDate.getDate() - 1);
  }
  return opDate;
}

export function formatCalendarDate(date: Date = new Date()): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatIndonesianDate(date?: Date, isRawCalendarDate: boolean = false): string {
  if (isRawCalendarDate) {
    const d = date || new Date();
    return formatCalendarDate(d);
  }
  const d = date ? getShiftOperationalDate(date) : getShiftOperationalDate();
  return formatCalendarDate(d);
}

/**
 * Normalizes any date string (including JavaScript Date strings like
 * "Sun Sep 13 2026 00:00:00 GMT+0700 (中南半島時間)", ISO strings, DD/MM/YYYY, etc.)
 * into standard clean Indonesian date: "12 April 2026" / "13 September 2026".
 */
export function normalizeIndonesianDate(inputDate?: any): string {
  if (!inputDate) return formatIndonesianDate();
  if (inputDate instanceof Date) {
    if (isNaN(inputDate.getTime())) return formatIndonesianDate();
    return formatCalendarDate(inputDate);
  }

  const str = String(inputDate).trim();
  if (!str || str === '-' || str.toLowerCase() === 'null') {
    return formatIndonesianDate();
  }

  // If already formatted like "12 April 2026" or "12 APRIL 2026"
  const indoWordMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (indoWordMatch) {
    const day = parseInt(indoWordMatch[1], 10);
    const mStr = indoWordMatch[2].toUpperCase();
    const year = indoWordMatch[3];
    const MAP: Record<string, string> = {
      JAN: 'Januari', JANUARI: 'Januari', JANUARY: 'Januari',
      FEB: 'Februari', FEBRUARI: 'Februari', FEBRUARY: 'Februari',
      MAR: 'Maret', MARET: 'Maret', MARCH: 'Maret',
      APR: 'April', APRIL: 'April',
      MEI: 'Mei', MAY: 'Mei',
      JUN: 'Juni', JUNI: 'Juni', JUNE: 'Juni',
      JUL: 'Juli', JULI: 'Juli', JULY: 'Juli',
      AGU: 'Agustus', AGUSTUS: 'Agustus', AUG: 'Agustus', AUGUST: 'Agustus',
      SEP: 'September', SEPTEMBER: 'September',
      OKT: 'Oktober', OKTOBER: 'Oktober', OCT: 'Oktober', OCTOBER: 'Oktober',
      NOV: 'November', NOVEMBER: 'November',
      DES: 'Desember', DESEMBER: 'Desember', DEC: 'Desember', DECEMBER: 'Desember',
    };
    if (MAP[mStr]) {
      return `${day} ${MAP[mStr]} ${year}`;
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const mIdx = parseInt(ddmmyyyy[2], 10) - 1;
    const year = ddmmyyyy[3];
    if (mIdx >= 0 && mIdx < 12) {
      return `${day} ${MONTH_NAMES[mIdx]} ${year}`;
    }
  }

  // Check YYYY-MM-DD (e.g. 2026-09-13)
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const mIdx = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    if (mIdx >= 0 && mIdx < 12) {
      return `${day} ${MONTH_NAMES[mIdx]} ${year}`;
    }
  }

  // Parse strings like "Sun Sep 13 2026 00:00:00 GMT+0700 (中南半島時間)"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatCalendarDate(parsed);
  }

  return str;
}


export function formatDDMMYYYY(date?: Date, isRawCalendarDate: boolean = false): string {
  const target = isRawCalendarDate ? (date || new Date()) : (date ? getShiftOperationalDate(date) : getShiftOperationalDate());
  const day = String(target.getDate()).padStart(2, '0');
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const year = target.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatIndonesianTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WIB`;
}

export function getCurrentShift(date: Date = new Date()): ShiftType {
  const hour = date.getHours();
  // Pagi: 08.00 - 15.00 (8 <= hour < 15)
  // Siang: 15.00 - 22.00 (15 <= hour < 22)
  // Malam: 22.00 - 08.00 (hour >= 22 || hour < 8)
  if (hour >= 8 && hour < 15) {
    return 'PAGI';
  } else if (hour >= 15 && hour < 22) {
    return 'SIANG';
  } else {
    return 'MALAM';
  }
}

export function getShiftTimeRange(shift: ShiftType): string {
  switch (shift) {
    case 'PAGI':
      return '08.00 - 14.59 WIB';
    case 'SIANG':
      return '15.00 - 21.59 WIB';
    case 'MALAM':
      return '22.00 - 07.59 WIB';
    default:
      return '';
  }
}

export function getDateKey(date?: Date, isRawCalendarDate: boolean = false): string {
  const target = isRawCalendarDate ? (date || new Date()) : (date ? getShiftOperationalDate(date) : getShiftOperationalDate());
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyUPS(overrides: Partial<UPSData> = {}): UPSData {
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
    backupTotalMinutes: '',
    keterangan: '-',
    ...overrides,
  };
}

function formatHoursDisplay(val?: string, totalMinutes?: string): string {
  if (val !== undefined && val.trim() !== '' && val !== '-') {
    const clean = val.replace(/jam/gi, '').trim();
    return `${clean} Jam`;
  }
  if (totalMinutes !== undefined && totalMinutes.trim() !== '') {
    const total = parseInt(totalMinutes, 10);
    if (!isNaN(total)) {
      return `${Math.floor(total / 60)} Jam`;
    }
  }
  return '0 Jam';
}

function formatMinutesDisplay(val?: string, totalMinutes?: string): string {
  if (val !== undefined && val.trim() !== '' && val !== '-') {
    const clean = val.replace(/menit/gi, '').trim();
    return `${clean} Menit`;
  }
  if (totalMinutes !== undefined && totalMinutes.trim() !== '') {
    const total = parseInt(totalMinutes, 10);
    if (!isNaN(total)) {
      return `${total % 60} Menit`;
    }
  }
  return '0 Menit';
}

export function createDefaultWapresData(): TimWapresReport {
  return {
    officers: ['', ''],
    inspectionDate: formatIndonesianDate(),
    inspectionTime: formatIndonesianTime(),
    ups30: createEmptyUPS(),
    ups40: createEmptyUPS({
      keterangan: 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)',
    }),
    ups60: createEmptyUPS(),
    acoTM: {
      penyulangClose: 'P HAYAM WURUK GI GAMBIR LAMA',
      penyulangOpen: 'KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)',
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      chargingKubikel: 'YA',
      remoteKubikel: 'AUTO',
      lampuIndikator: 'ON',
      keterangan: '-',
    },
    submittedAt: new Date().toISOString(),
  };
}

export function createDefaultRumdinData(): TimRumdinReport {
  return {
    officers: ['', ''],
    inspectionDate: formatIndonesianDate(),
    inspectionTime: formatIndonesianTime(),
    acoTRDipo: {
      garduT135Status: 'OPEN',
      garduT15NStatus: 'CLOSE',
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      lampuIndikator: 'ON',
      keterangan: '-',
    },
    acoTRST12: {
      garduT93Status: 'CLOSE',
      garduT10BStatus: 'OPEN',
      penyulangClose: 'GARDU T93',
      penyulangOpen: 'GARDU T10B',
      alarmStatus: 'NORMAL',
      powerACO: 'ON',
      lampuIndikator: 'ON',
      keterangan: '-',
    },
    ups40Dipo: createEmptyUPS({
      keterangan: 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)',
    }),
    ups100ST12: createEmptyUPS(),
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Format string exactly as specified in the user prompt for WhatsApp
 */
export function generateWhatsAppReport(report: CombinedShiftReport): string {
  const parts: string[] = [];

  // Header
  parts.push(`*LAPORAN MONITORING SHIFT ${report.shift}*`);

  // SECTION: Tim Wapres
  if (report.wapres) {
    const w = report.wapres;
    const officersStr = w.officers
      .filter(Boolean)
      .map((n) => n.toUpperCase())
      .join(' , ');

    parts.push('======================');
    parts.push('*_Pantauan UPS Dan ACO TM Gardu D 126 SetWapres_*');
    parts.push('======================');
    parts.push('Nama petugas :');
    parts.push(officersStr || '-');
    parts.push('Tanggal :');
    parts.push(normalizeIndonesianDate(w.inspectionDate || report.displayDate));
    parts.push('Jam Inspeksi :');
    parts.push(w.inspectionTime || formatIndonesianTime());

    // UPS 30 KVA
    parts.push('======================');
    parts.push('*_Pantauan Beban UPS 30 KVA_*');
    parts.push('======================');
    parts.push('BEBAN UPS 30 KVA :');
    parts.push(`R : ${w.ups30.loadR || '0'} A`);
    parts.push(`S : ${w.ups30.loadS || '0'} A`);
    parts.push(`T : ${w.ups30.loadT || '0'} A`);
    parts.push('Tegangan UPS (V) :');
    parts.push(`R-N: ${w.ups30.voltRN || '0'} V`);
    parts.push(`S-N: ${w.ups30.voltSN || '0'} V`);
    parts.push(`T-N: ${w.ups30.voltTN || '0'} V`);
    parts.push(`R-S: ${w.ups30.voltRS || '0'} V`);
    parts.push(`R-T: ${w.ups30.voltRT || '0'} V`);
    parts.push(`S-T: ${w.ups30.voltST || '0'} V`);
    parts.push('Temperatur ups :');
    parts.push(`${w.ups30.temperature || '0'} °C`);
    parts.push('Alarm UPS :');
    parts.push(w.ups30.alarm || 'NORMAL');
    parts.push('Back Up Time UPS :');
    parts.push(`Hours : ${formatHoursDisplay(w.ups30.backupHours, w.ups30.backupTotalMinutes)}`);
    parts.push(`Minutes: ${formatMinutesDisplay(w.ups30.backupMinutes, w.ups30.backupTotalMinutes)}`);
    parts.push('Keterangan :');
    parts.push(w.ups30.keterangan || '-');

    // UPS 40 KVA
    parts.push('======================');
    parts.push('*_Pantauan Beban UPS 40 KVA_*');
    parts.push('======================');
    parts.push('BEBAN UPS 40 KVA :');
    parts.push(`R : ${w.ups40.loadR || '0'} A`);
    parts.push(`S : ${w.ups40.loadS || '0'} A`);
    parts.push(`T : ${w.ups40.loadT || '0'} A`);
    parts.push('Tegangan UPS (V) :');
    parts.push(`R-N: ${w.ups40.voltRN || '0'} V`);
    parts.push(`S-N: ${w.ups40.voltSN || '0'} V`);
    parts.push(`T-N: ${w.ups40.voltTN || '0'} V`);
    parts.push(`R-S: ${w.ups40.voltRS || '0'} V`);
    parts.push(`R-T: ${w.ups40.voltRT || '0'} V`);
    parts.push(`S-T: ${w.ups40.voltST || '0'} V`);
    parts.push('Temperatur ups :');
    parts.push(`${w.ups40.temperature || '0'} °C`);
    parts.push('Alarm UPS :');
    parts.push(w.ups40.alarm || 'NORMAL');
    parts.push('Back Up Time UPS :');
    parts.push(`Hours : ${formatHoursDisplay(w.ups40.backupHours, w.ups40.backupTotalMinutes)}`);
    parts.push(`Minutes: ${formatMinutesDisplay(w.ups40.backupMinutes, w.ups40.backupTotalMinutes)}`);
    parts.push('Keterangan :');
    parts.push(w.ups40.keterangan || '-');

    // UPS 60 KVA
    parts.push('======================');
    parts.push('*_Pantauan Beban UPS 60 KVA_*');
    parts.push('======================');
    parts.push('BEBAN UPS 60 KVA :');
    parts.push(`R : ${w.ups60.loadR || '0'} A`);
    parts.push(`S : ${w.ups60.loadS || '0'} A`);
    parts.push(`T : ${w.ups60.loadT || '0'} A`);
    parts.push('Tegangan UPS (V) :');
    parts.push(`R-N: ${w.ups60.voltRN || '0'} V`);
    parts.push(`S-N: ${w.ups60.voltSN || '0'} V`);
    parts.push(`T-N: ${w.ups60.voltTN || '0'} V`);
    parts.push(`R-S: ${w.ups60.voltRS || '0'} V`);
    parts.push(`R-T: ${w.ups60.voltRT || '0'} V`);
    parts.push(`S-T: ${w.ups60.voltST || '0'} V`);
    parts.push('Temperatur ups :');
    parts.push(`${w.ups60.temperature || '0'} °C`);
    parts.push('Alarm UPS :');
    parts.push(w.ups60.alarm || 'NORMAL');
    parts.push('Back Up Time UPS :');
    parts.push(`Hours : ${formatHoursDisplay(w.ups60.backupHours, w.ups60.backupTotalMinutes)}`);
    parts.push(`Minutes: ${formatMinutesDisplay(w.ups60.backupMinutes, w.ups60.backupTotalMinutes)}`);
    parts.push('Keterangan :');
    parts.push(w.ups60.keterangan || '-');

    // ACO TM Gardu D 126 SetWapres
    parts.push('======================');
    parts.push('*_Pantauan ACO TM Gardu D 126 SetWapres_*');
    parts.push('======================');
    parts.push('Status Penyulang :');
    parts.push(`ClOSE ( // ) : ${w.acoTM.penyulangClose || '-'}`);
    parts.push(`OPEN ( # ) : ${w.acoTM.penyulangOpen || '-'}`);
    parts.push('Alarm Status :');
    parts.push(`ALARM : ${w.acoTM.alarmStatus === 'ALARM' ? 'ALARM' : '-'}`);
    parts.push(`NORMAL : ${w.acoTM.alarmStatus === 'NORMAL' ? 'NORMAL' : '-'}`);
    parts.push('Power ACO :');
    parts.push(`ON : ${w.acoTM.powerACO === 'ON' ? 'ON' : '-'}`);
    parts.push(`OFF : ${w.acoTM.powerACO === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Status Charging Kubikel :');
    parts.push(`Ya : ${w.acoTM.chargingKubikel === 'YA' ? 'YA' : '-'}`);
    parts.push(`Tidak : ${w.acoTM.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-'}`);
    parts.push('Status Remote Kubikel :');
    parts.push(`Local : ${w.acoTM.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-'}`);
    parts.push(`Auto : ${w.acoTM.remoteKubikel === 'AUTO' ? 'AUTO' : '-'}`);
    parts.push('Lampu Indikator :');
    parts.push(`On : ${w.acoTM.lampuIndikator === 'ON' ? 'ON' : '-'}`);
    parts.push(`Off : ${w.acoTM.lampuIndikator === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Keterangan :');
    parts.push(w.acoTM.keterangan || '-');
  }

  // SECTION: Tim Rumdin
  if (report.rumdin) {
    const r = report.rumdin;
    const officersStr = r.officers
      .filter(Boolean)
      .map((n) => n.toUpperCase())
      .join(' , ');

    parts.push('=========================');
    parts.push('*_Pantauan UPS Dan ACO TR Rumdin Wapres_*');
    parts.push('=========================');
    parts.push('Nama Petugas :');
    parts.push(officersStr || '-');
    parts.push('Tanggal :');
    parts.push(normalizeIndonesianDate(r.inspectionDate || report.displayDate));
    parts.push('Jam Inspeksi :');
    parts.push(r.inspectionTime || formatIndonesianTime());

    // ACO TR Rumdin Wapres (Dipo)
    parts.push('=========================');
    parts.push('*_Pantauan UPS Dan ACO TR Rumdin Wapres (Dipo)_*');
    parts.push('=========================');
    parts.push('Status ACO TR :');
    parts.push('Gardu T135');
    parts.push(`Close ( // )/Open ( # ) : ${r.acoTRDipo.garduT135Status || '-'}`);
    parts.push('Gardu T15N');
    parts.push(`Close ( // ) /Open ( # ) : ${r.acoTRDipo.garduT15NStatus || '-'}`);
    parts.push('Alarm Status :');
    parts.push(`Alarm : ${r.acoTRDipo.alarmStatus === 'ALARM' ? 'ALARM' : '-'}`);
    parts.push(`Normal : ${r.acoTRDipo.alarmStatus === 'NORMAL' ? 'NORMAL' : '-'}`);
    parts.push('Status Power ACO TR (Dipo) :');
    parts.push(`On : ${r.acoTRDipo.powerACO === 'ON' ? 'ON' : '-'}`);
    parts.push(`OFF : ${r.acoTRDipo.powerACO === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Lampu Indikator :');
    parts.push(`On : ${r.acoTRDipo.lampuIndikator === 'ON' ? 'ON' : '-'}`);
    parts.push(`Off : ${r.acoTRDipo.lampuIndikator === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Keterangan :');
    parts.push(r.acoTRDipo.keterangan || '-');

    // ACO TR Rumdin Wapres (ST12)
    const t93Status =
      r.acoTRST12.garduT93Status ||
      (r.acoTRST12.penyulangClose?.includes('T93') ? 'CLOSE' : 'OPEN');
    const t10BStatus =
      r.acoTRST12.garduT10BStatus ||
      (r.acoTRST12.penyulangOpen?.includes('T10B') ? 'OPEN' : 'CLOSE');

    parts.push('=========================');
    parts.push('*_Pantauan Inpeksi ACO TR Rumdin Wapres (ST12)_*');
    parts.push('=========================');
    parts.push('Status ACO TR :');
    parts.push('Gardu T93');
    parts.push(`Close ( // )/Open ( # ) : ${t93Status}`);
    parts.push('Gardu T10B');
    parts.push(`Close ( // ) /Open ( # ) : ${t10BStatus}`);
    parts.push('Alarm Status :');
    parts.push(`Alarm : ${r.acoTRST12.alarmStatus === 'ALARM' ? 'ALARM' : '-'}`);
    parts.push(`Normal : ${r.acoTRST12.alarmStatus === 'NORMAL' ? 'NORMAL' : '-'}`);
    parts.push('Status Power ACO TR ST 12 :');
    parts.push(`On : ${r.acoTRST12.powerACO === 'ON' ? 'ON' : '-'}`);
    parts.push(`Off : ${r.acoTRST12.powerACO === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Lampu Indikator :');
    parts.push(`On : ${r.acoTRST12.lampuIndikator === 'ON' ? 'ON' : '-'}`);
    parts.push(`Off : ${r.acoTRST12.lampuIndikator === 'OFF' ? 'OFF' : '-'}`);
    parts.push('Keterangan :');
    parts.push(r.acoTRST12.keterangan || '-');

    // UPS 40 KVA RUMDIN (Dipo)
    parts.push('======================');
    parts.push('*_Pantauan Beban UPS 40 KVA RUMDIN (Dipo)_*');
    parts.push('======================');
    parts.push(`R: ${r.ups40Dipo.loadR || '0'} A`);
    parts.push(`S: ${r.ups40Dipo.loadS || '0'} A`);
    parts.push(`T: ${r.ups40Dipo.loadT || '0'} A`);
    parts.push('Tegangan UPS (V) :');
    parts.push(`R-N: ${r.ups40Dipo.voltRN || '0'} V`);
    parts.push(`S-N: ${r.ups40Dipo.voltSN || '0'} V`);
    parts.push(`T-N: ${r.ups40Dipo.voltTN || '0'} V`);
    parts.push(`R-S: ${r.ups40Dipo.voltRS || '0'} V`);
    parts.push(`R-T: ${r.ups40Dipo.voltRT || '0'} V`);
    parts.push(`S-T: ${r.ups40Dipo.voltST || '0'} V`);
    parts.push('Temperatur ups :');
    parts.push(`${r.ups40Dipo.temperature || '0'} °C`);
    parts.push('Alarm UPS :');
    parts.push(r.ups40Dipo.alarm || 'NORMAL');
    parts.push('Back Up Time UPS :');
    parts.push(`Hours : ${formatHoursDisplay(r.ups40Dipo.backupHours, r.ups40Dipo.backupTotalMinutes)}`);
    parts.push(`Minutes: ${formatMinutesDisplay(r.ups40Dipo.backupMinutes, r.ups40Dipo.backupTotalMinutes)}`);
    parts.push('Keterangan :');
    parts.push(r.ups40Dipo.keterangan || '-');

    // UPS 100 KVA RUMDIN (ST12)
    parts.push('======================');
    parts.push('*_Pantauan Beban UPS 100 KVA RUMDIN (ST12)_*');
    parts.push('======================');
    parts.push(`R: ${r.ups100ST12.loadR || '0'} A`);
    parts.push(`S: ${r.ups100ST12.loadS || '0'} A`);
    parts.push(`T: ${r.ups100ST12.loadT || '0'} A`);
    parts.push('Tegangan UPS (V) :');
    parts.push(`R-N: ${r.ups100ST12.voltRN || '0'} V`);
    parts.push(`S-N: ${r.ups100ST12.voltSN || '0'} V`);
    parts.push(`T-N: ${r.ups100ST12.voltTN || '0'} V`);
    parts.push(`R-S: ${r.ups100ST12.voltRS || '0'} V`);
    parts.push(`R-T: ${r.ups100ST12.voltRT || '0'} V`);
    parts.push(`S-T: ${r.ups100ST12.voltST || '0'} V`);
    parts.push('Temperatur ups :');
    parts.push(`${r.ups100ST12.temperature || '0'} °C`);
    parts.push('Alarm UPS :');
    parts.push(r.ups100ST12.alarm || 'NORMAL');
    parts.push('Back Up Time UPS :');
    parts.push(`Hours : ${formatHoursDisplay(r.ups100ST12.backupHours, r.ups100ST12.backupTotalMinutes)}`);
    parts.push(`Minutes: ${formatMinutesDisplay(r.ups100ST12.backupMinutes, r.ups100ST12.backupTotalMinutes)}`);
    parts.push('Keterangan :');
    parts.push(r.ups100ST12.keterangan || '-');
  }

  // Footer
  parts.push('*_Terimakasih_*');

  return parts.join('\n');
}

export function generateSampleReport(shift: ShiftType = 'MALAM'): CombinedShiftReport {
  const dateStr = formatIndonesianDate();
  return {
    id: `${getDateKey()}_${shift}`,
    dateKey: getDateKey(),
    shift,
    displayDate: dateStr,
    wapres: {
      officers: ['Fajar', 'Yudhy'],
      inspectionDate: dateStr,
      inspectionTime: '22:38 WIB',
      ups30: {
        loadR: '3.1',
        loadS: '7.4',
        loadT: '8',
        voltRN: '223',
        voltSN: '223',
        voltTN: '223',
        voltRS: '387',
        voltRT: '386',
        voltST: '385',
        temperature: '25',
        alarm: 'NORMAL',
        backupHours: '13',
        backupMinutes: '0',
        keterangan: '-',
      },
      ups40: {
        loadR: '8.4',
        loadS: '10.5',
        loadT: '9',
        voltRN: '218',
        voltSN: '217',
        voltTN: '218',
        voltRS: '376',
        voltRT: '377',
        voltST: '377',
        temperature: '26',
        alarm: 'NORMAL',
        backupHours: '0',
        backupMinutes: '0',
        keterangan: 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)',
      },
      ups60: {
        loadR: '1.4',
        loadS: '1.7',
        loadT: '0.5',
        voltRN: '231',
        voltSN: '231',
        voltTN: '230',
        voltRS: '400',
        voltRT: '399',
        voltST: '397',
        temperature: '25',
        alarm: 'NORMAL',
        backupHours: '16',
        backupMinutes: '49',
        keterangan: '-',
      },
      acoTM: {
        penyulangClose: 'P HAYAM WURUK GI GAMBIR LAMA',
        penyulangOpen: 'KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)',
        alarmStatus: 'NORMAL',
        powerACO: 'ON',
        chargingKubikel: 'YA',
        remoteKubikel: 'AUTO',
        lampuIndikator: 'ON',
        keterangan: '-',
      },
      submittedAt: new Date().toISOString(),
    },
    rumdin: {
      officers: ['Agel', 'Sutra'],
      inspectionDate: dateStr,
      inspectionTime: '22:19 WIB',
      acoTRDipo: {
        garduT135Status: 'OPEN',
        garduT15NStatus: 'CLOSE',
        alarmStatus: 'NORMAL',
        powerACO: 'ON',
        lampuIndikator: 'ON',
        keterangan: '-',
      },
      acoTRST12: {
        garduT93Status: 'CLOSE',
        garduT10BStatus: 'OPEN',
        penyulangClose: 'GARDU T93',
        penyulangOpen: 'GARDU T10B',
        alarmStatus: 'NORMAL',
        powerACO: 'ON',
        lampuIndikator: 'ON',
        keterangan: '-',
      },
      ups40Dipo: {
        loadR: '2',
        loadS: '2',
        loadT: '0.7',
        voltRN: '233',
        voltSN: '237',
        voltTN: '234',
        voltRS: '407',
        voltRT: '409',
        voltST: '404',
        temperature: '18',
        alarm: 'NORMAL',
        backupHours: '0',
        backupMinutes: '0',
        keterangan: 'Backup time ups tidak terbaca (harus di padamkan terlebih dahulu)',
      },
      ups100ST12: {
        loadR: '16.3',
        loadS: '5.9',
        loadT: '22.1',
        voltRN: '225',
        voltSN: '225',
        voltTN: '255',
        voltRS: '406',
        voltRT: '408',
        voltST: '406',
        temperature: '22',
        alarm: 'NORMAL',
        backupHours: '9',
        backupMinutes: '43',
        keterangan: '-',
      },
      submittedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export function getRealtimeBriefingInfo(date: Date = new Date()) {
  const opDate = getShiftOperationalDate(date);
  const dayName = INDONESIAN_DAYS[opDate.getDay()];
  const monthName = MONTH_NAMES[opDate.getMonth()].toLowerCase();
  const dateStr = `${opDate.getDate()} ${monthName} ${opDate.getFullYear()}`;
  const shiftType = getCurrentShift(date);
  const shiftLabel = shiftType === 'PAGI' ? 'Pagi' : shiftType === 'SIANG' ? 'Siang' : 'Malam';
  return {
    day: dayName,
    date: dateStr,
    shift: shiftLabel,
    shiftType,
  };
}

export function formatBriefingWhatsAppText(params: {
  day: string;
  date: string;
  shift: string;
  wapresOfficers: [string, string];
  rumdinOfficers: [string, string];
  officerDb: Record<string, { fullName: string; phone: string }>;
}): string {
  const formatOfficer = (num: number, officerName: string) => {
    if (!officerName) return `${num}. [Pilih Petugas]`;
    const contact = params.officerDb[officerName];
    if (contact) {
      return `${num}. ${contact.fullName} (${contact.phone})`;
    }
    return `${num}. ${officerName}`;
  };

  return `*LAPORAN PETUGAS PIKET*
*POSKO ISTANA WAKIL PRESIDEN DAN RUMAH DINAS WAKIL PRESIDEN / VVIP*
==============================
*Hari :* ${params.day}
*Tanggal :* ${params.date}
*Shift :* ${params.shift}

*Istana Wakil Presiden :*
${formatOfficer(1, params.wapresOfficers[0])}
${formatOfficer(2, params.wapresOfficers[1])}

*Rumah Dinas Wakil Presiden dan VVIP :*
${formatOfficer(1, params.rumdinOfficers[0])}
${formatOfficer(2, params.rumdinOfficers[1])}

==============================
*FOKUS BEKERJA*

*Semoga Jaringan Aman dan Handal*
*Amiiin* 🤲`;
}
