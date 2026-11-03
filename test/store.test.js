import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../store.js';

const wipe = () => S.wipe();

test('storage key is unchanged', () => {
  assert.equal(S.STORAGE_KEY, 'cadence_pwa_state_v2');
});

test('normalizeProfile repairs bad input', () => {
  const p = S.normalizeProfile({ name: '  ', cycleLength: 999, periodLength: 'x', color: 'nope', periods: [{ start: 'bad' }], logs: { '2026-01-01': { libido: 9, moods: ['a', 3] }, nope: {} } }, '2026-11-02');
  assert.equal(p.name, 'Me');
  assert.equal(p.cycleLength, 45);
  assert.equal(p.periodLength, 5);
  assert.equal(p.periods.length, 1);
  assert.equal(p.logs['2026-01-01'].libido, 5);
  assert.deepEqual(p.logs['2026-01-01'].moods, ['a']);
  assert.equal(p.logs.nope, undefined);
  assert.match(p.color, /^#/);
});

test('imports a vault, a single profile and a bare profile', () => {
  wipe();
  const raw = { name: 'Ada', periods: [{ start: '2026-10-01', length: 4 }] };
  S.importData({ type: 'cadence_single_profile', profile: raw });
  S.importData(raw);
  assert.equal(S.get().profiles.length, 2);
  const vault = S.exportVault();
  wipe();
  assert.equal(S.get().profiles.length, 0);
  S.importData(JSON.parse(JSON.stringify(vault)));
  assert.equal(S.get().profiles.length, 2);
  assert.ok(S.active());
});

test('import rejects unrelated files', () => {
  assert.throws(() => S.importData({ hello: 'world' }), /Not a Tide file/);
  assert.throws(() => S.importData(null));
});

test('undo restores the previous state', () => {
  wipe();
  S.loadSample('2026-11-02');
  assert.equal(S.get().profiles.length, 3);
  const undo = S.deleteProfile('p_elena');
  assert.equal(S.get().profiles.length, 2);
  undo();
  assert.equal(S.get().profiles.length, 3);
});

test('saveLog drops empty entries and keeps real ones', () => {
  wipe();
  S.loadSample('2026-11-02');
  const p = S.active();
  S.saveLog(p, '2026-11-01', { moods: ['Calm'] });
  assert.deepEqual(S.active().logs['2026-11-01'].moods, ['Calm']);
  S.saveLog(S.active(), '2026-11-01', {});
  assert.equal(S.active().logs['2026-11-01'], undefined);
});

test('setPeriod updates average cycle length; removePeriod keeps one anchor', () => {
  wipe();
  S.createFirstProfile({ name: 'Zed', relation: 'Self', color: '#C25949', cycleLength: 28, periodLength: 5, lutealLength: 14, lastPeriod: '2026-10-20' });
  const p = S.active();
  assert.equal(p.periods.length, 2);
  S.removePeriod(p, p.periods[0].start);
  S.removePeriod(S.active(), S.active().periods[0].start);
  assert.equal(S.active().periods.length, 1);
});

test('tags keep their original ids, and the redesign spellings migrate back', () => {
  const p = S.normalizeProfile({
    name: 'T', periods: [{ start: '2026-10-01', length: 5 }],
    logs: { '2026-10-02': { moods: ['Warm / Affectionate', 'Affectionate', 'brain fog'], symptoms: ['High stamina', 'Salt/Sweet Cravings', 'Cravings'], sexQualities: ['Pelvic pain'] } },
  }, '2026-11-02');
  const l = p.logs['2026-10-02'];
  assert.deepEqual(l.moods, ['Warm / Affectionate', 'Brain Fog']);
  assert.deepEqual(l.symptoms, ['High Stamina', 'Salt/Sweet Cravings']);
  assert.deepEqual(l.sexQualities, ['Pelvic Pain / Dyspareunia']);
});

test('unknown tags are kept as typed', () => {
  const p = S.normalizeProfile({ name: 'T', periods: [{ start: '2026-10-01' }], logs: { '2026-10-02': { moods: ['Custom'] } } });
  assert.deepEqual(p.logs['2026-10-02'].moods, ['Custom']);
});

test('temperature: impossible values are dropped, real ones rounded', () => {
  const t = (bbt) => S.normalizeProfile({ name: 'T', periods: [{ start: '2026-10-01' }], logs: { '2026-10-02': { bbt, notes: 'x' } } }).logs['2026-10-02'].bbt;
  assert.equal(t('200'), '');
  assert.equal(t('50'), '');
  assert.equal(t(98.5999984741211), '98.6');
  assert.equal(t('97.38'), '97.38');
  assert.equal(t(''), '');
});

test('an empty vault is rejected instead of erasing everything', () => {
  assert.throws(() => S.importData({ profiles: [] }));
  assert.throws(() => S.importData({ garbage: true }));
});
