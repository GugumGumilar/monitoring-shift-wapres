import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Sparkles,
  Calendar,
  Building2,
  Zap,
} from 'lucide-react';
import { ShiftReportRecord, ShiftType, TimWapresReport, TimRumdinReport } from '../types';
import { formatToDDMMYYYY } from '../services/googleSheets';

interface SpreadsheetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  allReports: ShiftReportRecord[];
  currentWapresData: TimWapresReport;
  currentRumdinData: TimRumdinReport;
  currentDateKey: string;
  currentShift: ShiftType;
  directSheetLink?: string | null;
  activeSpreadsheetUrl?: string | null;
  onTidySheets?: () => Promise<void>;
}

type TabType =
  | 'ACO_TM'
  | 'ACO_DIPO'
  | 'ACO_ST12'
  | 'UPS_30'
  | 'UPS_40_WAPRES'
  | 'UPS_60'
  | 'UPS_40_DIPO'
  | 'UPS_100';

export const SpreadsheetViewModal: React.FC<SpreadsheetViewModalProps> = ({
  isOpen,
  onClose,
  allReports,
  currentWapresData,
  currentRumdinData,
  currentDateKey,
  currentShift,
  directSheetLink,
  activeSpreadsheetUrl,
  onTidySheets,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ACO_TM');
  const [copied, setCopied] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [tidySuccess, setTidySuccess] = useState<string | null>(null);

  const targetSheetUrl = directSheetLink || activeSpreadsheetUrl;

  // Selected Month & Year (Derived from current date)
  const now = new Date();
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = indonesianMonths[now.getMonth()];
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');

  // Build a lookup map of reports by date + shift
  const reportMap = useMemo(() => {
    const map = new Map<string, ShiftReportRecord>();
    for (const r of allReports) {
      const key = `${r.dateKey}_${r.shift}`;
      map.set(key, r);
    }
    return map;
  }, [allReports]);

  if (!isOpen) return null;

  // Generate 31 days data
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Helper to extract data for a specific day and shift
  const getRowData = (day: number, shift: ShiftType) => {
    const dayPadded = String(day).padStart(2, '0');
    const dateKey = `${currentYear}-${currentMonthNum}-${dayPadded}`;
    const report = reportMap.get(`${dateKey}_${shift}`);

    // If viewing today's current active shift, blend with draft form data
    const isCurrentActive = dateKey === currentDateKey && shift === currentShift;

    const wapres = isCurrentActive && currentWapresData ? currentWapresData : report?.wapres;
    const rumdin = isCurrentActive && currentRumdinData ? currentRumdinData : report?.rumdin;

    return { wapres, rumdin, isCurrentActive };
  };

  const handleCopyTable = async () => {
    try {
      const tableElem = document.getElementById('official-sheets-table');
      if (tableElem) {
        await navigator.clipboard.writeText(tableElem.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerTidy = async () => {
    if (!onTidySheets) return;
    try {
      setIsTidying(true);
      setTidySuccess(null);
      await onTidySheets();
      setTidySuccess('Tampilan Google Sheets berhasil dirapikan persis standar ini!');
      setTimeout(() => setTidySuccess(null), 4000);
    } catch (e: any) {
      setTidySuccess(`Gagal: ${e.message || e.toString()}`);
    } finally {
      setIsTidying(false);
    }
  };

  // Titles for tabs
  const tabTitles: Record<TabType, { name: string; title: string; powerTitle?: string }> = {
    ACO_TM: {
      name: 'ACO TM D 126 (Wapres)',
      title: 'PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )',
      powerTitle: 'STATUS POWER ACO TM D 126',
    },
    ACO_DIPO: {
      name: 'ACO TR DIPO',
      title: 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (DIPO)',
      powerTitle: 'STATUS POWER ACO TR DIPO',
    },
    ACO_ST12: {
      name: 'ACO TR ST 12',
      title: 'PANTAUAN INSPEKSI ACO TR RUMAH DINAS (SITUBONDO 12)',
      powerTitle: 'STATUS POWER ACO TR ST 12',
    },
    UPS_30: {
      name: 'UPS 30 KVA Wapres',
      title: 'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    },
    UPS_40_WAPRES: {
      name: 'UPS 40 KVA Wapres',
      title: 'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    },
    UPS_60: {
      name: 'UPS 60 KVA Wapres',
      title: 'PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN',
    },
    UPS_40_DIPO: {
      name: 'UPS 40 KVA Dipo',
      title: 'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)',
    },
    UPS_100: {
      name: 'UPS 100 KVA ST 12',
      title: 'PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)',
    },
  };

  const isAcoTab = activeTab.startsWith('ACO');

  return (
    <div
      id="spreadsheet-view-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="spreadsheet-view-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-[98vw] xl:max-w-7xl shadow-2xl flex flex-col h-[94vh] overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">
                  Format Tabel Resmi Google Sheets
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Standar PLN SetWapres
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Tampilan layout persis 100% seperti di Google Sheets (Kolom NO & Tanggal ter-merge 3 shift per hari).
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onTidySheets && (
              <button
                type="button"
                onClick={handleTriggerTidy}
                disabled={isTidying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-xs"
                title="Terapkan format ini ke file Google Sheets Anda"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTidying ? 'Merapikan...' : 'Rapikan Sheet Asli'}</span>
              </button>
            )}

            {targetSheetUrl && (
              <a
                href={targetSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Buka Google Sheets</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              title="Salin isi tabel untuk ditempel ke Excel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Tabel'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              title="Cetak format cetak resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tidySuccess && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{tidySuccess}</span>
          </div>
        )}

        {/* Tab Selector for Sheets */}
        <div className="flex items-center gap-1 px-4 py-2 bg-zinc-950 border-b border-zinc-800 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-zinc-400 mr-2 shrink-0">Pilih Lembar:</span>
          {(Object.keys(tabTitles) as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tabTitles[tab].name}
              </button>
            );
          })}
        </div>

        {/* Spreadsheet Paper Canvas */}
        <div className="flex-1 overflow-auto bg-zinc-100 p-3 sm:p-6 text-zinc-900 select-text">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-300 p-4 sm:p-6 min-w-[1000px]">
            {/* Sheet Title Row (Row 2 in Google Sheet) */}
            <div className="text-center mb-1">
              <h1 className="text-base sm:text-lg font-serif font-bold underline tracking-wide text-zinc-950 uppercase">
                {tabTitles[activeTab].title}
              </h1>
            </div>

            {/* Month Subtitle (Row 3 in Google Sheet) */}
            <div className="mb-3 text-left">
              <span className="text-xs sm:text-sm font-serif font-bold text-zinc-950">
                Bulan :{monthName} {currentYear}
              </span>
            </div>

            {/* The Official Table */}
            <div className="overflow-x-auto border border-black">
              {isAcoTab ? (
                <table
                  id="official-sheets-table"
                  className="w-full border-collapse text-[11px] font-serif text-zinc-950 text-center"
                >
                  <thead>
                    {/* Header Row 1 */}
                    <tr className="bg-[#FFC000] text-black font-bold uppercase border-b border-black text-[10px]">
                      <th rowSpan={2} className="border border-black px-2 py-2 w-10">NO</th>
                      <th rowSpan={2} className="border border-black px-3 py-2 w-44">NAMA PETUGAS</th>
                      <th rowSpan={2} className="border border-black px-2 py-2 w-28">TANGGAL/BULAN/TAHUN</th>
                      <th rowSpan={2} className="border border-black px-2 py-2 w-24">JAM INSPEKSI</th>
                      <th colSpan={2} className="border border-black px-4 py-1.5 min-w-[340px]">STATUS PENYULANG</th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">ALARM STATUS</th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">
                        {tabTitles[activeTab].powerTitle || 'STATUS POWER ACO'}
                      </th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">STATUS CHARGING KUBIKEL</th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">STATUS REMOTE KUBIKEL</th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">LAMPU INDIKATOR</th>
                      <th rowSpan={2} className="border border-black px-3 py-2 w-32">KETERANGAN</th>
                    </tr>

                    {/* Header Row 2 */}
                    <tr className="bg-[#FFC000] text-black font-bold uppercase border-b border-black text-[9px]">
                      <th className="border border-black px-2 py-1 min-w-[170px]">
                        {activeTab === 'ACO_DIPO' ? 'GARDU T15N' : 'CLOSE'}
                      </th>
                      <th className="border border-black px-2 py-1 min-w-[170px]">
                        {activeTab === 'ACO_DIPO' ? 'GARDU T135' : 'OPEN'}
                      </th>
                      <th className="border border-black px-1.5 py-1 w-14">ALARM</th>
                      <th className="border border-black px-1.5 py-1 w-14">NORMAL</th>
                      <th className="border border-black px-1.5 py-1 w-12">ON</th>
                      <th className="border border-black px-1.5 py-1 w-12">OFF</th>
                      <th className="border border-black px-1.5 py-1 w-12">YA</th>
                      <th className="border border-black px-1.5 py-1 w-12">TIDAK</th>
                      <th className="border border-black px-1.5 py-1 w-14">LOCAL</th>
                      <th className="border border-black px-1.5 py-1 w-14">AUTO</th>
                      <th className="border border-black px-1.5 py-1 w-12">ON</th>
                      <th className="border border-black px-1.5 py-1 w-12">OFF</th>
                    </tr>
                  </thead>

                  <tbody>
                    {days.map((day) => {
                      const dayPadded = String(day).padStart(2, '0');
                      const dateStr = `${dayPadded}/${currentMonthNum}/${currentYear}`;

                      // Shifts for this day
                      const shifts: ShiftType[] = ['PAGI', 'SIANG', 'MALAM'];

                      return shifts.map((shift, shiftIndex) => {
                        const { wapres, rumdin, isCurrentActive } = getRowData(day, shift);

                        // Extract field data depending on activeTab
                        let officers = '-';
                        let time = '-';
                        let close = '-';
                        let open = '-';
                        let alarm = '-';
                        let normal = '-';
                        let powerOn = '-';
                        let powerOff = '-';
                        let chargingYa = '-';
                        let chargingTidak = '-';
                        let remoteLocal = '-';
                        let remoteAuto = '-';
                        let lampOn = '-';
                        let lampOff = '-';
                        let notes = '-';

                        if (activeTab === 'ACO_TM' && wapres) {
                          officers = wapres.officers?.filter(Boolean).join(' , ') || '-';
                          time = wapres.inspectionTime ? `${wapres.inspectionTime} WIB` : '-';
                          close = wapres.acoTM?.penyulangClose || '-';
                          open = wapres.acoTM?.penyulangOpen || '-';
                          alarm = wapres.acoTM?.alarmStatus === 'ALARM' ? 'ALARM' : '-';
                          normal = wapres.acoTM?.alarmStatus === 'NORMAL' ? 'NORMAL' : '-';
                          powerOn = wapres.acoTM?.powerACO === 'ON' ? 'ON' : '-';
                          powerOff = wapres.acoTM?.powerACO === 'OFF' ? 'OFF' : '-';
                          chargingYa = wapres.acoTM?.chargingKubikel === 'YA' ? 'YA' : '-';
                          chargingTidak = wapres.acoTM?.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-';
                          remoteLocal = wapres.acoTM?.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-';
                          remoteAuto = wapres.acoTM?.remoteKubikel === 'AUTO' ? 'AUTO' : '-';
                          lampOn = wapres.acoTM?.lampuIndikator === 'ON' ? 'ON' : '-';
                          lampOff = wapres.acoTM?.lampuIndikator === 'OFF' ? 'OFF' : '-';
                          notes = wapres.acoTM?.keterangan || '-';
                        } else if (activeTab === 'ACO_DIPO' && rumdin) {
                          officers = rumdin.officers?.filter(Boolean).join(' , ') || '-';
                          time = rumdin.inspectionTime ? `${rumdin.inspectionTime} WIB` : '-';
                          close = rumdin.acoTRDipo?.penyulangClose || '-';
                          open = rumdin.acoTRDipo?.penyulangOpen || '-';
                          alarm = rumdin.acoTRDipo?.alarmStatus === 'ALARM' ? 'ALARM' : '-';
                          normal = rumdin.acoTRDipo?.alarmStatus === 'NORMAL' ? 'NORMAL' : '-';
                          powerOn = rumdin.acoTRDipo?.powerACO === 'ON' ? 'ON' : '-';
                          powerOff = rumdin.acoTRDipo?.powerACO === 'OFF' ? 'OFF' : '-';
                          chargingYa = rumdin.acoTRDipo?.chargingKubikel === 'YA' ? 'YA' : '-';
                          chargingTidak = rumdin.acoTRDipo?.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-';
                          remoteLocal = rumdin.acoTRDipo?.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-';
                          remoteAuto = rumdin.acoTRDipo?.remoteKubikel === 'AUTO' ? 'AUTO' : '-';
                          lampOn = rumdin.acoTRDipo?.lampuIndikator === 'ON' ? 'ON' : '-';
                          lampOff = rumdin.acoTRDipo?.lampuIndikator === 'OFF' ? 'OFF' : '-';
                          notes = rumdin.acoTRDipo?.keterangan || '-';
                        } else if (activeTab === 'ACO_ST12' && rumdin) {
                          officers = rumdin.officers?.filter(Boolean).join(' , ') || '-';
                          time = rumdin.inspectionTime ? `${rumdin.inspectionTime} WIB` : '-';
                          close = rumdin.acoTRST12?.penyulangClose || '-';
                          open = rumdin.acoTRST12?.penyulangOpen || '-';
                          alarm = rumdin.acoTRST12?.alarmStatus === 'ALARM' ? 'ALARM' : '-';
                          normal = rumdin.acoTRST12?.alarmStatus === 'NORMAL' ? 'NORMAL' : '-';
                          powerOn = rumdin.acoTRST12?.powerACO === 'ON' ? 'ON' : '-';
                          powerOff = rumdin.acoTRST12?.powerACO === 'OFF' ? 'OFF' : '-';
                          chargingYa = rumdin.acoTRST12?.chargingKubikel === 'YA' ? 'YA' : '-';
                          chargingTidak = rumdin.acoTRST12?.chargingKubikel === 'TIDAK' ? 'TIDAK' : '-';
                          remoteLocal = rumdin.acoTRST12?.remoteKubikel === 'LOCAL' ? 'LOCAL' : '-';
                          remoteAuto = rumdin.acoTRST12?.remoteKubikel === 'AUTO' ? 'AUTO' : '-';
                          lampOn = rumdin.acoTRST12?.lampuIndikator === 'ON' ? 'ON' : '-';
                          lampOff = rumdin.acoTRST12?.lampuIndikator === 'OFF' ? 'OFF' : '-';
                          notes = rumdin.acoTRST12?.keterangan || '-';
                        }

                        const hasData = officers !== '-';

                        return (
                          <tr
                            key={`${day}_${shift}`}
                            className={`h-[26px] ${
                              isCurrentActive
                                ? 'bg-amber-100 font-medium'
                                : shiftIndex % 2 === 1
                                ? 'bg-zinc-50'
                                : 'bg-white'
                            }`}
                          >
                            {/* Column A: NO (Merged 3 rows per day) */}
                            {shiftIndex === 0 && (
                              <td
                                rowSpan={3}
                                className="border border-black font-bold align-middle bg-white"
                              >
                                {day}
                              </td>
                            )}

                            {/* Column B: NAMA PETUGAS */}
                            <td className="border border-black px-2 py-0.5 text-xs text-center align-middle whitespace-normal">
                              {officers}
                            </td>

                            {/* Column C: TANGGAL/BULAN/TAHUN (Merged 3 rows per day) */}
                            {shiftIndex === 0 && (
                              <td
                                rowSpan={3}
                                className="border border-black font-semibold align-middle bg-white"
                              >
                                {dateStr}
                              </td>
                            )}

                            {/* Column D: JAM INSPEKSI */}
                            <td className="border border-black px-1.5 py-0.5 font-mono text-[11px] align-middle">
                              {time}
                            </td>

                            {/* Columns E-Q: Measurements */}
                            <td className="border border-black px-2 py-0.5 text-[10px] align-middle text-left font-sans">
                              {close}
                            </td>
                            <td className="border border-black px-2 py-0.5 text-[10px] align-middle text-left font-sans">
                              {open}
                            </td>
                            <td className="border border-black px-1 py-0.5 align-middle">{alarm}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{normal}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{powerOn}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{powerOff}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{chargingYa}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{chargingTidak}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{remoteLocal}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{remoteAuto}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{lampOn}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{lampOff}</td>
                            <td className="border border-black px-1.5 py-0.5 text-[10px] align-middle">{notes}</td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              ) : (
                /* UPS Table Template */
                <table
                  id="official-sheets-table"
                  className="w-full border-collapse text-[11px] font-serif text-zinc-950 text-center"
                >
                  <thead>
                    {/* Header Row 1 */}
                    <tr className="bg-[#00B0F0] text-black font-bold uppercase border-b border-black text-[10px]">
                      <th rowSpan={3} className="border border-black px-2 py-2 w-10">NO</th>
                      <th rowSpan={3} className="border border-black px-3 py-2 w-44">NAMA PETUGAS</th>
                      <th rowSpan={3} className="border border-black px-2 py-2 w-28">TANGGAL/BULAN/TAHUN</th>
                      <th rowSpan={3} className="border border-black px-2 py-2 w-24">JAM INSPEKSI</th>
                      <th colSpan={9} className="border border-black px-4 py-1.5 bg-[#FFA500]">
                        {tabTitles[activeTab].name}
                      </th>
                      <th rowSpan={3} className="border border-black px-2 py-1.5 w-20">TEMPERATUR UPS</th>
                      <th rowSpan={3} className="border border-black px-2 py-1.5 w-16">ALARM UPS</th>
                      <th colSpan={2} className="border border-black px-2 py-1.5">BACK UP TIME UPS</th>
                      <th rowSpan={3} className="border border-black px-3 py-2 w-36">KETERANGAN & LOKASI</th>
                    </tr>

                    {/* Header Row 2 */}
                    <tr className="bg-[#00B0F0] text-black font-bold uppercase border-b border-black text-[9px]">
                      <th className="border border-black px-1 py-0.5">R</th>
                      <th className="border border-black px-1 py-0.5">S</th>
                      <th className="border border-black px-1 py-0.5">T</th>
                      <th className="border border-black px-1 py-0.5">R</th>
                      <th className="border border-black px-1 py-0.5">S</th>
                      <th className="border border-black px-1 py-0.5">T</th>
                      <th className="border border-black px-1 py-0.5">R</th>
                      <th className="border border-black px-1 py-0.5">S</th>
                      <th className="border border-black px-1 py-0.5">T</th>
                      <th className="border border-black px-1 py-0.5 w-16">HOURS</th>
                      <th className="border border-black px-1 py-0.5 w-16">MINUTES</th>
                    </tr>

                    {/* Header Row 3 */}
                    <tr className="bg-[#00B0F0] text-black font-bold border-b border-black text-[9px]">
                      <th className="border border-black px-1 py-0.5">(A)</th>
                      <th className="border border-black px-1 py-0.5">(A)</th>
                      <th className="border border-black px-1 py-0.5">(A)</th>
                      <th className="border border-black px-1 py-0.5">(R-N)</th>
                      <th className="border border-black px-1 py-0.5">(S-N)</th>
                      <th className="border border-black px-1 py-0.5">(T-N)</th>
                      <th className="border border-black px-1 py-0.5">(R-S)</th>
                      <th className="border border-black px-1 py-0.5">(R-T)</th>
                      <th className="border border-black px-1 py-0.5">(S-T)</th>
                      <th colSpan={2} className="border border-black px-1 py-0.5 bg-[#00B0F0]"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {days.map((day) => {
                      const dayPadded = String(day).padStart(2, '0');
                      const dateStr = `${dayPadded}/${currentMonthNum}/${currentYear}`;
                      const shifts: ShiftType[] = ['PAGI', 'SIANG', 'MALAM'];

                      return shifts.map((shift, shiftIndex) => {
                        const { wapres, rumdin, isCurrentActive } = getRowData(day, shift);

                        let officers = '-';
                        let time = '-';
                        let upsObj: any = null;

                        if (activeTab === 'UPS_30' && wapres?.ups30) {
                          officers = wapres.officers?.filter(Boolean).join(' , ') || '-';
                          time = wapres.inspectionTime ? `${wapres.inspectionTime} WIB` : '-';
                          upsObj = wapres.ups30;
                        } else if (activeTab === 'UPS_40_WAPRES' && wapres?.ups40) {
                          officers = wapres.officers?.filter(Boolean).join(' , ') || '-';
                          time = wapres.inspectionTime ? `${wapres.inspectionTime} WIB` : '-';
                          upsObj = wapres.ups40;
                        } else if (activeTab === 'UPS_60' && wapres?.ups60) {
                          officers = wapres.officers?.filter(Boolean).join(' , ') || '-';
                          time = wapres.inspectionTime ? `${wapres.inspectionTime} WIB` : '-';
                          upsObj = wapres.ups60;
                        } else if (activeTab === 'UPS_40_DIPO' && rumdin?.upsDipo) {
                          officers = rumdin.officers?.filter(Boolean).join(' , ') || '-';
                          time = rumdin.inspectionTime ? `${rumdin.inspectionTime} WIB` : '-';
                          upsObj = rumdin.upsDipo;
                        } else if (activeTab === 'UPS_100' && rumdin?.upsST12) {
                          officers = rumdin.officers?.filter(Boolean).join(' , ') || '-';
                          time = rumdin.inspectionTime ? `${rumdin.inspectionTime} WIB` : '-';
                          upsObj = rumdin.upsST12;
                        }

                        return (
                          <tr
                            key={`${day}_${shift}`}
                            className={`h-[26px] ${
                              isCurrentActive
                                ? 'bg-sky-100 font-medium'
                                : shiftIndex % 2 === 1
                                ? 'bg-zinc-50'
                                : 'bg-white'
                            }`}
                          >
                            {/* Col A: NO (Merged 3 rows per day) */}
                            {shiftIndex === 0 && (
                              <td rowSpan={3} className="border border-black font-bold align-middle bg-white">
                                {day}
                              </td>
                            )}

                            {/* Col B: NAMA PETUGAS */}
                            <td className="border border-black px-2 py-0.5 text-xs text-center align-middle whitespace-normal">
                              {officers}
                            </td>

                            {/* Col C: TANGGAL (Merged 3 rows per day) */}
                            {shiftIndex === 0 && (
                              <td rowSpan={3} className="border border-black font-semibold align-middle bg-white">
                                {dateStr}
                              </td>
                            )}

                            {/* Col D: JAM INSPEKSI */}
                            <td className="border border-black px-1.5 py-0.5 font-mono text-[11px] align-middle">
                              {time}
                            </td>

                            {/* Col E-G: Arus R, S, T */}
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.arusR || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.arusS || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.arusT || '-'}</td>

                            {/* Col H-J: Tegangan R-N, S-N, T-N */}
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganRN || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganSN || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganTN || '-'}</td>

                            {/* Col K-M: Tegangan R-S, R-T, S-T */}
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganRS || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganRT || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.teganganST || '-'}</td>

                            {/* Col N: Suhu */}
                            <td className="border border-black px-1 py-0.5 align-middle">
                              {upsObj?.suhuRuangan ? `${upsObj.suhuRuangan}°C` : '-'}
                            </td>

                            {/* Col O: Alarm */}
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.alarmStatus || '-'}</td>

                            {/* Col P-Q: Backup Time */}
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.backupHours || '-'}</td>
                            <td className="border border-black px-1 py-0.5 align-middle">{upsObj?.backupMinutes || '-'}</td>

                            {/* Col R: Keterangan */}
                            <td className="border border-black px-1.5 py-0.5 text-[10px] align-middle">
                              {upsObj?.keterangan || '-'}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Status Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-zinc-600 gap-2 border-t border-zinc-300 pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#FFC000] border border-black inline-block"></span>
                  <span>Header ACO (Amber Gold)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#00B0F0] border border-black inline-block"></span>
                  <span>Header UPS (Cyan)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#FFA500] border border-black inline-block"></span>
                  <span>Beban UPS (Orange)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-400 inline-block"></span>
                  <span>Shift Aktif Saat Ini</span>
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 font-serif">
                Total 31 Hari × 3 Shift = 93 Baris Data (Pemetaan Otomatis Anti Tertumpuk)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
