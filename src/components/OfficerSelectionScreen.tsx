import React, { useState, useEffect } from 'react';
import { STAFF_LIST, ShiftType } from '../types';
import { getCurrentShift, getShiftTimeRange, formatIndonesianDate, formatIndonesianTime } from '../utils/formatters';
import {
  Users,
  Clock,
  Calendar,
  Zap,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  ChevronRight,
  UserCheck,
  Edit3,
  Check,
  Lock,
  MessageSquare,
} from 'lucide-react';

interface OfficerSelectionScreenProps {
  currentOfficers: [string, string];
  selectedTeam: 'WAPRES' | 'RUMDIN';
  onSelectOfficers: (officers: [string, string]) => void;
  onSelectTeam: (team: 'WAPRES' | 'RUMDIN') => void;
  onProceedToForm: (officer1: string, officer2: string, team: 'WAPRES' | 'RUMDIN') => void;
  onGoToDashboard: () => void;
  onGoToBriefing?: () => void;
  onEditSubmittedReport?: (team: 'WAPRES' | 'RUMDIN') => void;
  isWapresSubmitted: boolean;
  isRumdinSubmitted: boolean;
}

export const OfficerSelectionScreen: React.FC<OfficerSelectionScreenProps> = ({
  currentOfficers,
  selectedTeam,
  onSelectOfficers,
  onSelectTeam,
  onProceedToForm,
  onGoToDashboard,
  onGoToBriefing,
  onEditSubmittedReport,
  isWapresSubmitted,
  isRumdinSubmitted,
}) => {
  const [officer1, setOfficer1] = useState<string>(currentOfficers[0] || '');
  const [officer2, setOfficer2] = useState<string>(currentOfficers[1] || '');
  const [team, setTeam] = useState<'WAPRES' | 'RUMDIN'>(selectedTeam);

  const isValidSelection = Boolean(officer1 && officer2 && officer1 !== officer2);
  const [isOfficersCollapsed, setIsOfficersCollapsed] = useState<boolean>(isValidSelection);
  const [isTeamCollapsed, setIsTeamCollapsed] = useState<boolean>(false);

  // Real-time automatic shift detection based on device clock
  const [activeShift, setActiveShift] = useState<ShiftType>(() => getCurrentShift());
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => formatIndonesianTime());
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => formatIndonesianDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setActiveShift(getCurrentShift(now));
      setCurrentTimeStr(formatIndonesianTime(now));
      setCurrentDateStr(formatIndonesianDate(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOfficer1Change = (name: string) => {
    setOfficer1(name);
    if (name === officer2) {
      setOfficer2('');
      onSelectOfficers([name, '']);
    } else {
      onSelectOfficers([name, officer2]);
      if (name && officer2) {
        setIsOfficersCollapsed(true);
      }
    }
  };

  const handleOfficer2Change = (name: string) => {
    setOfficer2(name);
    onSelectOfficers([officer1, name]);
    if (officer1 && name && officer1 !== name) {
      setIsOfficersCollapsed(true);
    }
  };

  const handleTeamChange = (newTeam: 'WAPRES' | 'RUMDIN') => {
    setTeam(newTeam);
    onSelectTeam(newTeam);
    setIsTeamCollapsed(true);
  };

  const isBothSubmitted = isWapresSubmitted && isRumdinSubmitted;
  const isCurrentTeamSubmitted =
    (team === 'WAPRES' && isWapresSubmitted) || (team === 'RUMDIN' && isRumdinSubmitted);

  const handleStartForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentTeamSubmitted && onEditSubmittedReport) {
      onEditSubmittedReport(team);
      return;
    }
    if (!isValidSelection) return;
    onProceedToForm(officer1, officer2, team);
  };

  const shiftRange = getShiftTimeRange(activeShift);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* App Branding & Header */}
      <div className="text-center space-y-1.5 sm:space-y-2">
        <div className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-0.5 sm:mb-1 shadow-lg shadow-amber-500/5">
          <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 fill-amber-400/20" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
          Monitoring Shift Listrik Istana Wapres & Rumdin
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
          Pilih 2 nama petugas piket dinas, tentukan tim tugas, dan isi lembar monitoring berkala.
        </p>
      </div>

      {/* Auto Shift Detection Banner */}
      <div
        id="auto-shift-detection-card"
        className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-700/80 rounded-2xl p-3.5 sm:p-5 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Shift Terdeteksi Otomatis
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-400">Jam Perangkat Real-Time</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-zinc-100">
                  SHIFT {activeShift}
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-amber-400 font-mono">
                  ({shiftRange})
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {currentDateStr} • <span className="font-mono text-zinc-200">{currentTimeStr}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {onGoToBriefing && (
              <button
                type="button"
                id="officers-btn-briefing"
                onClick={onGoToBriefing}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-all hover:border-amber-500/50 shadow-sm cursor-pointer"
                title="Buka Shift Briefing: Pilih Petugas Piket & Format WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Shift Briefing</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all hover:border-zinc-600 shadow-sm cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Lihat Status Dashboard</span>
            </button>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-zinc-400">
          <span>
            ℹ️ <span className="text-zinc-300 font-medium">Jadwal Shift:</span> Pagi (08.00-14.59) • Siang (15.00-21.59) • Malam (22.00-07.59)
          </span>
          <span className="text-zinc-500">Otomatis tanpa pilih manual</span>
        </div>
      </div>

      {/* JIKA SEMUA TIM SUDAH SUBMIT: KUNCI FORM PILIH PETUGAS & TIM */}
      {isBothSubmitted ? (
        <div id="all-teams-submitted-locked-card" className="bg-zinc-900 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
          <div className="flex items-start sm:items-center gap-3.5 border-b border-zinc-800 pb-5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Formulir Terkunci (Shift {activeShift})
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-100 mt-1">
                Laporan Shift {activeShift} Selesai Disubmit
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Formulir pilih petugas & tim serta formulir input baru disembunyikan dan dikunci untuk menghindari pengisian ulang pada shift yang sama. Petugas tetap dapat membuka data yang sudah disubmit untuk mengedit dan mengupdate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Tim Wapres</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Status: Sudah Disubmit ke Database.
                </p>
              </div>
              <button
                type="button"
                id="btn-edit-wapres-from-officers"
                onClick={() => onEditSubmittedReport && onEditSubmittedReport('WAPRES')}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Buka & Edit Data Tim Wapres</span>
              </button>
            </div>

            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Tim Rumdin</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Status: Sudah Disubmit ke Database.
                </p>
              </div>
              <button
                type="button"
                id="btn-edit-rumdin-from-officers"
                onClick={() => onEditSubmittedReport && onEditSubmittedReport('RUMDIN')}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Buka & Edit Data Tim Rumdin</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex justify-center">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Lihat Dashboard Shift Lengkap</span>
            </button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleStartForm} className="space-y-4 sm:space-y-6">
        {/* Step 1: Petugas Piket Selection */}
        {isValidSelection && isOfficersCollapsed ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Petugas Piket Terpilih (Shift {activeShift})</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                    <span className="text-amber-300">{officer1}</span>
                    <span className="text-zinc-500">&</span>
                    <span className="text-blue-300">{officer2}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOfficersCollapsed(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ubah Petugas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-base sm:text-lg">
                    Langkah 1: Pilih 2 Petugas Piket
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pilih 2 orang petugas yang berdinas pada Shift {activeShift} hari ini
                  </p>
                </div>
              </div>
              {isValidSelection && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                  <UserCheck className="w-3.5 h-3.5" /> 2 Petugas Terpilih
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Petugas 1 */}
              <div className="bg-zinc-950/60 p-3.5 sm:p-4 rounded-xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Petugas 1 <span className="text-rose-400">*</span>
                </label>
                <select
                  id="petugas-1-select"
                  value={officer1}
                  onChange={(e) => handleOfficer1Change(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 font-semibold rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Nama Petugas 1 --</option>
                  {STAFF_LIST.map((name) => (
                    <option key={`p1-${name}`} value={name} disabled={name === officer2}>
                      {name} {name === officer2 ? '(Dipilih di Petugas 2)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  {officer1 ? `Petugas 1: ${officer1}` : 'Wajib memilih nama petugas'}
                </p>
              </div>

              {/* Petugas 2 */}
              <div className="bg-zinc-950/60 p-3.5 sm:p-4 rounded-xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Petugas 2 <span className="text-rose-400">*</span>
                </label>
                <select
                  id="petugas-2-select"
                  value={officer2}
                  onChange={(e) => handleOfficer2Change(e.target.value)}
                  disabled={!officer1}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 font-semibold rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Nama Petugas 2 --</option>
                  {STAFF_LIST.filter((n) => n !== officer1).map((name) => (
                    <option key={`p2-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  {!officer1
                    ? 'Pilih Petugas 1 terlebih dahulu'
                    : officer2
                    ? `Petugas 2: ${officer2}`
                    : 'Pilih rekan piket dinas'}
                </p>
              </div>
            </div>

            {/* Quick Staff Chips Selector */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="text-xs font-medium text-zinc-400 mb-2">
                Daftar Petugas (Klik untuk pilih cepat):
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-40 overflow-y-auto pr-1">
                {STAFF_LIST.map((name) => {
                  const isP1 = officer1 === name;
                  const isP2 = officer2 === name;

                  return (
                    <button
                      type="button"
                      key={`chip-${name}`}
                      onClick={() => {
                        if (isP1) {
                          setOfficer1('');
                          onSelectOfficers(['', officer2]);
                        } else if (isP2) {
                          setOfficer2('');
                          onSelectOfficers([officer1, '']);
                        } else if (!officer1) {
                          handleOfficer1Change(name);
                        } else if (!officer2) {
                          handleOfficer2Change(name);
                        } else {
                          handleOfficer2Change(name);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer min-h-[34px] ${
                        isP1
                          ? 'bg-amber-500 text-zinc-950 shadow-md ring-2 ring-amber-400 font-bold'
                          : isP2
                          ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400 font-bold'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/60'
                      }`}
                    >
                      <span>{name}</span>
                      {isP1 && <span className="text-[10px] px-1 py-0.2 bg-zinc-900/40 text-zinc-950 rounded font-bold">1</span>}
                      {isP2 && <span className="text-[10px] px-1 py-0.2 bg-zinc-900/40 text-white rounded font-bold">2</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {isValidSelection && (
              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOfficersCollapsed(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Selesai Memilih Petugas</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Tim Selection */}
        {team && isTeamCollapsed ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${team === 'WAPRES' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'} shrink-0`}>
                  {team === 'WAPRES' ? <Zap className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tim Tugas Terpilih</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                    <span>{team === 'WAPRES' ? 'Tim Wapres (Komplek Istana Wapres)' : 'Tim Rumdin (Rumah Dinas & ST12)'}</span>
                    {team === 'WAPRES' && isWapresSubmitted && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Sudah Submit</span>
                    )}
                    {team === 'RUMDIN' && isRumdinSubmitted && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Sudah Submit</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamCollapsed(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ganti Tim</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base sm:text-lg">
                  Langkah 2: Pilih Tim Tugas
                </h3>
                <p className="text-xs text-zinc-400">
                  Pilih apakah Anda mengisi untuk Tim Wapres atau Tim Rumdin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Tim Wapres Option Card */}
              <div
                id="select-team-wapres"
                onClick={() => handleTeamChange('WAPRES')}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  team === 'WAPRES'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          team === 'WAPRES' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-zinc-100 text-base">Tim Wapres</h4>
                        <p className="text-xs text-zinc-400">Kelistrikan Komplek Istana Wapres</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        team === 'WAPRES' ? 'border-amber-400 bg-amber-400' : 'border-zinc-700'
                      }`}
                    >
                      {team === 'WAPRES' && <div className="w-2 h-2 rounded-full bg-zinc-950" />}
                    </div>
                  </div>

                  <ul className="text-xs text-zinc-400 space-y-1.5 pl-1">
                    <li className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Pantauan Beban UPS 30, 40, & 60 KVA</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>ACO TM Gardu D 126 SetWapres</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Status Shift {activeShift}:</span>
                  {isWapresSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Submit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Belum Submit
                    </span>
                  )}
                </div>
              </div>

              {/* Tim Rumdin Option Card */}
              <div
                id="select-team-rumdin"
                onClick={() => handleTeamChange('RUMDIN')}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  team === 'RUMDIN'
                    ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          team === 'RUMDIN' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-zinc-100 text-base">Tim Rumdin</h4>
                        <p className="text-xs text-zinc-400">Rumah Dinas & ST12</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        team === 'RUMDIN' ? 'border-blue-400 bg-blue-400' : 'border-zinc-700'
                      }`}
                    >
                      {team === 'RUMDIN' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <ul className="text-xs text-zinc-400 space-y-1.5 pl-1">
                    <li className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span>Pantauan UPS 40 KVA Dipo & 100 KVA ST12</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span>ACO TR ST12 & ACO TR Dipo</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Status Shift {activeShift}:</span>
                  {isRumdinSubmitted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Submit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Belum Submit
                    </span>
                  )}
                </div>
              </div>
            </div>

            {team && (
              <div className="pt-2 border-t border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTeamCollapsed(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Selesai Memilih Tim</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA Button to proceed */}
        <div className="space-y-3 pt-1">
          {isCurrentTeamSubmitted && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Laporan Tim {team === 'WAPRES' ? 'Wapres' : 'Rumdin'} Sudah Disubmit:</span>
                <p className="text-zinc-300 mt-0.5">
                  Formulir dikunci untuk input baru pada shift ini. Klik tombol di bawah untuk membuka data yang sudah disubmit guna melakukan pengeditan atau pembaruan.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              id="proceed-to-form-btn"
              disabled={!isValidSelection}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                isValidSelection
                  ? isCurrentTeamSubmitted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:scale-[1.005] active:scale-[0.99]'
                    : team === 'WAPRES'
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 hover:scale-[1.005] active:scale-[0.99]'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:scale-[1.005] active:scale-[0.99]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              {isCurrentTeamSubmitted ? (
                <>
                  <Edit3 className="w-5 h-5" />
                  <span>
                    Buka & Edit Data Laporan Tim {team === 'WAPRES' ? 'Wapres' : 'Rumdin'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {!isValidSelection
                      ? 'Pilih 2 Petugas Terlebih Dahulu'
                      : `Lanjut ke Formulir ${team === 'WAPRES' ? 'Tim Wapres' : 'Tim Rumdin'}`}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
};
