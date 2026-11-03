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

// Past dates from an earlier year show the year, so a 2016 entry never looks like a 2026 one.
export const pastYear = (d) => d.getFullYear() !== new Date().getFullYear() && d < new Date();
const yr = (iso) => (pastYear(parseISO(iso)) ? { year: 'numeric' } : {});
export const fmtShort = (iso) => parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...yr(iso) });
export const fmtLong = (iso) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', ...yr(iso) });
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
export const averageCycleLength = (p) => cycleStats(p).mean;


// Observed cycle lengths (18–50 days) and how much they vary.
export function cycleStats(p) {
  const list = sortedPeriods(p);
  const gaps = [];
  for (let i = 1; i < list.length; i++) {
    const d = diffDays(list[i].start, list[i - 1].start);
    if (d >= 18 && d <= 50) gaps.push(d);
  }
  const n = gaps.length;
  if (!n) return { n: 0, mean: null, min: null, max: null, range: 0, spread: 0 };
  const min = Math.min(...gaps), max = Math.max(...gaps);
  const mean = Math.round(gaps.reduce((a, b) => a + b, 0) / n);
  // Only claim a margin once there are three cycles to base it on.
  const spread = n >= 3 ? Math.min(5, Math.ceil((max - min) / 2)) : 0;
  return { n, mean, min, max, range: max - min, spread };
}

// Reference ranges for "worth mentioning to a clinician" (FIGO 2018 normal menstrual parameters).
export function regularity(p) {
  const s = cycleStats(p);
  const b = phaseBounds(p);
  const flags = [];
  if (b.cycle < 24 || b.cycle > 38) flags.push(`Cycles average ${b.cycle} days (typical 24–38)`);
  if (s.range > 9) flags.push(`Cycle length varies by ${s.range} days (typical up to 9)`);
  if (b.period > 8) flags.push(`Bleeding lasts ${b.period} days (typical up to 8)`);
  if (b.lutealLength < 10) flags.push(`Luteal phase is ${b.lutealLength} days (usually 10 or more)`);
  return flags;
}

// What the person's own logs say about ovulation in the current cycle.
//   bbt: waking temperature stays above the previous six readings for three days (confirmed after the fact)
//   lh:  first positive LH test; ovulation usually follows within 12–36 hours (still an estimate)
export function observedOvulation(p, today = todayISO()) {
  if (p.hormonal) return null;
  const start = latestStart(p, today);
  const logs = p.logs || {};
  const span = Math.min(60, diffDays(today, start));
  if (span < 0) return null;
  const days = Array.from({ length: span + 1 }, (_, i) => addDays(start, i));
  const temps = days.map((iso) => {
    const t = parseFloat(logs[iso]?.bbt);
    return t > 90 && t < 110 ? t : null;
  });
  for (let i = 5; i + 2 < temps.length; i++) {
    const prior = temps.slice(Math.max(0, i - 6), i).filter((t) => t !== null);
    if (prior.length < 4 || temps[i] === null || temps[i + 1] === null || temps[i + 2] === null) continue;
    const cover = Math.max(...prior) + 0.1;
    if (temps[i] >= cover && temps[i + 1] >= cover && temps[i + 2] >= Math.max(...prior) + 0.2) {
      return { iso: days[i - 1], day: i, method: 'bbt', confirmed: true };
    }
  }
  const pos = days.find((iso) => logs[iso]?.opk === 'pos');
  if (pos) {
    const iso = addDays(pos, 1);
    return { iso, day: diffDays(iso, start) + 1, method: 'lh', confirmed: diffDays(today, iso) > 1 };
  }
  return null;
}

// Fertility on `iso` given an observed ovulation date.
function fertilityFrom(obs, iso) {
  const d = diffDays(obs.iso, iso);
  if (d < 0 || d > 5) return 'Low';
  return d <= 2 ? 'Peak' : 'High';
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
    // The fertile window is the six days ending on ovulation day (Wilcox 1995).
    fertile: [Math.max(period + 1, ovulationDay - 5), ovulationDay],
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
  else if (day <= b.follicular[1]) { phase = 'follicular'; variant = day >= Math.round((b.follicular[0] + b.follicular[1]) / 2) ? 'late' : 'base'; }
  else if (day <= b.ovulatory[1]) { phase = 'ovulatory'; variant = day === ovulationDay ? 'peak' : 'window'; }
  else { phase = 'luteal'; variant = cycle - day < 5 ? 'late' : 'early'; }

  // Chances are highest in the two days before ovulation and on ovulation day itself.
  let fertility = 'Low';
  if (!p.hormonal) {
    if (day >= ovulationDay - 2 && day <= ovulationDay) fertility = 'Peak';
    else if (day >= b.fertile[0] && day <= b.fertile[1]) fertility = 'High';
  }

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

  const info = dayInfo(p, day);
  const current = anchor && anchor === starts[starts.length - 1] && diffDays(iso, anchor) < b.cycle + LATE_WINDOW;
  const obs = current && !p.hormonal ? observedOvulation(p, today) : null;
  if (obs) info.fertility = fertilityFrom(obs, iso);
  return { ...info, cycleDay: day, late, bounds: b, anchor };
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

  let ovulation = addDays(expected, b.ovulationDay - 1 - b.cycle);
  if (diffDays(ovulation, today) < 0) ovulation = addDays(expected, b.ovulationDay - 1);
  let lutealStart = addDays(expected, b.luteal[0] - 1 - b.cycle);
  if (diffDays(lutealStart, today) < 0) lutealStart = addDays(expected, b.luteal[0] - 1);

  // Own signs beat the average: once ovulation is seen, the next period is about one luteal phase later.
  const observed = observedOvulation(p, today);
  if (observed && diffDays(observed.iso, start) >= 0 && diffDays(observed.iso, start) < b.cycle) {
    ovulation = observed.iso;
    lutealStart = addDays(observed.iso, 2);
    expected = addDays(observed.iso, b.lutealLength);
    late = Math.max(0, diffDays(today, expected));
  }

  return {
    nextPeriod: expected,
    nextPeriodEnd: addDays(expected, b.period - 1),
    daysUntilPeriod: diffDays(expected, today),
    late,
    spread: observed ? 0 : cycleStats(p).spread,
    ovulation,
    observed,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: ovulation,
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
      fertileEnd: ovulation,
    };
  });
}

// Calendar classification for one day.
export function calendarDay(p, iso, today = todayISO(), obs = observedOvulation(p, today)) {
  const s = status(p, iso, today);
  const b = s.bounds;
  const logged = inLoggedPeriod(p, iso);
  const start = latestStart(p, today);
  const inCurrent = obs && diffDays(iso, start) >= 0 && diffDays(iso, start) < b.cycle;
  let fertile = s.cycleDay >= b.fertile[0] && s.cycleDay <= b.fertile[1];
  let ovulation = s.cycleDay === b.ovulationDay;
  if (inCurrent) {
    fertile = diffDays(obs.iso, iso) >= 0 && diffDays(obs.iso, iso) <= 5;
    ovulation = iso === obs.iso;
  }
  if (p.hormonal) { fertile = false; ovulation = false; }
  return {
    ...s,
    logged,
    predicted: !logged && s.cycleDay <= b.period && iso > start,
    fertile,
    ovulation,
    confirmed: Boolean(inCurrent && ovulation && obs.confirmed),
  };
}
