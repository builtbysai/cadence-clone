// Pure SVG string builders. No DOM, no state.

import { AXES } from './content.js';

const line = (d, color, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const wrap = (inner) => `<svg viewBox="0 0 180 60" role="img" aria-hidden="true">${inner}</svg>`;

// Small illustrations for the Guide, one per article id.
const FIGURES = {
  estradiol: wrap(`${line('M8 50Q55 46 95 10T172 34', 'var(--green)')}<circle cx="95" cy="10" r="4" fill="var(--amber)"/>`),
  progesterone: wrap(`${line('M8 48H75Q115 8 145 16L172 52', 'var(--plum)')}<path d="M145 12V54" stroke="var(--red)" stroke-dasharray="2 3" fill="none"/>`),
  desire: wrap(`${line('M10 46Q65 40 90 8Q115 40 170 36', 'var(--rose)')}<circle cx="90" cy="8" r="4.5" fill="var(--rose)"/>`),
  bbt: wrap(`<path d="M10 32H170" stroke="var(--ink-3)" stroke-opacity=".5" stroke-dasharray="3 3" fill="none"/>${line('M10 42L40 44L70 45L92 40L105 20L135 18L170 19', 'var(--amber)')}`),
  vital: wrap(['var(--red)', 'var(--green)', 'var(--amber)'].map((c, i) =>
    `<rect x="${14 + i * 50}" y="18" width="${i === 2 ? 46 : 32}" height="26" rx="5" fill="${c}" fill-opacity=".22" stroke="${c}"/>`).join('')),
  window: wrap(`<rect x="62" y="16" width="86" height="28" rx="14" fill="var(--amber)" fill-opacity=".22"/><path d="M10 50H172" stroke="var(--ink-3)" stroke-opacity=".5" fill="none"/><circle cx="148" cy="30" r="5" fill="var(--amber)"/>`),
  pill: wrap(line('M10 30H170', 'var(--ink-3)', 'stroke-opacity=".7"')),
  sync: wrap([['var(--green)', 'M10 34Q60 24 100 32T170 28'], ['var(--plum)', 'M10 28Q60 38 100 24T170 36'], ['var(--amber)', 'M10 38Q60 30 100 36T170 26']].map(([c, d]) => line(d, c, 'stroke-opacity=".75"')).join('')),
  pain: wrap(`<path d="M10 48H170" stroke="var(--ink-3)" stroke-opacity=".5" fill="none"/>${[22, 58, 94, 130].map((x, i) => `<rect x="${x}" y="${44 - [10, 22, 34, 16][i]}" width="20" height="${[10, 22, 34, 16][i]}" rx="4" fill="var(--red)" fill-opacity="${[0.3, 0.5, 0.8, 0.4][i]}"/>`).join('')}`),
  hunger: wrap(line('M12 44H85Q125 14 168 18', 'var(--plum)')),
};

export const figure = (id) => FIGURES[id] ?? '';

// Six-axis "tendencies" chart. `values` is in AXES order, 0-100.
export function rose(values, color) {
  const cx = 105, cy = 96, R = 62;
  const at = (i, r) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  let out = [0.33, 0.66, 1].map((k) => `<circle cx="${cx}" cy="${cy}" r="${(R * k).toFixed(1)}" fill="none" stroke="var(--line)" stroke-dasharray="2 3"/>`).join('');
  const pts = [];
  AXES.forEach((label, i) => {
    const [gx, gy] = at(i, R);
    out += `<line x1="${cx}" y1="${cy}" x2="${gx.toFixed(1)}" y2="${gy.toFixed(1)}" stroke="var(--line)"/>`;
    pts.push(at(i, (Math.max(15, values[i]) / 100) * R));
    const [lx, ly] = at(i, R + 17);
    out += `<text x="${lx.toFixed(1)}" y="${(ly + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--ink-2)">${label}</text>`;
  });
  out += `<polygon points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  out += pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${color}"/>`).join('');
  return `<svg viewBox="0 0 210 192" class="rose" role="img" aria-label="Typical tendencies this phase: ${AXES.map((a, i) => `${a} ${values[i] >= 66 ? 'high' : values[i] >= 45 ? 'moderate' : 'low'}`).join(', ')}">${out}</svg>`;
}
