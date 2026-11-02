(function () {
  'use strict';

  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function parseISO(isoStr) {
    const parts = (isoStr || getTodayISO()).split('-').map(Number);
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 12, 0, 0);
  }

  function toISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function addDays(isoStr, days) {
    const d = parseISO(isoStr);
    d.setDate(d.getDate() + days);
    return toISO(d);
  }

  function diffDays(targetISO, baseISO) {
    const t = parseISO(targetISO).getTime();
    const b = parseISO(baseISO).getTime();
    return Math.round((t - b) / 86400000);
  }

  function formatShortDate(isoStr) {
    const d = parseISO(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatFullDate(isoStr) {
    const d = parseISO(isoStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
        return;
      }
    } catch (e) {}
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  const TODAY_ISO = getTodayISO();

  const MOOD_TAGS = [
    'Calm', 'Focused', 'Social', 'Grounded', 'Creative',
    'Warm / Affectionate', 'Sensitive', 'Introverted', 'Irritable', 'Anxious', 'Brain Fog', 'Low Drive'
  ];

  const SYMPTOM_TAGS = [
    'High Stamina', 'Deep Sleep', 'Cramps', 'Lower Back Ache',
    'Headache / Migraine', 'Bloating', 'Breast Tenderness', 'Vivid Dreams',
    'Restless Sleep', 'Salt/Sweet Cravings', 'Clear Skin', 'Joint Stiffness', 'Night Sweats'
  ];

  const SEX_ACTIVITIES = [
    { id: 'protected', label: 'Protected Sex', icon: '🛡️' },
    { id: 'unprotected', label: 'Unprotected Sex', icon: '✨' },
    { id: 'solo', label: 'Solo Pleasure', icon: '🌸' },
    { id: 'sensual', label: 'Sensual / Non-Penetrative', icon: '🤍' },
    { id: 'fantasy', label: 'High Desire / Thoughts', icon: '🔥' }
  ];

  const SEX_QUALITIES = [
    'Orgasm', 'Deep Connection', 'High Lubrication', 'Receptive Desire', 'Spontaneous Drive', 'Pelvic Pain / Dyspareunia'
  ];

  const CERVICAL_FLUIDS = [
    { id: 'none', label: 'Dry / None', sub: 'Low fertility' },
    { id: 'sticky', label: 'Sticky / Paste', sub: 'Early follicular' },
    { id: 'creamy', label: 'Creamy / Lotion', sub: 'Rising estrogen' },
    { id: 'eggwhite', label: 'Egg-White / Clear', sub: 'Peak fertile fluid' }
  ];

  const GOAL_LABELS = {
    rhythm: 'Body & Mood',
    intimacy: 'Intimacy & FAM',
    conception: 'Conception',
    pmdd: 'PMDD / Perimenopause'
  };

  const ATLAS_MODULES = [
    {
      cat: 'neuro',
      phase: 'follicular',
      badge: 'Brain & Estrogen • NIH / PMC',
      title: 'Estradiol (E₂), Synaptic Plasticity & Dopamine Tone',
      summary: 'As ovarian follicles mature during the follicular and ovulatory phases, rising 17β-estradiol increases dendritic spine density in the hippocampus and prefrontal cortex while upregulating dopamine (D₂) and serotonin (5-HT₂A) receptor availability.',
      takeaway: 'In daily life: Verbal fluency, working memory, reward sensitivity, and intrinsic motivation naturally climb as estradiol approaches its mid-cycle peak.',
      sourceLabel: 'PMC6309888: Reproductive Steroid Regulation of Mood & Behavior',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><path d="M8 50 Q55 46, 95 10 T172 34" fill="none" stroke="#3E7A6E" stroke-width="2.5"/><circle cx="95" cy="10" r="4" fill="#C4862D"/><text x="65" y="26" font-size="9" font-family="JetBrains Mono" fill="currentColor">E₂ Peak → Dopamine</text></svg>'
    },
    {
      cat: 'neuro',
      phase: 'luteal',
      badge: 'GABA-A Soothing • Luteal Care',
      title: 'Progesterone, Allopregnanolone & Late-Luteal Sensitivity',
      summary: 'After ovulation, the corpus luteum secretes progesterone, which converts in the brain into allopregnanolone—a potent positive modulator of calming GABA-A receptors. In the final 4–5 days before menstruation, rapid withdrawal of allopregnanolone alters GABA-A receptor subunits.',
      takeaway: 'In daily life: Premenstrual sensitivity or PMDD is not caused by "excess hormones," but by how quickly calming neurosteroids drop at the end of the cycle.',
      sourceLabel: 'PMC6594874: Allopregnanolone & Reproductive Psychiatry',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><path d="M8 48 L75 48 Q115 8, 145 16 L172 52" fill="none" stroke="#7C5879" stroke-width="2.5"/><line x1="145" y1="12" x2="145" y2="54" stroke="#C25949" stroke-dasharray="2 2"/><text x="85" y="45" font-size="9" font-family="JetBrains Mono" fill="currentColor">GABA-A Shift</text></svg>'
    },
    {
      cat: 'sex',
      phase: 'ovulatory',
      badge: 'Intimacy & Desire',
      title: 'Spontaneous vs. Responsive Desire Across the Cycle',
      summary: 'Sexual response follows two healthy pathways: Spontaneous desire (an internal spark) peaks around ovulation driven by peak estradiol and a brief ovarian testosterone pulse. Responsive desire (arousal that blooms *after* unhurried sensual touch, warmth, and emotional safety) predominates in the luteal phase.',
      takeaway: 'In daily life: Honoring responsive desire in the luteal phase removes pressure and deepens intimacy across the entire month.',
      sourceLabel: 'PMC8906247: Hormonal Modulation of Libido & Affect',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><path d="M10 46 Q65 40, 90 8 Q115 40, 170 36" fill="none" stroke="#C95B78" stroke-width="2.5"/><circle cx="90" cy="8" r="4.5" fill="#C95B78"/><text x="48" y="52" font-size="9" font-family="JetBrains Mono" fill="currentColor">Spontaneous vs Responsive</text></svg>'
    },
    {
      cat: 'fam',
      phase: 'ovulatory',
      badge: 'Symptothermal Method • Mayo Clinic',
      title: 'Waking Basal Temperature (BBT) & Cervical Fluid',
      summary: 'Estrogen stimulates cervical crypts to produce clear, stretchy, alkaline "egg-white" fluid before ovulation, keeping sperm viable for up to 5 days. Once ovulation occurs, progesterone warms the hypothalamus, raising waking BBT by +0.4°F to +0.8°F until your next period.',
      takeaway: 'In daily life: Fertile fluid tells you ovulation is approaching; a 3-day sustained temperature rise confirms ovulation has completed.',
      sourceLabel: 'PMC11837971 & Mayo Clinic Symptothermal Guidelines',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><polyline points="10,42 40,44 70,45 92,40 105,20 135,18 170,19" fill="none" stroke="#C4862D" stroke-width="2.5"/><line x1="10" y1="32" x2="170" y2="32" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="3 3"/><text x="102" y="14" font-size="9" font-family="JetBrains Mono" fill="currentColor">+0.5°F Thermal Shift</text></svg>'
    },
    {
      cat: 'clinical',
      phase: 'menstrual',
      badge: 'ACOG Fifth Vital Sign',
      title: 'What Your Cycle Tells a Doctor',
      summary: 'The American College of Obstetricians and Gynecologists (ACOG) recognizes the menstrual cycle as a vital sign alongside blood pressure and heart rate. Persistent cycles <21 or >35 days, bleeding >7 days, pelvic pain during intimacy (dyspareunia), or luteal phases <10 days help clinicians evaluate thyroid health, PCOS, endometriosis, or perimenopause.',
      takeaway: 'In daily life: Use the Vital Sign Summary in Cycle History to bring concrete, multi-cycle data to your next appointment.',
      sourceLabel: 'ACOG Committee Opinion: Menstrual Cycle as a Vital Sign',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><rect x="14" y="18" width="32" height="26" rx="4" fill="#C25949" fill-opacity="0.25" stroke="#C25949"/><rect x="64" y="18" width="32" height="26" rx="4" fill="#3E7A6E" fill-opacity="0.25" stroke="#3E7A6E"/><rect x="114" y="18" width="46" height="26" rx="4" fill="#C4862D" fill-opacity="0.25" stroke="#C4862D"/></svg>'
    },
    {
      cat: 'clinical',
      phase: 'luteal',
      badge: 'Metabolism & Nutrition',
      title: 'Why Luteal Hunger Is Biological, Not Lack of Willpower',
      summary: 'During the luteal phase, progesterone stimulates thermogenesis and raises resting energy expenditure by 5% to 10% (~150–250 kcal/day), while declining estrogen slightly increases blood-sugar sensitivity. Craving complex carbohydrates is the brain’s adaptive way of supporting tryptophan transport for serotonin synthesis.',
      takeaway: 'In daily life: Adding slow-burning complex carbs, protein, and magnesium in the luteal phase stabilizes both blood sugar and mood.',
      sourceLabel: 'Endocrine & Metabolic Regulation Across the Luteal Phase',
      svg: '<svg viewBox="0 0 180 60" class="w-full h-14"><path d="M12 44 L85 44 Q125 14, 168 18" fill="none" stroke="#7C5879" stroke-width="2.5"/><text x="78" y="38" font-size="9" font-family="JetBrains Mono" fill="currentColor">+150–250 kcal/day</text></svg>'
    }
  ];

  const STORAGE_KEY = 'cadence_pwa_state_v2';
  let chartMode = 'hormones';
  let atlasCategory = 'all';
  let onboardGoal = 'rhythm';
  let onboardColor = '#C25949';
  let selectedModalColor = '#C25949';

  function buildEmptyDefaultState() {
    return {
      theme: 'light',
      activeProfileId: null,
      activeView: 'cycle',
      selectedCycleDay: null,
      selectedCalendarDate: TODAY_ISO,
      calendarMonthOffset: 0,
      profiles: []
    };
  }

  function buildSampleHouseholdState() {
    const mayaLast = addDays(TODAY_ISO, -13);
    const elenaLast = addDays(TODAY_ISO, -22);
    const chloeLast = addDays(TODAY_ISO, -2);

    return {
      theme: state ? state.theme : 'light',
      activeProfileId: 'p_maya',
      activeView: 'cycle',
      selectedCycleDay: null,
      selectedCalendarDate: TODAY_ISO,
      calendarMonthOffset: 0,
      profiles: [
        {
          id: 'p_maya',
          name: 'Maya',
          relation: 'Self',
          goal: 'intimacy',
          color: '#C25949',
          cycleLength: 28,
          periodLength: 5,
          lutealLength: 14,
          periods: [
            { start: addDays(mayaLast, -84), length: 5 },
            { start: addDays(mayaLast, -55), length: 5 },
            { start: addDays(mayaLast, -28), length: 5 },
            { start: mayaLast, length: 5 }
          ],
          logs: {
            [TODAY_ISO]: {
              flow: 'none',
              sexActivities: ['unprotected', 'fantasy'],
              sexQualities: ['Orgasm', 'Deep Connection', 'High Lubrication', 'Spontaneous Drive'],
              libido: 5,
              cervicalFluid: 'eggwhite',
              opk: 'pos',
              moods: ['Focused', 'Social', 'Warm / Affectionate'],
              symptoms: ['High Stamina', 'Clear Skin'],
              energy: 5,
              bbt: '97.38',
              notes: 'Peak ovulatory energy, clear fertile fluid, and strong creative focus.'
            },
            [addDays(TODAY_ISO, -2)]: {
              flow: 'none',
              sexActivities: ['protected'],
              sexQualities: ['Deep Connection', 'High Lubrication'],
              libido: 4,
              cervicalFluid: 'creamy',
              opk: 'neg',
              moods: ['Calm', 'Creative'],
              symptoms: ['High Stamina'],
              energy: 4,
              bbt: '97.32',
              notes: 'Climbing follicular energy.'
            },
            [addDays(TODAY_ISO, -12)]: {
              flow: 'medium',
              sexActivities: [],
              sexQualities: [],
              libido: 2,
              cervicalFluid: 'none',
              opk: 'none',
              moods: ['Introverted', 'Calm'],
              symptoms: ['Cramps', 'Deep Sleep'],
              energy: 2,
              bbt: '97.26',
              notes: 'Day 2 flow; prioritized warm rest and early sleep.'
            }
          }
        },
        {
          id: 'p_elena',
          name: 'Elena',
          relation: 'Partner',
          goal: 'rhythm',
          color: '#3E7A6E',
          cycleLength: 30,
          periodLength: 4,
          lutealLength: 14,
          periods: [
            { start: addDays(elenaLast, -60), length: 4 },
            { start: addDays(elenaLast, -30), length: 4 },
            { start: elenaLast, length: 4 }
          ],
          logs: {
            [TODAY_ISO]: {
              flow: 'none',
              sexActivities: ['sensual'],
              sexQualities: ['Receptive Desire', 'Deep Connection'],
              libido: 3,
              cervicalFluid: 'sticky',
              opk: 'none',
              moods: ['Sensitive', 'Introverted'],
              symptoms: ['Bloating', 'Salt/Sweet Cravings', 'Vivid Dreams'],
              energy: 3,
              bbt: '98.12',
              notes: 'Luteal thermal shift confirmed; unhurried evening at home.'
            }
          }
        },
        {
          id: 'p_chloe',
          name: 'Chloe',
          relation: 'Family',
          goal: 'pmdd',
          color: '#7C5879',
          cycleLength: 27,
          periodLength: 5,
          lutealLength: 13,
          periods: [
            { start: addDays(chloeLast, -54), length: 5 },
            { start: addDays(chloeLast, -27), length: 5 },
            { start: chloeLast, length: 5 }
          ],
          logs: {
            [TODAY_ISO]: {
              flow: 'medium',
              sexActivities: [],
              sexQualities: [],
              libido: 1,
              cervicalFluid: 'none',
              opk: 'none',
              moods: ['Grounded', 'Introverted'],
              symptoms: ['Cramps', 'Lower Back Ache'],
              energy: 2,
              bbt: '97.29',
              notes: 'Day 3 of period; magnesium and warm compress helping.'
            }
          }
        }
      ]
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.profiles)) {
          return parsed;
        }
      }
    } catch (e) {}
    return buildEmptyDefaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function getActiveProfile() {
    if (!state.profiles || state.profiles.length === 0) return null;
    let p = state.profiles.find(function (item) { return item.id === state.activeProfileId; });
    if (!p) {
      p = state.profiles[0];
      state.activeProfileId = p.id;
    }
    return p;
  }

  function sortPeriods(periods) {
    return (periods || []).slice().sort(function (a, b) {
      return a.start.localeCompare(b.start);
    });
  }

  function getLatestPeriodStart(profile) {
    const sorted = sortPeriods(profile.periods);
    if (sorted.length === 0) return TODAY_ISO;
    return sorted[sorted.length - 1].start;
  }

  function getPhaseBounds(profile) {
    const cLen = Number(profile.cycleLength) || 28;
    const pLen = Math.min(Number(profile.periodLength) || 5, cLen - 10);
    const lLen = Math.min(Number(profile.lutealLength) || 14, cLen - pLen - 3);
    const ovDay = cLen - lLen;
    const ovStart = Math.max(pLen + 2, ovDay - 3);
    const ovEnd = Math.min(cLen - 4, ovDay + 1);
    return {
      cycleLength: cLen,
      periodLength: pLen,
      lutealLength: lLen,
      ovulationDay: ovDay,
      menstrual: [1, pLen],
      follicular: [pLen + 1, ovStart - 1],
      ovulatory: [ovStart, ovEnd],
      luteal: [ovEnd + 1, cLen]
    };
  }

  function getCycleStatusForDate(profile, targetISO) {
    const sorted = sortPeriods(profile.periods);
    const bounds = getPhaseBounds(profile);
    const latestStart = getLatestPeriodStart(profile);

    let anchorStart = latestStart;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].start <= targetISO) {
        anchorStart = sorted[i].start;
      }
    }

    const rawDiff = diffDays(targetISO, anchorStart);
    let cycleDay;
    if (rawDiff >= 0) {
      if (anchorStart === latestStart && rawDiff < bounds.cycleLength) {
        cycleDay = rawDiff + 1;
      } else {
        cycleDay = (rawDiff % bounds.cycleLength) + 1;
      }
    } else {
      const mod = ((rawDiff % bounds.cycleLength) + bounds.cycleLength) % bounds.cycleLength;
      cycleDay = mod + 1;
    }

    const phaseInfo = getDayInsight(profile, cycleDay);
    const daysSinceLatest = diffDays(targetISO, latestStart);
    const currentCycleDayToday = ((daysSinceLatest % bounds.cycleLength) + bounds.cycleLength) % bounds.cycleLength + 1;
    const daysUntilNextPeriod = bounds.cycleLength - currentCycleDayToday + 1;
    const nextPeriodISO = addDays(targetISO, daysUntilNextPeriod);

    return {
      cycleDay: cycleDay,
      bounds: bounds,
      phaseInfo: phaseInfo,
      latestStart: latestStart,
      nextPeriodISO: nextPeriodISO,
      daysUntilNextPeriod: daysUntilNextPeriod
    };
  }

  function getDayInsight(profile, day) {
    const b = getPhaseBounds(profile);
    const cLen = b.cycleLength;
    const ovDay = b.ovulationDay;

    const normPos = (day - 1) / Math.max(1, cLen - 1);
    const ovPos = (ovDay - 1) / Math.max(1, cLen - 1);

    const estPeak1 = Math.exp(-Math.pow((normPos - (ovPos - 0.03)) / 0.11, 2)) * 88;
    const estPeak2 = Math.exp(-Math.pow((normPos - (ovPos + 0.25)) / 0.16, 2)) * 48;
    const estrogen = Math.round(Math.min(96, 12 + estPeak1 + estPeak2));

    const lutealCenter = ovPos + (1 - ovPos) * 0.52;
    const progCurve = normPos > ovPos - 0.02
      ? Math.exp(-Math.pow((normPos - lutealCenter) / 0.18, 2)) * 86
      : 0;
    const progesterone = Math.round(Math.min(95, 8 + progCurve));

    const lhSurge = Math.round(8 + Math.exp(-Math.pow((day - ovDay) / 1.15, 2)) * 88);

    const expectedBbt = day <= ovDay
      ? (97.32 - (day === ovDay ? 0.08 : 0) + Math.sin(day * 0.5) * 0.04)
      : (97.86 + Math.min(0.22, (day - ovDay) * 0.03) - (day >= cLen - 1 ? 0.25 : 0));

    if (day >= b.menstrual[0] && day <= b.menstrual[1]) {
      const isEarly = day <= 2;
      return {
        phaseKey: 'menstrual',
        phaseName: 'Menstrual Phase',
        subPhase: isEarly ? 'Early Flow • Restorative Baseline' : 'Late Flow • Quiet Renewal',
        color: '#C25949',
        fertility: 'Low',
        conceptionBadge: 'Low Conception Probability',
        shortCaption: isEarly ? 'Hormones at baseline • Restorative focus' : 'Follicular recruitment beginning',
        headline: isEarly
          ? 'Inward somatic focus, quiet sensory threshold, and deep restorative pull.'
          : 'Physical heaviness lifts as rising FSH initiates early mental clarity.',
        physiology: isEarly
          ? 'Estradiol and progesterone rest at their lowest baseline, triggering uterine shedding. Iron replenishment, pelvic warmth, and unhurried rest take priority.'
          : 'Prostaglandin cramping subsides by Day ' + day + '. The pituitary gently releases FSH to recruit new follicles, bringing a noticeable lift in clarity.',
        energy: isEarly ? 38 : 56,
        mood: isEarly ? 64 : 75,
        focus: isEarly ? 54 : 68,
        desire: isEarly ? 36 : 48,
        social: isEarly ? 34 : 52,
        recovery: isEarly ? 90 : 66,
        estrogen: estrogen,
        progesterone: progesterone,
        lh: lhSurge,
        expectedBbt: expectedBbt.toFixed(2),
        fluidLabel: 'Menstrual flow',
        metabolicNote: 'Basal metabolism at follicular baseline • Focus on iron + Vitamin C',
        cues: [
          { icon: '🌡️', label: 'BBT Baseline (~97.3°F)' },
          { icon: '🤍', label: 'Comfort & Warm Touch' },
          { icon: '🍵', label: 'Iron + Ginger Support' }
        ],
        rituals: [
          { title: 'Nourishment', body: 'Pair heme or plant iron (lentils, dark leafy greens, grass-fed beef) with Vitamin C to replenish ferritin lost during flow. Warm ginger or red raspberry leaf tea eases prostaglandin cramping.' },
          { title: 'Movement Pace', body: 'Honor your nervous system: gentle walking, restorative yin yoga, or somatic stretching without performance pressure.' },
          { title: 'Evening Sanctuary', body: 'Core body temperature drops back to baseline—a warm bath or heating pad over the lower abdomen deepens slow-wave sleep.' }
        ],
        moodTitle: isEarly ? 'Reflective & Low-Stimulation' : 'Clearing Mental Fog',
        moodBody: isEarly
          ? 'With estradiol at baseline, you may prefer candor, stillness, and trusted spaces over performative small talk.'
          : 'As hormone withdrawal settles, emotional reactivity levels out into a grounded sense of reset.',
        behaviorTitle: isEarly ? 'Protect Margin & Simplify' : 'Gentle Structuring',
        behaviorBody: isEarly
          ? 'Leave breathing room between commitments. Ideal days for solo reflection, reading, and low-friction tasks.'
          : 'Ease back into organizing upcoming priorities without forcing marathon sessions.',
        bodyTitle: isEarly ? 'Pelvic Relief & Deep Rest' : 'Rebounding Stamina',
        bodyBody: isEarly
          ? 'Some women experience heightened pelvic congestion or relief from gentle orgasms, while others prefer complete physical stillness.'
          : 'Neuromuscular recovery accelerates now; light strength or mobility work feels noticeably smoother.',
        partnerTitle: isEarly ? 'Quiet Presence Over Fixing' : 'Unhurried Momentum',
        partnerBody: isEarly
          ? 'Take dinner and household logistics off her plate without asking her to direct the plan. Warmth and zero pressure land best.'
          : 'Energy is returning gently; check in on social battery before booking busy group plans.'
      };
    }

    if (day >= b.follicular[0] && day <= b.follicular[1]) {
      const isLateFollicular = day >= Math.round((b.follicular[0] + b.follicular[1]) / 2);
      return {
        phaseKey: 'follicular',
        phaseName: 'Follicular Phase',
        subPhase: isLateFollicular ? 'Late Follicular • Steep Estradiol Climb' : 'Mid Follicular • Rising Vitality',
        color: '#3E7A6E',
        fertility: isLateFollicular ? 'High (Opening)' : 'Low–Moderate',
        conceptionBadge: isLateFollicular ? 'Fertile Window Opening (Sperm Viable)' : 'Low–Moderate Fertility',
        shortCaption: 'Climbing estradiol & high dopamine sensitivity',
        headline: 'Rising curiosity, fast cognitive execution, and building spontaneous desire.',
        physiology: 'Maturing follicles secrete climbing 17β-estradiol while progesterone stays quiet. Estradiol boosts synaptic plasticity and amplifies dopamine and serotonin receptor sensitivity.',
        energy: isLateFollicular ? 86 : 78,
        mood: 84,
        focus: 88,
        desire: isLateFollicular ? 80 : 68,
        social: isLateFollicular ? 84 : 74,
        recovery: 35,
        estrogen: estrogen,
        progesterone: progesterone,
        lh: lhSurge,
        expectedBbt: expectedBbt.toFixed(2),
        fluidLabel: isLateFollicular ? 'Creamy → Watery' : 'Sticky → Creamy',
        metabolicNote: 'High insulin sensitivity & optimal glycogen use',
        cues: [
          { icon: '⚡', label: 'Peak Strength Adaptation' },
          { icon: '💧', label: isLateFollicular ? 'Fertile Fluid Developing' : 'Early Cervical Fluid' },
          { icon: '🎯', label: 'Creative & Strategic Flow' }
        ],
        rituals: [
          { title: 'Nourishment', body: 'Fresh, vibrant proteins, fermented foods (kimchi, kefir), and flax or pumpkin seeds support healthy estrogen metabolism as estradiol climbs.' },
          { title: 'Movement Pace', body: 'Estrogen protects muscle tissue and boosts glucose uptake—your body responds beautifully to progressive strength training and high-output cardio.' },
          { title: 'Evening Sanctuary', body: 'Mental energy runs high into the evening; a 20-minute wind-down away from screens helps channel creative momentum into restful sleep.' }
        ],
        moodTitle: 'Optimistic, Resilient & Curious',
        moodBody: 'Rising estradiol acts as a natural mood elevator and buffers stress reactivity. Frustrations roll off more easily and intrinsic drive climbs.',
        behaviorTitle: 'Complex Problem-Solving & New Projects',
        behaviorBody: 'Working memory, learning speed, and creative ideation thrive during the follicular climb. Anchor demanding deep-work sprints here.',
        bodyTitle: 'Spontaneous Desire Climb & Fast Recovery',
        bodyBody: 'Natural lubrication and spontaneous interest build alongside estradiol, while high insulin sensitivity fuels physical stamina.',
        partnerTitle: 'Novelty, Play & Shared Adventure',
        partnerBody: 'Appetite for new experiences, spontaneous date nights, and tackling ambitious plans together is naturally high.'
      };
    }

    if (day >= b.ovulatory[0] && day <= b.ovulatory[1]) {
      const isPeakOv = day === ovDay;
      return {
        phaseKey: 'ovulatory',
        phaseName: 'Ovulatory Phase',
        subPhase: isPeakOv ? 'Estimated Ovulation Day • LH Surge Peak' : 'Fertile Ovulatory Window • Peak Estradiol',
        color: '#C4862D',
        fertility: isPeakOv ? 'Peak' : 'High',
        conceptionBadge: isPeakOv ? 'Peak Fertility (Ovulation Day)' : 'High Conception Probability',
        shortCaption: isPeakOv ? 'LH surge, androgen pulse & egg release' : 'Peak estradiol & fertile fluid',
        headline: 'Peak verbal fluency, spontaneous desire, and outward social magnetism.',
        physiology: isPeakOv
          ? 'Estradiol reaches its cycle zenith and triggers a sharp luteinizing hormone (LH) surge, releasing the dominant egg within 12–36 hours alongside a brief pulse of ovarian testosterone.'
          : 'High circulating estradiol maximizes verbal articulation, reward-pathway responsiveness, and clear, stretchy "egg-white" cervical fluid.',
        energy: 92,
        mood: 88,
        focus: 90,
        desire: 95,
        social: 94,
        recovery: 40,
        estrogen: estrogen,
        progesterone: progesterone,
        lh: lhSurge,
        expectedBbt: expectedBbt.toFixed(2),
        fluidLabel: 'Egg-White (Peak Fertile)',
        metabolicNote: 'Peak estradiol • Support liver clearance & hydration',
        cues: [
          { icon: '🔥', label: 'Peak Spontaneous Desire' },
          { icon: '✨', label: 'Egg-White Fertile Fluid' },
          { icon: '🗣️', label: 'Peak Verbal Articulation' }
        ],
        rituals: [
          { title: 'Nourishment', body: 'Cruciferous vegetables (broccoli sprouts, arugula, kale), berries, and mineral-rich hydration help the liver metabolize peak estradiol smoothly.' },
          { title: 'Movement Pace', body: 'Peak power output and social energy—great for group classes or PRs, with mindful warm-ups since peak estrogen slightly increases ligament laxity.' },
          { title: 'Evening Sanctuary', body: 'Libido and sensory warmth peak during this window; prioritize intentional connection, romance, or expressive creative outlets.' }
        ],
        moodTitle: 'Confident, Expressive & Magnetic',
        moodBody: 'Peak estradiol and a mid-cycle androgen rise promote social confidence, warmth, and sensory responsiveness.',
        behaviorTitle: 'Conversations, Pitches & Leadership',
        behaviorBody: 'Verbal articulation and empathy are at their cycle high. Ideal days for important conversations, presentations, and hosting.',
        bodyTitle: 'Peak Libido, Fertile Fluid & Vitality',
        bodyBody: 'Spontaneous desire and natural lubrication reach their peak. Notice whether you feel mild one-sided ovulatory twinges (mittelschmerz).',
        partnerTitle: 'High Connection & Intentional Intimacy',
        partnerBody: 'Prime window for date nights, romantic attention, and open, heart-to-heart dialogue.'
      };
    }

    const daysLeftInCycle = cLen - day;
    const isLateLuteal = daysLeftInCycle < 5;
    return {
      phaseKey: 'luteal',
      phaseName: 'Luteal Phase',
      subPhase: isLateLuteal ? 'Late Luteal • Pre-Flow Transition' : 'Early–Mid Luteal • Progesterone Calm',
      color: '#7C5879',
      fertility: 'Low',
      conceptionBadge: 'Post-Ovulatory • Low Fertility',
      shortCaption: isLateLuteal ? 'Hormones declining • Protect quiet margin' : 'Progesterone peak & +0.5°F thermal shift',
      headline: isLateLuteal
        ? 'Heightened discernment, lower sensory buffer, and a natural pull toward completion.'
        : 'Settled GABAergic calm paired with methodical focus and responsive intimacy.',
      physiology: isLateLuteal
        ? 'As the corpus luteum winds down, progesterone and estradiol drop rapidly. The steep decline in calming allopregnanolone temporarily heightens nervous system sensitivity.'
        : 'High progesterone converts into allopregnanolone (soothing GABA-A receptors), raises waking temperature by +0.4°F–0.8°F, and increases basal caloric burn by 5–10%.',
        energy: isLateLuteal ? 46 : 68,
        mood: isLateLuteal ? 52 : 78,
        focus: isLateLuteal ? 60 : 78,
        desire: isLateLuteal ? 42 : 58,
        social: isLateLuteal ? 40 : 62,
        recovery: isLateLuteal ? 84 : 62,
        estrogen: estrogen,
        progesterone: progesterone,
        lh: lhSurge,
        expectedBbt: expectedBbt.toFixed(2),
        fluidLabel: 'Dry / Sticky (Non-fertile)',
        metabolicNote: 'Resting burn +150–250 kcal/day • Honor complex carb cravings',
        cues: [
          { icon: '🌡️', label: 'BBT Elevated (+0.5°F)' },
          { icon: '🕯️', label: 'Responsive / Sensual Desire' },
          { icon: '🥑', label: '+150–250 kcal Metabolic Rise' }
        ],
        rituals: [
          { title: 'Nourishment', body: 'Your metabolism burns 150–250 extra calories daily. Complex carbohydrates (roasted sweet potato, oats), B6, and dark chocolate stabilize serotonin and prevent cortisol spikes.' },
          { title: 'Movement Pace', body: 'Progesterone raises core temperature and resting heart rate—favor steady strength training, pilates, or incline walks over breathless HIIT.' },
          { title: 'Evening Sanctuary', body: 'Magnesium glycinate before bed and a slightly cooler bedroom counter progesterone’s thermal rise and protect deep REM sleep.' }
        ],
        moodTitle: isLateLuteal ? 'High Discernment & Sensory Honesty' : 'Grounded via GABA-A Calm',
        moodBody: isLateLuteal
          ? 'Rapid withdrawal of allopregnanolone lowers your buffer for noise, clutter, and sleep debt—making boundaries essential.'
          : 'Mid-luteal progesterone promotes a settled, observant, and homeward-leaning temperament.',
        behaviorTitle: isLateLuteal ? 'Closing Loops & Saying No' : 'Deep Execution & Refining',
        behaviorBody: isLateLuteal
          ? 'Your mind quickly spots what isn’t working. Channel this clarity into finishing open tasks and declining non-essential obligations.'
          : 'Shift from launching new commitments to editing, organizing, and steady follow-through.',
        bodyTitle: isLateLuteal ? 'Nervous System Soothing & Minerals' : 'Responsive Desire & Steady Warmth',
        bodyBody: isLateLuteal
          ? 'Reducing caffeine and alcohol in the final 4 days dramatically eases breast tenderness, sleep fragmentation, and mood dips.'
          : 'Desire shifts from spontaneous to responsive—blooming when preceded by emotional safety, massage, and unhurried closeness.',
        partnerTitle: isLateLuteal ? 'Validation, Margin & Zero Defensiveness' : 'Cozy Routines & Affectionate Safety',
        partnerBody: isLateLuteal
          ? 'Decision fatigue hits faster right before flow. Offer proactive practical help, warm nourishing food, and unpressured space.'
          : 'Prefers meaningful one-on-one time, affectionate touch without agenda, and calm evenings.'
      };
  }

  function recalculateProfileCycleStats(profile) {
    const sorted = sortPeriods(profile.periods);
    if (sorted.length >= 2) {
      const diffs = [];
      for (let i = 1; i < sorted.length; i++) {
        const d = diffDays(sorted[i].start, sorted[i - 1].start);
        if (d >= 18 && d <= 50) diffs.push(d);
      }
      if (diffs.length > 0) {
        const sum = diffs.reduce(function (a, b) { return a + b; }, 0);
        profile.cycleLength = Math.round(sum / diffs.length);
      }
    }
  }

  function applyTheme(phaseKey) {
    const htmlEl = document.documentElement;
    const sun = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if (state.theme === 'dark') {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
    if (phaseKey) {
      document.body.setAttribute('data-phase', phaseKey);
    }
  }

  function getBotanicalPhaseSVG(phaseKey, color) {
    if (phaseKey === 'menstrual') {
      return '<svg viewBox="0 0 48 48" class="w-full h-full"><circle cx="24" cy="24" r="19" fill="none" stroke="' + color + '" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.55"/><path d="M24 10 C30 20, 33 27, 24 38 C15 27, 18 20, 24 10 Z" fill="' + color + '" fill-opacity="0.22" stroke="' + color + '" stroke-width="1.75"/><circle cx="24" cy="27" r="3" fill="' + color + '"/></svg>';
    }
    if (phaseKey === 'follicular') {
      return '<svg viewBox="0 0 48 48" class="w-full h-full"><circle cx="24" cy="24" r="19" fill="none" stroke="' + color + '" stroke-width="1.2" opacity="0.35"/><path d="M24 38 L24 14 M24 28 C15 26, 13 17, 21 14 C23 20, 24 24, 24 28 Z M24 24 C33 22, 35 13, 27 10 C25 16, 24 20, 24 24 Z" fill="' + color + '" fill-opacity="0.22" stroke="' + color + '" stroke-width="1.75" stroke-linecap="round"/></svg>';
    }
    if (phaseKey === 'ovulatory') {
      return '<svg viewBox="0 0 48 48" class="w-full h-full"><circle cx="24" cy="24" r="20" fill="' + color + '" fill-opacity="0.14"/><g stroke="' + color + '" stroke-width="1.6" fill="' + color + '" fill-opacity="0.22"><ellipse cx="24" cy="24" rx="5.5" ry="16"/><ellipse cx="24" cy="24" rx="16" ry="5.5"/><ellipse cx="24" cy="24" rx="5.5" ry="16" transform="rotate(45 24 24)"/><ellipse cx="24" cy="24" rx="5.5" ry="16" transform="rotate(-45 24 24)"/></g><circle cx="24" cy="24" r="4" fill="' + color + '"/></svg>';
    }
    return '<svg viewBox="0 0 48 48" class="w-full h-full"><circle cx="24" cy="24" r="19" fill="none" stroke="' + color + '" stroke-width="1.2" opacity="0.4"/><path d="M27 11 A14 14 0 1 0 27 37 A11 11 0 1 1 27 11 Z" fill="' + color + '" fill-opacity="0.28" stroke="' + color + '" stroke-width="1.75"/><circle cx="19" cy="24" r="2.2" fill="' + color + '"/></svg>';
  }

  function renderPetalRoseSVG(insight) {
    const svg = document.getElementById('petal-rose-svg');
    if (!svg) return;
    const cx = 105;
    const cy = 96;
    const maxR = 62;
    const axes = [
      { label: 'Vitality', val: insight.energy, angle: -90 },
      { label: 'Clarity', val: insight.focus, angle: -30 },
      { label: 'Desire', val: insight.desire, angle: 30 },
      { label: 'Social', val: insight.social, angle: 90 },
      { label: 'Stillness', val: insight.recovery, angle: 150 },
      { label: 'Calm', val: insight.mood, angle: 210 }
    ];

    let out = '';
    [0.33, 0.66, 1.0].forEach(function (step) {
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (maxR * step).toFixed(1) + '" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2 2"/>';
    });

    const pts = [];
    axes.forEach(function (ax) {
      const rad = (ax.angle * Math.PI) / 180;
      const gx = cx + maxR * Math.cos(rad);
      const gy = cy + maxR * Math.sin(rad);
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + gx.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="var(--border)" stroke-width="1"/>';

      const rVal = (Math.max(15, ax.val) / 100) * maxR;
      const px = cx + rVal * Math.cos(rad);
      const py = cy + rVal * Math.sin(rad);
      pts.push(px.toFixed(1) + ',' + py.toFixed(1));

      const lx = cx + (maxR + 19) * Math.cos(rad);
      const ly = cy + (maxR + 14) * Math.sin(rad);
      out += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="middle" font-size="8.5" font-family="JetBrains Mono" fill="var(--sub)">' + ax.label + '</text>';
    });

    out += '<polygon points="' + pts.join(' ') + '" fill="' + insight.color + '" fill-opacity="0.24" stroke="' + insight.color + '" stroke-width="2"/>';
    pts.forEach(function (pt) {
      const sp = pt.split(',');
      out += '<circle cx="' + sp[0] + '" cy="' + sp[1] + '" r="3" fill="' + insight.color + '"/>';
    });

    svg.innerHTML = out;
  }

  function renderHeaderAndSwitcher() {
    const bar = document.getElementById('profile-switcher-bar');
    const active = getActiveProfile();
    bar.innerHTML = '';

    state.profiles.forEach(function (p) {
      const isSelected = active && p.id === active.id;
      const status = getCycleStatusForDate(p, TODAY_ISO);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tactile-btn px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shrink-0 border ' +
        (isSelected
          ? 'surface-card font-medium text-ink'
          : 'border-transparent surface-muted text-sub');
      btn.innerHTML =
        '<span class="w-2 h-2 rounded-full shrink-0" style="background-color:' + p.color + '"></span>' +
        '<span>' + escapeHtml(p.name) + '</span>' +
        '<span class="font-mono text-[10px] opacity-75">D' + status.cycleDay + '</span>';
      btn.addEventListener('click', function () {
        state.activeProfileId = p.id;
        state.selectedCycleDay = null;
        saveState();
        renderAll();
      });
      bar.appendChild(btn);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'tactile-btn px-2.5 py-1.5 rounded-full text-xs font-mono text-sub border border-dashed border-subtle shrink-0';
    addBtn.textContent = '+ Person';
    addBtn.addEventListener('click', function () {
      openProfileModal(null);
    });
    bar.appendChild(addBtn);

    document.getElementById('nav-people-count').textContent = String(state.profiles.length);
    document.getElementById('header-today-label').textContent = formatFullDate(TODAY_ISO);

    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      const v = tab.getAttribute('data-view');
      if (v === state.activeView) {
        tab.className = 'nav-tab tactile-btn px-3 py-1.5 rounded-full font-medium whitespace-nowrap bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
      } else {
        tab.className = 'nav-tab tactile-btn px-3 py-1.5 rounded-full font-medium whitespace-nowrap text-sub';
      }
    });

    document.querySelectorAll('.dock-btn').forEach(function (btn) {
      const v = btn.getAttribute('data-dock-view');
      if (v === state.activeView) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function renderActiveProfileBanner() {
    const p = getActiveProfile();
    if (!p) return;
    const status = getCycleStatusForDate(p, TODAY_ISO);
    const phase = status.phaseInfo;

    document.getElementById('brand-phase-dot').style.backgroundColor = phase.color;
    document.getElementById('header-phase-pill').textContent = phase.phaseName;

    const avatar = document.getElementById('active-avatar');
    avatar.style.backgroundColor = p.color;
    avatar.textContent = p.name.charAt(0).toUpperCase();

    document.getElementById('active-profile-name').textContent = p.name;
    document.getElementById('active-profile-relation').textContent = p.relation;
    document.getElementById('active-profile-goal-badge').textContent = GOAL_LABELS[p.goal || 'rhythm'] || 'Body & Mood';
    document.getElementById('active-profile-summary').textContent =
      phase.phaseName + ' • Next expected period on ' + formatShortDate(status.nextPeriodISO) +
      ' (last started ' + formatShortDate(status.latestStart) + ')';

    document.getElementById('metric-cycle-day').textContent = 'Day ' + status.cycleDay + ' / ' + status.bounds.cycleLength;
    document.getElementById('metric-next-period').textContent =
      status.daysUntilNextPeriod === 0 ? 'Today' :
      status.daysUntilNextPeriod === 1 ? 'Tomorrow' :
      'In ' + status.daysUntilNextPeriod + ' days';
    document.getElementById('metric-fertility').textContent = phase.fertility;
  }

  function renderCycleView() {
    const p = getActiveProfile();
    if (!p) return;
    const todayStatus = getCycleStatusForDate(p, TODAY_ISO);
    const bounds = todayStatus.bounds;
    const cLen = bounds.cycleLength;

    const inspectedDay = state.selectedCycleDay !== null
      ? Math.min(Math.max(1, state.selectedCycleDay), cLen)
      : todayStatus.cycleDay;

    const isToday = inspectedDay === todayStatus.cycleDay;
    const insight = getDayInsight(p, inspectedDay);

    applyTheme(insight.phaseKey);

    const resetBtn = document.getElementById('btn-reset-today');
    if (isToday) resetBtn.classList.add('hidden');
    else resetBtn.classList.remove('hidden');

    const slider = document.getElementById('cycle-day-slider');
    slider.max = String(cLen);
    slider.value = String(inspectedDay);
    document.getElementById('scrubber-day-readout').textContent =
      'Day ' + inspectedDay + ' of ' + cLen + (isToday ? ' (Today)' : '');
    document.getElementById('scrubber-ovulation-marker').textContent = 'Ovulation (~D' + bounds.ovulationDay + ')';
    document.getElementById('scrubber-end-marker').textContent = 'Day ' + cLen;

    document.getElementById('legend-menstrual').textContent = 'Menstrual (D' + bounds.menstrual[0] + '–' + bounds.menstrual[1] + ')';
    document.getElementById('legend-follicular').textContent = 'Follicular (D' + bounds.follicular[0] + '–' + bounds.follicular[1] + ')';
    document.getElementById('legend-ovulatory').textContent = 'Ovulatory (D' + bounds.ovulatory[0] + '–' + bounds.ovulatory[1] + ')';
    document.getElementById('legend-luteal').textContent = 'Luteal (D' + bounds.luteal[0] + '–' + bounds.luteal[1] + ')';

    const dayOffsetFromToday = inspectedDay - todayStatus.cycleDay;
    const inspectedDateISO = addDays(TODAY_ISO, dayOffsetFromToday);
    document.getElementById('dial-date-label').textContent = isToday
      ? 'TODAY • ' + formatShortDate(TODAY_ISO).toUpperCase()
      : formatShortDate(inspectedDateISO).toUpperCase() + (dayOffsetFromToday > 0 ? ' (+' + dayOffsetFromToday + 'D)' : ' (' + dayOffsetFromToday + 'D)');
    document.getElementById('dial-day-number').textContent = 'Day ' + inspectedDay;

    const pill = document.getElementById('dial-phase-pill');
    pill.textContent = insight.phaseName;
    pill.style.backgroundColor = insight.color + '22';
    pill.style.color = insight.color;
    document.getElementById('dial-sub-caption').textContent = insight.shortCaption;

    document.getElementById('dial-botanical-glyph').innerHTML = getBotanicalPhaseSVG(insight.phaseKey, insight.color);

    renderCycleRingSVG(p, cLen, todayStatus.cycleDay, inspectedDay, todayStatus.latestStart);

    document.getElementById('insight-phase-dot').style.backgroundColor = insight.color;
    document.getElementById('insight-phase-title').textContent = insight.subPhase;
    document.getElementById('insight-conception-badge').textContent = insight.conceptionBadge;
    document.getElementById('insight-headline').textContent = insight.headline;
    document.getElementById('insight-physiology').textContent = insight.physiology;

    const cueStrip = document.getElementById('visual-cue-strip');
    cueStrip.innerHTML = (insight.cues || []).map(function (c) {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full surface-muted text-[11px] font-medium text-ink">' +
        '<span>' + c.icon + '</span><span>' + escapeHtml(c.label) + '</span></span>';
    }).join('');

    renderPetalRoseSVG(insight);

    setBar('energy', insight.energy);
    setBar('mood', insight.mood);
    setBar('focus', insight.focus);
    setBar('recovery', insight.recovery);

    // Populate custom SVG micro-glyphs on the 3 domain cards
    document.getElementById('glyph-neuro').innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 3a6 6 0 0 0-6 6c0 4 6 12 6 12s6-8 6-12a6 6 0 0 0-6-6z"/><circle cx="12" cy="9" r="2"/></svg>';
    document.getElementById('glyph-cognition').innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
    document.getElementById('glyph-body').innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    document.getElementById('card-mood-title').textContent = insight.moodTitle;
    document.getElementById('card-mood-body').textContent = insight.moodBody;
    document.getElementById('card-behavior-title').textContent = insight.behaviorTitle;
    document.getElementById('card-behavior-body').textContent = insight.behaviorBody;
    document.getElementById('card-body-title').textContent = insight.bodyTitle;
    document.getElementById('card-body-body').textContent = insight.bodyBody;
    document.getElementById('card-partner-title').textContent = insight.partnerTitle;
    document.getElementById('card-partner-body').textContent = insight.partnerBody;
    document.getElementById('partner-badge').textContent = p.relation === 'Self' ? 'To Share With Partner' : 'Supporting ' + p.name;

    // Populate Daily Nourishment, Movement & Evening Rituals
    document.getElementById('ritual-metabolic-badge').textContent = insight.metabolicNote;
    const ritualsEl = document.getElementById('daily-rituals-strip');
    ritualsEl.innerHTML = (insight.rituals || []).map(function (r) {
      return (
        '<div class="surface-muted rounded-2xl p-4 space-y-1.5">' +
          '<div class="font-serif text-lg text-ink">' + escapeHtml(r.title) + '</div>' +
          '<p class="text-xs text-sub leading-relaxed">' + escapeHtml(r.body) + '</p>' +
        '</div>'
      );
    }).join('');

    renderHormoneOrBbtChartSVG(p, cLen, inspectedDay, insight, todayStatus.latestStart);
    renderUpcomingMilestones(p, todayStatus);
  }

  function setBar(key, val) {
    document.getElementById('bar-label-' + key).textContent = val + '%';
    document.getElementById('bar-fill-' + key).style.width = val + '%';
  }

  function renderCycleRingSVG(profile, cLen, todayDay, inspectedDay, latestStartISO) {
    const svg = document.getElementById('cycle-ring-svg');
    const cx = 140;
    const cy = 140;
    const r = 118;
    const gapAngle = 1.65;
    const sliceAngle = 360 / cLen;
    const bounds = getPhaseBounds(profile);

    let html = '';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 15) + '" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2 3" />';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 16) + '" fill="none" stroke="var(--border)" stroke-width="0.75" opacity="0.5" />';

    for (let d = 1; d <= cLen; d++) {
      const dayInsight = getDayInsight(profile, d);
      const startDeg = (d - 1) * sliceAngle - 90 + gapAngle / 2;
      const endDeg = d * sliceAngle - 90 - gapAngle / 2;
      const pathData = describeArc(cx, cy, r, startDeg, endDeg);

      const isSelected = d === inspectedDay;
      const isToday = d === todayDay;
      const strokeW = isSelected ? 18 : (isToday ? 13 : 9.5);
      const opacity = isSelected ? '1' : (d < todayDay ? '0.52' : '0.86');

      html += '<path d="' + pathData + '" fill="none" stroke="' + dayInsight.color + '" stroke-width="' + strokeW +
        '" stroke-linecap="butt" opacity="' + opacity + '" class="ring-segment" data-day="' + d + '">' +
        '<title>Day ' + d + ' — ' + dayInsight.phaseName + '</title></path>';

      const midRad = (((d - 0.5) * sliceAngle - 90) * Math.PI) / 180;

      if (d === bounds.ovulationDay) {
        const ox = cx + (r - 18) * Math.cos(midRad);
        const oy = cy + (r - 18) * Math.sin(midRad);
        html += '<circle cx="' + ox.toFixed(1) + '" cy="' + oy.toFixed(1) + '" r="3.5" fill="#C4862D" stroke="var(--card)" stroke-width="1.2"/>';
      }

      const dateForDay = addDays(latestStartISO, d - 1);
      const dayLog = profile.logs && profile.logs[dateForDay];
      if (dayLog && ((dayLog.sexActivities && dayLog.sexActivities.length > 0) || (dayLog.libido && dayLog.libido >= 4))) {
        const ix = cx + (r + 16) * Math.cos(midRad);
        const iy = cy + (r + 16) * Math.sin(midRad);
        html += '<circle cx="' + ix.toFixed(1) + '" cy="' + iy.toFixed(1) + '" r="3.2" fill="#C95B78"><title>Intimacy logged on ' + formatShortDate(dateForDay) + '</title></circle>';
      }

      if (isToday) {
        const mx = cx + (r + 16) * Math.cos(midRad);
        const my = cy + (r + 16) * Math.sin(midRad);
        html += '<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="5" fill="none" stroke="var(--ink)" stroke-width="1.75" />';
      }
    }

    svg.innerHTML = html;
    svg.querySelectorAll('.ring-segment').forEach(function (seg) {
      seg.addEventListener('click', function () {
        state.selectedCycleDay = Number(seg.getAttribute('data-day'));
        renderCycleView();
      });
    });
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const startRad = (startAngle * Math.PI) / 180.0;
    const endRad = (endAngle * Math.PI) / 180.0;
    const x1 = x + radius * Math.cos(startRad);
    const y1 = y + radius * Math.sin(startRad);
    const x2 = x + radius * Math.cos(endRad);
    const y2 = y + radius * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', x1.toFixed(2), y1.toFixed(2), 'A', radius, radius, 0, largeArcFlag, 1, x2.toFixed(2), y2.toFixed(2)].join(' ');
  }

  function renderHormoneOrBbtChartSVG(profile, cLen, inspectedDay, insight, latestStartISO) {
    const svg = document.getElementById('hormone-chart-svg');
    const w = 620;
    const h = 165;
    const padX = 20;
    const padY = 16;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;
    const selX = padX + ((inspectedDay - 1) / Math.max(1, cLen - 1)) * usableW;

    let out = '';
    out += '<line x1="' + padX + '" y1="' + (padY + usableH) + '" x2="' + (w - padX) + '" y2="' + (padY + usableH) + '" stroke="var(--border)" stroke-width="1" />';
    out += '<line x1="' + padX + '" y1="' + (padY + usableH / 2) + '" x2="' + (w - padX) + '" y2="' + (padY + usableH / 2) + '" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 3" />';

    if (chartMode === 'hormones') {
      const estPts = [];
      const progPts = [];
      const lhPts = [];

      for (let d = 1; d <= cLen; d++) {
        const info = getDayInsight(profile, d);
        const x = padX + ((d - 1) / Math.max(1, cLen - 1)) * usableW;
        const yEst = padY + usableH - (info.estrogen / 100) * usableH;
        const yProg = padY + usableH - (info.progesterone / 100) * usableH;
        const yLh = padY + usableH - (info.lh / 100) * usableH;
        estPts.push(x.toFixed(1) + ',' + yEst.toFixed(1));
        progPts.push(x.toFixed(1) + ',' + yProg.toFixed(1));
        lhPts.push(x.toFixed(1) + ',' + yLh.toFixed(1));
      }

      out += '<polyline fill="none" stroke="#C4862D" stroke-width="1.75" stroke-dasharray="3 3" opacity="0.85" points="' + lhPts.join(' ') + '" />';
      out += '<polyline fill="none" stroke="#7C5879" stroke-width="2.4" points="' + progPts.join(' ') + '" />';
      out += '<polyline fill="none" stroke="#3E7A6E" stroke-width="2.6" points="' + estPts.join(' ') + '" />';

      out += '<line x1="' + selX.toFixed(1) + '" y1="4" x2="' + selX.toFixed(1) + '" y2="' + (h - 6) + '" stroke="var(--ink)" stroke-width="1.5" />';
      out += '<circle cx="' + selX.toFixed(1) + '" cy="' + (padY + usableH - (insight.estrogen / 100) * usableH).toFixed(1) + '" r="4.5" fill="#3E7A6E" />';
      out += '<circle cx="' + selX.toFixed(1) + '" cy="' + (padY + usableH - (insight.progesterone / 100) * usableH).toFixed(1) + '" r="4.5" fill="#7C5879" />';

      document.getElementById('hormone-day-note').textContent =
        'Day ' + inspectedDay + ' — Estradiol: ' + insight.estrogen +
        '% • Progesterone: ' + insight.progesterone +
        '% • LH: ' + insight.lh + '%';
    } else {
      const bbtPts = [];
      const loggedDots = [];
      const minTemp = 97.0;
      const maxTemp = 98.4;

      for (let d = 1; d <= cLen; d++) {
        const info = getDayInsight(profile, d);
        const x = padX + ((d - 1) / Math.max(1, cLen - 1)) * usableW;
        const tVal = parseFloat(info.expectedBbt);
        const yT = padY + usableH - ((tVal - minTemp) / (maxTemp - minTemp)) * usableH;
        bbtPts.push(x.toFixed(1) + ',' + yT.toFixed(1));

        const dateISO = addDays(latestStartISO, d - 1);
        const log = profile.logs && profile.logs[dateISO];
        if (log && log.bbt && !isNaN(parseFloat(log.bbt))) {
          const actualT = Math.min(maxTemp, Math.max(minTemp, parseFloat(log.bbt)));
          const yAct = padY + usableH - ((actualT - minTemp) / (maxTemp - minTemp)) * usableH;
          loggedDots.push({ x: x, y: yAct, t: log.bbt, d: d });
        }
      }

      const coverY = padY + usableH - ((97.55 - minTemp) / (maxTemp - minTemp)) * usableH;
      out += '<line x1="' + padX + '" y1="' + coverY.toFixed(1) + '" x2="' + (w - padX) + '" y2="' + coverY.toFixed(1) + '" stroke="#C25949" stroke-width="1" stroke-dasharray="4 4" opacity="0.65"/>';
      out += '<text x="' + (padX + 6) + '" y="' + (coverY - 5).toFixed(1) + '" font-size="9" font-family="JetBrains Mono" fill="#C25949">Thermal Shift Line (~97.55°F)</text>';

      out += '<polyline fill="none" stroke="#C4862D" stroke-width="2.4" points="' + bbtPts.join(' ') + '" />';
      loggedDots.forEach(function (pt) {
        out += '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="4.5" fill="#C25949" stroke="var(--card)" stroke-width="1.5"><title>Day ' + pt.d + ': Logged ' + pt.t + '°F</title></circle>';
      });

      out += '<line x1="' + selX.toFixed(1) + '" y1="4" x2="' + selX.toFixed(1) + '" y2="' + (h - 6) + '" stroke="var(--ink)" stroke-width="1.5" />';

      document.getElementById('hormone-day-note').textContent =
        'Day ' + inspectedDay + ' — Expected Waking BBT: ~' + insight.expectedBbt + '°F • Fluid: ' + insight.fluidLabel;
    }

    out += '<text x="' + padX + '" y="180" fill="var(--faint)" font-size="10" font-family="JetBrains Mono">Day 1</text>';
    out += '<text x="' + (w / 2 - 24) + '" y="180" fill="var(--faint)" font-size="10" font-family="JetBrains Mono">Ovulation</text>';
    out += '<text x="' + (w - padX - 38) + '" y="180" fill="var(--faint)" font-size="10" font-family="JetBrains Mono">Day ' + cLen + '</text>';

    svg.innerHTML = out;
  }

  function renderUpcomingMilestones(profile, todayStatus) {
    const b = todayStatus.bounds;
    const latestStart = todayStatus.latestStart;
    const nextPeriodStart = todayStatus.nextPeriodISO;
    const nextPeriodEnd = addDays(nextPeriodStart, b.periodLength - 1);

    let nextOvulationISO = addDays(latestStart, b.ovulationDay - 1);
    if (diffDays(nextOvulationISO, TODAY_ISO) < 0) {
      nextOvulationISO = addDays(nextPeriodStart, b.ovulationDay - 1);
    }
    const fertileStartISO = addDays(nextOvulationISO, -3);
    const fertileEndISO = addDays(nextOvulationISO, 1);

    let nextLutealISO = addDays(latestStart, b.luteal[0] - 1);
    if (diffDays(nextLutealISO, TODAY_ISO) < 0) {
      nextLutealISO = addDays(nextPeriodStart, b.luteal[0] - 1);
    }

    const items = [
      {
        label: 'Next Expected Period',
        dates: formatShortDate(nextPeriodStart) + ' – ' + formatShortDate(nextPeriodEnd),
        delta: formatDeltaDays(diffDays(nextPeriodStart, TODAY_ISO)),
        color: '#C25949'
      },
      {
        label: 'Fertile & Peak Desire Window',
        dates: formatShortDate(fertileStartISO) + ' – ' + formatShortDate(fertileEndISO) + ' (Peak ' + formatShortDate(nextOvulationISO) + ')',
        delta: formatDeltaDays(diffDays(nextOvulationISO, TODAY_ISO)),
        color: '#C4862D'
      },
      {
        label: 'Luteal Calm & Nesting Shift',
        dates: 'Starts ' + formatShortDate(nextLutealISO),
        delta: formatDeltaDays(diffDays(nextLutealISO, TODAY_ISO)),
        color: '#7C5879'
      }
    ];

    const container = document.getElementById('upcoming-milestones-list');
    container.innerHTML = items.map(function (it) {
      return (
        '<div class="surface-muted rounded-2xl p-3.5 flex items-center justify-between gap-2">' +
          '<div class="flex items-start gap-2.5">' +
            '<span class="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style="background-color:' + it.color + '"></span>' +
            '<div>' +
              '<div class="text-xs font-medium text-ink">' + it.label + '</div>' +
              '<div class="text-[11px] font-mono text-sub mt-0.5">' + it.dates + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="text-xs font-mono px-2.5 py-1 rounded-xl surface-card text-ink shrink-0">' + it.delta + '</span>' +
        '</div>'
      );
    }).join('');

    document.getElementById('cycle-stats-footer').textContent =
      'Avg Cycle: ' + b.cycleLength + 'd • Period: ' + b.periodLength + 'd • Luteal: ' + b.lutealLength + 'd';
  }

  function formatDeltaDays(d) {
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d > 1) return 'In ' + d + 'd';
    return Math.abs(d) + 'd ago';
  }

  function renderCalendarView() {
    const p = getActiveProfile();
    if (!p) return;
    const baseDate = parseISO(TODAY_ISO);
    baseDate.setDate(1);
    baseDate.setMonth(baseDate.getMonth() + state.calendarMonthOffset);

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    document.getElementById('cal-month-title').textContent =
      baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    for (let i = 0; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.className = 'h-14 sm:h-16 rounded-2xl';
      grid.appendChild(empty);
    }

    const bounds = getPhaseBounds(p);

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const cellDate = new Date(year, month, dayNum, 12, 0, 0);
      const iso = toISO(cellDate);
      const status = getCycleStatusForDate(p, iso);
      const isLoggedPeriod = isDateInLoggedPeriods(p, iso);
      const isPredictedPeriod = !isLoggedPeriod && status.cycleDay <= bounds.periodLength && iso > status.latestStart;
      const isFertile = status.phaseInfo.phaseKey === 'ovulatory';
      const isOvulation = status.cycleDay === bounds.ovulationDay;
      const dayLog = p.logs && p.logs[iso];
      const hasLog = Boolean(dayLog);
      const hasSex = Boolean(dayLog && dayLog.sexActivities && dayLog.sexActivities.length > 0);
      const isSelected = iso === state.selectedCalendarDate;
      const isToday = iso === TODAY_ISO;

      const btn = document.createElement('button');
      btn.type = 'button';
      let bgClass = 'surface-muted text-ink';
      if (isLoggedPeriod) {
        bgClass = 'bg-[#C25949] text-white';
      } else if (isPredictedPeriod) {
        bgClass = 'border border-dashed border-[#C25949] bg-[#C25949]/15 text-ink';
      } else if (isFertile) {
        bgClass = 'border border-[#C4862D]/60 bg-[#C4862D]/15 text-ink';
      }

      const ringClass = isSelected ? 'ring-2' : '';
      btn.className = 'tactile-btn h-14 sm:h-16 rounded-2xl p-1.5 flex flex-col justify-between items-start relative ' + bgClass + ' ' + ringClass;

      btn.innerHTML =
        '<div class="w-full flex items-center justify-between text-xs font-mono">' +
          '<span class="' + (isToday ? 'underline font-bold' : '') + '">' + dayNum + '</span>' +
          '<span class="text-[9px] opacity-70">D' + status.cycleDay + '</span>' +
        '</div>' +
        '<div class="w-full flex items-center justify-between mt-auto">' +
          (isOvulation ? '<span class="text-[9px] font-mono uppercase px-1 rounded bg-[#C4862D] text-white">OV</span>' : '<span></span>') +
          '<div class="flex items-center gap-1">' +
            (hasSex ? '<span class="w-2 h-2 rounded-full bg-[#C95B78]" title="Intimacy logged"></span>' : '') +
            (hasLog ? '<span class="w-1.5 h-1.5 rounded-full ' + (isLoggedPeriod ? 'bg-white' : 'bg-phase') + '"></span>' : '') +
          '</div>' +
        '</div>';

      btn.addEventListener('click', function () {
        state.selectedCalendarDate = iso;
        renderCalendarView();
      });

      grid.appendChild(btn);
    }

    renderSelectedCalendarDateInspector(p);
    renderThreeCycleForecast(p);
  }

  function isDateInLoggedPeriods(profile, iso) {
    const list = profile.periods || [];
    for (let i = 0; i < list.length; i++) {
      const start = list[i].start;
      const len = Number(list[i].length) || Number(profile.periodLength) || 5;
      const d = diffDays(iso, start);
      if (d >= 0 && d < len) return true;
    }
    return false;
  }

  function renderSelectedCalendarDateInspector(profile) {
    const iso = state.selectedCalendarDate || TODAY_ISO;
    const status = getCycleStatusForDate(profile, iso);
    const log = (profile.logs && profile.logs[iso]) || null;

    document.getElementById('cal-selected-date-label').textContent = formatFullDate(iso);
    document.getElementById('cal-selected-cycle-day').textContent = 'Cycle Day ' + status.cycleDay;
    document.getElementById('cal-selected-phase').textContent = status.phaseInfo.phaseName;
    document.getElementById('cal-selected-summary').textContent = status.phaseInfo.headline;

    const logsEl = document.getElementById('cal-selected-logs');
    if (!log) {
      logsEl.innerHTML = '<div class="text-faint italic">No daily check-in recorded for this date.</div>';
    } else {
      const pills = [];
      if (log.flow && log.flow !== 'none') pills.push('Flow: ' + log.flow);
      if (log.libido) pills.push('Desire: ' + log.libido + '/5');
      if (log.cervicalFluid && log.cervicalFluid !== 'none') pills.push('Fluid: ' + log.cervicalFluid);
      if (log.opk && log.opk !== 'none') pills.push('LH Strip: ' + log.opk.toUpperCase());
      if (log.energy) pills.push('Vitality: ' + log.energy + '/5');
      if (log.bbt) pills.push('BBT: ' + log.bbt + '°F');
      (log.sexActivities || []).forEach(function (sa) {
        const found = SEX_ACTIVITIES.find(function (x) { return x.id === sa; });
        pills.push(found ? found.icon + ' ' + found.label : sa);
      });
      (log.sexQualities || []).forEach(function (sq) { pills.push(sq); });
      (log.moods || []).forEach(function (m) { pills.push(m); });
      (log.symptoms || []).forEach(function (s) { pills.push(s); });

      logsEl.innerHTML =
        '<div class="flex flex-wrap gap-1.5">' +
          pills.map(function (t) {
            return '<span class="px-2 py-0.5 rounded-md surface-muted text-ink font-mono text-[11px]">' + escapeHtml(t) + '</span>';
          }).join('') +
        '</div>' +
        (log.notes ? '<p class="text-sub mt-2">“' + escapeHtml(log.notes) + '”</p>' : '');
    }
  }

  function renderThreeCycleForecast(profile) {
    const status = getCycleStatusForDate(profile, TODAY_ISO);
    const b = status.bounds;
    const firstNext = status.nextPeriodISO;
    const rows = [];

    for (let c = 0; c < 3; c++) {
      const pStart = addDays(firstNext, c * b.cycleLength);
      const pEnd = addDays(pStart, b.periodLength - 1);
      const ovDate = addDays(pStart, b.ovulationDay - 1);
      const fStart = addDays(ovDate, -3);
      const fEnd = addDays(ovDate, 1);

      rows.push(
        '<div class="surface-muted rounded-2xl p-3.5 flex items-center justify-between gap-2">' +
          '<div>' +
            '<div class="font-medium text-ink">Cycle +' + (c + 1) + ' Period: ' + formatShortDate(pStart) + ' – ' + formatShortDate(pEnd) + '</div>' +
            '<div class="text-[11px] font-mono text-sub mt-0.5">Fertile Window: ' + formatShortDate(fStart) + ' – ' + formatShortDate(fEnd) + '</div>' +
          '</div>' +
          '<span class="font-mono text-[11px] px-2.5 py-1 rounded-xl surface-card text-ink">' + formatDeltaDays(diffDays(pStart, TODAY_ISO)) + '</span>' +
        '</div>'
      );
    }
    document.getElementById('three-cycle-forecast').innerHTML = rows.join('');
  }

  let draftCheckin = {
    flow: 'none',
    sexActivities: [],
    sexQualities: [],
    libido: 3,
    cervicalFluid: 'none',
    opk: 'none',
    moods: [],
    symptoms: [],
    energy: 3,
    bbt: '',
    notes: ''
  };

  const LIBIDO_LABELS = {
    1: '1 / 5 (Dormant)',
    2: '2 / 5 (Quiet)',
    3: '3 / 5 (Receptive)',
    4: '4 / 5 (Spontaneous)',
    5: '5 / 5 (Peak Drive)'
  };

  function loadCheckinForDate(iso) {
    const p = getActiveProfile();
    if (!p) return;
    document.getElementById('checkin-profile-name').textContent = p.name;
    document.getElementById('checkin-date-input').value = iso;

    const status = getCycleStatusForDate(p, iso);
    document.getElementById('checkin-fertility-context').textContent =
      'Day ' + status.cycleDay + ' • ' + status.phaseInfo.conceptionBadge;

    const existing = (p.logs && p.logs[iso]) || null;
    draftCheckin = {
      flow: existing ? (existing.flow || 'none') : 'none',
      sexActivities: existing && Array.isArray(existing.sexActivities) ? existing.sexActivities.slice() : [],
      sexQualities: existing && Array.isArray(existing.sexQualities) ? existing.sexQualities.slice() : [],
      libido: existing && existing.libido ? Number(existing.libido) : 3,
      cervicalFluid: existing ? (existing.cervicalFluid || 'none') : 'none',
      opk: existing ? (existing.opk || 'none') : 'none',
      moods: existing && Array.isArray(existing.moods) ? existing.moods.slice() : [],
      symptoms: existing && Array.isArray(existing.symptoms) ? existing.symptoms.slice() : [],
      energy: existing && existing.energy ? Number(existing.energy) : 3,
      bbt: existing && existing.bbt ? String(existing.bbt) : '',
      notes: existing && existing.notes ? String(existing.notes) : ''
    };

    renderCheckinControls();
  }

  function renderCheckinControls() {
    document.querySelectorAll('.flow-btn').forEach(function (btn) {
      const val = btn.getAttribute('data-flow');
      if (val === draftCheckin.flow) {
        btn.className = 'flow-btn tactile-btn px-3 py-2.5 rounded-xl border border-[#C25949] bg-[#C25949] text-white text-xs font-medium';
      } else {
        btn.className = 'flow-btn tactile-btn px-3 py-2.5 rounded-xl border border-subtle surface-muted text-ink text-xs font-medium';
      }
    });

    const sexActWrap = document.getElementById('sex-activity-options');
    sexActWrap.innerHTML = '';
    SEX_ACTIVITIES.forEach(function (act) {
      const active = draftCheckin.sexActivities.indexOf(act.id) !== -1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tactile-btn px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 ' +
        (active
          ? 'bg-[#C95B78] text-white border-transparent'
          : 'surface-card border-subtle text-ink');
      b.innerHTML = '<span>' + act.icon + '</span><span>' + escapeHtml(act.label) + '</span>';
      b.addEventListener('click', function () {
        toggleArrayItem(draftCheckin.sexActivities, act.id);
        renderCheckinControls();
      });
      sexActWrap.appendChild(b);
    });

    document.getElementById('checkin-libido-slider').value = String(draftCheckin.libido);
    document.getElementById('checkin-libido-val').textContent = LIBIDO_LABELS[draftCheckin.libido] || (draftCheckin.libido + ' / 5');

    const sexQualWrap = document.getElementById('sex-quality-options');
    sexQualWrap.innerHTML = '';
    SEX_QUALITIES.forEach(function (q) {
      const active = draftCheckin.sexQualities.indexOf(q) !== -1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tactile-btn px-2.5 py-1 rounded-full text-[11px] font-medium border ' +
        (active
          ? 'bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010] border-transparent'
          : 'surface-card border-subtle text-sub');
      b.textContent = q;
      b.addEventListener('click', function () {
        toggleArrayItem(draftCheckin.sexQualities, q);
        renderCheckinControls();
      });
      sexQualWrap.appendChild(b);
    });

    const cfWrap = document.getElementById('cervical-fluid-options');
    cfWrap.innerHTML = '';
    CERVICAL_FLUIDS.forEach(function (cf) {
      const active = draftCheckin.cervicalFluid === cf.id;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tactile-btn p-2.5 rounded-xl border text-left ' +
        (active
          ? 'bg-[#C4862D] text-white border-transparent'
          : 'surface-card border-subtle text-ink');
      b.innerHTML = '<div class="text-xs font-medium">' + escapeHtml(cf.label) + '</div><div class="text-[10px] opacity-75">' + escapeHtml(cf.sub) + '</div>';
      b.addEventListener('click', function () {
        draftCheckin.cervicalFluid = cf.id;
        renderCheckinControls();
      });
      cfWrap.appendChild(b);
    });

    document.querySelectorAll('.opk-btn').forEach(function (btn) {
      const val = btn.getAttribute('data-opk');
      if (val === draftCheckin.opk) {
        btn.className = 'opk-btn px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
      } else {
        btn.className = 'opk-btn px-2.5 py-1 rounded-lg text-[10px] font-mono surface-card text-sub';
      }
    });

    const moodWrap = document.getElementById('mood-options');
    moodWrap.innerHTML = '';
    MOOD_TAGS.forEach(function (tag) {
      const active = draftCheckin.moods.indexOf(tag) !== -1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tactile-btn px-3 py-1.5 rounded-full text-xs font-medium border ' +
        (active
          ? 'bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010] border-transparent'
          : 'surface-muted border-subtle text-sub');
      b.textContent = tag;
      b.addEventListener('click', function () {
        toggleArrayItem(draftCheckin.moods, tag);
        renderCheckinControls();
      });
      moodWrap.appendChild(b);
    });

    const symWrap = document.getElementById('symptom-options');
    symWrap.innerHTML = '';
    SYMPTOM_TAGS.forEach(function (tag) {
      const active = draftCheckin.symptoms.indexOf(tag) !== -1;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tactile-btn px-3 py-1.5 rounded-full text-xs font-medium border ' +
        (active
          ? 'bg-[#3E7A6E] text-white border-transparent'
          : 'surface-muted border-subtle text-sub');
      b.textContent = tag;
      b.addEventListener('click', function () {
        toggleArrayItem(draftCheckin.symptoms, tag);
        renderCheckinControls();
      });
      symWrap.appendChild(b);
    });

    document.getElementById('checkin-energy-slider').value = String(draftCheckin.energy);
    document.getElementById('checkin-energy-val').textContent = draftCheckin.energy + ' / 5';
    document.getElementById('checkin-bbt-input').value = draftCheckin.bbt;
    document.getElementById('checkin-notes').value = draftCheckin.notes;
  }

  function toggleArrayItem(arr, item) {
    const idx = arr.indexOf(item);
    if (idx === -1) arr.push(item);
    else arr.splice(idx, 1);
  }

  function renderAtlasView() {
    const grid = document.getElementById('atlas-cards-grid');
    if (!grid) return;

    document.querySelectorAll('.atlas-cat-btn').forEach(function (b) {
      const c = b.getAttribute('data-atlas-cat');
      if (c === atlasCategory) {
        b.className = 'atlas-cat-btn tactile-btn px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
      } else {
        b.className = 'atlas-cat-btn tactile-btn px-3 py-1.5 rounded-full text-xs font-medium surface-muted text-sub';
      }
    });

    const filtered = ATLAS_MODULES.filter(function (m) {
      return atlasCategory === 'all' || m.cat === atlasCategory;
    });

    grid.innerHTML = filtered.map(function (mod) {
      return (
        '<article class="surface-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4">' +
          '<div>' +
            '<div class="flex items-center justify-between gap-2 mb-2">' +
              '<span class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full surface-muted text-sub">' + escapeHtml(mod.badge) + '</span>' +
            '</div>' +
            '<h3 class="font-serif text-2xl text-ink leading-snug">' + escapeHtml(mod.title) + '</h3>' +
            '<div class="my-3 p-3 rounded-2xl surface-muted text-ink">' + mod.svg + '</div>' +
            '<p class="text-xs sm:text-sm text-sub leading-relaxed">' + escapeHtml(mod.summary) + '</p>' +
          '</div>' +
          '<div class="pt-3 border-t border-subtle space-y-1.5">' +
            '<p class="text-xs text-ink font-medium">' + escapeHtml(mod.takeaway) + '</p>' +
            '<div class="text-[10px] font-mono text-faint">' + escapeHtml(mod.sourceLabel) + '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderPeopleView() {
    const grid = document.getElementById('multi-profile-grid');
    grid.innerHTML = '';

    state.profiles.forEach(function (p) {
      const status = getCycleStatusForDate(p, TODAY_ISO);
      const ph = status.phaseInfo;
      const card = document.createElement('div');
      card.className = 'surface-card rounded-3xl p-5 flex flex-col justify-between gap-4';

      card.innerHTML =
        '<div>' +
          '<div class="flex items-center justify-between gap-2">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-xl text-white" style="background-color:' + p.color + '">' + escapeHtml(p.name.charAt(0).toUpperCase()) + '</div>' +
              '<div>' +
                '<div class="flex items-center gap-2">' +
                  '<h3 class="font-serif text-2xl text-ink leading-none">' + escapeHtml(p.name) + '</h3>' +
                  '<span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full surface-muted text-sub">' + escapeHtml(p.relation) + '</span>' +
                '</div>' +
                '<div class="text-xs font-mono text-sub mt-1">Day ' + status.cycleDay + ' of ' + status.bounds.cycleLength + ' • ' + ph.phaseName + '</div>' +
              '</div>' +
            '</div>' +
            '<span class="w-3 h-3 rounded-full shrink-0" style="background-color:' + ph.color + '"></span>' +
          '</div>' +

          '<div class="mt-4 pt-3 border-t border-subtle space-y-2 text-xs">' +
            '<p class="text-ink font-medium leading-snug">' + escapeHtml(ph.headline) + '</p>' +
            '<p class="text-sub leading-relaxed"><strong>Care Cue:</strong> ' + escapeHtml(ph.partnerBody) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="pt-3 border-t border-subtle flex items-center justify-between text-xs">' +
          '<span class="font-mono text-sub">Next flow: <strong>' + formatShortDate(status.nextPeriodISO) + '</strong> (' + formatDeltaDays(status.daysUntilNextPeriod) + ')</span>' +
          '<div class="flex items-center gap-2">' +
            '<button type="button" data-export-id="' + p.id + '" class="btn-card-export text-sub underline font-mono text-[11px]">Export</button>' +
            '<button type="button" data-edit-id="' + p.id + '" class="btn-card-edit text-sub underline">Edit</button>' +
            '<button type="button" data-switch-id="' + p.id + '" class="btn-card-switch tactile-btn px-3 py-1 rounded-full surface-muted text-ink font-medium">Inspect →</button>' +
          '</div>' +
        '</div>';

      grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-card-switch').forEach(function (b) {
      b.addEventListener('click', function () {
        state.activeProfileId = b.getAttribute('data-switch-id');
        state.activeView = 'cycle';
        state.selectedCycleDay = null;
        saveState();
        renderAll();
      });
    });

    grid.querySelectorAll('.btn-card-edit').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-edit-id');
        const prof = state.profiles.find(function (x) { return x.id === id; });
        if (prof) openProfileModal(prof);
      });
    });

    grid.querySelectorAll('.btn-card-export').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-export-id');
        const prof = state.profiles.find(function (x) { return x.id === id; });
        if (prof) exportSingleProfileJSON(prof);
      });
    });

    const timeline = document.getElementById('multi-person-timeline');
    let headerCells = '<div class="w-28 shrink-0 text-[11px] font-mono text-faint">Person</div>';
    for (let d = 0; d < 14; d++) {
      const iso = addDays(TODAY_ISO, d);
      const dt = parseISO(iso);
      headerCells +=
        '<div class="flex-1 text-center text-[10px] font-mono text-faint">' +
          '<div>' + dt.toLocaleDateString('en-US', { weekday: 'narrow' }) + '</div>' +
          '<div class="text-ink">' + dt.getDate() + '</div>' +
        '</div>';
    }

    let rowsHtml = '<div class="flex items-center gap-1 pb-2 border-b border-subtle">' + headerCells + '</div>';

    state.profiles.forEach(function (p) {
      let cells = '<div class="w-28 shrink-0 pr-2 truncate text-xs font-medium text-ink flex items-center gap-1.5">' +
        '<span class="w-2 h-2 rounded-full" style="background-color:' + p.color + '"></span>' +
        escapeHtml(p.name) + '</div>';

      for (let d = 0; d < 14; d++) {
        const iso = addDays(TODAY_ISO, d);
        const st = getCycleStatusForDate(p, iso);
        cells +=
          '<div class="flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono text-white" ' +
          'style="background-color:' + st.phaseInfo.color + '" title="' + escapeHtml(p.name) + ' • ' + formatShortDate(iso) + ': Day ' + st.cycleDay + ' (' + st.phaseInfo.phaseName + ')">' +
          'D' + st.cycleDay +
          '</div>';
      }
      rowsHtml += '<div class="flex items-center gap-1">' + cells + '</div>';
    });

    timeline.innerHTML = rowsHtml;
  }

  function renderHistoryView() {
    const p = getActiveProfile();
    if (!p) return;
    const sorted = sortPeriods(p.periods).reverse();
    const listEl = document.getElementById('history-cycles-list');

    if (sorted.length === 0) {
      listEl.innerHTML = '<div class="text-xs text-sub">No periods logged yet.</div>';
    } else {
      listEl.innerHTML = sorted.map(function (per, idx) {
        const nextNewer = idx > 0 ? sorted[idx - 1] : null;
        const cycleLen = nextNewer ? diffDays(nextNewer.start, per.start) : p.cycleLength;
        const label = idx === 0 ? 'Current Cycle (Active)' : 'Cycle Length: ' + cycleLen + ' days';
        const barWidth = Math.min(100, Math.round((cycleLen / 38) * 100));

        return (
          '<div class="surface-muted rounded-2xl p-3.5 space-y-2">' +
            '<div class="flex items-center justify-between text-xs">' +
              '<span class="font-medium text-ink">Started ' + formatFullDate(per.start) + '</span>' +
              '<div class="flex items-center gap-2">' +
                '<span class="font-mono text-sub">' + label + ' • Flow: ' + per.length + 'd</span>' +
                (sorted.length > 1
                  ? '<button type="button" data-del-start="' + per.start + '" class="btn-del-period text-[11px] font-mono text-[#C25949] underline">Remove</button>'
                  : '') +
              '</div>' +
            '</div>' +
            '<div class="w-full h-2 rounded-full surface-card overflow-hidden flex">' +
              '<div class="h-full bg-[#C25949]" style="width:' + Math.round((per.length / cycleLen) * barWidth) + '%"></div>' +
              '<div class="h-full bg-[#3E7A6E]" style="width:' + Math.round(((cycleLen - p.lutealLength - per.length) / cycleLen) * barWidth) + '%"></div>' +
              '<div class="h-full bg-[#7C5879]" style="width:' + Math.round((p.lutealLength / cycleLen) * barWidth) + '%"></div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      listEl.querySelectorAll('.btn-del-period').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const st = btn.getAttribute('data-del-start');
          p.periods = (p.periods || []).filter(function (x) { return x.start !== st; });
          recalculateProfileCycleStats(p);
          saveState();
          renderAll();
        });
      });
    }

    const b = getPhaseBounds(p);
    const acogStatus = (b.cycleLength >= 21 && b.cycleLength <= 35) ? 'Normal (21–35d ACOG range)' : 'Evaluate (>35d or <21d)';
    document.getElementById('history-metrics-summary').innerHTML =
      '<div class="flex justify-between py-1.5 border-b border-subtle"><span class="text-sub">Average Cycle Length</span><span class="font-mono text-ink">' + b.cycleLength + ' days</span></div>' +
      '<div class="flex justify-between py-1.5 border-b border-subtle"><span class="text-sub">Average Bleeding Duration</span><span class="font-mono text-ink">' + b.periodLength + ' days</span></div>' +
      '<div class="flex justify-between py-1.5 border-b border-subtle"><span class="text-sub">Estimated Ovulation Day</span><span class="font-mono text-ink">Day ' + b.ovulationDay + '</span></div>' +
      '<div class="flex justify-between py-1.5 border-b border-subtle"><span class="text-sub">Luteal Phase Length</span><span class="font-mono text-ink">' + b.lutealLength + ' days</span></div>' +
      '<div class="flex justify-between py-1.5"><span class="text-sub">Vital Sign Status</span><span class="font-mono text-[#3E7A6E]">' + acogStatus + '</span></div>';

    // Render Phase Correlation Matrix
    const phaseBuckets = {
      menstrual: { title: 'Menstrual', color: '#C25949', tags: [] },
      follicular: { title: 'Follicular', color: '#3E7A6E', tags: [] },
      ovulatory: { title: 'Ovulatory', color: '#C4862D', tags: [] },
      luteal: { title: 'Luteal', color: '#7C5879', tags: [] }
    };

    const logDates = Object.keys(p.logs || {}).sort().reverse();
    logDates.forEach(function (iso) {
      const st = getCycleStatusForDate(p, iso);
      const pk = st.phaseInfo.phaseKey;
      const entry = p.logs[iso];
      if (phaseBuckets[pk]) {
        (entry.moods || []).forEach(function (m) { phaseBuckets[pk].tags.push(m); });
        (entry.symptoms || []).forEach(function (s) { phaseBuckets[pk].tags.push(s); });
        if (entry.libido >= 4) phaseBuckets[pk].tags.push('High Desire');
      }
    });

    const matrixEl = document.getElementById('phase-correlation-matrix');
    matrixEl.innerHTML = Object.keys(phaseBuckets).map(function (k) {
      const bucket = phaseBuckets[k];
      const unique = Array.from(new Set(bucket.tags)).slice(0, 4);
      return (
        '<div class="surface-muted rounded-2xl p-3.5">' +
          '<div class="flex items-center gap-2 mb-1.5">' +
            '<span class="w-2 h-2 rounded-full" style="background-color:' + bucket.color + '"></span>' +
            '<span class="font-medium text-ink">' + bucket.title + ' Patterns</span>' +
          '</div>' +
          '<div class="text-[11px] text-sub">' +
            (unique.length ? escapeHtml(unique.join(' · ')) : 'Log daily check-ins to surface phase correlations') +
          '</div>' +
        '</div>'
      );
    }).join('');

    const logsEl = document.getElementById('history-logs-list');
    if (logDates.length === 0) {
      logsEl.innerHTML = '<div class="text-faint italic">No daily check-in entries logged yet.</div>';
    } else {
      logsEl.innerHTML = logDates.map(function (iso) {
        const entry = p.logs[iso];
        const tags = [].concat(
          (entry.sexActivities || []).map(function (s) { return 'Intimacy: ' + s; }),
          entry.sexQualities || [],
          entry.moods || [],
          entry.symptoms || []
        );
        return (
          '<div class="surface-muted rounded-2xl p-3 space-y-1">' +
            '<div class="flex items-center justify-between font-mono text-[11px]">' +
              '<span class="text-ink font-medium">' + formatShortDate(iso) + '</span>' +
              '<span class="text-sub">Vitality ' + (entry.energy || 3) + '/5' +
                (entry.libido ? ' • Desire ' + entry.libido + '/5' : '') +
                (entry.bbt ? ' • ' + entry.bbt + '°F' : '') + '</span>' +
            '</div>' +
            (tags.length ? '<div class="text-[11px] text-sub">' + escapeHtml(tags.join(' · ')) + '</div>' : '') +
            (entry.notes ? '<div class="text-xs text-ink italic">“' + escapeHtml(entry.notes) + '”</div>' : '') +
          '</div>'
        );
      }).join('');
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAll() {
    const hasProfiles = Array.isArray(state.profiles) && state.profiles.length > 0;
    const onboardSec = document.getElementById('view-onboarding');
    const workspace = document.getElementById('workspace-authenticated');
    const mainNav = document.getElementById('main-nav-container');
    const mobileDock = document.getElementById('mobile-bottom-dock');
    const logPeriodBtn = document.getElementById('btn-open-log-period');

    if (!hasProfiles) {
      applyTheme('menstrual');
      onboardSec.classList.remove('hidden');
      workspace.classList.add('hidden');
      mainNav.classList.add('hidden');
      mobileDock.classList.add('hidden');
      logPeriodBtn.classList.add('hidden');
      document.getElementById('profile-switcher-bar').innerHTML =
        '<span class="text-xs font-mono text-faint">Welcome</span>';
      return;
    }

    onboardSec.classList.add('hidden');
    workspace.classList.remove('hidden');
    mainNav.classList.remove('hidden');
    mobileDock.classList.remove('hidden');
    logPeriodBtn.classList.remove('hidden');

    const active = getActiveProfile();
    const todayStatus = getCycleStatusForDate(active, TODAY_ISO);
    applyTheme(todayStatus.phaseInfo.phaseKey);

    renderHeaderAndSwitcher();
    renderActiveProfileBanner();

    const views = ['cycle', 'calendar', 'checkin', 'atlas', 'people', 'history'];
    views.forEach(function (v) {
      const el = document.getElementById('view-' + v);
      if (v === state.activeView) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    if (state.activeView === 'cycle') renderCycleView();
    else if (state.activeView === 'calendar') renderCalendarView();
    else if (state.activeView === 'checkin') loadCheckinForDate(state.selectedCalendarDate || TODAY_ISO);
    else if (state.activeView === 'atlas') renderAtlasView();
    else if (state.activeView === 'people') renderPeopleView();
    else if (state.activeView === 'history') renderHistoryView();
  }

  function exportSingleProfileJSON(profile) {
    if (!profile) return;
    const payload = {
      type: 'cadence_single_profile',
      version: '3.0',
      exportedAt: TODAY_ISO,
      profile: profile
    };
    downloadJSON(payload, 'cadence_profile_' + profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json');
  }

  function downloadJSON(obj, filename) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleImportedJSONFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const parsed = JSON.parse(String(ev.target.result));
        if (parsed && parsed.type === 'cadence_single_profile' && parsed.profile && parsed.profile.name) {
          const incoming = parsed.profile;
          incoming.id = 'p_' + Date.now();
          state.profiles.push(incoming);
          state.activeProfileId = incoming.id;
          saveState();
          renderAll();
          showPwaMessage('Imported profile: ' + incoming.name);
        } else if (parsed && Array.isArray(parsed.profiles)) {
          state = parsed;
          if (state.profiles.length > 0 && !state.activeProfileId) {
            state.activeProfileId = state.profiles[0].id;
          }
          saveState();
          renderAll();
          showPwaMessage('Full vault restored (' + state.profiles.length + ' profiles).');
        } else if (parsed && parsed.name && Array.isArray(parsed.periods)) {
          parsed.id = 'p_' + Date.now();
          state.profiles.push(parsed);
          state.activeProfileId = parsed.id;
          saveState();
          renderAll();
          showPwaMessage('Imported profile: ' + parsed.name);
        } else {
          showPwaMessage('Unrecognized JSON structure.');
        }
      } catch (err) {
        showPwaMessage('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function openProfileModal(profileObj) {
    const modal = document.getElementById('modal-profile');
    const delBtn = document.getElementById('btn-delete-profile');

    if (profileObj) {
      document.getElementById('modal-profile-title').textContent = 'Edit ' + profileObj.name;
      document.getElementById('profile-id-input').value = profileObj.id;
      document.getElementById('profile-name-input').value = profileObj.name;
      document.getElementById('profile-relation-input').value = profileObj.relation;
      document.getElementById('profile-goal-input').value = profileObj.goal || 'rhythm';
      document.getElementById('profile-cycle-len').value = String(profileObj.cycleLength);
      document.getElementById('profile-period-len').value = String(profileObj.periodLength);
      document.getElementById('profile-luteal-len').value = String(profileObj.lutealLength);
      document.getElementById('profile-last-period').value = getLatestPeriodStart(profileObj);
      selectedModalColor = profileObj.color || '#C25949';
      delBtn.classList.remove('hidden');
    } else {
      document.getElementById('modal-profile-title').textContent = 'Add Person';
      document.getElementById('profile-id-input').value = '';
      document.getElementById('profile-name-input').value = '';
      document.getElementById('profile-relation-input').value = state.profiles.length === 0 ? 'Self' : 'Partner';
      document.getElementById('profile-goal-input').value = 'rhythm';
      document.getElementById('profile-cycle-len').value = '28';
      document.getElementById('profile-period-len').value = '5';
      document.getElementById('profile-luteal-len').value = '14';
      document.getElementById('profile-last-period').value = addDays(TODAY_ISO, -7);
      selectedModalColor = '#3E7A6E';
      delBtn.classList.add('hidden');
    }

    updateColorSwatches();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeProfileModal() {
    const modal = document.getElementById('modal-profile');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function updateColorSwatches() {
    document.querySelectorAll('.color-swatch').forEach(function (sw) {
      const c = sw.getAttribute('data-color');
      if (c === selectedModalColor) {
        sw.classList.add('ring-2');
      } else {
        sw.classList.remove('ring-2');
      }
    });
  }

  function bindEvents() {
    const onboardDateInput = document.getElementById('onboard-last-period');
    if (onboardDateInput) onboardDateInput.value = addDays(TODAY_ISO, -10);

    document.getElementById('onboard-cycle-len').addEventListener('input', function (e) {
      document.getElementById('onboard-cycle-val').textContent = e.target.value + ' days';
    });
    document.getElementById('onboard-period-len').addEventListener('input', function (e) {
      document.getElementById('onboard-period-val').textContent = e.target.value + ' days';
    });
    document.getElementById('onboard-luteal-len').addEventListener('input', function (e) {
      document.getElementById('onboard-luteal-val').textContent = e.target.value + ' days';
    });

    document.querySelectorAll('.onboard-goal-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onboardGoal = btn.getAttribute('data-goal');
        document.querySelectorAll('.onboard-goal-btn').forEach(function (b) {
          if (b.getAttribute('data-goal') === onboardGoal) {
            b.className = 'onboard-goal-btn tactile-btn p-3 rounded-xl border border-subtle text-left bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
          } else {
            b.className = 'onboard-goal-btn tactile-btn p-3 rounded-xl border border-subtle surface-muted text-ink text-left';
          }
        });
      });
    });

    document.querySelectorAll('.onboard-swatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        onboardColor = sw.getAttribute('data-onboard-color');
        document.querySelectorAll('.onboard-swatch').forEach(function (s) {
          if (s.getAttribute('data-onboard-color') === onboardColor) {
            s.classList.add('ring-2');
          } else {
            s.classList.remove('ring-2');
          }
        });
      });
    });

    document.getElementById('form-onboarding').addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('onboard-name').value.trim() || 'Me';
      const relation = document.getElementById('onboard-relation').value;
      const cycleLen = Number(document.getElementById('onboard-cycle-len').value) || 28;
      const periodLen = Number(document.getElementById('onboard-period-len').value) || 5;
      const lutealLen = Number(document.getElementById('onboard-luteal-len').value) || 14;
      const lastPeriod = document.getElementById('onboard-last-period').value || addDays(TODAY_ISO, -10);

      const newId = 'p_' + Date.now();
      state.profiles = [{
        id: newId,
        name: name,
        relation: relation,
        goal: onboardGoal,
        color: onboardColor,
        cycleLength: cycleLen,
        periodLength: periodLen,
        lutealLength: lutealLen,
        periods: [
          { start: addDays(lastPeriod, -cycleLen), length: periodLen },
          { start: lastPeriod, length: periodLen }
        ],
        logs: {}
      }];
      state.activeProfileId = newId;
      state.activeView = 'cycle';
      saveState();
      renderAll();
    });

    document.getElementById('onboard-import-file').addEventListener('change', function (e) {
      handleImportedJSONFile(e.target.files && e.target.files[0]);
    });

    document.getElementById('btn-onboard-load-sample').addEventListener('click', function () {
      state = buildSampleHouseholdState();
      saveState();
      renderAll();
    });

    document.getElementById('btn-theme-toggle').addEventListener('click', function () {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      renderAll();
    });

    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.activeView = tab.getAttribute('data-view');
        saveState();
        renderAll();
      });
    });

    document.querySelectorAll('.dock-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeView = btn.getAttribute('data-dock-view');
        saveState();
        renderAll();
      });
    });

    // Copy Partner Care Note
    document.getElementById('btn-copy-partner-note').addEventListener('click', function () {
      const p = getActiveProfile();
      if (!p) return;
      const st = getCycleStatusForDate(p, TODAY_ISO);
      const day = state.selectedCycleDay !== null ? state.selectedCycleDay : st.cycleDay;
      const info = getDayInsight(p, day);
      const note = p.name + ' is on Day ' + day + ' (' + info.phaseName + '). ' + info.partnerTitle + ': ' + info.partnerBody;
      copyTextToClipboard(note);
      const fb = document.getElementById('copy-partner-feedback');
      fb.classList.remove('hidden');
      setTimeout(function () { fb.classList.add('hidden'); }, 2200);
    });

    // Copy Doctor Summary
    document.getElementById('btn-copy-doctor-summary').addEventListener('click', function () {
      const p = getActiveProfile();
      if (!p) return;
      const b = getPhaseBounds(p);
      const summary = 'Cadence Clinical Cycle Summary for ' + p.name + ' (' + TODAY_ISO + '):\n' +
        '- Average Cycle Length: ' + b.cycleLength + ' days\n' +
        '- Average Period Duration: ' + b.periodLength + ' days\n' +
        '- Estimated Luteal Phase: ' + b.lutealLength + ' days\n' +
        '- Recent Period Starts: ' + sortPeriods(p.periods).map(function (x) { return x.start; }).join(', ');
      copyTextToClipboard(summary);
      const fb = document.getElementById('copy-doctor-feedback');
      fb.classList.remove('hidden');
      setTimeout(function () { fb.classList.add('hidden'); }, 2400);
    });

    document.getElementById('btn-chart-hormones').addEventListener('click', function () {
      chartMode = 'hormones';
      document.getElementById('btn-chart-hormones').className = 'tactile-btn px-3 py-1 rounded-full font-medium bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
      document.getElementById('btn-chart-bbt').className = 'tactile-btn px-3 py-1 rounded-full font-medium text-sub';
      renderCycleView();
    });

    document.getElementById('btn-chart-bbt').addEventListener('click', function () {
      chartMode = 'bbt';
      document.getElementById('btn-chart-bbt').className = 'tactile-btn px-3 py-1 rounded-full font-medium bg-[#1C1917] text-[#F7F4EF] dark:bg-[#F4EFEA] dark:text-[#121010]';
      document.getElementById('btn-chart-hormones').className = 'tactile-btn px-3 py-1 rounded-full font-medium text-sub';
      renderCycleView();
    });

    document.getElementById('btn-quick-log-intimacy').addEventListener('click', function () {
      state.selectedCalendarDate = TODAY_ISO;
      state.activeView = 'checkin';
      saveState();
      renderAll();
    });

    document.querySelectorAll('.atlas-cat-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        atlasCategory = btn.getAttribute('data-atlas-cat');
        renderAtlasView();
      });
    });

    document.getElementById('cycle-day-slider').addEventListener('input', function (e) {
      state.selectedCycleDay = Number(e.target.value);
      renderCycleView();
    });

    document.getElementById('btn-reset-today').addEventListener('click', function () {
      state.selectedCycleDay = null;
      renderCycleView();
    });

    document.getElementById('btn-jump-calendar').addEventListener('click', function () {
      state.activeView = 'calendar';
      saveState();
      renderAll();
    });

    document.getElementById('cal-prev-month').addEventListener('click', function () {
      state.calendarMonthOffset -= 1;
      renderCalendarView();
    });
    document.getElementById('cal-next-month').addEventListener('click', function () {
      state.calendarMonthOffset += 1;
      renderCalendarView();
    });
    document.getElementById('cal-today-btn').addEventListener('click', function () {
      state.calendarMonthOffset = 0;
      state.selectedCalendarDate = TODAY_ISO;
      renderCalendarView();
    });

    document.getElementById('btn-cal-toggle-period').addEventListener('click', function () {
      const p = getActiveProfile();
      if (!p) return;
      const iso = state.selectedCalendarDate || TODAY_ISO;
      const exists = (p.periods || []).some(function (x) { return x.start === iso; });
      if (exists) {
        if (p.periods.length > 1) {
          p.periods = p.periods.filter(function (x) { return x.start !== iso; });
        }
      } else {
        p.periods.push({ start: iso, length: p.periodLength || 5 });
      }
      recalculateProfileCycleStats(p);
      saveState();
      renderAll();
    });

    document.getElementById('btn-cal-open-checkin').addEventListener('click', function () {
      state.activeView = 'checkin';
      saveState();
      renderAll();
    });

    document.getElementById('checkin-date-input').addEventListener('change', function (e) {
      state.selectedCalendarDate = e.target.value || TODAY_ISO;
      loadCheckinForDate(state.selectedCalendarDate);
    });

    document.querySelectorAll('.flow-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draftCheckin.flow = btn.getAttribute('data-flow');
        renderCheckinControls();
      });
    });

    document.getElementById('checkin-libido-slider').addEventListener('input', function (e) {
      draftCheckin.libido = Number(e.target.value);
      document.getElementById('checkin-libido-val').textContent = LIBIDO_LABELS[draftCheckin.libido] || (draftCheckin.libido + ' / 5');
    });

    document.querySelectorAll('.opk-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        draftCheckin.opk = btn.getAttribute('data-opk');
        renderCheckinControls();
      });
    });

    document.getElementById('checkin-energy-slider').addEventListener('input', function (e) {
      draftCheckin.energy = Number(e.target.value);
      document.getElementById('checkin-energy-val').textContent = draftCheckin.energy + ' / 5';
    });

    document.getElementById('checkin-bbt-input').addEventListener('input', function (e) {
      draftCheckin.bbt = e.target.value;
    });

    document.getElementById('checkin-notes').addEventListener('input', function (e) {
      draftCheckin.notes = e.target.value;
    });

    document.getElementById('checkin-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const p = getActiveProfile();
      if (!p) return;
      const iso = document.getElementById('checkin-date-input').value || TODAY_ISO;
      if (!p.logs) p.logs = {};
      p.logs[iso] = {
        flow: draftCheckin.flow,
        sexActivities: draftCheckin.sexActivities.slice(),
        sexQualities: draftCheckin.sexQualities.slice(),
        libido: draftCheckin.libido,
        cervicalFluid: draftCheckin.cervicalFluid,
        opk: draftCheckin.opk,
        moods: draftCheckin.moods.slice(),
        symptoms: draftCheckin.symptoms.slice(),
        energy: draftCheckin.energy,
        bbt: draftCheckin.bbt,
        notes: draftCheckin.notes.trim()
      };
      saveState();
      const fb = document.getElementById('checkin-save-feedback');
      fb.classList.remove('opacity-0');
      setTimeout(function () { fb.classList.add('opacity-0'); }, 2200);
    });

    document.getElementById('btn-clear-checkin').addEventListener('click', function () {
      const p = getActiveProfile();
      if (!p) return;
      const iso = document.getElementById('checkin-date-input').value || TODAY_ISO;
      if (p.logs && p.logs[iso]) {
        delete p.logs[iso];
        saveState();
      }
      loadCheckinForDate(iso);
    });

    document.getElementById('btn-edit-active-profile').addEventListener('click', function () {
      openProfileModal(getActiveProfile());
    });
    document.getElementById('btn-export-active-profile').addEventListener('click', function () {
      exportSingleProfileJSON(getActiveProfile());
    });
    document.getElementById('btn-add-profile').addEventListener('click', function () {
      openProfileModal(null);
    });
    document.getElementById('btn-close-profile-modal').addEventListener('click', closeProfileModal);
    document.getElementById('btn-cancel-profile').addEventListener('click', closeProfileModal);

    document.querySelectorAll('.color-swatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        selectedModalColor = sw.getAttribute('data-color');
        updateColorSwatches();
      });
    });

    document.getElementById('form-profile').addEventListener('submit', function (e) {
      e.preventDefault();
      const id = document.getElementById('profile-id-input').value;
      const name = document.getElementById('profile-name-input').value.trim() || 'Person';
      const relation = document.getElementById('profile-relation-input').value;
      const goal = document.getElementById('profile-goal-input').value || 'rhythm';
      const cycleLength = Math.min(45, Math.max(20, Number(document.getElementById('profile-cycle-len').value) || 28));
      const periodLength = Math.min(10, Math.max(2, Number(document.getElementById('profile-period-len').value) || 5));
      const lutealLength = Math.min(17, Math.max(10, Number(document.getElementById('profile-luteal-len').value) || 14));
      const lastPeriod = document.getElementById('profile-last-period').value || TODAY_ISO;

      if (id) {
        const existing = state.profiles.find(function (x) { return x.id === id; });
        if (existing) {
          existing.name = name;
          existing.relation = relation;
          existing.goal = goal;
          existing.cycleLength = cycleLength;
          existing.periodLength = periodLength;
          existing.lutealLength = lutealLength;
          existing.color = selectedModalColor;
          const hasDate = (existing.periods || []).some(function (p) { return p.start === lastPeriod; });
          if (!hasDate) {
            existing.periods.push({ start: lastPeriod, length: periodLength });
          }
        }
      } else {
        const newId = 'p_' + Date.now();
        state.profiles.push({
          id: newId,
          name: name,
          relation: relation,
          goal: goal,
          color: selectedModalColor,
          cycleLength: cycleLength,
          periodLength: periodLength,
          lutealLength: lutealLength,
          periods: [{ start: lastPeriod, length: periodLength }],
          logs: {}
        });
        state.activeProfileId = newId;
      }

      state.selectedCycleDay = null;
      saveState();
      closeProfileModal();
      renderAll();
    });

    document.getElementById('btn-delete-profile').addEventListener('click', function () {
      const id = document.getElementById('profile-id-input').value;
      state.profiles = state.profiles.filter(function (x) { return x.id !== id; });
      state.activeProfileId = state.profiles.length > 0 ? state.profiles[0].id : null;
      saveState();
      closeProfileModal();
      renderAll();
    });

    const periodModal = document.getElementById('modal-log-period');
    function openPeriodModal() {
      const p = getActiveProfile();
      if (!p) return;
      document.getElementById('period-modal-person-name').textContent = p.name;
      document.getElementById('period-start-date-input').value = TODAY_ISO;
      document.getElementById('period-duration-input').value = String(p.periodLength || 5);
      periodModal.classList.remove('hidden');
      periodModal.classList.add('flex');
    }
    function closePeriodModal() {
      periodModal.classList.add('hidden');
      periodModal.classList.remove('flex');
    }

    document.getElementById('btn-open-log-period').addEventListener('click', openPeriodModal);
    document.getElementById('btn-history-add-period').addEventListener('click', openPeriodModal);
    document.getElementById('btn-close-period-modal').addEventListener('click', closePeriodModal);
    document.getElementById('btn-cancel-period-modal').addEventListener('click', closePeriodModal);

    document.getElementById('form-log-period').addEventListener('submit', function (e) {
      e.preventDefault();
      const p = getActiveProfile();
      if (!p) return;
      const startISO = document.getElementById('period-start-date-input').value || TODAY_ISO;
      const dur = Math.min(10, Math.max(2, Number(document.getElementById('period-duration-input').value) || 5));
      if (!p.periods) p.periods = [];
      const existing = p.periods.find(function (x) { return x.start === startISO; });
      if (existing) existing.length = dur;
      else p.periods.push({ start: startISO, length: dur });
      p.periodLength = dur;
      recalculateProfileCycleStats(p);
      state.selectedCycleDay = null;
      saveState();
      closePeriodModal();
      renderAll();
    });

    const pwaModal = document.getElementById('modal-pwa');
    document.getElementById('btn-open-pwa').addEventListener('click', function () {
      pwaModal.classList.remove('hidden');
      pwaModal.classList.add('flex');
    });
    document.getElementById('btn-close-pwa-modal').addEventListener('click', function () {
      pwaModal.classList.add('hidden');
      pwaModal.classList.remove('flex');
    });

    document.getElementById('btn-export-json').addEventListener('click', function () {
      downloadJSON(state, 'cadence_vault_' + TODAY_ISO + '.json');
      showPwaMessage('Full vault downloaded.');
    });

    document.getElementById('btn-export-single-modal').addEventListener('click', function () {
      const p = getActiveProfile();
      if (!p) {
        showPwaMessage('No active profile to export.');
        return;
      }
      exportSingleProfileJSON(p);
      showPwaMessage('Exported ' + p.name + '.');
    });

    document.getElementById('input-import-json').addEventListener('change', function (e) {
      handleImportedJSONFile(e.target.files && e.target.files[0]);
    });

    document.getElementById('people-import-profile-input').addEventListener('change', function (e) {
      handleImportedJSONFile(e.target.files && e.target.files[0]);
    });

    document.getElementById('btn-reset-demo-data').addEventListener('click', function () {
      state = buildSampleHouseholdState();
      saveState();
      renderAll();
      showPwaMessage('Sample household loaded.');
    });

    document.getElementById('btn-wipe-vault').addEventListener('click', function () {
      state = buildEmptyDefaultState();
      saveState();
      renderAll();
      pwaModal.classList.add('hidden');
      pwaModal.classList.remove('flex');
    });
  }

  function showPwaMessage(msg) {
    const el = document.getElementById('pwa-status-msg');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 3200);
  }

  function initOfflinePWA() {
    if ('serviceWorker' in navigator) {
      try {
        const swCode = "self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});";
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        navigator.serviceWorker.register(swUrl).then(function () {
          const b = document.getElementById('sw-status-badge');
          if (b) b.textContent = 'Offline Active';
        }).catch(function () {});
      } catch (e) {}
    }
  }

  bindEvents();
  initOfflinePWA();
  renderAll();
})();
