// State, persistence, import/export, undo. No DOM.
// STORAGE_KEY and file formats are unchanged from earlier versions so existing data keeps working.

import { addDays, todayISO, clamp, averageCycleLength } from './cycle.js';
import { COLORS } from './content.js';

export const STORAGE_KEY = 'cadence_pwa_state_v2';
const LEGACY_VIEWS = { cycle: 'today', checkin: 'log', atlas: 'guide' };

// ---------- Normalizing ----------
// Everything that enters state (storage, imports, forms) goes through here.

const text = (v, fallback = '') => (typeof v === 'string' ? v : fallback);
const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const isISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const uid = () => 'p_' + (globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now().toString(36));

function normalizeLog(l) {
  const out = {
    flow: text(l.flow, 'none'),
    sexActivities: list(l.sexActivities),
    sexQualities: list(l.sexQualities),
    cervicalFluid: text(l.cervicalFluid, 'none'),
    opk: text(l.opk, 'none'),
    moods: list(l.moods),
    symptoms: list(l.symptoms),
    bbt: l.bbt === undefined || l.bbt === null ? '' : String(l.bbt),
    notes: text(l.notes),
  };
  if (Number(l.libido) >= 1) out.libido = clamp(Math.round(Number(l.libido)), 1, 5);
  if (Number(l.energy) >= 1) out.energy = clamp(Math.round(Number(l.energy)), 1, 5);
  return out;
}

export function normalizeProfile(raw, today = todayISO()) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const periodLength = clamp(Number(p.periodLength) || 5, 2, 10);
  const periods = (Array.isArray(p.periods) ? p.periods : [])
    .filter((x) => x && isISO(x.start))
    .map((x) => ({ start: x.start, length: clamp(Number(x.length) || periodLength, 2, 10) }));
  if (!periods.length) periods.push({ start: addDays(today, -7), length: periodLength });

  const logs = {};
  for (const [iso, l] of Object.entries(p.logs && typeof p.logs === 'object' ? p.logs : {})) {
    if (isISO(iso) && l && typeof l === 'object') logs[iso] = normalizeLog(l);
  }

  return {
    id: text(p.id) || uid(),
    name: text(p.name).trim().slice(0, 32) || 'Me',
    relation: text(p.relation, 'Self'),
    goal: text(p.goal, 'rhythm'), // kept for compatibility with older exports; not shown
    color: COLORS.some((c) => c.hex === p.color) ? p.color : COLORS[0].hex,
    cycleLength: clamp(Number(p.cycleLength) || 28, 20, 45),
    periodLength,
    lutealLength: clamp(Number(p.lutealLength) || 14, 10, 17),
    periods,
    logs,
  };
}

export function normalizeState(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const profiles = (Array.isArray(s.profiles) ? s.profiles : []).map((p) => normalizeProfile(p));
  const active = profiles.some((p) => p.id === s.activeProfileId) ? s.activeProfileId : profiles[0]?.id ?? null;
  return { profiles, activeProfileId: active };
}

// ---------- Store ----------

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && Array.isArray(raw.profiles)) {
      const s = normalizeState(raw);
      s.view = LEGACY_VIEWS[raw.activeView] || raw.activeView || 'today';
      return s;
    }
  } catch { /* fall through to empty state */ }
  return { ...normalizeState({}), view: 'today' };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: 'light', // legacy field; the app follows the system theme
      activeProfileId: state.activeProfileId,
      activeView: state.view,
      profiles: state.profiles,
    }));
  } catch { /* storage unavailable: keep working in memory */ }
}

export const get = () => state;
export const active = () => state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0] ?? null;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

// Change state. Returns an `undo` function that restores the previous state.
export function commit(mutate, { silent = false } = {}) {
  const before = structuredClone(state);
  mutate(state);
  persist();
  if (!silent) listeners.forEach((fn) => fn());
  return () => {
    state = before;
    persist();
    listeners.forEach((fn) => fn());
  };
}

// ---------- Profile actions ----------

export function saveProfile(form) {
  return commit((s) => {
    const existing = form.id && s.profiles.find((p) => p.id === form.id);
    if (existing) {
      Object.assign(existing, normalizeProfile({ ...existing, ...form, periods: existing.periods, logs: existing.logs }));
      if (form.lastPeriod && !existing.periods.some((x) => x.start === form.lastPeriod)) {
        existing.periods.push({ start: form.lastPeriod, length: existing.periodLength });
      }
    } else {
      const p = normalizeProfile({ ...form, periods: [{ start: form.lastPeriod, length: form.periodLength }], logs: {} });
      s.profiles.push(p);
      s.activeProfileId = p.id;
    }
  });
}

export function createFirstProfile(form) {
  const cycle = clamp(Number(form.cycleLength) || 28, 20, 45);
  return commit((s) => {
    const p = normalizeProfile({
      ...form,
      periods: [{ start: addDays(form.lastPeriod, -cycle), length: form.periodLength }, { start: form.lastPeriod, length: form.periodLength }],
    });
    s.profiles = [p];
    s.activeProfileId = p.id;
    s.view = 'today';
  });
}

export function deleteProfile(id) {
  return commit((s) => {
    s.profiles = s.profiles.filter((p) => p.id !== id);
    s.activeProfileId = s.profiles[0]?.id ?? null;
  });
}

export function setPeriod(profile, start, length) {
  return commit(() => {
    const found = profile.periods.find((x) => x.start === start);
    if (found) found.length = length;
    else profile.periods.push({ start, length });
    profile.periodLength = length;
    const avg = averageCycleLength(profile);
    if (avg) profile.cycleLength = clamp(avg, 20, 45);
  });
}

export function removePeriod(profile, start) {
  return commit(() => {
    if (profile.periods.length < 2) return; // always keep one anchor
    profile.periods = profile.periods.filter((x) => x.start !== start);
    const avg = averageCycleLength(profile);
    if (avg) profile.cycleLength = clamp(avg, 20, 45);
  });
}

export const saveLog = (profile, iso, log) => commit(() => {
  const clean = normalizeLog(log);
  const empty = clean.flow === 'none' && clean.cervicalFluid === 'none' && clean.opk === 'none' && !clean.bbt && !clean.notes
    && !clean.sexActivities.length && !clean.sexQualities.length && !clean.moods.length && !clean.symptoms.length
    && clean.libido === undefined && clean.energy === undefined;
  if (empty) delete profile.logs[iso];
  else profile.logs[iso] = clean;
}, { silent: true });

export const clearLog = (profile, iso) => commit(() => { delete profile.logs[iso]; });
export const setView = (view) => commit((s) => { s.view = view; });
export const setActive = (id) => commit((s) => { s.activeProfileId = id; });

// ---------- Import / export ----------

export function exportVault() {
  return { type: 'cadence_vault', version: '4.0', exportedAt: todayISO(), activeProfileId: state.activeProfileId, profiles: state.profiles };
}

export function exportProfile(p) {
  return { type: 'cadence_single_profile', version: '4.0', exportedAt: todayISO(), profile: p };
}

// Accepts a vault, a single-profile export, or a bare profile. Returns a message and an undo, or throws.
export function importData(parsed) {
  if (parsed && parsed.type === 'cadence_single_profile' && parsed.profile?.name) return addImported(parsed.profile);
  if (parsed && Array.isArray(parsed.profiles)) {
    const incoming = normalizeState(parsed);
    const undo = commit((s) => { s.profiles = incoming.profiles; s.activeProfileId = incoming.activeProfileId; });
    return { message: `Restored ${incoming.profiles.length} ${incoming.profiles.length === 1 ? 'profile' : 'profiles'}`, undo };
  }
  if (parsed && parsed.name && Array.isArray(parsed.periods)) return addImported(parsed);
  throw new Error('Not a Cadence file');
}

function addImported(raw) {
  const p = normalizeProfile({ ...raw, id: '' });
  const undo = commit((s) => { s.profiles.push(p); s.activeProfileId = p.id; });
  return { message: `Imported ${p.name}`, undo };
}

export function loadSample(today = todayISO()) {
  const mk = (id, name, relation, color, cycleLength, periodLength, lutealLength, ago, logs) => {
    const last = addDays(today, -ago);
    return normalizeProfile({
      id, name, relation, color, cycleLength, periodLength, lutealLength,
      periods: [-2, -1, 0].map((i) => ({ start: addDays(last, i * cycleLength), length: periodLength })),
      logs,
    }, today);
  };
  const profiles = [
    mk('p_maya', 'Maya', 'Self', '#C25949', 28, 5, 14, 13, {
      [today]: { cervicalFluid: 'eggwhite', opk: 'pos', libido: 5, energy: 5, bbt: '97.38', moods: ['Focused', 'Social'], symptoms: ['High stamina', 'Clear skin'], sexActivities: ['unprotected'], sexQualities: ['Deep connection'], notes: 'Clear fluid, strong focus.' },
      [addDays(today, -2)]: { cervicalFluid: 'creamy', opk: 'neg', libido: 4, energy: 4, bbt: '97.32', moods: ['Calm', 'Creative'], sexActivities: ['protected'] },
      [addDays(today, -12)]: { flow: 'medium', libido: 2, energy: 2, bbt: '97.26', moods: ['Introverted'], symptoms: ['Cramps'] },
    }),
    mk('p_elena', 'Elena', 'Partner', '#3E7A6E', 30, 4, 14, 22, {
      [today]: { cervicalFluid: 'sticky', libido: 3, energy: 3, bbt: '98.12', moods: ['Sensitive'], symptoms: ['Bloating', 'Cravings'] },
    }),
    mk('p_chloe', 'Chloe', 'Family', '#7C5879', 27, 5, 13, 2, {
      [today]: { flow: 'medium', libido: 1, energy: 2, bbt: '97.29', symptoms: ['Cramps', 'Lower back ache'] },
    }),
  ];
  return commit((s) => { s.profiles = profiles; s.activeProfileId = 'p_maya'; s.view = 'today'; });
}

export function wipe() {
  return commit((s) => { s.profiles = []; s.activeProfileId = null; s.view = 'today'; });
}
