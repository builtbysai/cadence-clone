import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, phaseBounds, status, forecast, upcomingCycles, calendarDay, averageCycleLength, dayInfo, cycleStats, regularity, observedOvulation } from '../cycle.js';

const TODAY = '2026-11-02';
const profile = (over = {}) => ({
  cycleLength: 28, periodLength: 5, lutealLength: 14,
  periods: [{ start: addDays(TODAY, -13), length: 5 }], ...over,
});

test('date math crosses DST and month boundaries', () => {
  assert.equal(addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDays('2026-11-02', '2026-03-08'), 239);
});

test('phase bounds for a 28-day cycle', () => {
  const b = phaseBounds(profile());
  assert.equal(b.ovulationDay, 14);
  assert.deepEqual(b.menstrual, [1, 5]);
  assert.deepEqual(b.follicular, [6, 10]);
  assert.deepEqual(b.ovulatory, [11, 15]);
  assert.deepEqual(b.luteal, [16, 28]);
  assert.equal(b.lutealLength, 14);
  assert.deepEqual(b.fertile, [9, 14]);
});

test('phase bounds stay valid for extreme settings', () => {
  for (const cycleLength of [21, 28, 45]) for (const periodLength of [2, 10]) for (const lutealLength of [10, 17]) {
    const b = phaseBounds({ cycleLength, periodLength, lutealLength });
    assert.ok(b.follicular[0] <= b.follicular[1] + 1, JSON.stringify(b));
    assert.ok(b.ovulatory[0] <= b.ovulatory[1], JSON.stringify(b));
    assert.ok(b.luteal[0] <= b.luteal[1], JSON.stringify(b));
  }
});

test('today is day 14 and ovulatory', () => {
  const s = status(profile(), TODAY, TODAY);
  assert.equal(s.cycleDay, 14);
  assert.equal(s.phase, 'ovulatory');
  assert.equal(s.fertility, 'Peak');
  assert.equal(s.late, 0);
});

test('a late period is reported as late, not as a new cycle', () => {
  const p = profile({ periods: [{ start: addDays(TODAY, -30), length: 5 }] });
  const s = status(p, TODAY, TODAY);
  assert.equal(s.cycleDay, 31);
  assert.equal(s.late, 2);
  assert.equal(s.phase, 'luteal');
  const f = forecast(p, TODAY);
  assert.equal(f.late, 2);
  assert.equal(f.daysUntilPeriod, -2);
});

test('long-unlogged periods fall back to projecting the rhythm', () => {
  const p = profile({ periods: [{ start: addDays(TODAY, -60), length: 5 }] });
  const s = status(p, TODAY, TODAY);
  assert.equal(s.late, 0);
  assert.equal(s.cycleDay, 5); // 60 % 28 = 4
  const f = forecast(p, TODAY);
  assert.equal(f.late, 0);
  assert.ok(f.daysUntilPeriod >= 0 && f.daysUntilPeriod <= 28);
});

test('past cycles use their real length', () => {
  const p = profile({ periods: [{ start: '2026-08-01', length: 5 }, { start: '2026-09-05', length: 5 }, { start: addDays(TODAY, -13), length: 5 }] });
  assert.equal(status(p, '2026-09-04', TODAY).cycleDay, 35); // 35-day cycle, not wrapped to 7
  assert.equal(status(p, '2026-09-05', TODAY).cycleDay, 1);
});

test('future dates project forward in cycles', () => {
  const s = status(profile(), addDays(TODAY, 15), TODAY); // day 29 -> wraps to day 1
  assert.equal(s.cycleDay, 1);
  assert.equal(s.phase, 'menstrual');
});

test('forecast: next period, ovulation and fertile window', () => {
  const f = forecast(profile(), TODAY);
  assert.equal(f.nextPeriod, addDays(TODAY, 15));
  assert.equal(f.daysUntilPeriod, 15);
  assert.equal(f.ovulation, TODAY);
  assert.equal(f.fertileStart, addDays(TODAY, -5));
  assert.equal(f.fertileEnd, TODAY);
});

test('upcomingCycles spaces cycles by the cycle length', () => {
  const [a, b, c] = upcomingCycles(profile(), TODAY);
  assert.equal(diffDays(b.periodStart, a.periodStart), 28);
  assert.equal(diffDays(c.periodStart, b.periodStart), 28);
  assert.equal(a.periodEnd, addDays(a.periodStart, 4));
});

test('calendar flags logged vs predicted periods', () => {
  const p = profile();
  assert.equal(calendarDay(p, addDays(TODAY, -13), TODAY).logged, true);
  assert.equal(calendarDay(p, addDays(TODAY, 15), TODAY).predicted, true);
  assert.equal(calendarDay(p, TODAY, TODAY).ovulation, true);
  assert.equal(calendarDay(p, TODAY, TODAY).fertile, true);
});

test('averageCycleLength ignores implausible gaps', () => {
  const p = { periods: [{ start: '2026-01-01' }, { start: '2026-01-29' }, { start: '2026-02-26' }, { start: '2026-06-30' }] };
  assert.equal(averageCycleLength(p), 28);
  assert.equal(averageCycleLength({ periods: [{ start: '2026-01-01' }] }), null);
});

test('dayInfo variants cover every day without gaps', () => {
  const p = profile();
  for (let d = 1; d <= 40; d++) {
    const i = dayInfo(p, d);
    assert.ok(['menstrual', 'follicular', 'ovulatory', 'luteal'].includes(i.phase));
    assert.ok(i.variant);
  }
});

test('follicular splits into mid and late', () => {
  const p = { cycleLength: 28, periodLength: 5, lutealLength: 14 };
  assert.equal(dayInfo(p, 6).variant, 'base');
  assert.equal(dayInfo(p, 10).variant, 'late');
});

test('fertile window is six days ending on ovulation; peak is the last three', () => {
  const p = profile();
  assert.equal(dayInfo(p, 11).fertility, 'High');
  assert.equal(dayInfo(p, 12).fertility, 'Peak');
  assert.equal(dayInfo(p, 14).fertility, 'Peak');
  assert.equal(dayInfo(p, 15).fertility, 'Low');
  assert.equal(dayInfo(profile({ hormonal: true }), 13).fertility, 'Low');
});

test('cycleStats gives a margin only after three cycles', () => {
  const mk = (...gaps) => {
    let d = '2026-01-01';
    const periods = [{ start: d, length: 5 }];
    for (const g of gaps) { d = addDays(d, g); periods.push({ start: d, length: 5 }); }
    return profile({ periods });
  };
  assert.equal(cycleStats(mk(28, 30)).spread, 0);
  const s = cycleStats(mk(26, 30, 28));
  assert.deepEqual([s.n, s.mean, s.range, s.spread], [3, 28, 4, 2]);
});

test('regularity follows FIGO ranges', () => {
  assert.deepEqual(regularity(profile()), []);
  assert.equal(regularity(profile({ cycleLength: 42 })).length, 1);
  assert.equal(regularity(profile({ periodLength: 9 })).length, 1);
});

test('own logs move ovulation and the next period', () => {
  const start = addDays(TODAY, -13);
  const p = profile({ logs: { [TODAY]: { opk: 'pos' } } });
  const o = observedOvulation(p, TODAY);
  assert.deepEqual([o.iso, o.method, o.confirmed], [addDays(TODAY, 1), 'lh', false]);
  const f = forecast(p, TODAY);
  assert.equal(f.ovulation, addDays(TODAY, 1));
  assert.equal(f.nextPeriod, addDays(TODAY, 15));
  assert.equal(status(p, TODAY, TODAY).fertility, 'Peak');
  assert.equal(observedOvulation(profile({ hormonal: true, logs: { [TODAY]: { opk: 'pos' } } }), TODAY), null);
  assert.ok(start);
});

test('three high temperatures after six lower ones confirm ovulation', () => {
  const start = addDays(TODAY, -15);
  const logs = {};
  const temps = [97.2, 97.3, 97.2, 97.3, 97.2, 97.3, 97.2, 97.3, 97.2, 97.3, 97.2, 97.9, 98.0, 98.1];
  temps.forEach((t, i) => { logs[addDays(start, i)] = { bbt: String(t) }; });
  const p = profile({ periods: [{ start, length: 5 }], logs });
  const o = observedOvulation(p, TODAY);
  assert.equal(o.method, 'bbt');
  assert.equal(o.confirmed, true);
  assert.equal(o.iso, addDays(start, 10));
});
