// Tide UI. Views are template functions: (profile) => html. Events are delegated via data-action.
// Model lives in cycle.js, copy in content.js, state in store.js.

import { pastYear, addDays, diffDays, todayISO, parseISO, fmtShort, fmtLong, fmtRange, relative, status, forecast, dayInfo, upcomingCycles, calendarDay, phaseBounds, sortedPeriods, latestStart, averageCycleLength, cycleStats, regularity, observedOvulation, clamp, PHASE_NAMES, PHASE_ORDER } from './cycle.js';
import * as S from './store.js';
import * as T from './content.js';
import { figure, rose } from './figures.js';

// ---------- Templating ----------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
class Raw { constructor(s) { this.s = s; } }
const out = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(out).join('') : v == null || v === false ? '' : esc(v));
const html = (strings, ...vals) => new Raw(strings.reduce((acc, s, i) => acc + s + (i < vals.length ? out(vals[i]) : ''), ''));
const icon = (name, cls = '') => html`<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const $ = (sel, root = document) => root.querySelector(sel);

const fmtDay = (iso) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(pastYear(parseISO(iso)) && { year: 'numeric' }) });
const monthLabel = (iso) => parseISO(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const byId = (list, id) => list.find((x) => x.id === id);

// ---------- UI state (not persisted) ----------

let TODAY = todayISO();
const ui = {
  tab: 'feel',          // Today detail: feel | care | partner
  day: null,            // scrubbed cycle day on Today, null = actual today
  date: TODAY,          // selected date for Calendar / Log
  cursor: TODAY.slice(0, 8) + '01', // first day of the month shown in Calendar
  chart: 'hormones',
  cat: 'all',           // Guide filter
  draft: null,          // Log entry being edited
  slide: 0,             // direction of the last month change, for the calendar animation
};

const VIEWS = ['today', 'calendar', 'log', 'people', 'history', 'guide'];
const TABS = ['today', 'calendar', 'log', 'people', 'history'];

// ---------- Motion helpers ----------

// Restart a CSS animation by toggling a class.
function play(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Slide each segmented control's thumb under its selected option.
function placeSeg(seg) {
  const on = seg.querySelector('[aria-checked="true"]');
  if (!on || !on.offsetWidth) return;
  seg.style.setProperty('--x', `${on.offsetLeft}px`);
  seg.style.setProperty('--w', `${on.offsetWidth}px`);
  if (!seg.classList.contains('ready')) requestAnimationFrame(() => seg.classList.add('ready'));
}
const placeSegs = (root = document) => root.querySelectorAll('.seg').forEach(placeSeg);
window.addEventListener('resize', () => placeSegs());

function pickSeg(el) {
  el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b === el ? 'true' : 'false'));
  placeSeg(el.parentElement);
}

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
  if (log.energy) tags.push(`Energy ${log.energy}/5`);
  if (log.pain && log.pain !== 'none') tags.push(`${label(T.PAIN, log.pain)} pain`);
  (log.sexActivities || []).forEach((id) => tags.push(label(T.INTIMACY, id)));
  const names = (list) => (list || []).map(T.tagLabel);
  return [...tags, ...names(log.sexQualities), ...names(log.moods), ...names(log.symptoms), ...names(log.events)];
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
  const obs = observedOvulation(p, TODAY);
  const ovDay = Math.min(L, obs?.day ?? b.ovulationDay);
  const fertile = obs ? [Math.max(1, ovDay - 5), ovDay] : b.fertile;
  let svg = '';
  for (let d = 1; d <= L; d++) {
    svg += `<path class="seg-path p-${dayInfo(p, d).phase}" data-day="${d}" style="--i:${d}" d="${arc(d, L)}"/>`;
  }
  // Inside the ring: the fertile window as a thin track, ovulation as a ring (filled once confirmed), logged intimacy as dots.
  // Outside: today.
  const mid = (d) => (d - 0.5) * (360 / L);
  if (!p.hormonal) {
    const [ax, ay] = polar(RING.r - 19, fertile[0] * (360 / L) - 360 / L + 1);
    const [bx, by] = polar(RING.r - 19, fertile[1] * (360 / L) - 1);
    svg += `<path class="mark" d="M${ax.toFixed(1)},${ay.toFixed(1)}A${RING.r - 19},${RING.r - 19} 0 0 1 ${bx.toFixed(1)},${by.toFixed(1)}" fill="none" stroke="var(--amber)" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>`;
    const [ox, oy] = polar(RING.r - 19, mid(ovDay));
    svg += `<circle class="mark" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="4" fill="${obs?.confirmed ? 'var(--amber)' : 'var(--bg)'}" stroke="var(--amber)" stroke-width="1.75"/>`;
  }
  for (let d = 1; d <= L; d++) {
    const log = p.logs[addDays(start, d - 1)];
    if (log && (log.sexActivities?.length || log.libido >= 4)) {
      const [x, y] = polar(RING.r - 19, mid(d));
      if (d !== ovDay || p.hormonal) svg += `<circle class="mark" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="var(--rose)"/>`;
    }
  }
  const [tx, ty] = polar(RING.r + 19, mid(todayDay));
  svg += `<circle class="mark now" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3.5" fill="var(--ink)"/>`;
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
  const scrub = $('#scrub');
  if (scrub) { scrub.value = sel; scrub.style.setProperty('--p', `${((sel - 1) / Math.max(1, L - 1)) * 100}%`); }
}

function upcoming(p) {
  const f = forecast(p, TODAY);
  const fertileNow = diffDays(f.fertileStart, TODAY) <= 0 && diffDays(f.fertileEnd, TODAY) >= 0;
  const passed = f.observed && diffDays(f.fertileEnd, TODAY) < 0;
  const ovNote = f.observed?.confirmed ? ' · confirmed' : '';
  const range = f.spread ? ` · ±${f.spread}d` : '';
  const periodSub = f.late ? `Expected ${fmtShort(f.nextPeriod)} · cycles shift with stress, travel and illness` : fmtRange(f.nextPeriod, f.nextPeriodEnd) + range;
  return html`
    <div>
      <div class="section-title">Coming up</div>
      <div class="group">
        <div class="row"><span class="dot p-menstrual"></span><div class="row-main"><div class="row-title">Period</div><div class="row-sub">${periodSub}</div></div><span class="row-end ${f.late ? 'warn' : ''}">${f.late ? plural(f.late, 'day') + ' late' : relative(f.daysUntilPeriod)}</span></div>
        ${p.hormonal ? '' : html`<div class="row"><span class="dot p-ovulatory"></span><div class="row-main"><div class="row-title">Fertile window</div><div class="row-sub">${fmtRange(f.fertileStart, f.fertileEnd)} · ovulation ${fmtShort(f.ovulation)}${ovNote}</div></div><span class="row-end">${fertileNow ? 'Now' : passed ? 'Passed' : relative(diffDays(f.fertileStart, TODAY))}</span></div>`}
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

const PHASE_VAR = { menstrual: 'var(--red)', follicular: 'var(--green)', ovulatory: 'var(--amber)', luteal: 'var(--plum)' };

function tabRows(p) {
  const info = dayInfo(p, shownDay(p));
  const c = T.phaseCopy(info.phase, info.variant);
  return ui.tab === 'care'
    ? html`${row('eat', 'Nourishment', c.care.eat)}${row('move', 'Movement', c.care.move)}${row('evening', 'Evening', c.care.evening)}`
    : ui.tab === 'partner'
      ? row('people', c.partner.t, c.partner.b, html`<button class="btn quiet" data-action="copy-partner">Copy</button>`)
      : html`${row('mood', c.mood.t, c.mood.b)}${row('focus', c.focus.t, c.focus.b)}${row('body', c.body.t, c.body.b)}`;
}

function chartBody(p) {
  const day = shownDay(p);
  const info = dayInfo(p, day);
  const c = T.phaseCopy(info.phase, info.variant);
  return ui.chart === 'bbt' ? bbtChart(p, day)
    : ui.chart === 'rose' ? html`<div class="rose-wrap">${new Raw(rose(c.tendencies, PHASE_VAR[info.phase]))}</div><p class="muted cap">A general pattern, not your data.</p>`
    : hormoneChart(p, day);
}

function detail(p) {
  const day = shownDay(p);
  const info = dayInfo(p, day);
  const c = T.phaseCopy(info.phase, info.variant);
  const tabs = [['feel', 'Feel'], ['care', 'Care'], ['partner', p.relation === 'Self' ? 'Partner' : 'Support']];
  const tabBtn = ([id, label]) => html`<button type="button" role="radio" aria-checked="${ui.tab === id ? 'true' : 'false'}" data-action="tab" data-value="${id}">${label}</button>`;
  const chartTab = (id, label) => html`<button type="button" role="radio" aria-checked="${ui.chart === id ? 'true' : 'false'}" data-action="chart" data-value="${id}">${label}</button>`;
  return html`
    <div>
      <div class="eyebrow p-${info.phase}"><i></i>${c.label}</div>
      <h2 class="lede">${c.headline}</h2>
      <p>${c.physiology}</p>
      ${p.hormonal ? '' : html`<div class="chips-inline">${c.cues.map((x) => html`<span class="chip static">${x}</span>`)}</div>`}
    </div>
    <div class="stack-tight">
      <div class="seg" role="radiogroup" aria-label="Guidance">${tabs.map(tabBtn)}</div>
      <div class="group" id="tab-rows">${tabRows(p)}</div>
    </div>
    ${p.hormonal ? '' : html`<div>
      <div class="section-title">Expected</div>
      <div class="group">
        <div class="row"><span>Cervical fluid</span><span class="row-end">${c.fluid}</span></div>
        <div class="row"><span>Waking temperature</span><span class="row-end num">about ${info.expectedBbt.toFixed(1)}°F</span></div>
        <div class="row"><span>Appetite</span><span class="row-end wrap-end">${c.metabolic}</span></div>
      </div>
    </div>`}
    ${p.hormonal ? '' : html`<div class="group">
      <div class="chart-head">
        <div class="seg" role="radiogroup" aria-label="Chart">${chartTab('hormones', 'Hormones')}${chartTab('bbt', 'Temperature')}${chartTab('rose', 'Tendencies')}</div>
      </div>
      <div class="chart-wrap" id="chart-body">${chartBody(p)}</div>
    </div>`}`;
}

function todayTitle(p) {
  if (ui.day === null) return 'Today';
  const st = status(p, TODAY, TODAY);
  return fmtDay(addDays(TODAY, ui.day - st.cycleDay));
}

let introPlayed = false;
function today(p) {
  const intro = !introPlayed;
  introPlayed = true;
  const st = status(p, TODAY, TODAY);
  const L = st.bounds.cycle;
  const day = shownDay(p);
  return html`
    <div class="split">
      <div class="sticky hero">
        <div class="today-title"><div><h1 id="today-title">${todayTitle(p)}</h1><p class="muted" id="today-date" ${ui.day === null ? '' : 'hidden'}>${fmtLong(TODAY)}</p></div><button class="btn quiet" id="reset-day" data-action="reset-day" ${ui.day === null ? 'hidden' : ''}>Today</button></div>
        <div class="ring p-${dayInfo(p, day).phase} ${intro ? 'intro' : ''}" id="ring" role="slider" tabindex="0" aria-label="Cycle day" aria-valuemin="1" aria-valuemax="${L}" aria-valuenow="${day}">
          ${new Raw(ringSvg(p))}
          <div class="ring-center" id="ring-center">${ringCenter(p)}</div>
        </div>
        <input class="scrub" id="scrub" type="range" min="1" max="${L}" value="${Math.min(day, L)}" style="--p:${((Math.min(day, L) - 1) / Math.max(1, L - 1)) * 100}%" aria-label="Explore any day of the cycle">
        <ul class="legend">${PHASE_ORDER.map((k) => html`<li class="p-${k}"><i></i>${PHASE_NAMES[k]} <span class="num">${st.bounds[k][0]}–${st.bounds[k][1]}</span></li>`)}</ul>
        ${upcoming(p)}
      </div>
      <div id="detail" data-phase="${dayInfo(p, day).phase}" style="display:grid;gap:24px">${detail(p)}</div>
    </div>`;
}

function paintToday(p) {
  paintRing(p);
  $('#today-title').textContent = todayTitle(p);
  $('#reset-day').hidden = ui.day === null;
  $('#today-date').hidden = ui.day !== null;
  const box = $('#detail');
  const phase = dayInfo(p, shownDay(p)).phase;
  box.innerHTML = detail(p).s;
  placeSegs(box);
  if (box.dataset.phase !== phase) { box.dataset.phase = phase; play(box, 'swap'); }
}

function setDay(p, day) {
  const st = status(p, TODAY, TODAY);
  const L = st.bounds.cycle;
  const next = clamp(day, 1, L);
  const value = next === st.cycleDay ? null : next;
  if (value === ui.day) return;
  ui.day = value;
  tick();
  paintToday(p);
}

// ---------- Calendar ----------

function monthCells(p) {
  const first = parseISO(ui.cursor);
  const lead = first.getDay();
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const obs = observedOvulation(p, TODAY);
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(html`<span class="day out" aria-hidden="true"></span>`);
  for (let n = 1; n <= count; n++) {
    const iso = ui.cursor.slice(0, 8) + String(n).padStart(2, '0');
    const c = calendarDay(p, iso, TODAY, obs);
    const log = p.logs[iso];
    const edge = (off) => calendarDay(p, addDays(iso, off), TODAY, obs).fertile && !calendarDay(p, addDays(iso, off), TODAY, obs).logged;
    const band = c.fertile && !c.logged;
    const cls = [c.logged && 'is-period', c.predicted && 'is-predicted', band && 'is-fertile', band && !edge(-1) && 'f-start', band && !edge(1) && 'f-end', iso === TODAY && 'is-today', iso === ui.date && 'is-sel'].filter(Boolean).join(' ');
    const flags = [`cycle day ${c.cycleDay}`, c.logged && 'period', c.predicted && 'predicted period', band && 'fertile window', c.ovulation && (c.confirmed ? 'ovulation confirmed' : 'estimated ovulation'), log && 'entry logged'].filter(Boolean).join(', ');
    cells.push(html`<button type="button" class="day ${cls}" data-action="pick-date" data-date="${iso}" aria-pressed="${iso === ui.date ? 'true' : 'false'}" aria-label="${fmtLong(iso)}, ${flags}">
      <span class="n">${n}</span>
      <span class="marks" aria-hidden="true">${c.ovulation ? html`<i class="m-ov ${c.confirmed ? 'on' : ''}"></i>` : ''}${log?.sexActivities?.length ? html`<i class="m-sex"></i>` : ''}${log && !log.sexActivities?.length ? html`<i></i>` : ''}</span>
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
      <p class="inspector-note">${T.phaseCopy(st.phase, st.variant).headline}</p>
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
        <ul class="legend key-row" aria-label="Key"><li class="k-period"><i></i>Period</li><li class="k-pred"><i></i>Predicted</li>${p.hormonal ? '' : html`<li class="k-fert"><i></i>Fertile</li><li class="k-ov"><i></i>Ovulation</li>`}<li class="k-sex"><i></i>Intimacy</li></ul>
      </div>
      <div class="cal-side">
        <div id="inspector" style="display:grid;gap:16px">${inspector(p)}</div>
        <div>
          <div class="section-title">Next cycles</div>
          <div class="group">${cycles.map((c) => html`
            <div class="row"><div class="row-main"><div class="row-title">${fmtRange(c.periodStart, c.periodEnd)}</div>${p.hormonal ? '' : html`<div class="row-sub">Fertile ${fmtRange(c.fertileStart, c.fertileEnd)}</div>`}</div><span class="row-end">${relative(diffDays(c.periodStart, TODAY))}</span></div>`)}
          </div>
        </div>
      </div>
    </div>`;
}

// ---------- Log ----------

const emptyLog = () => ({ flow: 'none', cervicalFluid: 'none', opk: 'none', bbt: '', notes: '', pain: 'none', events: [], sexActivities: [], sexQualities: [], moods: [], symptoms: [] });

function log(p) {
  const iso = ui.date;
  const st = status(p, iso, TODAY);
  const d = (ui.draft = { ...emptyLog(), ...structuredClone(p.logs[iso] ?? {}) });
  const isToday = iso === TODAY;
  return html`
    <div class="log-date">
      <button class="icon-btn" data-action="log-date" data-d="-1" aria-label="Previous day">${icon('chevron-left')}</button>
      <div class="mid">
        <h1>${isToday ? 'Today' : fmtDay(iso)}</h1>
        <p class="muted"><span class="nw">${isToday ? fmtShort(iso) + ' · ' : ''}Day ${st.cycleDay}</span> <span class="nw">${PHASE_NAMES[st.phase]}${st.fertility !== 'Low' ? ` · ${st.fertility} fertility` : ''}</span> <span class="saved" id="saved">${icon('check')}</span><span class="sr" id="saved-sr" role="status"></span></p>
        <input type="date" class="date-overlay" id="log-date-input" value="${iso}" max="${TODAY}" aria-label="Choose date">
      </div>
      <button class="icon-btn" data-action="log-date" data-d="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.3"' : ''}>${icon('chevron-right')}</button>
    </div>

    <div class="field"><div class="field-head">Flow</div>${seg('flow', T.FLOW, d.flow, 'Flow')}</div>

    ${p.hormonal ? '' : html`<div class="field">
      <div class="field-head">Cervical fluid</div>${seg('cervicalFluid', T.FLUID, d.cervicalFluid, 'Cervical fluid')}
      <div class="field-head" style="margin-top:16px">LH test</div>${seg('opk', T.LH, d.opk, 'LH test')}
      <div class="field-head" style="margin-top:16px">Temperature</div>
      <input class="input" type="number" inputmode="decimal" step="0.01" min="90" max="110" placeholder="°F, on waking" data-field="bbt" value="${d.bbt}" aria-label="Basal body temperature in degrees Fahrenheit">
      <p class="hint" id="bbt-hint" role="alert" hidden>Enter a temperature between 90 and 110°F. This one won't be saved.</p>
    </div>`}

    <div class="field">
      <div class="field-head">Mood</div>${chips('moods', T.MOODS, d.moods)}
    </div>

    <div class="field">
      <div class="field-head">Body</div>${chips('symptoms', T.SYMPTOMS, d.symptoms)}
      <div class="field-head" style="margin-top:16px">Pain</div>${seg('pain', T.PAIN, d.pain, 'Pain')}
    </div>

    <div class="field">
      <div class="field-head"><span>Energy</span><span class="muted" data-label="energy">${T.ENERGY_LABELS[d.energy - 1] ?? ''}</span></div>
      ${rating('energy', d.energy)}
    </div>

    <div class="field">
      <div class="field-head">Intimacy</div>
      ${chips('sexActivities', T.INTIMACY, d.sexActivities)}
      <div class="field-head" style="margin-top:16px"><span>Desire</span><span class="muted" data-label="libido">${T.DESIRE_LABELS[d.libido - 1] ?? ''}</span></div>
      ${rating('libido', d.libido)}
      ${chips('sexQualities', T.INTIMACY_NOTES, d.sexQualities)}
    </div>

    <div class="field"><div class="field-head">Other factors</div>${chips('events', T.EVENTS, d.events)}</div>

    <div class="field"><div class="field-head">Notes</div><textarea class="input" rows="3" placeholder="Anything else" data-field="notes" aria-label="Notes">${d.notes}</textarea></div>

    <div><button class="btn quiet danger" id="log-clear" data-action="log-clear" ${p.logs[iso] ? '' : 'hidden'}>Clear entry</button></div>`;
}

const tick = () => navigator.vibrate?.(6);
let saveTimer;
function saveDraft(p, now = true) {
  clearTimeout(saveTimer);
  if (now) tick();
  const run = () => {
    S.saveLog(p, ui.date, ui.draft);
    const saved = $('#saved');
    if (!saved) return;
    saved.classList.add('on');
    play(saved, 'bump');
    $('#saved-sr').textContent = 'Saved';
    $('#log-clear').hidden = !p.logs[ui.date];
    clearTimeout(saved._t);
    saved._t = setTimeout(() => { saved.classList.remove('on'); const sr = $('#saved-sr'); if (sr) sr.textContent = ''; }, 1400);
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
    <div class="people-grid">${profiles.map((p) => {
      const st = status(p, TODAY, TODAY);
      const f = forecast(p, TODAY);
      const c = T.phaseCopy(st.phase, st.variant);
      return html`<article class="group person-card ${p.id === activeId ? 'active' : ''}">
        <button class="person-head" data-action="open-person" data-id="${p.id}">
          ${avatar(p, 'lg')}
          <span class="row-main"><span class="row-title">${p.name}<span class="rel">${p.relation}</span></span><span class="row-sub">Day ${st.cycleDay} of ${st.bounds.cycle} · ${PHASE_NAMES[st.phase]}</span></span>
          <i class="dot p-${st.phase}" aria-hidden="true"></i>
        </button>
        <div class="person-body"><p>${c.headline}</p><p class="muted"><b>Care cue</b> ${c.partner.b}</p></div>
        <div class="person-foot">
          <span class="muted ${f.late ? 'warn' : ''}">${f.late ? plural(f.late, 'day') + ' late' : 'Next period ' + fmtShort(f.nextPeriod) + (f.spread ? ` ±${f.spread}d` : '') + ' · ' + relative(f.daysUntilPeriod)}</span>
          <span class="person-actions">
            <button class="btn quiet" data-action="export-person" data-id="${p.id}">${icon('download')}Export</button>
            <button class="btn quiet" data-action="edit-person" data-id="${p.id}">${icon('edit')}Edit</button>
          </span>
        </div>
      </article>`;
    })}</div>
    ${profiles.length > 1 ? html`
    <div>
      <div class="section-title">Next 14 days</div>
      <div class="group align"><div class="align-grid">
        <span></span>${days.map((iso) => html`<span class="h"><b>${parseISO(iso).toLocaleDateString('en-US', { weekday: 'narrow' })}</b>${parseISO(iso).getDate()}</span>`)}
        ${profiles.map((p) => html`<span class="nm"><span class="dot" style="background:${p.color}"></span>${p.name}</span>${days.map((iso) => {
          const s = status(p, iso, TODAY);
          return html`<span class="c p-${s.phase}" title="${p.name}, ${fmtShort(iso)}: ${phaseLine(s)}">D${s.cycleDay}</span>`;
        })}`)}
      </div></div>
    </div>` : ''}`;
}

// ---------- History ----------

function ovulationLine(p) {
  const f = forecast(p, TODAY);
  const b = phaseBounds(p);
  if (f.observed) return `Day ${f.observed.day} · ${f.observed.confirmed ? 'confirmed' : 'from LH test'}`;
  return `Day ${b.ovulationDay} · estimated`;
}

// Most-logged tags per phase, plus average desire and energy, from this person's own entries.
function phasePatterns(p) {
  const out = Object.fromEntries(PHASE_ORDER.map((k) => [k, { tags: new Map(), desire: [], energy: [], pain: 0, n: 0 }]));
  for (const [iso, l] of Object.entries(p.logs)) {
    const b = out[status(p, iso, TODAY).phase];
    b.n++;
    [...(l.moods || []), ...(l.symptoms || [])].forEach((t) => b.tags.set(t, (b.tags.get(t) || 0) + 1));
    if (l.libido) b.desire.push(l.libido);
    if (l.energy) b.energy.push(l.energy);
    if (l.pain === 'moderate' || l.pain === 'severe') b.pain++;
  }
  return out;
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function doctorSummary(p) {
  const b = phaseBounds(p);
  const s = cycleStats(p);
  const flags = regularity(p);
  const pat = phasePatterns(p);
  const lines = [
    `Cycle summary for ${p.name} (${TODAY})`,
    `Cycle length: ${b.cycle} days on average${s.n >= 2 ? `, ranging ${s.min}–${s.max} over ${s.n} cycles` : ''}`,
    `Bleeding: ${b.period} days on average`,
    ...(p.hormonal ? ['On hormonal birth control'] : [`Ovulation: ${ovulationLine(p).toLowerCase()}`, `Luteal phase: ${b.lutealLength} days`]),
    flags.length ? `Outside typical ranges: ${flags.join('; ')}` : 'Within typical ranges (cycle 24–38 days, varying up to 9, bleeding up to 8)',
    `Recent period starts: ${sortedPeriods(p).slice(-6).map((x) => x.start).join(', ')}`,
  ];
  const painDays = Object.values(p.logs).filter((l) => l.pain === 'moderate' || l.pain === 'severe').length;
  if (painDays) lines.push(`Moderate or severe pain logged on ${plural(painDays, 'day')}`);
  const heavy = Object.values(p.logs).filter((l) => l.flow === 'heavy').length;
  if (heavy) lines.push(`Heavy flow logged on ${plural(heavy, 'day')}`);
  const seen = PHASE_ORDER.filter((k) => pat[k].tags.size).map((k) => `${PHASE_NAMES[k]}: ${[...pat[k].tags.entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map((e) => T.tagLabel(e[0])).join(', ')}`);
  if (seen.length) lines.push('Most logged by phase:', ...seen);
  return lines.join('\n');
}

function history(p) {
  const b = phaseBounds(p);
  const s = cycleStats(p);
  const flags = regularity(p);
  const periods = sortedPeriods(p).reverse();
  const dates = Object.keys(p.logs).sort().reverse();
  const pat = phasePatterns(p);
  const longest = Math.max(b.cycle, ...periods.map((per, i) => (i === 0 ? 0 : diffDays(periods[i - 1].start, per.start))));
  const shown = PHASE_ORDER.filter((k) => pat[k].n);

  const kv = (k, v, warn) => html`<div class="row"><span>${k}</span><span class="row-end ${warn ? 'warn' : ''}">${v}</span></div>`;
  const level = (v) => html`<span class="lvl" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => html`<i class="${v !== null && Math.round(v) >= n ? 'on' : ''}"></i>`)}</span>`;
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
          <div class="cycle-bar" style="width:${(len / longest) * 100}%" aria-hidden="true"><i class="p-menstrual" style="flex:${flow}"></i><i class="p-follicular" style="flex:${len - flow - lut}"></i><i class="p-luteal" style="flex:${lut}"></i></div>
        </div>
        ${periods.length > 1 ? html`<button class="icon-btn" data-action="remove-period" data-date="${per.start}" aria-label="Remove period starting ${fmtShort(per.start)}">${icon('x')}</button>` : ''}
      </div>`;
    })}</div>

    <div>
      <div class="section-title">Summary<button class="btn quiet" data-action="copy-summary">${icon('copy')}Copy for doctor</button></div>
      <div class="group kv">
        ${kv('Cycle length', plural(b.cycle, 'day') + (s.n >= 2 && s.range ? ` · ${s.min}–${s.max}` : ''), b.cycle < 24 || b.cycle > 38)}
        ${kv('Bleeding', plural(b.period, 'day'), b.period > 8)}
        ${p.hormonal ? '' : kv('Ovulation', ovulationLine(p))}
        ${p.hormonal ? '' : kv('Luteal phase', plural(b.lutealLength, 'day'), b.lutealLength < 10)}
        ${kv('Regularity', flags.length ? 'Worth mentioning' : 'Within typical ranges', flags.length > 0)}
      </div>
      ${flags.length ? html`<ul class="flags">${flags.map((f) => html`<li>${f}</li>`)}</ul>` : ''}
    </div>

    ${shown.length ? html`<div>
      <div class="section-title">Your patterns</div>
      <div class="group patterns">${shown.map((k) => {
        const top = [...pat[k].tags.entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map((e) => T.tagLabel(e[0]));
        const d = mean(pat[k].desire), en = mean(pat[k].energy);
        return html`<div class="row stack"><span class="dot p-${k}" style="margin-top:6px"></span><div class="row-main"><div class="row-title">${PHASE_NAMES[k]}</div>${top.length ? html`<div class="row-sub">${top.join(' · ')}</div>` : ''}</div>
          <div class="lvls">${d !== null ? html`<span title="Average desire ${d.toFixed(1)} of 5">Desire ${level(d)}</span>` : ''}${en !== null ? html`<span title="Average energy ${en.toFixed(1)} of 5">Energy ${level(en)}</span>` : ''}</div></div>`;
      })}</div>
    </div>` : ''}

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
  const items = T.GUIDE.filter((g) => ui.cat === 'all' || g.cat === ui.cat);
  const catLabel = (id) => T.GUIDE_CATEGORIES.find((c) => c.id === id).label;
  return html`
    <h1>Guide</h1>
    <div class="chips" role="group" aria-label="Topic">${T.GUIDE_CATEGORIES.map((c) =>
      html`<button type="button" class="chip" aria-pressed="${ui.cat === c.id ? 'true' : 'false'}" data-action="guide-cat" data-value="${c.id}">${c.label}</button>`)}</div>
    <div class="articles">${items.map((g) => html`
      <article class="group article">
        <div class="eyebrow p-${g.phase}"><i></i>${catLabel(g.cat)}</div>
        <h2>${g.title}</h2>
        <div class="figure">${new Raw(figure(g.id))}</div>
        <p>${g.body}</p>
        <p class="take">${g.takeaway}</p>
        ${g.source ? html`<p class="src">${g.source}</p>` : ''}
      </article>`)}
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
  const onboard = kind === 'onboard';
  const options = html`
    <div class="group">
      <label class="row"><span>Relationship</span><select class="input" name="relation">${T.RELATIONS.map((r) => html`<option ${r === v.relation ? 'selected' : ''}>${r}</option>`)}</select></label>
      ${stepper('Luteal phase', 'lutealLength', v.lutealLength, 10, 17)}
      <div class="row"><span>Color</span><div class="swatches" role="radiogroup" aria-label="Color">
        ${T.COLORS.map((c) => html`<label style="--c:${c.hex}" title="${c.name}"><input type="radio" name="color" value="${c.hex}" aria-label="${c.name}" ${c.hex === v.color ? 'checked' : ''}></label>`)}
      </div></div>
      <label class="row"><span>Hormonal birth control</span><input class="switch" type="checkbox" role="switch" name="hormonal" ${v.hormonal ? 'checked' : ''}></label>
    </div>`;
  return html`
    <form data-form="${kind}" autocomplete="off">
      <input type="hidden" name="id" value="${v.id ?? ''}">
      <div class="group">
        <label class="row"><span>Name</span><input class="input" name="name" value="${v.name}" required maxlength="32" placeholder="Required" autocapitalize="words" ${kind === 'profile' && v.id ? '' : 'autofocus'}></label>
        <label class="row"><span>${onboard ? 'Period started' : 'Last period'}</span><input class="input" type="date" name="lastPeriod" value="${v.lastPeriod}" max="${TODAY}" required></label>
      </div>
      <p class="hint" data-hint hidden></p>
      ${onboard ? html`<div class="quick"><button type="button" class="chip" data-action="last-period" data-offset="0">Today</button><button type="button" class="chip" data-action="last-period" data-offset="1">Yesterday</button></div>` : ''}
      <div class="group" style="margin-top:20px">
        ${stepper('Cycle length', 'cycleLength', v.cycleLength, 20, 45)}
        ${stepper('Period length', 'periodLength', v.periodLength, 2, 10)}
      </div>
      ${onboard ? html`<details class="more"><summary>More options</summary>${options}</details>` : html`<div style="margin-top:20px">${options}</div>`}
      <div style="margin-top:24px;display:grid;gap:8px">
        <button class="btn primary block" type="submit">${onboard ? 'Get started' : 'Save'}</button>
        ${kind === 'profile' && v.id ? html`<button type="button" class="btn quiet danger block" data-action="delete-person" data-id="${v.id}">Delete ${v.name}</button>` : ''}
      </div>
    </form>`;
}

function profileDefaults(p) {
  const used = S.get().profiles.map((x) => x.color);
  return p ? {
    id: p.id, name: p.name, relation: p.relation, color: p.color, cycleLength: p.cycleLength, periodLength: p.periodLength,
    lutealLength: p.lutealLength, hormonal: p.hormonal, lastPeriod: latestStart(p, TODAY),
  } : {
    id: '', name: '', relation: S.get().profiles.length ? 'Partner' : 'Self', cycleLength: 28, periodLength: 5, lutealLength: 14, hormonal: false,
    lastPeriod: addDays(TODAY, -7), color: (T.COLORS.find((c) => !used.includes(c.hex)) ?? T.COLORS[0]).hex,
  };
}

// The welcome ring previews exactly what Today will show for the numbers entered.
function previewProfile(v) {
  return S.normalizeProfile({ ...v, periods: [{ start: v.lastPeriod || addDays(TODAY, -7), length: v.periodLength }] });
}

function previewInner(p) {
  const st = status(p, TODAY, TODAY);
  return html`${new Raw(ringSvg(p))}<div class="ring-center"><span class="ring-day-label">Day</span><span class="ring-day">${st.cycleDay}</span><span class="ring-phase p-${st.phase}">${PHASE_NAMES[st.phase]}</span></div>`;
}

function previewNote(p) {
  const f = forecast(p, TODAY);
  return f.late ? `Period ${plural(f.late, 'day')} late` : `Next period ${relative(f.daysUntilPeriod).toLowerCase()}`;
}

function updatePreview(form) {
  const v = readForm(form);
  if (!v.lastPeriod) return;
  const p = previewProfile(v);
  $('#preview').innerHTML = previewInner(p).s;
  $('#note').textContent = previewNote(p);
  $('#art').className = `welcome-art p-${status(p, TODAY, TODAY).phase}`;
}

function onboarding() {
  const p = previewProfile(profileDefaults(null));
  return html`
    <div class="welcome fade-in">
      <div class="welcome-art p-${status(p, TODAY, TODAY).phase}" id="art"><div class="ring intro" id="preview" aria-hidden="true">${previewInner(p)}</div><p class="muted num" id="note" role="status">${previewNote(p)}</p></div>
      <div class="welcome-form">
        <h1>Welcome to Tide</h1>
        ${profileForm(profileDefaults(null), 'onboard')}
        <p class="privacy muted">${icon('lock')}Stays on this device. No account.</p>
        <div class="alt">
          <label class="btn quiet">Import backup<input type="file" accept=".json,application/json" data-import hidden></label>
          <button class="btn quiet" data-action="sample">Try sample data</button>
        </div>
      </div>
    </div>`;
}

const dlg = $('#sheet');
function openSheet(title, body) {
  clearTimeout(closeTimer);
  dlg.classList.remove('closing');
  dlg.style.transform = '';
  dlg.innerHTML = html`<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">${icon('x')}</button></div><div class="sheet-body">${body}</div>`.s;
  if (!dlg.open) dlg.showModal();
}
let closeTimer;
function closeSheet() {
  if (!dlg.open || dlg.classList.contains('closing')) return;
  dlg.classList.add('closing');
  closeTimer = setTimeout(() => { dlg.close(); dlg.classList.remove('closing'); dlg.style.transform = ''; dlg.style.transition = ''; }, 170);
}
dlg.addEventListener('click', (e) => { if (e.target === dlg) closeSheet(); });
dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });

// On phones the sheet follows a downward drag from its header and closes past 90px.
let drag = null;
dlg.addEventListener('pointerdown', (e) => {
  if (innerWidth >= 600 || !e.target.closest('.sheet-head') || e.target.closest('button')) return;
  drag = { y: e.clientY, dy: 0 };
  dlg.setPointerCapture(e.pointerId);
  dlg.style.transition = 'none';
});
dlg.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.dy = Math.max(0, e.clientY - drag.y);
  dlg.style.transform = `translateY(${drag.dy}px)`;
});
const endDrag = () => {
  if (!drag) return;
  const { dy } = drag;
  drag = null;
  dlg.style.transition = 'transform 0.25s var(--ease)';
  if (dy > 90) closeSheet(); else dlg.style.transform = '';
};
dlg.addEventListener('pointerup', endDrag);
dlg.addEventListener('pointercancel', endDrag);

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
    </div>
    <p class="foot muted">Stored only on this device.${navigator.serviceWorker?.controller ? ' Works offline.' : ''}</p>`);
}

function periodSheet(p) {
  openSheet('Log period', html`
    <form data-form="period" autocomplete="off">
      <div class="group">
        <label class="row"><span>Started</span><input class="input" type="date" name="start" value="${TODAY}" max="${TODAY}" required></label>
        ${stepper('Length', 'flowDays', p.periodLength, 2, 10)}
      </div>
      <p class="hint" data-hint hidden></p>
      <div style="margin-top:24px"><button class="btn primary block" type="submit">Save</button></div>
    </form>`);
}

// A start date years in the past is usually a typo. Warn, don't block: imported data can be old.
function dateHint(input) {
  if (!input.matches?.('input[type="date"][name="lastPeriod"], input[type="date"][name="start"]')) return;
  const hint = input.closest('form')?.querySelector('[data-hint]');
  if (!hint) return;
  const years = input.value ? diffDays(TODAY, input.value) / 365 : 0;
  hint.hidden = years < 2;
  if (!hint.hidden) hint.textContent = `That was over ${Math.floor(years)} years ago. Check the date.`;
}

// ---------- Toast ----------

const toastEl = $('#toast');
let toastTimer;
let toastUndo;
let hideTimer;
function hideToast() {
  clearTimeout(toastTimer);
  toastUndo = null;
  toastEl.classList.add('out');
  hideTimer = setTimeout(() => { toastEl.hidden = true; toastEl.classList.remove('out'); }, 180);
}
function toast(message, undo) {
  clearTimeout(toastTimer);
  clearTimeout(hideTimer);
  toastEl.classList.remove('out');
  toastUndo = undo;
  toastEl.innerHTML = html`<span>${message}</span>${undo ? html`<button data-action="undo">Undo</button>` : ''}`.s;
  toastEl.hidden = false;
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  toastTimer = setTimeout(hideToast, undo ? 6500 : 2200);
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
    $('.app').classList.toggle('no-nav', !p);
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
    placeSegs(main);
    if (ui.slide) {
      play($('.cal'), ui.slide > 0 ? 'from-r' : 'from-l');
      ui.slide = 0;
    }
  };

  const changed = lastView !== view;
  lastView = view;
  paint();
  if (changed) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
}

// ---------- Actions ----------

function go(view) {
  if (location.hash === '#' + view) return window.scrollTo({ top: 0, behavior: 'smooth' });
  location.hash = view;
}

function readForm(form) {
  const f = Object.fromEntries(new FormData(form));
  return { ...f, cycleLength: +f.cycleLength, periodLength: +f.periodLength, lutealLength: +(f.lutealLength ?? 14), hormonal: f.hormonal === 'on' };
}

const actions = {
  go: (el) => { closeSheet(); go(el.dataset.view); },
  'close-sheet': closeSheet,
  switcher: switcherSheet,
  more: moreSheet,
  period: () => periodSheet(S.active()),
  undo: () => { const u = toastUndo; hideToast(); if (u) { u(); ui.day = null; toast('Restored'); } },

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
    const out = el.closest('form').querySelector(`[data-out="${el.dataset.name}"]`);
    out.textContent = plural(v, 'day');
    play(out, 'bump');
    tick();
    if (el.closest('form').dataset.form === 'onboard') updatePreview(el.closest('form'));
  },
  'last-period': (el) => {
    const form = el.closest('form');
    form.elements.lastPeriod.value = addDays(TODAY, -Number(el.dataset.offset));
    updatePreview(form);
  },
  tab: (el) => { ui.tab = el.dataset.value; pickSeg(el); const box = $('#tab-rows'); box.innerHTML = tabRows(S.active()).s; play(box, 'swap'); tick(); },

  // Today
  'reset-day': () => { ui.day = null; paintToday(S.active()); },
  chart: (el) => { ui.chart = el.dataset.value; pickSeg(el); const box = $('#chart-body'); box.innerHTML = chartBody(S.active()).s; play(box, 'swap'); tick(); },
  'copy-partner': () => {
    const p = S.active();
    const info = dayInfo(p, shownDay(p));
    const c = T.phaseCopy(info.phase, info.variant).partner;
    copy(`${p.name} is on day ${info.day} (${PHASE_NAMES[info.phase].toLowerCase()} phase). ${c.t}: ${c.b}`);
  },

  // Calendar
  'pick-date': (el) => {
    ui.date = el.dataset.date;
    document.querySelectorAll('.day.is-sel').forEach((d) => { d.classList.remove('is-sel'); d.setAttribute('aria-pressed', 'false'); });
    el.classList.add('is-sel');
    el.setAttribute('aria-pressed', 'true');
    const box = $('#inspector');
    box.innerHTML = inspector(S.active()).s;
    play(box, 'swap');
    tick();
  },
  month: (el) => { const d = parseISO(ui.cursor); d.setMonth(d.getMonth() + Number(el.dataset.d)); ui.cursor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; ui.slide = Number(el.dataset.d); render(); },
  'month-today': () => { ui.slide = TODAY.slice(0, 8) + '01' > ui.cursor ? 1 : -1; ui.date = TODAY; ui.cursor = TODAY.slice(0, 8) + '01'; render(); },
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
  'log-set': (el) => {
    ui.draft[el.dataset.key] = el.dataset.value;
    pickSeg(el);
    saveDraft(S.active());
  },
  'log-toggle': (el) => {
    const list = ui.draft[el.dataset.key];
    const i = list.indexOf(el.dataset.value);
    if (i < 0) list.push(el.dataset.value); else list.splice(i, 1);
    el.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
    if (i < 0) play(el, 'bump');
    saveDraft(S.active());
  },
  'log-rate': (el) => {
    const key = el.dataset.key;
    const n = Number(el.dataset.value);
    if (ui.draft[key] === n) delete ui.draft[key]; else ui.draft[key] = n;
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.value) === ui.draft[key] ? 'true' : 'false'));
    if (ui.draft[key] === n) play(el, 'bump');
    const labels = key === 'libido' ? T.DESIRE_LABELS : T.ENERGY_LABELS;
    $(`[data-label="${key}"]`).textContent = labels[ui.draft[key] - 1] ?? '';
    saveDraft(S.active());
  },
  'log-clear': () => { toast('Entry cleared', S.clearLog(S.active(), ui.date)); },

  // History
  'remove-period': (el) => toast('Period removed', S.removePeriod(S.active(), el.dataset.date)),
  'copy-summary': () => copy(doctorSummary(S.active()), 'Summary copied'),
  'edit-entry': (el) => { ui.date = el.dataset.date; go('log'); },

  // Data
  'guide-cat': (el) => { ui.cat = el.dataset.value; render(); },
  'export-person': (el) => { const p = S.get().profiles.find((x) => x.id === el.dataset.id); if (p) { download(S.exportProfile(p), `tide_${slug(p.name)}.json`); toast(`Exported ${p.name}`); } },
  'export-all': () => { download(S.exportVault(), `tide_backup_${TODAY}.json`); closeSheet(); toast('Backup downloaded'); },
  'export-one': () => { const p = S.active(); download(S.exportProfile(p), `tide_${slug(p.name)}.json`); closeSheet(); toast(`Exported ${p.name}`); },
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
    toast('Period logged', S.setPeriod(S.active(), v.start, Number(v.flowDays)));
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'scrub') return setDay(S.active(), Number(e.target.value));
  dateHint(e.target);
  const onboard = e.target.closest?.('form[data-form="onboard"]');
  if (onboard) return updatePreview(onboard);
  const field = e.target.dataset?.field;
  if (field === 'bbt') {
    const t = e.target.value === '' ? null : Number(e.target.value);
    const bad = t !== null && !(t >= 90 && t <= 110);
    e.target.setAttribute('aria-invalid', bad ? 'true' : 'false');
    $('#bbt-hint').hidden = !bad;
  }
  if (!field || !ui.draft) return;
  ui.draft[field] = e.target.value;
  saveDraft(S.active(), false);
});

document.addEventListener('change', async (e) => {
  dateHint(e.target);
  const onboard = e.target.closest?.('form[data-form="onboard"]');
  if (onboard && !e.target.matches('[data-import]')) return updatePreview(onboard);
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

// Header hairline appears once content scrolls beneath it.
window.addEventListener('scroll', () => $('#bar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });

// ---------- Boot ----------

S.subscribe(render);
const initial = location.hash.slice(1);
if (VIEWS.includes(initial)) S.commit((s) => { s.view = initial; }, { silent: true });
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
