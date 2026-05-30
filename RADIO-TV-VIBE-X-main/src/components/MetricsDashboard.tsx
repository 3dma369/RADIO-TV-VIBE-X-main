import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from '../firebaseConfig';
import { useStation } from '../context/StationContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import { BarChart2, Clock, Loader2, TrendingUp, Users, Zap, DollarSign, Eye, Activity } from 'lucide-react';

interface ListenerRecord {
  id?: string;
  count: number;
  timestamp: any;
}

interface SessionRecord {
  id?: string;
  durationSeconds: number;
  pageViews: number;
  timestamp: any;
}

interface PageViewRecord {
  id?: string;
  path: string;
  timestamp: any;
}

interface PaymentRecord {
  id?: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  metadata: any;
  timestamp: any;
}

interface DayInfo {
  date: string;
  label: string;
  fullLabel: string;
  records: ListenerRecord[];
  total: number;
  peak: number;
  avg: number;
  hourMap: number[];
}

function parseTimestamp(ts: any): Date {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === 'function') return ts.toDate();
  return new Date(ts);
}

function formatHour12(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(dateStr: string): { label: string; fullLabel: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toISOString().split('T')[0];
  if (dateStr === todayStr) return { label: 'Today', fullLabel: 'Today' };
  if (dateStr === yestStr) return { label: 'Yest', fullLabel: 'Yest' };
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
  return { label: dow, fullLabel: `${dow} ${d.getDate()}` };
}

function buildDays(records: ListenerRecord[]): DayInfo[] {
  const map: Record<string, ListenerRecord[]> = {};
  for (const r of records) {
    const ts = parseTimestamp(r.timestamp);
    const ds = getDateStr(ts);
    if (!map[ds]) map[ds] = [];
    map[ds].push(r);
  }

  const days: DayInfo[] = [];
  for (const [date, recs] of Object.entries(map)) {
    const hourMap = new Array(24).fill(-1);
    let peak = 0;
    let total = 0;
    for (const r of recs) {
      const ts = parseTimestamp(r.timestamp);
      const h = ts.getHours();
      total += r.count;
      peak = Math.max(peak, r.count);
      if (hourMap[h] < 0) hourMap[h] = r.count;
      else hourMap[h] = Math.max(hourMap[h], r.count);
    }
    const { label, fullLabel } = formatDayLabel(date);
    days.push({ date, label, fullLabel, records: recs, total, peak, avg: recs.length > 0 ? Math.round(total / recs.length) : 0, hourMap });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
}

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h ${Math.round((secs % 3600) / 60)}m`;
}

const DAY_COLORS = ['#39FF13', '#00D4FF', '#FF6B6B', '#FFD93D', '#9B59B6', '#FF9F1C', '#6BCB77'];

function TimeSeriesChart({ days }: { days: DayInfo[] }) {
  const W = 900;
  const H = 200;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const totalSlots = days.length * 24;
  const slotW = chartW / totalSlots;
  const maxY = Math.max(...days.flatMap(d => d.hourMap.filter(v => v >= 0)), 10);

  if (!days.length) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">No data yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padT + chartH - frac * chartH;
          return (
            <g key={frac}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end" fontFamily="monospace">{Math.round(frac * maxY)}</text>
            </g>
          );
        })}
        {days.map((day, di) => {
          const x = padL + di * 24 * slotW;
          return <line key={`sep-${di}`} x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3,3" />;
        })}
        {days.map((day, di) => {
          const dayX = padL + di * 24 * slotW;
          const color = DAY_COLORS[di % DAY_COLORS.length];
          return day.hourMap.map((count, h) => {
            if (count < 0) return null;
            const barH = Math.max((count / maxY) * chartH, 3);
            const x = dayX + h * slotW;
            const y = padT + chartH - barH;
            return <rect key={`bar-${di}-${h}`} x={x} y={y} width={Math.max(slotW - 1, 2)} height={barH} fill={color} opacity="0.75" rx="1" />;
          });
        })}
        {days.map((day, di) => {
          const labelX = padL + di * 24 * slotW + (24 * slotW) / 2;
          const color = DAY_COLORS[di % DAY_COLORS.length];
          return (
            <g key={`dl-${di}`}>
              <text x={labelX} y={padT + chartH + 14} fill={color} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{day.label}</text>
              <text x={labelX} y={padT + chartH + 25} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="monospace">{day.fullLabel}</text>
            </g>
          );
        })}
        {[0, 6, 12, 18].map(h => (
          <text key={`hl-${h}`} x={padL + h * slotW} y={padT - 4} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="middle" fontFamily="monospace">{formatHour12(h)}</text>
        ))}
        <text x={W / 2} y={H - 4} fill="rgba(255,255,255,0.2)" fontSize="9" textAnchor="middle" fontFamily="monospace">— Hour of Day (12am – 11:59pm) —</text>
      </svg>
    </div>
  );
}

export default function MetricsDashboard() {
  const { listenerCount } = useStation();
  const { isAdmin } = useAuth();

  // Listener data
  const [listenerRecords, setListenerRecords] = useState<ListenerRecord[]>([]);
  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([]);
  const [pageViewRecords, setPageViewRecords] = useState<PageViewRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [lastLogTime, setLastLogTime] = useState<string | null>(null);
  const lastLogMinRef = useRef<number>(-1);

  const loadAll = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [listSnap, sessSnap, pvSnap, paySnap] = await Promise.all([
        getDocs(query(collection(db, 'listenerHistory'), orderBy('timestamp', 'desc'))),
        getDocs(query(collection(db, 'sessionHistory'), orderBy('timestamp', 'desc'))),
        getDocs(query(collection(db, 'pageViews'), orderBy('timestamp', 'desc'))),
        getDocs(query(collection(db, 'payments'), orderBy('timestamp', 'desc'))),
      ]);
      setListenerRecords(listSnap.docs.map(d => ({ id: d.id, ...d.data() } as ListenerRecord)));
      setSessionRecords(sessSnap.docs.map(d => ({ id: d.id, ...d.data() } as SessionRecord)));
      setPageViewRecords(pvSnap.docs.map(d => ({ id: d.id, ...d.data() } as PageViewRecord)));
      setPaymentRecords(paySnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord)));

      if (listSnap.docs.length > 0) {
        const last = parseTimestamp(listSnap.docs[0].data().timestamp);
        setLastLogTime(last.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error('[Metrics] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const doLog = useCallback(async () => {
    if (!isAdmin || logging) return;
    setLogging(true);
    try {
      await addDoc(collection(db, 'listenerHistory'), {
        count: listenerCount,
        timestamp: serverTimestamp(),
      });
      await loadAll();
    } catch (e) {
      console.error('[Metrics] Log error:', e);
    } finally {
      setLogging(false);
    }
  }, [isAdmin, logging, listenerCount, loadAll]);

  // Auto-log listener every 5 min
  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
    const id = setInterval(async () => {
      const now = new Date();
      const min = now.getMinutes();
      if (min % 5 === 0 && min !== lastLogMinRef.current) {
        lastLogMinRef.current = min;
        await doLog();
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [isAdmin, doLog, loadAll]);

  // ─── Compute real stats ─────────────────────────────────────────────────────

  const days = buildDays(listenerRecords);
  const todayStr = getDateStr(new Date());
  const todayEntry = days.find(d => d.date === todayStr);
  const peak7d = days.length ? Math.max(...days.map(d => d.peak)) : 0;
  const totalListenerLogs = listenerRecords.length;

  // Avg session time
  const allSessions = sessionRecords.filter(s => s.durationSeconds >= 10);
  const avgSessionSec = allSessions.length > 0
    ? Math.round(allSessions.reduce((s, r) => s + r.durationSeconds, 0) / allSessions.length)
    : 0;

  // Total page views
  const totalPageViews = pageViewRecords.length;

  // Total revenue
  const totalRevenue = paymentRecords
    .filter(p => p.status === 'succeeded')
    .reduce((s, p) => s + (p.amount || 0), 0);

  const realAvgDaily = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.total, 0) / days.length) : 0;

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <h3 className="text-3xl font-bold tracking-tighter uppercase">Station Performance</h3>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
        </div>
      ) : (
        <>
          {/* ── Real stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Active Now" value={listenerCount.toString()} sub="LIVE" color="text-neon-green" glow />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Avg Session" value={avgSessionSec > 0 ? fmtDuration(avgSessionSec) : '—'} sub={allSessions.length > 0 ? `${allSessions.length} sessions logged` : 'No data yet'} color="text-neon-pink" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={totalRevenue > 0 ? `$${totalRevenue.toFixed(2)}` : '$0.00'} sub={paymentRecords.filter(p => p.status === 'succeeded').length > 0 ? `${paymentRecords.filter(p => p.status === 'succeeded').length} payments` : 'No sales yet'} color="text-neon-green" />
            <StatCard icon={<Eye className="w-5 h-5" />} label="Page Views" value={totalPageViews > 0 ? totalPageViews.toLocaleString() : '0'} sub={totalPageViews > 0 ? `Logged from ${new Set(pageViewRecords.map(p => p.path)).size} pages` : 'No data yet'} color="text-white" />
          </div>

          {/* ── Listener chart ── */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Listener History</p>
                <p className="text-[10px] text-white/20 font-mono">X: Hour (12am → 11:59pm) • Y: Listeners • Each row = one day</p>
              </div>
              <button onClick={doLog} disabled={logging}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  logging ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20")}>
                {logging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                Log Now
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              {days.map((day, i) => (
                <div key={day.date} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }} />
                  <span className="text-[10px] font-mono text-white/50">{day.fullLabel}</span>
                </div>
              ))}
            </div>

            <TimeSeriesChart days={days} />
          </div>

          {/* ── Today mini stats ── */}
          {todayEntry && (
            <div className="glass rounded-3xl p-6">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Today — {todayEntry.fullLabel}</p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-neon-green">{todayEntry.peak}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Peak Listeners</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{todayEntry.avg}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Avg Listeners</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white/70">{todayEntry.total}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total Listener Count</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Daily breakdown ── */}
          {days.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">7-Day Listener Breakdown</p>
              <div className="space-y-2">
                {[...days].reverse().map((day, i) => {
                  const color = DAY_COLORS[days.indexOf(day) % DAY_COLORS.length];
                  return (
                    <div key={day.date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-white/60 w-16">{day.fullLabel}</span>
                        <div className="flex gap-[2px] items-end h-5">
                          {day.hourMap.map((count, h) => (
                            <div key={h} className="w-1 rounded-[1px]"
                              style={{
                                height: count >= 0 ? Math.max((count / (peak7d || 1)) * 20, 2) : 2,
                                backgroundColor: count >= 0 ? color : 'rgba(255,255,255,0.08)'
                              }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <p className="text-[9px] text-white/30 font-mono">Peak</p>
                          <p className="text-sm font-bold text-white">{day.peak}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/30 font-mono">Avg</p>
                          <p className="text-sm font-bold text-white/70">{day.avg}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/30 font-mono">Total</p>
                          <p className="text-sm font-bold text-neon-green">{day.total}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, glow }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; glow?: boolean;
}) {
  return (
    <div className={cn("bg-white/5 border border-white/10 rounded-3xl p-5", glow && "shadow-[0_0_20px_rgba(57,255,19,0.15)]")}>
      <div className={cn("w-9 h-9 rounded-xl glass flex items-center justify-center mb-3", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
      <p className="text-[10px] text-white/30 mt-1">{sub}</p>
    </div>
  );
}