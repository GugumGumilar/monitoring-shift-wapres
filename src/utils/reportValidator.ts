import { TimWapresReport, TimRumdinReport, UPSData, AcoTMData, CombinedShiftReport } from '../types';

export interface ValidationItem {
  key: string;
  label: string;
  isComplete: boolean;
  missingFields: string[];
}

export interface TeamValidationResult {
  isComplete: boolean;
  completionPercentage: number;
  items: ValidationItem[];
  missingSummary: string[]; // e.g. ["UPS 40 KVA", "UPS 100 KVA"]
  detailedMissingText: string;
}

export interface ShiftValidationResult {
  isComplete: boolean;
  wapres: TeamValidationResult;
  rumdin: TeamValidationResult;
  allMissingList: string[];
  canSendWhatsApp: boolean;
  summaryMessage: string;
}

/**
 * Validasi pemilihan minimal 2 petugas piket
 */
export function validateOfficers(officers?: string[]): ValidationItem {
  const missing: string[] = [];
  if (!officers || officers.length === 0) {
    missing.push('Petugas 1 & 2');
  } else {
    if (!officers[0]?.trim()) missing.push('Petugas 1');
    if (!officers[1]?.trim()) missing.push('Petugas 2');
  }

  return {
    key: 'officers',
    label: '2 Petugas Piket',
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Validasi parameter card beban UPS (Arus Beban R/S/T, Tegangan, Temperatur)
 */
export function validateUPS(label: string, ups?: UPSData | null): ValidationItem {
  const key = label.toLowerCase().replace(/[^a-z0-9]/g, '-');

  if (!ups) {
    return {
      key,
      label,
      isComplete: false,
      missingFields: ['Beban Arus (R, S, T)', 'Tegangan (V)', 'Temperatur (°C)'],
    };
  }

  const missing: string[] = [];

  // 1. Cek Beban Arus (R, S, T)
  const hasLoadR = Boolean(ups.loadR && ups.loadR.trim() !== '' && ups.loadR.trim() !== '-');
  const hasLoadS = Boolean(ups.loadS && ups.loadS.trim() !== '' && ups.loadS.trim() !== '-');
  const hasLoadT = Boolean(ups.loadT && ups.loadT.trim() !== '' && ups.loadT.trim() !== '-');

  if (!hasLoadR || !hasLoadS || !hasLoadT) {
    const missingLoads = [];
    if (!hasLoadR) missingLoads.push('R');
    if (!hasLoadS) missingLoads.push('S');
    if (!hasLoadT) missingLoads.push('T');
    missing.push(`Arus Beban (${missingLoads.join(',')})`);
  }

  // 2. Cek Tegangan Phase-Neutral & Phase-Phase
  const hasRN = Boolean(ups.voltRN && ups.voltRN.trim() !== '' && ups.voltRN.trim() !== '-');
  const hasSN = Boolean(ups.voltSN && ups.voltSN.trim() !== '' && ups.voltSN.trim() !== '-');
  const hasTN = Boolean(ups.voltTN && ups.voltTN.trim() !== '' && ups.voltTN.trim() !== '-');
  const hasRS = Boolean(ups.voltRS && ups.voltRS.trim() !== '' && ups.voltRS.trim() !== '-');
  const hasRT = Boolean(ups.voltRT && ups.voltRT.trim() !== '' && ups.voltRT.trim() !== '-');
  const hasST = Boolean(ups.voltST && ups.voltST.trim() !== '' && ups.voltST.trim() !== '-');

  if (!hasRN || !hasSN || !hasTN || !hasRS || !hasRT || !hasST) {
    missing.push('Tegangan (V)');
  }

  // 3. Cek Temperatur
  const hasTemp = Boolean(ups.temperature && ups.temperature.trim() !== '' && ups.temperature.trim() !== '-');
  if (!hasTemp) {
    missing.push('Temperatur (°C)');
  }

  return {
    key,
    label,
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Validasi parameter ACO TM Gardu D 126 Tim Wapres
 */
export function validateAcoTM(aco?: AcoTMData | null): ValidationItem {
  if (!aco) {
    return {
      key: 'aco-tm',
      label: 'ACO TM Gardu D 126',
      isComplete: false,
      missingFields: ['Penyulang Close/Open', 'Status Operasi'],
    };
  }

  const missing: string[] = [];
  if (!aco.penyulangClose?.trim() || !aco.penyulangOpen?.trim()) {
    missing.push('Penyulang Close/Open');
  }
  if (!aco.powerACO?.trim()) {
    missing.push('Power ACO');
  }

  return {
    key: 'aco-tm',
    label: 'ACO TM Gardu D 126',
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Validasi parameter ACO TR Rumdin (Situbondo 12 & Dipo)
 */
export function validateAcoRumdin(acoDipo?: any, acoST12?: any): ValidationItem {
  const missing: string[] = [];

  if (!acoDipo || !acoDipo.garduT135Status?.trim() || !acoDipo.garduT15NStatus?.trim()) {
    missing.push('ACO TR Dipo (T135/T15N)');
  }

  if (!acoST12 || !acoST12.garduT93Status?.trim() || !acoST12.garduT10BStatus?.trim()) {
    missing.push('ACO TR ST 12 (T93/T10B)');
  }

  return {
    key: 'aco-rumdin',
    label: 'ACO TR (Dipo & ST 12)',
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Validasi seluruh kelengkapan Tim Wapres
 */
export function validateTimWapres(report?: TimWapresReport | null): TeamValidationResult {
  if (!report) {
    return {
      isComplete: false,
      completionPercentage: 0,
      items: [
        { key: 'officers', label: 'Petugas Piket', isComplete: false, missingFields: ['2 Petugas'] },
        { key: 'aco-tm', label: 'ACO TM Gardu D 126', isComplete: false, missingFields: ['Semua Input'] },
        { key: 'ups-30', label: 'UPS 30 KVA', isComplete: false, missingFields: ['Semua Input'] },
        { key: 'ups-40', label: 'UPS 40 KVA', isComplete: false, missingFields: ['Semua Input'] },
        { key: 'ups-60', label: 'UPS 60 KVA', isComplete: false, missingFields: ['Semua Input'] },
      ],
      missingSummary: ['Petugas Piket', 'ACO TM Gardu D 126', 'UPS 30 KVA', 'UPS 40 KVA', 'UPS 60 KVA'],
      detailedMissingText: 'Belum diisi sama sekali',
    };
  }

  const items: ValidationItem[] = [
    validateOfficers(report.officers),
    validateAcoTM(report.acoTM),
    validateUPS('UPS 30 KVA', report.ups30),
    validateUPS('UPS 40 KVA', report.ups40),
    validateUPS('UPS 60 KVA', report.ups60),
  ];

  const incompleteItems = items.filter((item) => !item.isComplete);
  const completedCount = items.length - incompleteItems.length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  const missingSummary = incompleteItems.map((item) => {
    if (item.missingFields.length > 0) {
      return `${item.label} (${item.missingFields.join(', ')})`;
    }
    return item.label;
  });

  return {
    isComplete: incompleteItems.length === 0,
    completionPercentage,
    items,
    missingSummary,
    detailedMissingText:
      incompleteItems.length === 0
        ? 'Lengkap'
        : `Kurang: ${incompleteItems.map((i) => i.label).join(', ')}`,
  };
}

/**
 * Validasi seluruh kelengkapan Tim Rumdin
 */
export function validateTimRumdin(report?: TimRumdinReport | null): TeamValidationResult {
  if (!report) {
    return {
      isComplete: false,
      completionPercentage: 0,
      items: [
        { key: 'officers', label: 'Petugas Piket', isComplete: false, missingFields: ['2 Petugas'] },
        { key: 'aco-rumdin', label: 'ACO TR (Dipo & ST12)', isComplete: false, missingFields: ['Semua Input'] },
        { key: 'ups-40-dipo', label: 'UPS 40 KVA Dipo', isComplete: false, missingFields: ['Semua Input'] },
        { key: 'ups-100-st12', label: 'UPS 100 KVA ST 12', isComplete: false, missingFields: ['Semua Input'] },
      ],
      missingSummary: ['Petugas Piket', 'ACO TR (Dipo & ST12)', 'UPS 40 KVA Dipo', 'UPS 100 KVA ST 12'],
      detailedMissingText: 'Belum diisi sama sekali',
    };
  }

  const items: ValidationItem[] = [
    validateOfficers(report.officers),
    validateAcoRumdin(report.acoTRDipo, report.acoTRST12),
    validateUPS('UPS 40 KVA Dipo', report.ups40Dipo),
    validateUPS('UPS 100 KVA ST 12', report.ups100ST12),
  ];

  const incompleteItems = items.filter((item) => !item.isComplete);
  const completedCount = items.length - incompleteItems.length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  const missingSummary = incompleteItems.map((item) => {
    if (item.missingFields.length > 0) {
      return `${item.label} (${item.missingFields.join(', ')})`;
    }
    return item.label;
  });

  return {
    isComplete: incompleteItems.length === 0,
    completionPercentage,
    items,
    missingSummary,
    detailedMissingText:
      incompleteItems.length === 0
        ? 'Lengkap'
        : `Kurang: ${incompleteItems.map((i) => i.label).join(', ')}`,
  };
}

/**
 * Validasi gabungan kedua tim untuk verifikasi tombol WhatsApp
 */
export function validateShiftReport(report: CombinedShiftReport): ShiftValidationResult {
  const wapres = validateTimWapres(report.wapres);
  const rumdin = validateTimRumdin(report.rumdin);

  const allMissingList: string[] = [];
  if (!wapres.isComplete) {
    allMissingList.push(`Tim Wapres: ${wapres.detailedMissingText}`);
  }
  if (!rumdin.isComplete) {
    allMissingList.push(`Tim Rumdin: ${rumdin.detailedMissingText}`);
  }

  const canSendWhatsApp = wapres.isComplete && rumdin.isComplete;

  let summaryMessage = 'Semua data kedua tim lengkap. Format laporan siap dikirim ke WhatsApp.';
  if (!canSendWhatsApp) {
    summaryMessage = `Laporan belum lengkap! ${allMissingList.join(' | ')}`;
  }

  return {
    isComplete: canSendWhatsApp,
    wapres,
    rumdin,
    allMissingList,
    canSendWhatsApp,
    summaryMessage,
  };
}
