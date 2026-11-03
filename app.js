// Cadence UI. Views are template functions: (profile) => html. Events are delegated via data-action.
// Model lives in cycle.js, copy in content.js, state in store.js.

import { addDays, diffDays, todayISO, parseISO, fmtShort, fmtLong, fmtRange, relative, status, forecast, dayInfo, upcomingCycles, calendarDay, phaseBounds, sortedPeriods, latestStart, averageCycleLength, clamp, PHASE_NAMES, PHASE_ORDER } from './cycle.js';
import * as S from './store.js';
import * as T from './content.js';

// ---------- Templating ----------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
class Raw { constructor(s) { this.s = s; } }
const out = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(out).join('') : v == null || v === false ? '' : esc(v));
const html = (strings, ...vals) => new Raw(strings.reduce((acc, s, i) => acc + s + (i < vals.length ? out(vals[i]) : ''), ''));
const icon = (name, cls = '') => html`<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const $ = (sel, root = document) => root.querySelector(sel);

const fmtDay = (iso) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const monthLabel = (iso) => parseISO(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const byId = (list, id) => list.find((x) => x.id === id);

// ---------- UI state (not persisted) ----------

let TODAY = todayISO();
const ui = {
  day: null,            // scrubbed cycle day on Today, null = actual today
  date: TODAY,          // selected date for Calendar / Log
  cursor: TODAY.slice(0, 8) + '01', // first day of the month shown in Calendar
  chart: 'hormones',
  draft: null,          // Log entry being edited
};

const VIEWS = ['today', 'calendar', 'log', 'people', 'history', 'guide'];
const TABS = ['today', 'calendar', 'log', 'people', 'history'];

// ---------- Small pieces ----------

const avatar = (p, cls = '') => html`<span class="avatar ${cls}" style="background:${p.color}" aria-hidden="true">${p.name.charAt(0).toUpperCase()}</span>`;
const phaseLine = (st) => `Day ${st.cycleDay} · ${PHASE_NAMES[st.phase]}`;

function row(iconName, title, body, end = '') {
  return html`<div class="row stack">${icon(iconName)}<div class="row-main"><div class="row-title">${title}</div><div class="row-sub">${body}</div></div>${end}</div>`;
}

function seg(key, options, value, label) {
  return html`<div class="seg" role="radiogroup" aria-label="${label}">${options.map((o) =>
    html`<button type="button" role="radio" aria-checked="${o.id === value ? 'true' : 'false'}" data-action="log-set" data-key="${key}" data-value="${o.id}">${o.label}</button>`)}</div>`;
}

function chips(key, options, selected) {
  return html`<div class="chips">${options.map((o) => {
    const id = o.id ?? o;
    return html`<button type="button" class="chip" aria-pressed="${selected.includes(id) ? 'true' : 'false'}" data-action="log-toggle" data-key="${key}" data-value="${id}">${o.label ?? o}</button>`;
  })}</div>`;
}

function rating(key, value) {
  return html`<div class="rating" role="group" aria-label="${key}">${[1, 2, 3, 4, 5].map((n) =>
    html`<button type="button" aria-pressed="${value === n ? 'true' : 'false'}" data-action="log-rate" data-key="${key}" data-value="${n}">${n}</button>`)}</div>`;
}

function smooth(pts) {
  if (pts.length < 3) return 'M' + pts.map((p) => p.join(',')).join('L');
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function summarize(log) {
  const tags = [];
  const label = (list, id) => byId(list, id)?.label ?? id;
  if (log.flow && log.flow !== 'none') tags.push(`${label(T.FLOW, log.flow)} flow`);
  if (log.cervicalFluid && log.cervicalFluid !== 'none') tags.push(`${label(T.FLUID, log.cervicalFluid)} fluid`);
  if (log.opk && log.opk !== 'none') tags.push(`LH ${label(T.LH, log.opk).toLowerCase()}`);
  if (log.bbt) tags.push(`${log.bbt}°F`);
  if (log.libido) tags.push(`Desire ${log.libido}/5`);
  if (log.energy) tags.push(`Vitality ${log.energy}/5`);
  (log.sexActivities || []).forEach((id) => tags.push(label(T.INTIMACY, id)));
  return [...tags, ...(log.sexQualities || []), ...(log.moods || []), ...(log.symptoms || [])];
}

// ---------- Today ----------

const RING = { c: 140, r: 112, stroke: 10, gap: 5 };

function polar(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [RING.c + r * Math.cos(a), RING.c + r * Math.sin(a)];
}

function arc(day, L) {
  const slice = 360 / L;
  const pad = Math.max(0.4, ((RING.stroke + RING.gap) / RING.r) * (180 / Math.PI) / 2);
  const mid = (day - 0.5) * slice;
  const half = Math.max(0.3, slice / 2 - pad);
  const [x1, y1] = polar(RING.r, mid - half);
  const [x2, y2] = polar(RING.r, mid + half);
  return `M${x1.toFixed(2)},${y1.toFixed(2)}A${RING.r},${RING.r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

function shownDay(p) {
  return ui.day ?? status(p, TODAY, TODAY).cycleDay;
}

function ringSvg(p) {
  const st = status(p, TODAY, TODAY);
  const b = st.bounds;
  const L = b.cycle;
  const todayDay = Math.min(st.cycleDay, L);
  const start = latestStart(p, TODAY);
  let svg = '';
  for (let d = 1; d <= L; d++) {
    svg += `<path class="seg-path p-${dayInfo(p, d).phase}" data-day="${d}" d="${arc(d, L)}"/>`;
  }
  // Markers: ovulation and logged intimacy inside the ring, today outside.
  const mid = (d) => (d - 0.5) * (360 / L);
  const [ox, oy] = polar(RING.r - 19, mid(b.ovulationDay));
  svg += `<circle class="mark" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="3.5" fill="none" stroke="var(--amber)" stroke-width="1.75"/>`;
  for (let d = 1; d <= L; d++) {
    const log = p.logs[addDays(start, d - 1)];
    if (log && (log.sexActivities?.length || log.libido >= 4)) {
      const [x, y] = polar(RING.r - 19, mid(d));
      if (d !== b.ovulationDay) svg += `<circle class="mark" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="var(--rose)"/>`;
    }
  }
  const [tx, ty] = polar(RING.r + 19, mid(todayDay));
  svg += `<circle class="mark" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3.5" fill="var(--ink)"/>`;
  return `<svg viewBox="0 0 280 280" aria-hidden="true">${svg}</svg>`;
}

function ringCenter(p) {
  const day = shownDay(p);
  const info = dayInfo(p, day);
  const fert = info.fertility === 'Low' ? ' ' : `${info.fertility} fertility`;
  return html`<span class="ring-day-label">Day</span><span class="ring-day">${day}</span><span class="ring-phase p-${info.phase}">${PHASE_NAMES[info.phase]}</span><span class="ring-fert">${fert}</span>`;
}

function paintRing(p) {
  const L = phaseBounds(p).cycle;
  const day = shownDay(p);
  const st = status(p, TODAY, TODAY);
  const sel = Math.min(day, L);
  const todayDay = Math.min(st.cycleDay, L);
  document.querySelectorAll('#ring .seg-path').forEach((el) => {
    const d = Number(el.dataset.day);
    el.classList.toggle('sel', d === sel);
    el.classList.toggle('past', d < todayDay && d !== sel);
  });
  const ring = $('#ring');
  ring.setAttribute('aria-valuenow', day);
  ring.setAttribute('aria-valuetext', `Day ${day}, ${PHASE_NAMES[dayInfo(p, day).phase]} phase`);
  $('#ring-center').innerHTML = ringCenter(p).s;
}

function upcoming(p) {
  const f = forecast(p, TODAY);
  const inWindow = diffDays(f.fertileStart, TODAY) <= 0 && diffDays(f.fertileEnd, TODAY) >= 0;
  const lateText = f.late ? `${plural(f.late, 'day')} late` : null;
  return html`
    <div>
      <div class="section-title">Coming up</div>
      <div class="group">
        <div class="row"><span class="dot p-menstrual"></span><div class="row-main"><div class="row-title">Period</div><div class="row-sub">${f.late ? 'Expected ' + fmtShort(f.nextPeriod) : fmtRange(f.nextPeriod, f.nextPeriodEnd)}</div></div><span class="row-end ${f.late ? 'warn' : ''}">${lateText ?? relative(f.daysUntilPeriod)}</span></div>
        <div class="row"><span class="dot p-ovulatory"></span><div class="row-main"><div class="row-title">Fertile window</div><div class="row-sub">${fmtRange(f.fertileStart, f.fertileEnd)}</div></div><span class="row-end">${inWindow ? 'Now' : relative(diffDays(f.fertileStart, TODAY))}</span></div>
        <div class="row"><span class="dot p-luteal"></span><div class="row-main"><div class="row-title">Luteal phase</div><div class="row-sub">Starts ${fmtShort(f.lutealStart)}</div></div><span class="row-end">${relative(diffDays(f.lutealStart, TODAY))}</span></div>
      </div>
    </div>`;
}

function hormoneChart(p, day) {
  const L = phaseBounds(p).cycle;
  const W = 560, H = 150, px = 4, top = 10, bottom = 8;
  const x = (d) => px + ((d - 1) / Math.max(1, L - 1)) * (W - px * 2);
  const y = (v) => top + (1 - v / 100) * (H - top - bottom);
  const days = Array.from({ length: L }, (_, i) => dayInfo(p, i + 1));
  const line = (k) => smooth(days.map((d, i) => [x(i + 1), y(d[k])]));
  const sel = Math.min(day, L);
  const cur = days[sel - 1];
  return html`
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated hormone pattern across the cycle">
      <line x1="${px}" x2="${W - px}" y1="${H - bottom}" y2="${H - bottom}" stroke="var(--line)"/>
      <path d="${line('lh')}" fill="none" stroke="var(--amber)" stroke-width="1.75" stroke-dasharray="3 4" stroke-linecap="round"/>
      <path d="${line('progesterone')}" fill="none" stroke="var(--plum)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="${line('estrogen')}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="${x(sel)}" x2="${x(sel)}" y1="2" y2="${H - bottom}" stroke="var(--ink)" stroke-opacity=".3"/>
      <circle cx="${x(sel)}" cy="${y(cur.estrogen)}" r="4.5" fill="var(--green)" stroke="var(--surface)" stroke-width="2"/>
      <circle cx="${x(sel)}" cy="${y(cur.progesterone)}" r="4.5" fill="var(--plum)" stroke="var(--surface)" stroke-width="2"/>
    </svg>
    <div class="key"><span style="--c:var(--green)"><i></i>Estradiol</span><span style="--c:var(--plum)"><i></i>Progesterone</span><span style="--c:var(--amber)"><i></i>LH</span></div>`;
}

function bbtChart(p, day) {
  const L = phaseBounds(p).cycle;
  const start = latestStart(p, TODAY);
  const W = 560, H = 150, px = 4, top = 10, bottom = 8;
  const expected = Array.from({ length: L }, (_, i) => dayInfo(p, i + 1).expectedBbt);
  const logged = [];
  for (let d = 1; d <= L; d++) {
    const t = parseFloat(p.logs[addDays(start, d - 1)]?.bbt);
    if (t > 90 && t < 110) logged.push([d, t]);
  }
  const all = [...expected, ...logged.map((l) => l[1])];
  const lo = Math.min(...all) - 0.2, hi = Math.max(...all) + 0.2;
  const x = (d) => px + ((d - 1) / Math.max(1, L - 1)) * (W - px * 2);
  const y = (t) => top + (1 - (t - lo) / (hi - lo)) * (H - top - bottom);
  const sel = Math.min(day, L);
  return html`
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Basal body temperature across the cycle">
      <line x1="${px}" x2="${W - px}" y1="${H - bottom}" y2="${H - bottom}" stroke="var(--line)"/>
      <path d="${smooth(expected.map((t, i) => [x(i + 1), y(t)]))}" fill="none" stroke="var(--amber)" stroke-width="2.25" stroke-linecap="round" opacity=".75"/>
      <line x1="${x(sel)}" x2="${x(sel)}" y1="2" y2="${H - bottom}" stroke="var(--ink)" stroke-opacity=".3"/>
      ${logged.map(([d, t]) => html`<circle cx="${x(d)}" cy="${y(t)}" r="4.5" fill="var(--red)" stroke="var(--surface)" stroke-width="2"><title>Day ${d}: ${t}°F</title></circle>`)}
    </svg>
    <div class="key"><span style="--c:var(--amber)"><i></i>Expected</span><span style="--c:var(--red)"><i></i>Logged</span></div>`;
}

function detail(p) {
  const day = shownDay(p);
  const info = dayInfo(p, day);
  const copy = T.phaseCopy(info.phase, info.variant);
  const care = copy.care;
  const partnerHeading = p.relation === 'Self' ? 'Share with a partner' : `Supporting ${p.name}`;
  return html`
    <div>
      <h2 class="lede">${copy.headline}</h2>
      <p>${copy.summary}</p>
    </div>
    <div class="group">
      ${row('mood', copy.mood.t, copy.mood.b)}
      ${row('focus', copy.focus.t, copy.focus.b)}
      ${row('body', copy.body.t, copy.body.b)}
    </div>
    <div>
      <div class="section-title">Care</div>
      <div class="group">
        ${row('eat', 'Nourishment', care.eat)}
        ${row('move', 'Movement', care.move)}
        ${row('evening', 'Evening', care.evening)}
      </div>
    </div>
    <div>
      <div class="section-title">${partnerHeading}</div>
      <div class="group">${row('people', copy.partner.t, copy.partner.b, html`<button class="btn quiet" data-action="copy-partner">Copy</button>`)}</div>
    </div>
    <div class="group">
      <div class="chart-head">
        <div class="seg" role="radiogroup" aria-label="Chart">
          <button type="button" role="radio" aria-checked="${ui.chart === 'hormones' ? 'true' : 'false'}" data-action="chart" data-value="hormones">Hormones</button>
          <button type="button" role="radio" aria-checked="${ui.chart === 'bbt' ? 'true' : 'false'}" data-action="chart" data-value="bbt">Temperature</button>
        </div>
      </div>
      <div class="chart-wrap">${ui.chart === 'bbt' ? bbtChart(p, day) : hormoneChart(p, day)}</div>
    </div>`;
}

function todayTitle(p) {
  if (ui.day === null) return 'Today';
  const st = status(p, TODAY, TODAY);
  return fmtDay(addDays(TODAY, ui.day - st.cycleDay));
}

function today(p) {
  const st = status(p, TODAY, TODAY);
  const L = st.bounds.cycle;
  const day = shownDay(p);
  return html`
    <div class="split">
      <div class="sticky hero">
        <div class="today-title"><h1 id="today-title">${todayTitle(p)}</h1><button class="btn quiet" id="reset-day" data-action="reset-day" ${ui.day === null ? 'hidden' : ''}>Today</button></div>
        <div class="ring p-${dayInfo(p, day).phase}" id="ring" role="slider" tabindex="0" aria-label="Cycle day" aria-valuemin="1" aria-valuemax="${L}" aria-valuenow="${day}">
          ${new Raw(ringSvg(p))}
          <div class="ring-center" id="ring-center">${ringCenter(p)}</div>
        </div>
        ${upcoming(p)}
      </div>
      <div id="detail" style="display:grid;gap:24px">${detail(p)}</div>
    </div>`;
}

function paintToday(p) {
  paintRing(p);
  $('#today-title').textContent = todayTitle(p);
  $('#reset-day').hidden = ui.day === null;
  $('#detail').innerHTML = detail(p).s;
}

function setDay(p, day) {
  const st = status(p, TODAY, TODAY);
  const L = st.bounds.cycle;
  const next = clamp(day, 1, L);
  const value = next === st.cycleDay ? null : next;
  if (value === ui.day) return;
  ui.day = value;
  paintToday(p);
}

// ---------- Calendar ----------

function monthCells(p) {
  const first = parseISO(ui.cursor);
  const lead = first.getDay();
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(html`<span class="day out" aria-hidden="true"></span>`);
  for (let n = 1; n <= count; n++) {
    const iso = ui.cursor.slice(0, 8) + String(n).padStart(2, '0');
    const c = calendarDay(p, iso, TODAY);
    const log = p.logs[iso];
    const cls = [c.logged && 'is-period', c.predicted && 'is-predicted', c.fertile && !c.logged && 'is-fertile', iso === TODAY && 'is-today', iso === ui.date && 'is-sel'].filter(Boolean).join(' ');
    const flags = [c.logged && 'period', c.predicted && 'predicted period', c.fertile && 'fertile window', c.ovulation && 'ovulation', log && 'entry logged'].filter(Boolean).join(', ');
    cells.push(html`<button type="button" class="day ${cls}" data-action="pick-date" data-date="${iso}" aria-pressed="${iso === ui.date ? 'true' : 'false'}" aria-label="${fmtLong(iso)}${flags ? ', ' + flags : ''}">
      <span class="n">${n}</span>
      <span class="marks">${c.ovulation ? html`<i class="m-ov"></i>` : ''}${log?.sexActivities?.length ? html`<i class="m-sex"></i>` : ''}${log && !log.sexActivities?.length ? html`<i></i>` : ''}</span>
    </button>`);
  }
  return cells;
}

function inspector(p) {
  const iso = ui.date;
  const st = status(p, iso, TODAY);
  const log = p.logs[iso];
  const isStart = p.periods.some((x) => x.start === iso);
  const tags = log ? summarize(log) : [];
  return html`
    <div>
      <h2>${fmtLong(iso)}</h2>
      <p class="muted">${phaseLine(st)}${st.fertility !== 'Low' ? ` · ${st.fertility} fertility` : ''}</p>
      ${tags.length ? html`<div class="chips-inline">${tags.map((t) => html`<span class="chip static">${t}</span>`)}</div>` : ''}
      ${log?.notes ? html`<p class="muted" style="margin-top:12px">${log.notes}</p>` : ''}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn primary" data-action="open-log">${log ? 'Edit entry' : 'Log this day'}</button>
      <button class="btn" data-action="toggle-period" data-date="${iso}">${isStart ? 'Remove period start' : 'Period starts here'}</button>
    </div>`;
}

function calendar(p) {
  const cycles = upcomingCycles(p, TODAY);
  return html`
    <div class="cal-head">
      <h1>${monthLabel(ui.cursor)}</h1>
      <div class="cal-nav">
        <button class="icon-btn" data-action="month" data-d="-1" aria-label="Previous month">${icon('chevron-left')}</button>
        <button class="btn quiet" data-action="month-today">Today</button>
        <button class="icon-btn" data-action="month" data-d="1" aria-label="Next month">${icon('chevron-right')}</button>
      </div>
    </div>
    <div class="cal-layout">
      <div>
        <div class="cal" role="group" aria-label="${monthLabel(ui.cursor)}">
          ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => html`<span class="wd" aria-hidden="true">${d}</span>`)}
          ${monthCells(p)}
        </div>
      </div>
      <div class="cal-side">
        <div id="inspector" style="display:grid;gap:16px">${inspector(p)}</div>
        <div>
          <div class="section-title">Next cycles</div>
          <div class="group">${cycles.map((c) => html`
            <div class="row"><div class="row-main"><div class="row-title">${fmtRange(c.periodStart, c.periodEnd)}</div><div class="row-sub">Fertile ${fmtRange(c.fertileStart, c.fertileEnd)}</div></div><span class="row-end">${relative(diffDays(c.periodStart, TODAY))}</span></div>`)}
          </div>
        </div>
      </div>
    </div>`;
}

// ---------- Log ----------

const emptyLog = () => ({ flow: 'none', cervicalFluid: 'none', opk: 'none', bbt: '', notes: '', sexActivities: [], sexQualities: [], moods: [], symptoms: [] });

function log(p) {
  const iso = ui.date;
  const st = status(p, iso, TODAY);
  const d = (ui.draft = { ...emptyLog(), ...structuredClone(p.logs[iso] ?? {}) });
  const isToday = iso === TODAY;
  return html`
    <div class="log-date">
      <button class="icon-btn" data-action="log-date" data-d="-1" aria-label="Previous day">${icon('chevron-left')}</button>
      <button class="mid" data-action="pick-log-date" style="position:relative" aria-label="Choose date">
        <h1>${isToday ? 'Today' : fmtDay(iso)}</h1>
        <p class="muted">${isToday ? fmtShort(iso) + ' · ' : ''}${phaseLine(st)} <span class="saved" id="saved">${icon('check')}</span><span class="sr" id="saved-sr" role="status"></span></p>
        <input type="date" class="sr" id="log-date-input" value="${iso}" max="${TODAY}" tabindex="-1" aria-hidden="true" style="left:50%;top:100%">
      </button>
      <button class="icon-btn" data-action="log-date" data-d="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.3"' : ''}>${icon('chevron-right')}</button>
    </div>

    <div class="field"><div class="field-head">Flow</div>${seg('flow', T.FLOW, d.flow, 'Flow')}</div>

    <div class="field">
      <div class="field-head">Intimacy</div>
      ${chips('sexActivities', T.INTIMACY, d.sexActivities)}
      <div class="field-head" style="margin-top:16px"><span>Desire</span><span class="muted" data-label="libido">${T.DESIRE_LABELS[d.libido - 1] ?? ''}</span></div>
      ${rating('libido', d.libido)}
      ${chips('sexQualities', T.INTIMACY_NOTES, d.sexQualities)}
    </div>

    <div class="field"><div class="field-head">Cervical fluid</div>${seg('cervicalFluid', T.FLUID, d.cervicalFluid, 'Cervical fluid')}</div>

    <div class="field">
      <div class="field-head">Temperature</div>
      <input class="input" type="number" inputmode="decimal" step="0.01" min="90" max="110" placeholder="°F, on waking" data-field="bbt" value="${d.bbt}" aria-label="Basal body temperature in degrees Fahrenheit">
      <div class="field-head" style="margin-top:16px">LH test</div>
      ${seg('opk', T.LH, d.opk, 'LH test')}
    </div>

    <div class="field"><div class="field-head">Mood</div>${chips('moods', T.MOODS, d.moods)}</div>
    <div class="field"><div class="field-head">Body</div>${chips('symptoms', T.SYMPTOMS, d.symptoms)}</div>

    <div class="field">
      <div class="field-head"><span>Vitality</span><span class="muted" data-label="energy">${T.VITALITY_LABELS[d.energy - 1] ?? ''}</span></div>
      ${rating('energy', d.energy)}
    </div>

    <div class="field"><div class="field-head">Notes</div><textarea class="input" rows="3" placeholder="Anything else" data-field="notes" aria-label="Notes">${d.notes}</textarea></div>

    <div><button class="btn quiet danger" id="log-clear" data-action="log-clear" ${p.logs[iso] ? '' : 'hidden'}>Clear entry</button></div>`;
}

let saveTimer;
function saveDraft(p, now = true) {
  clearTimeout(saveTimer);
  const run = () => {
    S.saveLog(p, ui.date, ui.draft);
    const saved = $('#saved');
    if (!saved) return;
    saved.classList.add('on');
    $('#saved-sr').textContent = 'Saved';
    $('#log-clear').hidden = !p.logs[ui.date];
    clearTimeout(saved._t);
    saved._t = setTimeout(() => { saved.classList.remove('on'); $('#saved-sr').textContent = ''; }, 1400);
  };
  now ? run() : (saveTimer = setTimeout(run, 400));
}

// ---------- People ----------

function people() {
  const profiles = S.get().profiles;
  const activeId = S.get().activeProfileId;
  const days = Array.from({ length: 14 }, (_, i) => addDays(TODAY, i));
  return html`
    <div class="page-head"><h1>People</h1><button class="btn" data-action="add-person">${icon('plus')}Add</button></div>
    <div class="group">${profiles.map((p) => {
      const st = status(p, TODAY, TODAY);
      const f = forecast(p, TODAY);
      return html`<div class="row person ${p.id === activeId ? 'active' : ''}" style="padding:8px 8px 8px 16px">
        <button class="open" data-action="open-person" data-id="${p.id}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-align:left;min-height:44px">
          ${avatar(p, 'lg')}
          <span class="row-main"><span class="row-title">${p.name}</span><span class="row-sub">${phaseLine(st)}</span></span>
        </button>
        <span class="row-end ${f.late ? 'warn' : ''}">${f.late ? plural(f.late, 'day') + ' late' : relative(f.daysUntilPeriod)}</span>
        <button class="icon-btn" data-action="edit-person" data-id="${p.id}" aria-label="Edit ${p.name}">${icon('edit')}</button>
      </div>`;
    })}</div>
    ${profiles.length > 1 ? html`
    <div>
      <div class="section-title">Next 14 days</div>
      <div class="group align"><div class="align-grid">
        <span></span>${days.map((iso) => html`<span class="h"><b>${parseISO(iso).toLocaleDateString('en-US', { weekday: 'narrow' })}</b>${parseISO(iso).getDate()}</span>`)}
        ${profiles.map((p) => html`<span class="nm"><span class="dot" style="background:${p.color}"></span>${p.name}</span>${days.map((iso) => {
          const s = status(p, iso, TODAY);
          return html`<span class="c p-${s.phase}" title="${p.name}, ${fmtShort(iso)}: ${phaseLine(s)}"></span>`;
        })}`)}
      </div></div>
    </div>` : ''}`;
}

// ---------- History ----------

function doctorSummary(p) {
  const b = phaseBounds(p);
  return [
    `Cycle summary for ${p.name} (${TODAY})`,
    `Average cycle: ${b.cycle} days`,
    `Average bleeding: ${b.period} days`,
    `Estimated ovulation: day ${b.ovulationDay}`,
    `Luteal phase: ${b.lutealLength} days`,
    `Recent period starts: ${sortedPeriods(p).slice(-6).map((x) => x.start).join(', ')}`,
  ].join('\n');
}

function history(p) {
  const b = phaseBounds(p);
  const periods = sortedPeriods(p).reverse();
  const dates = Object.keys(p.logs).sort().reverse();

  const buckets = Object.fromEntries(PHASE_ORDER.map((k) => [k, new Map()]));
  for (const iso of dates) {
    const l = p.logs[iso];
    const map = buckets[status(p, iso, TODAY).phase];
    [...(l.moods || []), ...(l.symptoms || []), ...(l.libido >= 4 ? ['High desire'] : [])].forEach((t) => map.set(t, (map.get(t) || 0) + 1));
  }

  const kv = (k, v, warn) => html`<div class="row"><span>${k}</span><span class="row-end ${warn ? 'warn' : ''}">${v}</span></div>`;
  return html`
    <h1>History</h1>

    <div class="group">${periods.map((per, i) => {
      const len = i === 0 ? b.cycle : diffDays(periods[i - 1].start, per.start);
      const flow = Math.min(per.length, len);
      const lut = Math.min(b.lutealLength, len - flow);
      return html`<div class="row stack">
        <div class="row-main">
          <div class="row-title">${fmtLong(per.start)}</div>
          <div class="row-sub">${i === 0 ? 'Current cycle · ' : plural(len, 'day') + ' · '}${plural(per.length, 'day')} of flow</div>
          <div class="cycle-bar" aria-hidden="true"><i class="p-menstrual" style="flex:${flow}"></i><i class="p-follicular" style="flex:${len - flow - lut}"></i><i class="p-luteal" style="flex:${lut}"></i></div>
        </div>
        ${periods.length > 1 ? html`<button class="icon-btn" data-action="remove-period" data-date="${per.start}" aria-label="Remove period starting ${fmtShort(per.start)}">${icon('x')}</button>` : ''}
      </div>`;
    })}</div>

    <div>
      <div class="section-title">Summary<button class="btn quiet" data-action="copy-summary">${icon('copy')}Copy for doctor</button></div>
      <div class="group kv">
        ${kv('Cycle length', plural(b.cycle, 'day'), b.cycle < 21 || b.cycle > 35)}
        ${kv('Bleeding', plural(b.period, 'day'))}
        ${kv('Ovulation', 'Day ' + b.ovulationDay)}
        ${kv('Luteal phase', plural(b.lutealLength, 'day'))}
      </div>
    </div>

    <div>
      <div class="section-title">Patterns</div>
      <div class="group patterns">${PHASE_ORDER.map((k) => {
        const top = [...buckets[k].entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map((e) => e[0]);
        return html`<div class="row"><span class="dot p-${k}"></span><div class="row-main"><div class="row-title">${PHASE_NAMES[k]}</div><div class="row-sub ${top.length ? '' : 'faint'}">${top.length ? top.join(' · ') : '–'}</div></div></div>`;
      })}</div>
    </div>

    ${dates.length ? html`
    <div>
      <div class="section-title">Entries</div>
      <div class="group">${dates.map((iso) => {
        const l = p.logs[iso];
        const tags = summarize(l);
        return html`<button class="row stack" data-action="edit-entry" data-date="${iso}"><div class="row-main"><div class="row-title">${fmtDay(iso)}</div>${tags.length ? html`<div class="row-sub">${tags.join(' · ')}</div>` : ''}${l.notes ? html`<div class="row-sub faint">${l.notes}</div>` : ''}</div>${icon('chevron-right')}</button>`;
      })}</div>
    </div>` : ''}`;
}

// ---------- Guide ----------

function guide() {
  return html`
    <h1>Guide</h1>
    <div class="group">${T.GUIDE.map((g) => html`
      <details class="row">
        <summary>${g.title}${icon('chevron-down')}</summary>
        <div class="answer"><p>${g.body}</p><p class="take">${g.takeaway}</p>${g.source ? html`<p class="src">${g.source}</p>` : ''}</div>
      </details>`)}
    </div>`;
}

// ---------- Forms & sheets ----------

const stepper = (label, name, value, min, max) => html`
  <div class="row"><span>${label}</span><div class="stepper">
    <button type="button" data-action="step" data-name="${name}" data-d="-1" aria-label="Decrease ${label.toLowerCase()}">−</button>
    <output data-out="${name}">${plural(value, 'day')}</output>
    <input type="hidden" name="${name}" value="${value}" data-min="${min}" data-max="${max}">
    <button type="button" data-action="step" data-name="${name}" data-d="1" aria-label="Increase ${label.toLowerCase()}">+</button>
  </div></div>`;

function profileForm(v, kind) {
  return html`
    <form data-form="${kind}" autocomplete="off">
      <input type="hidden" name="id" value="${v.id ?? ''}">
      <div class="group">
        <label class="row"><span>Name</span><input class="input" name="name" value="${v.name}" required maxlength="32" placeholder="Required" autocapitalize="words" ${kind === 'profile' && v.id ? '' : 'autofocus'}></label>
        <label class="row"><span>Relationship</span><select class="input" name="relation">${T.RELATIONS.map((r) => html`<option ${r === v.relation ? 'selected' : ''}>${r}</option>`)}</select></label>
        <label class="row"><span>Last period started</span><input class="input" type="date" name="lastPeriod" value="${v.lastPeriod}" max="${TODAY}" required></label>
      </div>
      <div class="group" style="margin-top:20px">
        ${stepper('Cycle length', 'cycleLength', v.cycleLength, 20, 45)}
        ${stepper('Period length', 'periodLength', v.periodLength, 2, 10)}
        ${stepper('Luteal phase', 'lutealLength', v.lutealLength, 10, 17)}
      </div>
      <div class="group" style="margin-top:20px"><div class="row"><span>Color</span><div class="swatches" role="radiogroup" aria-label="Color">
        ${T.COLORS.map((c) => html`<label style="--c:${c.hex}" title="${c.name}"><input type="radio" name="color" value="${c.hex}" aria-label="${c.name}" ${c.hex === v.color ? 'checked' : ''}></label>`)}
      </div></div></div>
      <div style="margin-top:24px;display:grid;gap:8px">
        <button class="btn primary block" type="submit">${kind === 'onboard' ? 'Create profile' : 'Save'}</button>
        ${kind === 'profile' && v.id ? html`<button type="button" class="btn quiet danger block" data-action="delete-person" data-id="${v.id}">Delete ${v.name}</button>` : ''}
      </div>
    </form>`;
}

function profileDefaults(p) {
  const used = S.get().profiles.map((x) => x.color);
  return p ? {
    id: p.id, name: p.name, relation: p.relation, color: p.color, cycleLength: p.cycleLength, periodLength: p.periodLength,
    lutealLength: p.lutealLength, lastPeriod: latestStart(p, TODAY),
  } : {
    id: '', name: '', relation: S.get().profiles.length ? 'Partner' : 'Self', cycleLength: 28, periodLength: 5, lutealLength: 14,
    lastPeriod: addDays(TODAY, -7), color: (T.COLORS.find((c) => !used.includes(c.hex)) ?? T.COLORS[0]).hex,
  };
}

function onboarding() {
  return html`
    <div class="welcome fade-in">
      <h1>Cadence</h1>
      ${profileForm(profileDefaults(null), 'onboard')}
      <div class="alt">
        <label class="btn quiet">Import backup<input type="file" accept=".json,application/json" data-import hidden></label>
        <button class="btn quiet" data-action="sample">Try sample data</button>
      </div>
    </div>`;
}

const dlg = $('#sheet');
function openSheet(title, body) {
  dlg.innerHTML = html`<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${icon('x')}</button></div><div class="sheet-body">${body}</div>`.s;
  if (!dlg.open) dlg.showModal();
}
const closeSheet = () => dlg.open && dlg.close();
dlg.addEventListener('click', (e) => { if (e.target === dlg) closeSheet(); });

function switcherSheet() {
  const s = S.get();
  openSheet('People', html`
    <div class="group">${s.profiles.map((p) => {
      const st = status(p, TODAY, TODAY);
      return html`<button class="row" data-action="switch" data-id="${p.id}">${avatar(p)}<span class="row-main"><span class="row-title">${p.name}</span><span class="row-sub" style="display:block">${phaseLine(st)}</span></span>${p.id === s.activeProfileId ? icon('check') : ''}</button>`;
    })}</div>
    <div class="group"><button class="row" data-action="add-person">${icon('plus')}<span>Add person</span></button></div>`);
}

function moreSheet() {
  const p = S.active();
  openSheet('More', html`
    <div class="group">
      <button class="row narrow-only" data-action="go" data-view="guide">${icon('guide')}<span>Guide</span></button>
      <button class="row" data-action="export-all">${icon('download')}<span>Export backup</span></button>
      <button class="row" data-action="export-one">${icon('download')}<span>Export ${p.name}</span></button>
      <label class="row">${icon('upload')}<span>Import from file</span><input type="file" accept=".json,application/json" data-import hidden></label>
    </div>
    <div class="group">
      <button class="row" data-action="sample" data-confirm="Replace everything? Tap again">${icon('people')}<span>Load sample data</span></button>
      <button class="row" data-action="wipe" data-confirm="Erase everything? Tap again" style="color:var(--red)">${icon('trash')}<span>Erase all data</span></button>
    </div>`);
}

function periodSheet(p) {
  openSheet('Log period', html`
    <form data-form="period" autocomplete="off">
      <div class="group">
        <label class="row"><span>Started</span><input class="input" type="date" name="start" value="${TODAY}" max="${TODAY}" required></label>
        ${stepper('Length', 'length', p.periodLength, 2, 10)}
      </div>
      <div style="margin-top:24px"><button class="btn primary block" type="submit">Save</button></div>
    </form>`);
}

// ---------- Toast ----------

const toastEl = $('#toast');
let toastTimer;
let toastUndo;
function toast(message, undo) {
  clearTimeout(toastTimer);
  toastUndo = undo;
  toastEl.innerHTML = html`<span>${message}</span>${undo ? html`<button data-action="undo">Undo</button>` : ''}`.s;
  toastEl.hidden = false;
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  toastTimer = setTimeout(() => { toastEl.hidden = true; toastUndo = null; }, undo ? 6500 : 2200);
}

// ---------- Utilities ----------

function download(obj, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function copy(text, message = 'Copied') {
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast(message);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');

// ---------- Render ----------

const main = $('#view');
const views = { today, calendar, log, people, history, guide };
let lastView;

function render() {
  const p = S.active();
  const view = p ? (VIEWS.includes(S.get().view) ? S.get().view : 'today') : 'onboarding';
  document.body.dataset.phase = p ? status(p, TODAY, TODAY).phase : 'luteal';

  const paint = () => {
    $('#bar').hidden = !p;
    $('.nav').hidden = !p;
    if (p) {
      $('#bar').innerHTML = html`
        <button class="who" data-action="switcher" aria-label="Switch person">${avatar(p)}<span>${p.name}</span>${icon('chevron-down')}</button>
        <div class="bar-actions"><button class="btn" data-action="period"><span class="dot-red"></span>Log period</button><button class="icon-btn" data-action="more" aria-label="More">${icon('more')}</button></div>`.s;
    }
    document.querySelectorAll('.nav button').forEach((b) => {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    main.innerHTML = (p ? views[view](p) : onboarding()).s;
    if (view === 'today' && p) paintRing(p);
  };

  const changed = lastView !== undefined && lastView !== view;
  lastView = view;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (changed && document.startViewTransition && !reduce) document.startViewTransition(paint); else paint();
}

// ---------- Actions ----------

function go(view) {
  if (location.hash === '#' + view) return window.scrollTo({ top: 0, behavior: 'smooth' });
  location.hash = view;
}

function readForm(form) {
  const f = Object.fromEntries(new FormData(form));
  return { ...f, cycleLength: +f.cycleLength, periodLength: +f.periodLength, lutealLength: +f.lutealLength };
}

const actions = {
  go: (el) => { closeSheet(); go(el.dataset.view); },
  'close-sheet': closeSheet,
  switcher: switcherSheet,
  more: moreSheet,
  period: () => periodSheet(S.active()),
  undo: () => { const u = toastUndo; toastEl.hidden = true; toastUndo = null; if (u) { u(); ui.day = null; toast('Restored'); } },

  switch: (el) => { closeSheet(); ui.day = null; S.setActive(el.dataset.id); },
  'add-person': () => openSheet('New person', profileForm(profileDefaults(null), 'profile')),
  'edit-person': (el) => openSheet('Edit person', profileForm(profileDefaults(S.get().profiles.find((x) => x.id === el.dataset.id)), 'profile')),
  'open-person': (el) => { ui.day = null; S.commit((s) => { s.activeProfileId = el.dataset.id; s.view = 'today'; }, { silent: true }); location.hash = 'today'; render(); },
  'delete-person': (el) => {
    const name = S.get().profiles.find((x) => x.id === el.dataset.id)?.name;
    closeSheet();
    ui.day = null;
    toast(`Deleted ${name}`, S.deleteProfile(el.dataset.id));
  },
  step: (el) => {
    const input = el.closest('form').elements[el.dataset.name];
    const v = clamp(Number(input.value) + Number(el.dataset.d), Number(input.dataset.min), Number(input.dataset.max));
    input.value = v;
    el.closest('form').querySelector(`[data-out="${el.dataset.name}"]`).textContent = plural(v, 'day');
  },

  // Today
  'reset-day': () => { ui.day = null; paintToday(S.active()); },
  chart: (el) => { ui.chart = el.dataset.value; paintToday(S.active()); },
  'copy-partner': () => {
    const p = S.active();
    const info = dayInfo(p, shownDay(p));
    const c = T.phaseCopy(info.phase, info.variant).partner;
    copy(`${p.name} is on day ${info.day} (${PHASE_NAMES[info.phase].toLowerCase()} phase). ${c.t}: ${c.b}`);
  },

  // Calendar
  'pick-date': (el) => { ui.date = el.dataset.date; render(); },
  month: (el) => { const d = parseISO(ui.cursor); d.setMonth(d.getMonth() + Number(el.dataset.d)); ui.cursor = d.toISOString ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` : ui.cursor; render(); },
  'month-today': () => { ui.date = TODAY; ui.cursor = TODAY.slice(0, 8) + '01'; render(); },
  'open-log': () => go('log'),
  'toggle-period': (el) => {
    const p = S.active();
    const iso = el.dataset.date;
    const isStart = p.periods.some((x) => x.start === iso);
    if (isStart && p.periods.length < 2) return toast('Keep at least one period');
    const undo = isStart ? S.removePeriod(p, iso) : S.setPeriod(p, iso, p.periodLength);
    toast(isStart ? 'Period start removed' : 'Period start added', undo);
  },

  // Log
  'log-date': (el) => { ui.date = addDays(ui.date, Number(el.dataset.d)); if (diffDays(ui.date, TODAY) > 0) ui.date = TODAY; render(); },
  'pick-log-date': () => $('#log-date-input')?.showPicker?.(),
  'log-set': (el) => {
    ui.draft[el.dataset.key] = el.dataset.value;
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b === el ? 'true' : 'false'));
    saveDraft(S.active());
  },
  'log-toggle': (el) => {
    const list = ui.draft[el.dataset.key];
    const i = list.indexOf(el.dataset.value);
    if (i < 0) list.push(el.dataset.value); else list.splice(i, 1);
    el.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
    saveDraft(S.active());
  },
  'log-rate': (el) => {
    const key = el.dataset.key;
    const n = Number(el.dataset.value);
    if (ui.draft[key] === n) delete ui.draft[key]; else ui.draft[key] = n;
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.value) === ui.draft[key] ? 'true' : 'false'));
    const labels = key === 'libido' ? T.DESIRE_LABELS : T.VITALITY_LABELS;
    $(`[data-label="${key}"]`).textContent = labels[ui.draft[key] - 1] ?? '';
    saveDraft(S.active());
  },
  'log-clear': () => { toast('Entry cleared', S.clearLog(S.active(), ui.date)); },

  // History
  'remove-period': (el) => toast('Period removed', S.removePeriod(S.active(), el.dataset.date)),
  'copy-summary': () => copy(doctorSummary(S.active()), 'Summary copied'),
  'edit-entry': (el) => { ui.date = el.dataset.date; go('log'); },

  // Data
  'export-all': () => { download(S.exportVault(), `cadence_backup_${TODAY}.json`); closeSheet(); toast('Backup downloaded'); },
  'export-one': () => { const p = S.active(); download(S.exportProfile(p), `cadence_${slug(p.name)}.json`); closeSheet(); toast(`Exported ${p.name}`); },
  sample: () => { closeSheet(); ui.day = null; toast('Sample data loaded', S.loadSample()); },
  wipe: () => { closeSheet(); ui.day = null; toast('All data erased', S.wipe()); },
};

// Two-tap confirmation for destructive rows.
function confirmed(el) {
  if (!el.dataset.confirm || !S.get().profiles.length) return true;
  if (el.dataset.armed) return true;
  const label = el.querySelector('span');
  const original = label.textContent;
  label.textContent = el.dataset.confirm;
  el.dataset.armed = '1';
  setTimeout(() => { label.textContent = original; delete el.dataset.armed; }, 3500);
  return false;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (!fn || !confirmed(el)) return;
  fn(el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  const v = readForm(form);
  if (kind === 'onboard') S.createFirstProfile(v);
  else if (kind === 'profile') { closeSheet(); ui.day = null; S.saveProfile(v); }
  else if (kind === 'period') {
    closeSheet();
    ui.day = null;
    toast('Period logged', S.setPeriod(S.active(), v.start, Number(v.length)));
  }
});

document.addEventListener('input', (e) => {
  const field = e.target.dataset?.field;
  if (!field || !ui.draft) return;
  ui.draft[field] = e.target.value;
  saveDraft(S.active(), false);
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'log-date-input') {
    ui.date = e.target.value && diffDays(e.target.value, TODAY) <= 0 ? e.target.value : TODAY;
    return render();
  }
  if (!e.target.matches('[data-import]')) return;
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const { message, undo } = S.importData(JSON.parse(await file.text()));
    closeSheet();
    ui.day = null;
    toast(message, undo);
  } catch {
    toast('Could not read that file');
  }
});

// Ring: drag, tap or use arrow keys to inspect any day.
let dragging = false;
function dayFromPointer(e) {
  const r = $('#ring').getBoundingClientRect();
  const L = phaseBounds(S.active()).cycle;
  const angle = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90;
  return Math.floor(((angle + 360) % 360) / (360 / L)) + 1;
}
document.addEventListener('pointerdown', (e) => {
  const ring = e.target.closest('#ring');
  if (!ring) return;
  dragging = true;
  ring.setPointerCapture(e.pointerId);
  setDay(S.active(), dayFromPointer(e));
});
document.addEventListener('pointermove', (e) => { if (dragging) setDay(S.active(), dayFromPointer(e)); });
['pointerup', 'pointercancel'].forEach((t) => document.addEventListener(t, () => { dragging = false; }));

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || dlg.open) return;
  const typing = e.target.matches?.('input, textarea, select');
  const p = S.active();
  if (!p || typing) return;
  const view = S.get().view;
  const n = Number(e.key);
  if (n >= 1 && n <= TABS.length) return go(TABS[n - 1]);
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  if (view === 'today' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.matches('button')) {
    e.preventDefault();
    setDay(p, shownDay(p) + step);
  } else if (view === 'calendar' && step && !e.target.matches('button:not(.day)')) {
    e.preventDefault();
    ui.date = addDays(ui.date, step);
    ui.cursor = ui.date.slice(0, 8) + '01';
    render();
    $('.day.is-sel')?.focus();
  }
});

window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (!VIEWS.includes(v)) return;
  S.commit((s) => { s.view = v; }, { silent: true });
  if (v === 'log' || v === 'calendar') { /* keep selected date */ } else if (v === 'today') ui.day = null;
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const t = todayISO();
  if (t === TODAY) return;
  if (ui.date === TODAY) ui.date = t;
  TODAY = t;
  render();
});

// ---------- Boot ----------

S.subscribe(render);
const initial = location.hash.slice(1);
if (VIEWS.includes(initial)) S.commit((s) => { s.view = initial; }, { silent: true });
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
