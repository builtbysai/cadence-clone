// Pure cycle model: dates, phases, forecasts. No DOM, no storage.
// Runs in the browser and in Node (see test/cycle.test.js).

// ---------- Dates ----------
// ISO strings (YYYY-MM-DD) everywhere. Dates are built at local noon so DST never shifts a day.

const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(iso) {
  const [y, m, d] = (iso || toISO(new Date())).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export const todayISO = () => toISO(new Date());

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);

export const fmtShort = (iso) => parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fmtLong = (iso) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
export const fmtRange = (a, b) => `${fmtShort(a)} – ${fmtShort(b)}`;

export function relative(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

// ---------- Profile helpers ----------

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const mod = (n, m) => ((n % m) + m) % m;

export const sortedPeriods = (p) => [...(p.periods || [])].sort((a, b) => a.start.localeCompare(b.start));

export function latestStart(p, today = todayISO()) {
  const list = sortedPeriods(p);
  return list.length ? list[list.length - 1].start : today;
}

export function inLoggedPeriod(p, iso) {
  return (p.periods || []).some((per) => {
    const d = diffDays(iso, per.start);
    return d >= 0 && d < (Number(per.length) || Number(p.periodLength) || 5);
  });
}

// Average of observed cycle lengths (18–50 days). Returns null if there is nothing to average.
export function averageCycleLength(p) {
  const list = sortedPeriods(p);
  const gaps = [];
  for (let i = 1; i < list.length; i++) {
    const d = diffDays(list[i].start, list[i - 1].start);
    if (d >= 18 && d <= 50) gaps.push(d);
  }
  return gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
}

// ---------- Phases ----------

export const PHASE_NAMES = { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulatory', luteal: 'Luteal' };
export const PHASE_ORDER = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function phaseBounds(p) {
  const cycle = Number(p.cycleLength) || 28;
  const period = Math.min(Number(p.periodLength) || 5, cycle - 10);
  const luteal = Math.min(Number(p.lutealLength) || 14, cycle - period - 3);
  const ovulationDay = cycle - luteal;
  const ovStart = Math.max(period + 2, ovulationDay - 3);
  const ovEnd = Math.min(cycle - 4, ovulationDay + 1);
  return {
    cycle, period, lutealLength: luteal, ovulationDay,
    menstrual: [1, period],
    follicular: [period + 1, ovStart - 1],
    ovulatory: [ovStart, ovEnd],
    luteal: [ovEnd + 1, cycle],
    // Sperm survive up to ~5 days, the egg ~1 day.
    fertile: [Math.max(period + 1, ovulationDay - 5), ovulationDay + 1],
  };
}

// What a given cycle day looks like. `day` may exceed the cycle length when a period is late.
export function dayInfo(p, day) {
  const b = phaseBounds(p);
  const { cycle, ovulationDay } = b;
  const pos = (day - 1) / Math.max(1, cycle - 1);
  const ovPos = (ovulationDay - 1) / Math.max(1, cycle - 1);

  // Stylised hormone curves (0–100), scaled to this person's cycle. Illustrative, not measured.
  const estrogen = Math.round(Math.min(96, 12
    + Math.exp(-(((pos - (ovPos - 0.03)) / 0.11) ** 2)) * 88
    + Math.exp(-(((pos - (ovPos + 0.25)) / 0.16) ** 2)) * 48));
  const lutealMid = ovPos + (1 - ovPos) * 0.52;
  const progesterone = Math.round(Math.min(95, 8 + (pos > ovPos - 0.02
    ? Math.exp(-(((pos - lutealMid) / 0.18) ** 2)) * 86 : 0)));
  const lh = Math.round(8 + Math.exp(-(((day - ovulationDay) / 1.15) ** 2)) * 88);
  const bbt = day <= ovulationDay
    ? 97.32 - (day === ovulationDay ? 0.08 : 0) + Math.sin(day * 0.5) * 0.04
    : 97.86 + Math.min(0.22, (day - ovulationDay) * 0.03) - (day >= cycle - 1 ? 0.25 : 0);

  let phase, variant;
  if (day <= b.menstrual[1]) { phase = 'menstrual'; variant = day <= 2 ? 'early' : 'late'; }
  else if (day <= b.follicular[1]) { phase = 'follicular'; variant = 'base'; }
  else if (day <= b.ovulatory[1]) { phase = 'ovulatory'; variant = day === ovulationDay ? 'peak' : 'window'; }
  else { phase = 'luteal'; variant = cycle - day < 5 ? 'late' : 'early'; }

  let fertility = 'Low';
  if (day >= ovulationDay - 1 && day <= ovulationDay) fertility = 'Peak';
  else if (day >= b.fertile[0] && day <= b.fertile[1]) fertility = 'High';

  return { day, phase, variant, fertility, estrogen, progesterone, lh, expectedBbt: bbt };
}

// ---------- Status & forecast ----------

const LATE_WINDOW = 14; // days past due that still count as "late" rather than "unlogged"

// Where is this person in their cycle on `iso`?
export function status(p, iso, today = todayISO()) {
  const b = phaseBounds(p);
  const starts = sortedPeriods(p).map((x) => x.start);
  let anchor = null;
  let next = null;
  for (const s of starts) {
    if (s <= iso) anchor = s;
    else { next = s; break; }
  }

  let day;
  let late = 0;
  if (!anchor) {
    day = mod(diffDays(iso, starts[0] || today), b.cycle) + 1; // before the first record: extrapolate back
  } else {
    const d = diffDays(iso, anchor);
    if (next || d < b.cycle) day = d + 1; // a real, logged cycle (or the current one)
    else if (iso <= today && d < b.cycle + LATE_WINDOW) { day = d + 1; late = d - b.cycle; }
    else day = (d % b.cycle) + 1; // projection into future cycles
  }

  return { ...dayInfo(p, day), cycleDay: day, late, bounds: b, anchor };
}

// What is coming up, relative to `today`.
export function forecast(p, today = todayISO()) {
  const b = phaseBounds(p);
  const start = latestStart(p, today);
  let expected = addDays(start, b.cycle);
  let late = Math.max(0, diffDays(today, expected));
  if (late > LATE_WINDOW) { // long unlogged: assume the rhythm continued
    const k = Math.ceil(diffDays(today, start) / b.cycle);
    expected = addDays(start, k * b.cycle);
    late = 0;
  }
  const periodEnd = addDays(expected, b.period - 1);

  let ovulation = addDays(expected, b.ovulationDay - 1 - b.cycle);
  if (diffDays(ovulation, today) < 0) ovulation = addDays(expected, b.ovulationDay - 1);
  let lutealStart = addDays(expected, b.luteal[0] - 1 - b.cycle);
  if (diffDays(lutealStart, today) < 0) lutealStart = addDays(expected, b.luteal[0] - 1);

  return {
    nextPeriod: expected,
    nextPeriodEnd: periodEnd,
    daysUntilPeriod: diffDays(expected, today),
    late,
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
    lutealStart,
  };
}

// The next few predicted cycles after the one in progress.
export function upcomingCycles(p, today = todayISO(), count = 3) {
  const b = phaseBounds(p);
  const f = forecast(p, today);
  return Array.from({ length: count }, (_, i) => {
    const periodStart = addDays(f.nextPeriod, i * b.cycle);
    const ovulation = addDays(periodStart, b.ovulationDay - 1);
    return {
      periodStart,
      periodEnd: addDays(periodStart, b.period - 1),
      fertileStart: addDays(ovulation, -5),
      fertileEnd: addDays(ovulation, 1),
    };
  });
}

// Calendar classification for one day.
export function calendarDay(p, iso, today = todayISO()) {
  const s = status(p, iso, today);
  const b = s.bounds;
  const logged = inLoggedPeriod(p, iso);
  return {
    ...s,
    logged,
    predicted: !logged && s.cycleDay <= b.period && iso > latestStart(p, today),
    fertile: s.cycleDay >= b.fertile[0] && s.cycleDay <= b.fertile[1],
    ovulation: s.cycleDay === b.ovulationDay,
  };
}
