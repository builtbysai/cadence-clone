import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, phaseBounds, status, forecast, upcomingCycles, calendarDay, averageCycleLength, dayInfo } from '../cycle.js';

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
  assert.deepEqual(b.fertile, [9, 15]);
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
  assert.equal(f.fertileEnd, addDays(TODAY, 1));
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
