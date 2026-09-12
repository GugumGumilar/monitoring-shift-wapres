export type ShiftType = 'PAGI' | 'SIANG' | 'MALAM';

export interface ShiftInfo {
  type: ShiftType;
  label: string;
  timeRange: string;
  startHour: number;
  endHour: number;
}

export const SHIFTS: ShiftInfo[] = [
  { type: 'PAGI', label: 'Shift Pagi', timeRange: '08.00 - 15.00', startHour: 8, endHour: 15 },
  { type: 'SIANG', label: 'Shift Siang', timeRange: '15.00 - 22.00', startHour: 15, endHour: 22 },
  { type: 'MALAM', label: 'Shift Malam', timeRange: '22.00 - 08.00', startHour: 22, endHour: 8 },
];

export const STAFF_LIST = [
  'Gugum',
  'Indro',
  'Lukman',
  'Windhu',
  'Asep',
  'Damar',
  'Hendri',
  'Sendi',
  'Sutra',
  'Agel',
  'Ismanto',
  'Halim',
  'Hilal',
  'Fajar',
  'Yudhy',
  'Parid',
] as const;

export type StaffName = (typeof STAFF_LIST)[number];

export const ACO_TM_PENYULANG_OPTIONS = [
  'EL. ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)',
  'P HAYAM WURUK GI GAMBIR LAMA',
  'KOPEL ACO (GH41 P HONGKONG GI BUDI KEMULIAAN)',
  'KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)',
  'KOPEL ACO (KS3A P REKANAN GI KEBON SIRIH)',
] as const;

export type AcoTMPenyulangOption = (typeof ACO_TM_PENYULANG_OPTIONS)[number];

export interface UPSData {
  loadR: string;
  loadS: string;
  loadT: string;
  voltRN: string;
  voltSN: string;
  voltTN: string;
  voltRS: string;
  voltRT: string;
  voltST: string;
  temperature: string;
  alarm: 'NORMAL' | 'ALARM';
  backupHours: string;
  backupMinutes: string;
  backupTotalMinutes?: string;
  keterangan: string;
}

export interface AcoTMData {
  penyulangClose: string;
  penyulangOpen: string;
  alarmStatus: 'NORMAL' | 'ALARM';
  powerACO: 'ON' | 'OFF';
  chargingKubikel: 'YA' | 'TIDAK';
  remoteKubikel: 'AUTO' | 'LOCAL';
  lampuIndikator: 'ON' | 'OFF';
  keterangan: string;
}

export interface AcoTRDipoData {
  garduT135Status: 'OPEN' | 'CLOSE';
  garduT15NStatus: 'OPEN' | 'CLOSE';
  alarmStatus: 'NORMAL' | 'ALARM';
  powerACO: 'ON' | 'OFF';
  lampuIndikator: 'ON' | 'OFF';
  keterangan: string;
}

export interface AcoTRST12Data {
  garduT93Status: 'OPEN' | 'CLOSE';
  garduT10BStatus: 'OPEN' | 'CLOSE';
  penyulangClose?: string;
  penyulangOpen?: string;
  alarmStatus: 'NORMAL' | 'ALARM';
  powerACO: 'ON' | 'OFF';
  lampuIndikator: 'ON' | 'OFF';
  keterangan: string;
}

export interface TimWapresReport {
  officers: [string, string];
  inspectionDate: string;
  inspectionTime: string;
  ups30: UPSData;
  ups40: UPSData;
  ups60: UPSData;
  acoTM: AcoTMData;
  submittedAt: string;
}

export interface TimRumdinReport {
  officers: [string, string];
  inspectionDate: string;
  inspectionTime: string;
  acoTRDipo: AcoTRDipoData;
  acoTRST12: AcoTRST12Data;
  ups40Dipo: UPSData;
  ups100ST12: UPSData;
  submittedAt: string;
}

export interface CombinedShiftReport {
  id: string; // e.g. "2026-09-10_MALAM"
  dateKey: string; // YYYY-MM-DD
  shift: ShiftType;
  displayDate: string; // e.g. "10 SEPTEMBER 2026"
  wapres?: TimWapresReport;
  rumdin?: TimRumdinReport;
  createdAt: string;
  updatedAt: string;
}

export type ShiftReportRecord = CombinedShiftReport;

