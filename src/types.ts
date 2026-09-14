export type ShiftType = 'PAGI' | 'SIANG' | 'MALAM';

export interface ShiftInfo {
  type: ShiftType;
  label: string;
  timeRange: string;
  startHour: number;
  endHour: number;
}

export const SHIFTS: ShiftInfo[] = [
  { type: 'PAGI', label: 'Shift Pagi', timeRange: '08.00 - 14.59', startHour: 8, endHour: 15 },
  { type: 'SIANG', label: 'Shift Siang', timeRange: '15.00 - 21.59', startHour: 15, endHour: 22 },
  { type: 'MALAM', label: 'Shift Malam', timeRange: '22.00 - 07.59', startHour: 22, endHour: 8 },
];

export const STAFF_LIST = [
  'Gugum G',
  'Indro P',
  'Julianto L N',
  'Windhu W',
  'AsepK',
  'Damar S Y',
  'Hendri P',
  'Sendi',
  'Sutra Aditio',
  'Agel Bayu S',
  'Ismanto',
  'Halim',
  'M. Hilal',
  'Fajar N S',
  'Yudhy S',
  'Parid M',
] as const;

export type StaffName = (typeof STAFF_LIST)[number];

export interface OfficerContactInfo {
  shortName: string;
  fullName: string;
  phone: string;
}

export const OFFICER_DATABASE: Record<string, { fullName: string; phone: string }> = {
  'Gugum G': { fullName: 'Gugum G', phone: '08892146641' },
  Gugum: { fullName: 'Gugum G', phone: '08892146641' },
  'Indro P': { fullName: 'Indro P', phone: '085729968119' },
  Indro: { fullName: 'Indro P', phone: '085729968119' },
  'Julianto L N': { fullName: 'Julianto L N', phone: '085794556859' },
  Julianto: { fullName: 'Julianto L N', phone: '085794556859' },
  Lukman: { fullName: 'Julianto L N', phone: '085794556859' },
  'Windhu W': { fullName: 'Windhu W', phone: '089503918722' },
  Windhu: { fullName: 'Windhu W', phone: '089503918722' },
  AsepK: { fullName: 'AsepK', phone: '089669477147' },
  'Asep K': { fullName: 'AsepK', phone: '089669477147' },
  Asep: { fullName: 'AsepK', phone: '089669477147' },
  'Damar S Y': { fullName: 'Damar S Y', phone: '081389063562' },
  Damar: { fullName: 'Damar S Y', phone: '081389063562' },
  'Hendri P': { fullName: 'Hendri P', phone: '082113118412' },
  Hendri: { fullName: 'Hendri P', phone: '082113118412' },
  Sendi: { fullName: 'Sendi', phone: '089654800157' },
  'Sutra Aditio': { fullName: 'Sutra Aditio', phone: '089513066474' },
  Sutra: { fullName: 'Sutra Aditio', phone: '089513066474' },
  'Agel Bayu S': { fullName: 'Agel Bayu S', phone: '085156264583' },
  Agel: { fullName: 'Agel Bayu S', phone: '085156264583' },
  Ismanto: { fullName: 'Ismanto', phone: '085780544419' },
  Halim: { fullName: 'Halim', phone: '0895352535273' },
  'M. Hilal': { fullName: 'M. Hilal', phone: '087886188234' },
  Hilal: { fullName: 'M. Hilal', phone: '087886188234' },
  'Fajar N S': { fullName: 'Fajar N S', phone: '085866509710' },
  Fajar: { fullName: 'Fajar N S', phone: '085866509710' },
  'Yudhy S': { fullName: 'Yudhy S', phone: '085710509981' },
  Yudhy: { fullName: 'Yudhy S', phone: '085710509981' },
  'Parid M': { fullName: 'Parid M', phone: '085866509710' },
  Parid: { fullName: 'Parid M', phone: '085866509710' },
};

export const ACO_TM_PENYULANG_OPTIONS = [
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

export interface SheetMissingInfo {
  isWapresComplete: boolean;
  isRumdinComplete: boolean;
  isBothComplete: boolean;
  isWapresPartial: boolean;
  isRumdinPartial: boolean;
  wapresEmptyItems: string[];
  rumdinEmptyItems: string[];
  wapresFilledItems: string[];
  rumdinFilledItems: string[];
  unsubmittedTeams: ('WAPRES' | 'RUMDIN')[];
  instructionMessage: string;
}

