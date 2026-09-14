import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  RotateCcw,
  Users,
  Building2,
  Zap,
  Clock,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import {
  STAFF_LIST,
  OFFICER_DATABASE,
  StaffName,
} from '../types';
import {
  INDONESIAN_DAYS,
  getRealtimeBriefingInfo,
  formatBriefingWhatsAppText,
} from '../utils/formatters';

interface ShiftBriefingScreenProps {
  onGoToDashboard: () => void;
  onGoToOfficers: () => void;
  currentWapresOfficers?: [string, string];
  currentRumdinOfficers?: [string, string];
  showToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const ShiftBriefingScreen: React.FC<ShiftBriefingScreenProps> = ({
  onGoToDashboard,
  onGoToOfficers,
  currentWapresOfficers,
  currentRumdinOfficers,
  showToast,
}) => {
  // Realtime time state for auto-fill
  const realtimeDefaults = getRealtimeBriefingInfo();

  const [day, setDay] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_day');
    return saved || realtimeDefaults.day;
  });

  const [dateStr, setDateStr] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_date');
    return saved || realtimeDefaults.date;
  });

  const [shift, setShift] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_shift');
    return saved || realtimeDefaults.shift;
  });

  // Helper to normalize legacy or current names to updated staff names
  const normalizeOfficer = (name?: string, fallback: string = ''): string => {
    if (!name) return fallback;
    if (STAFF_LIST.includes(name as StaffName)) return name;
    const match = OFFICER_DATABASE[name];
    if (match && STAFF_LIST.includes(match.fullName as StaffName)) return match.fullName;
    return fallback;
  };

  // Istana Wakil Presiden: 2 officers
  const [wapresOfficer1, setWapresOfficer1] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_wapres1');
    if (saved) {
      const norm = normalizeOfficer(saved);
      if (norm) return norm;
    }
    if (currentWapresOfficers && currentWapresOfficers[0]) {
      const norm = normalizeOfficer(currentWapresOfficers[0]);
      if (norm) return norm;
    }
    return 'AsepK';
  });

  const [wapresOfficer2, setWapresOfficer2] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_wapres2');
    if (saved) {
      const norm = normalizeOfficer(saved);
      if (norm) return norm;
    }
    if (currentWapresOfficers && currentWapresOfficers[1]) {
      const norm = normalizeOfficer(currentWapresOfficers[1]);
      if (norm) return norm;
    }
    return 'Damar S Y';
  });

  // Rumah Dinas Wakil Presiden dan VVIP: 2 officers
  const [rumdinOfficer1, setRumdinOfficer1] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_rumdin1');
    if (saved) {
      const norm = normalizeOfficer(saved);
      if (norm) return norm;
    }
    if (currentRumdinOfficers && currentRumdinOfficers[0]) {
      const norm = normalizeOfficer(currentRumdinOfficers[0]);
      if (norm) return norm;
    }
    return 'Hendri P';
  });

  const [rumdinOfficer2, setRumdinOfficer2] = useState<string>(() => {
    const saved = localStorage.getItem('monitoring_briefing_rumdin2');
    if (saved) {
      const norm = normalizeOfficer(saved);
      if (norm) return norm;
    }
    if (currentRumdinOfficers && currentRumdinOfficers[1]) {
      const norm = normalizeOfficer(currentRumdinOfficers[1]);
      if (norm) return norm;
    }
    return 'Sendi';
  });

  const [isCopied, setIsCopied] = useState(false);
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(true);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('monitoring_briefing_day', day);
    localStorage.setItem('monitoring_briefing_date', dateStr);
    localStorage.setItem('monitoring_briefing_shift', shift);
    localStorage.setItem('monitoring_briefing_wapres1', wapresOfficer1);
    localStorage.setItem('monitoring_briefing_wapres2', wapresOfficer2);
    localStorage.setItem('monitoring_briefing_rumdin1', rumdinOfficer1);
    localStorage.setItem('monitoring_briefing_rumdin2', rumdinOfficer2);
  }, [day, dateStr, shift, wapresOfficer1, wapresOfficer2, rumdinOfficer1, rumdinOfficer2]);

  // Handle Realtime Clock update if autoSync is active
  useEffect(() => {
    if (!isAutoSyncActive) return;
    const interval = setInterval(() => {
      const nowInfo = getRealtimeBriefingInfo();
      setDay(nowInfo.day);
      setDateStr(nowInfo.date);
      setShift(nowInfo.shift);
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAutoSyncActive]);

  const handleResetToRealtime = () => {
    const nowInfo = getRealtimeBriefingInfo();
    setDay(nowInfo.day);
    setDateStr(nowInfo.date);
    setShift(nowInfo.shift);
    setIsAutoSyncActive(true);
    if (showToast) {
      showToast('Waktu hari, tanggal, & shift berhasil disinkronkan ke waktu real-time.', 'info');
    }
  };

  const handlePullFromCurrentShift = () => {
    let pulledCount = 0;
    if (currentWapresOfficers && currentWapresOfficers[0]) {
      setWapresOfficer1(currentWapresOfficers[0]);
      pulledCount++;
    }
    if (currentWapresOfficers && currentWapresOfficers[1]) {
      setWapresOfficer2(currentWapresOfficers[1]);
      pulledCount++;
    }
    if (currentRumdinOfficers && currentRumdinOfficers[0]) {
      setRumdinOfficer1(currentRumdinOfficers[0]);
      pulledCount++;
    }
    if (currentRumdinOfficers && currentRumdinOfficers[1]) {
      setRumdinOfficer2(currentRumdinOfficers[1]);
      pulledCount++;
    }

    if (showToast) {
      if (pulledCount > 0) {
        showToast(`Berhasil memuat ${pulledCount} petugas dari data shift aktif.`, 'success');
      } else {
        showToast('Belum ada petugas yang tersimpan di form shift aktif.', 'info');
      }
    }
  };

  // Generate WhatsApp briefing message
  const generatedMessage = formatBriefingWhatsAppText({
    day,
    date: dateStr,
    shift,
    wapresOfficers: [wapresOfficer1, wapresOfficer2],
    rumdinOfficers: [rumdinOfficer1, rumdinOfficer2],
    officerDb: OFFICER_DATABASE,
  });

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (showToast) {
        showToast('Teks briefing berhasil disalin ke clipboard!', 'success');
      }
    } catch {
      if (showToast) {
        showToast('Gagal menyalin teks secara otomatis. Silakan salin manual.', 'error');
      }
    }
  };

  const handleSendToWhatsApp = () => {
    const encoded = encodeURIComponent(generatedMessage);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast('Membuka WhatsApp dengan teks briefing otomatis...', 'success');
    }
  };

  const isFormComplete =
    Boolean(wapresOfficer1) &&
    Boolean(wapresOfficer2) &&
    Boolean(rumdinOfficer1) &&
    Boolean(rumdinOfficer2);

  const getOfficerDetail = (name: string) => {
    if (!name) return null;
    return OFFICER_DATABASE[name] || { fullName: name, phone: '-' };
  };

  return (
    <div id="shift-briefing-screen" className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Shift Briefing
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Real-Time Auto-Fill
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Shift Briefing Petugas Piket
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Pilih 2 petugas per lokasi posko. Nomor HP tertanam otomatis dari database sistem. Hari, tanggal, dan shift terisi otomatis secara real-time untuk dikirim langsung ke grup WhatsApp.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {(currentWapresOfficers || currentRumdinOfficers) && (
              <button
                type="button"
                id="btn-pull-shift-officers"
                onClick={handlePullFromCurrentShift}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Tarik petugas yang saat ini aktif di form shift"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Salin Petugas Shift</span>
              </button>
            )}
            <button
              type="button"
              id="btn-reset-realtime-briefing"
              onClick={handleResetToRealtime}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Reset Hari, Tanggal, & Shift ke waktu sekarang"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reset ke Real-Time</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Hari, Tanggal, & Shift (Otomatis Real-Time) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">
                    Waktu & Jadwal Briefing
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Otomatis terisi sesuai waktu real-time sistem
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Hari */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Hari</span>
                  <span className="text-[10px] text-zinc-500">Auto</span>
                </label>
                <select
                  id="briefing-select-day"
                  value={day}
                  onChange={(e) => {
                    setDay(e.target.value);
                    setIsAutoSyncActive(false);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {INDONESIAN_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Tanggal</span>
                  <span className="text-[10px] text-zinc-500">Auto</span>
                </label>
                <input
                  type="text"
                  id="briefing-input-date"
                  value={dateStr}
                  onChange={(e) => {
                    setDateStr(e.target.value);
                    setIsAutoSyncActive(false);
                  }}
                  placeholder="e.g. 14 september 2026"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Shift */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Shift</span>
                  <span className="text-[10px] text-zinc-500">Auto</span>
                </label>
                <select
                  id="briefing-select-shift"
                  value={shift}
                  onChange={(e) => {
                    setShift(e.target.value);
                    setIsAutoSyncActive(false);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Pagi">Pagi</option>
                  <option value="Siang">Siang</option>
                  <option value="Malam">Malam</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Lokasi 1 - Istana Wakil Presiden */}
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                    Istana Wakil Presiden
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Pilih 2 nama petugas piket (Nomor HP terisi otomatis)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                2 Petugas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Wapres Petugas 1 */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Petugas 1</span>
                  {wapresOfficer1 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>

                <select
                  id="select-briefing-wapres-1"
                  value={wapresOfficer1}
                  onChange={(e) => setWapresOfficer1(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Pilih Petugas 1 --</option>
                  {STAFF_LIST.map((name) => {
                    const info = OFFICER_DATABASE[name];
                    return (
                      <option key={name} value={name}>
                        {info ? `${info.fullName} (${info.phone})` : name}
                      </option>
                    );
                  })}
                </select>

                {/* Embedded Detail Badge */}
                {wapresOfficer1 && getOfficerDetail(wapresOfficer1) && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[140px]">
                      {getOfficerDetail(wapresOfficer1)?.fullName}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Phone className="w-3 h-3" />
                      {getOfficerDetail(wapresOfficer1)?.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Wapres Petugas 2 */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Petugas 2</span>
                  {wapresOfficer2 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>

                <select
                  id="select-briefing-wapres-2"
                  value={wapresOfficer2}
                  onChange={(e) => setWapresOfficer2(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Pilih Petugas 2 --</option>
                  {STAFF_LIST.map((name) => {
                    const info = OFFICER_DATABASE[name];
                    return (
                      <option key={name} value={name}>
                        {info ? `${info.fullName} (${info.phone})` : name}
                      </option>
                    );
                  })}
                </select>

                {/* Embedded Detail Badge */}
                {wapresOfficer2 && getOfficerDetail(wapresOfficer2) && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[140px]">
                      {getOfficerDetail(wapresOfficer2)?.fullName}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Phone className="w-3 h-3" />
                      {getOfficerDetail(wapresOfficer2)?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {wapresOfficer1 && wapresOfficer2 && wapresOfficer1 === wapresOfficer2 && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Peringatan: Petugas 1 dan Petugas 2 Istana Wapres memilih nama yang sama.</span>
              </div>
            )}
          </div>

          {/* Card 3: Lokasi 2 - Rumah Dinas Wakil Presiden dan VVIP */}
          <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-blue-300 uppercase tracking-wider">
                    Rumah Dinas Wakil Presiden dan VVIP
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Pilih 2 nama petugas piket (Nomor HP terisi otomatis)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                2 Petugas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rumdin Petugas 1 */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Petugas 1</span>
                  {rumdinOfficer1 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>

                <select
                  id="select-briefing-rumdin-1"
                  value={rumdinOfficer1}
                  onChange={(e) => setRumdinOfficer1(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Pilih Petugas 1 --</option>
                  {STAFF_LIST.map((name) => {
                    const info = OFFICER_DATABASE[name];
                    return (
                      <option key={name} value={name}>
                        {info ? `${info.fullName} (${info.phone})` : name}
                      </option>
                    );
                  })}
                </select>

                {/* Embedded Detail Badge */}
                {rumdinOfficer1 && getOfficerDetail(rumdinOfficer1) && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[140px]">
                      {getOfficerDetail(rumdinOfficer1)?.fullName}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Phone className="w-3 h-3" />
                      {getOfficerDetail(rumdinOfficer1)?.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Rumdin Petugas 2 */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Petugas 2</span>
                  {rumdinOfficer2 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>

                <select
                  id="select-briefing-rumdin-2"
                  value={rumdinOfficer2}
                  onChange={(e) => setRumdinOfficer2(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Pilih Petugas 2 --</option>
                  {STAFF_LIST.map((name) => {
                    const info = OFFICER_DATABASE[name];
                    return (
                      <option key={name} value={name}>
                        {info ? `${info.fullName} (${info.phone})` : name}
                      </option>
                    );
                  })}
                </select>

                {/* Embedded Detail Badge */}
                {rumdinOfficer2 && getOfficerDetail(rumdinOfficer2) && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[140px]">
                      {getOfficerDetail(rumdinOfficer2)?.fullName}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Phone className="w-3 h-3" />
                      {getOfficerDetail(rumdinOfficer2)?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {rumdinOfficer1 && rumdinOfficer2 && rumdinOfficer1 === rumdinOfficer2 && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Peringatan: Petugas 1 dan Petugas 2 Rumah Dinas memilih nama yang sama.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live WhatsApp Message Preview & Actions (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">
                    Format Pesan WhatsApp
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Sesuai template briefing resmi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isFormComplete ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Siap Kirim
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" /> Belum Lengkap
                  </span>
                )}
              </div>
            </div>

            {/* WhatsApp Chat Bubble Display */}
            <div className="bg-[#0b141a] rounded-xl p-4 border border-zinc-800 relative">
              {/* WhatsApp Header bar styling */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 mb-2.5 border-b border-zinc-800">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Posko Wapres & Rumdin
                </span>
                <span className="text-[10px] text-zinc-500">Pratinjau Teks</span>
              </div>

              {/* Message text container */}
              <pre className="text-xs sm:text-sm text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto pr-1 select-all scrollbar-thin">
                {generatedMessage}
              </pre>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Kirim ke WhatsApp Button */}
              <button
                type="button"
                id="btn-send-briefing-wa"
                onClick={handleSendToWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Briefing ke WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Salin Teks Button */}
              <button
                type="button"
                id="btn-copy-briefing-wa"
                onClick={handleCopyText}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Teks Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Salin Teks Briefing</span>
                  </>
                )}
              </button>
            </div>

            {/* Navigation Link to Return to Other Views */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onGoToOfficers}
                className="text-zinc-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Pilih Petugas & Tim</span>
              </button>

              <button
                type="button"
                onClick={onGoToDashboard}
                className="text-zinc-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Dashboard Shift</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
