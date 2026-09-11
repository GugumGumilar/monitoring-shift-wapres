import { CombinedShiftReport, ShiftType, TimRumdinReport, TimWapresReport } from '../types';
import { formatIndonesianDate, generateSampleReport, getDateKey } from './formatters';

const STORAGE_KEY_REPORTS = 'monitoring_shift_reports_v1';
const DRAFT_WAPRES_PREFIX = 'monitoring_draft_wapres_';
const DRAFT_RUMDIN_PREFIX = 'monitoring_draft_rumdin_';

export function getAllReports(): CombinedShiftReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading reports from storage:', err);
    return [];
  }
}

export function saveReport(report: CombinedShiftReport): void {
  try {
    const all = getAllReports();
    const index = all.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      all[index] = { ...all[index], ...report, updatedAt: new Date().toISOString() };
    } else {
      all.unshift({ ...report, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(all));
  } catch (err) {
    console.error('Error saving report to storage:', err);
  }
}

export function getReportById(id: string): CombinedShiftReport | undefined {
  const all = getAllReports();
  return all.find((r) => r.id === id);
}

export function getOrCreateShiftReport(dateKey: string, shift: ShiftType): CombinedShiftReport {
  const id = `${dateKey}_${shift}`;
  const existing = getReportById(id);
  if (existing) {
    return existing;
  }
  const dateObj = new Date(dateKey + 'T12:00:00');
  const displayDate = isNaN(dateObj.getTime()) ? formatIndonesianDate() : formatIndonesianDate(dateObj);
  return {
    id,
    dateKey,
    shift,
    displayDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function submitWapresToShift(dateKey: string, shift: ShiftType, data: TimWapresReport): CombinedShiftReport {
  const report = getOrCreateShiftReport(dateKey, shift);
  report.wapres = data;
  report.updatedAt = new Date().toISOString();
  saveReport(report);
  // Clear draft
  clearDraftWapres(dateKey, shift);
  return report;
}

export function submitRumdinToShift(dateKey: string, shift: ShiftType, data: TimRumdinReport): CombinedShiftReport {
  const report = getOrCreateShiftReport(dateKey, shift);
  report.rumdin = data;
  report.updatedAt = new Date().toISOString();
  saveReport(report);
  // Clear draft
  clearDraftRumdin(dateKey, shift);
  return report;
}

export function deleteReport(id: string): void {
  try {
    const all = getAllReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(all));
  } catch (err) {
    console.error('Error deleting report:', err);
  }
}

// Draft storage
export function saveDraftWapres(dateKey: string, shift: ShiftType, data: TimWapresReport): void {
  try {
    localStorage.setItem(`${DRAFT_WAPRES_PREFIX}${dateKey}_${shift}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save wapres draft', e);
  }
}

export function getDraftWapres(dateKey: string, shift: ShiftType): TimWapresReport | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_WAPRES_PREFIX}${dateKey}_${shift}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraftWapres(dateKey: string, shift: ShiftType): void {
  localStorage.removeItem(`${DRAFT_WAPRES_PREFIX}${dateKey}_${shift}`);
}

export function saveDraftRumdin(dateKey: string, shift: ShiftType, data: TimRumdinReport): void {
  try {
    localStorage.setItem(`${DRAFT_RUMDIN_PREFIX}${dateKey}_${shift}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save rumdin draft', e);
  }
}

export function getDraftRumdin(dateKey: string, shift: ShiftType): TimRumdinReport | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_RUMDIN_PREFIX}${dateKey}_${shift}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraftRumdin(dateKey: string, shift: ShiftType): void {
  localStorage.removeItem(`${DRAFT_RUMDIN_PREFIX}${dateKey}_${shift}`);
}
