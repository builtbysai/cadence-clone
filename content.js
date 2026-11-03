// All user-facing copy and option lists. Edit here, not in app.js.
//
// Option ids are what gets saved in logs. Never rename an id: older backups and
// saved entries use them. Change `label` instead.

const tag = (id, label = id) => ({ id, label });

export const FLOW = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

export const FLUID = [
  { id: 'none', label: 'Dry' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'creamy', label: 'Creamy' },
  { id: 'eggwhite', label: 'Egg white' },
];

export const LH = [
  { id: 'none', label: 'Not taken' },
  { id: 'neg', label: 'Negative' },
  { id: 'pos', label: 'Positive' },
];

export const PAIN = [
  { id: 'none', label: 'None' },
  { id: 'mild', label: 'Mild' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'severe', label: 'Severe' },
];

export const INTIMACY = [
  { id: 'protected', label: 'Protected sex' },
  { id: 'unprotected', label: 'Unprotected sex' },
  { id: 'solo', label: 'Solo' },
  { id: 'sensual', label: 'Sensual, non-penetrative' },
  { id: 'fantasy', label: 'High desire' },
];

export const INTIMACY_NOTES = [
  tag('Orgasm'),
  tag('Deep Connection', 'Deep connection'),
  tag('High Lubrication', 'High lubrication'),
  tag('Receptive Desire', 'Receptive desire'),
  tag('Spontaneous Drive', 'Spontaneous drive'),
  tag('Pelvic Pain / Dyspareunia', 'Pelvic pain or pain with sex'),
];

export const MOODS = [
  tag('Calm'), tag('Focused'), tag('Social'), tag('Grounded'), tag('Creative'),
  tag('Warm / Affectionate', 'Warm'), tag('Sensitive'), tag('Introverted'), tag('Irritable'),
  tag('Anxious'), tag('Brain Fog', 'Brain fog'), tag('Low Drive', 'Low drive'),
];

export const SYMPTOMS = [
  tag('High Stamina', 'High stamina'), tag('Deep Sleep', 'Deep sleep'), tag('Cramps'),
  tag('Lower Back Ache', 'Lower back ache'), tag('Headache / Migraine', 'Headache or migraine'),
  tag('Bloating'), tag('Breast Tenderness', 'Breast tenderness'), tag('Vivid Dreams', 'Vivid dreams'),
  tag('Restless Sleep', 'Restless sleep'), tag('Salt/Sweet Cravings', 'Salty or sweet cravings'),
  tag('Clear Skin', 'Clear skin'), tag('Joint Stiffness', 'Joint stiffness'), tag('Night Sweats', 'Night sweats'),
];

export const EVENTS = [
  tag('Stress'), tag('Illness'), tag('Travel'), tag('Poor Sleep', 'Poor sleep'), tag('Alcohol'), tag('New Medication', 'New medication'),
];

// Id/label for any stored tag string, including the spellings the redesign briefly used.
const TAG_LOOKUP = new Map();
for (const t of [...INTIMACY_NOTES, ...MOODS, ...SYMPTOMS, ...EVENTS]) {
  TAG_LOOKUP.set(t.id.toLowerCase(), t.id);
  TAG_LOOKUP.set(t.label.toLowerCase(), t.id);
}
TAG_LOOKUP.set('affectionate', 'Warm / Affectionate');
TAG_LOOKUP.set('headache', 'Headache / Migraine');
TAG_LOOKUP.set('cravings', 'Salt/Sweet Cravings');
TAG_LOOKUP.set('pelvic pain', 'Pelvic Pain / Dyspareunia');
export const canonicalTag = (s) => TAG_LOOKUP.get(String(s).toLowerCase()) ?? s;
export const tagLabel = (s) => [...INTIMACY_NOTES, ...MOODS, ...SYMPTOMS, ...EVENTS].find((t) => t.id === s)?.label ?? s;

export const DESIRE_LABELS = ['Dormant', 'Quiet', 'Receptive', 'Spontaneous', 'Peak'];
export const ENERGY_LABELS = ['Drained', 'Low', 'Steady', 'Good', 'Vibrant'];
export const VITALITY_LABELS = ENERGY_LABELS; // old name

export const COLORS = [
  { hex: '#C25949', name: 'Terracotta' },
  { hex: '#3E7A6E', name: 'Celadon' },
  { hex: '#C4862D', name: 'Marigold' },
  { hex: '#7C5879', name: 'Velvet fig' },
  { hex: '#C95B78', name: 'Rosehip' },
  { hex: '#4A6B82', name: 'Mineral slate' },
];

export const RELATIONS = ['Self', 'Partner', 'Family', 'Friend', 'Client'];

// The six axes of the tendencies chart.
export const AXES = ['Vitality', 'Clarity', 'Desire', 'Social', 'Stillness', 'Calm'];

// ---------- Phase guidance ----------
// phase -> variant -> copy. Missing variants fall back to the group's first entry.
//   label        sub-phase name
//   physiology   what is happening in the body
//   mood/focus/body/partner  { t: title, b: body }
//   care         { eat, move, evening }
//   fluid        typical cervical fluid
//   metabolic    one-line metabolic note
//   cues         three short chips
//   tendencies   Vitality, Clarity, Desire, Social, Stillness, Calm on 0-100.
//                Illustrative generalisations for the rose chart, not measurements.

export const PHASE_COPY = {
  menstrual: {
    early: {
      label: 'Early flow · restorative baseline',
      headline: 'Low energy and a pull toward rest.',
      physiology: 'Estradiol and progesterone are at their lowest, and the uterine lining sheds.',
      mood: { t: 'Quieter, more inward', b: 'Many people want less stimulation and more time alone or with people they trust.' },
      focus: { t: 'Protect your margin', b: 'Leave room between commitments. Good days for reading, reflection and low-friction tasks.' },
      body: { t: 'Cramps are common', b: 'Heat, rest and gentle movement help many people. Some find orgasm eases cramps; others prefer stillness.' },
      partner: { t: 'Quiet presence over fixing', b: 'Take dinner and household logistics off their plate without asking them to direct the plan. Warmth, no pressure.' },
      care: {
        eat: 'Iron (lentils, leafy greens, red meat) with vitamin C replaces what flow uses. Ginger tea may ease cramps.',
        move: 'Walking or stretching can ease cramps. Resting is just as valid.',
        evening: 'A warm bath or a heating pad on the lower abdomen can ease cramps and help sleep.',
      },
      fluid: 'Menstrual flow',
      metabolic: 'Baseline metabolism · iron with vitamin C',
      cues: ['Waking temperature near baseline', 'Comfort and warm touch', 'Iron and ginger'],
      tendencies: [38, 54, 36, 34, 90, 64],
    },
    late: {
      label: 'Late flow · quiet renewal',
      headline: 'Energy starts to return.',
      physiology: 'Cramping usually eases as FSH recruits new follicles and estradiol begins to climb.',
      mood: { t: 'Clearing', b: 'As hormone withdrawal settles, mood often levels out into a sense of reset.' },
      focus: { t: 'Ease back in', b: 'Start organising what is coming up without forcing long sessions.' },
      body: { t: 'Recovering stamina', b: 'Light strength work or mobility often feels easier as flow tapers.' },
      partner: { t: 'Unhurried momentum', b: 'Energy is returning gently. Check their social battery before booking busy group plans.' },
      care: {
        eat: 'Keep up iron with vitamin C while flow continues. Steady protein and fibre help energy recover.',
        move: 'Light strength or mobility work is a good fit.',
        evening: 'A warm bath or a heating pad on the lower abdomen can ease cramps and help sleep.',
      },
      fluid: 'Menstrual flow, tapering',
      metabolic: 'Baseline metabolism · iron with vitamin C',
      cues: ['Waking temperature near baseline', 'Comfort and warm touch', 'Iron and ginger'],
      tendencies: [56, 68, 48, 52, 66, 75],
    },
  },
  follicular: {
    base: {
      label: 'Mid follicular · rising vitality',
      headline: 'Rising energy and curiosity.',
      physiology: 'Follicles mature and estradiol climbs while progesterone stays low.',
      mood: { t: 'Lighter, more curious', b: 'Mood often lifts as estradiol rises, and stress can feel easier to carry.' },
      focus: { t: 'Good for starting things', b: 'Many people have more drive for new projects and demanding work now.' },
      body: { t: 'Desire building', b: 'Natural lubrication and spontaneous interest tend to build as estradiol rises.' },
      partner: { t: 'Novelty, play, shared adventure', b: 'Appetite for new plans, spontaneous dates and ambitious projects together is often higher.' },
      care: {
        eat: 'Nothing special is needed. Regular meals with protein keep energy even.',
        move: 'Hard sessions often feel good now. Performance barely changes across the cycle, so go by how you feel.',
        evening: 'Energy can run late. A screen-free wind-down helps you sleep.',
      },
      fluid: 'Sticky to creamy',
      metabolic: 'Steady',
      cues: ['Strong workouts', 'Early cervical fluid', 'Drive for new projects'],
      tendencies: [78, 88, 68, 74, 35, 84],
    },
    late: {
      label: 'Late follicular · steep estradiol climb',
      cues: ['Strong workouts', 'Fertile fluid developing', 'Drive for new projects'],
      fluid: 'Creamy to watery',
      tendencies: [86, 88, 80, 84, 35, 84],
    },
  },
  ovulatory: {
    window: {
      label: 'Fertile window · peak estradiol',
      headline: 'Often the highest energy and desire of the cycle.',
      physiology: 'Estradiol is near its peak and cervical fluid turns clear and stretchy. This is the fertile window.',
      mood: { t: 'Confident, outgoing', b: 'Many people feel more sociable and expressive around ovulation.' },
      focus: { t: 'Good for conversations', b: 'Energy is often high, which suits presentations, hosting and important talks.' },
      body: { t: 'Desire and fertile fluid', b: 'Spontaneous desire and natural lubrication tend to peak. Some people feel a one-sided twinge at ovulation (mittelschmerz).' },
      partner: { t: 'High connection', b: 'A good window for dates, romantic attention and open, heart-to-heart conversation.' },
      care: {
        eat: 'Regular meals and water. No special foods needed.',
        move: 'If you feel strong, push. Group classes suit the social energy many people have now.',
        evening: 'Desire and sensory warmth tend to peak. Make time for connection, romance or creative outlets.',
      },
      fluid: 'Egg white',
      metabolic: 'Steady',
      cues: ['Peak spontaneous desire', 'Egg-white fertile fluid', 'High energy'],
      tendencies: [92, 90, 95, 94, 40, 88],
    },
    peak: {
      label: 'Estimated ovulation · LH surge',
      physiology: 'Estradiol triggers a surge of LH. The egg is released about 12 to 36 hours later.',
    },
  },
  luteal: {
    early: {
      label: 'Early to mid luteal · progesterone calm',
      headline: 'Calm, steady focus.',
      physiology: 'Progesterone rises. It warms waking temperature by a few tenths of a degree and raises energy use slightly.',
      mood: { t: 'Steadier, more inward', b: 'Mood is often calmer and more reflective after ovulation.' },
      focus: { t: 'Finish and refine', b: 'Good for editing, organising and steady follow-through rather than launching new commitments.' },
      body: { t: 'Responsive desire, steady warmth', b: 'Desire often shifts from spontaneous to responsive, building after emotional safety, massage and unhurried closeness.' },
      partner: { t: 'Cozy routines', b: 'Meaningful one-on-one time, affection without an agenda and calm evenings usually land well.' },
      care: {
        eat: 'Energy needs rise by roughly 100–300 kcal a day. Oats, sweet potato and protein keep energy and mood steady.',
        move: 'Core temperature and heart rate run slightly higher, so steady work can feel better than intervals. Train hard if you feel good.',
        evening: 'A slightly cooler bedroom offsets the temperature rise and protects deep sleep.',
      },
      fluid: 'Dry or sticky',
      metabolic: 'Resting burn up roughly 100–300 kcal a day',
      cues: ['Waking temperature raised', 'Responsive, sensual desire', 'Higher energy needs'],
      tendencies: [68, 78, 58, 62, 62, 78],
    },
    late: {
      label: 'Late luteal · pre-flow transition',
      headline: 'Less buffer for noise and stress.',
      physiology: 'Progesterone and estradiol fall quickly before the period. Sensitivity to stress, noise and poor sleep can rise.',
      mood: { t: 'Less buffer', b: 'Noise, clutter and short sleep can weigh more. Protect your margin.' },
      focus: { t: 'Finish, then rest', b: 'Good for closing open tasks. Saying no to extras is easier on yourself now.' },
      body: { t: 'Tender, tired, hungry', b: 'Breast tenderness, bloating, broken sleep and cravings are common. Less caffeine and alcohol can help.' },
      partner: { t: 'Practical help, no pressure', b: 'Take something off their plate, cook, and leave space without taking quiet personally.' },
      care: {
        eat: 'Complex carbs (roasted sweet potato, oats), protein and regular meals keep blood sugar and mood steady. Cravings are normal.',
        move: 'Walks, yoga or lighter lifting. Keep hard sessions optional.',
        evening: 'Earlier lights-out, no late caffeine and a cooler bedroom protect sleep.',
      },
      fluid: 'Dry or sticky',
      metabolic: 'Resting burn up roughly 100–300 kcal a day · cravings are normal',
      cues: ['Waking temperature raised', 'Responsive, sensual desire', 'Higher energy needs'],
      tendencies: [46, 60, 42, 40, 84, 52],
    },
  },
};

export function phaseCopy(phase, variant) {
  const group = PHASE_COPY[phase];
  const base = group.base || group.early || group.window;
  return { ...base, ...(group[variant] || {}) };
}

// ---------- Guide ----------
// cat: brain | intimacy | fertility | clinical. `phase` colours the dot.
// `source` is shown only where the reference has been checked.
//
// Original labels that could not be verified and are intentionally not shown:
//   PMC6309888, PMC6594874, PMC8906247 (was attached to the desire article), PMC11837971,
//   "Mayo Clinic Symptothermal Guidelines". Confirm each before restoring it.
// Dropped for overreach: the original estradiol/dendritic-spine and progesterone/allopregnanolone articles
// (animal and imaging evidence presented as guidance).

export const GUIDE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'brain', label: 'Brain and mood' },
  { id: 'intimacy', label: 'Intimacy' },
  { id: 'fertility', label: 'Fertility' },
  { id: 'clinical', label: 'Clinical' },
];

export const GUIDE = [
  {
    id: 'window', cat: 'fertility', phase: 'ovulatory',
    title: 'The fertile window is six days',
    body: 'Pregnancy is possible in the six days ending on ovulation day: sperm can survive up to five days and the egg about one. The chance is highest in the two days before ovulation and on the day itself. Even in regular cycles the ovulation day moves from month to month, so a date on the calendar is an estimate.',
    takeaway: 'Tide moves the window when you log a positive LH test or a temperature rise. A calendar prediction alone is not dependable birth control.',
    source: 'Wilcox et al., New England Journal of Medicine, 1995',
  },
  {
    id: 'bbt', cat: 'fertility', phase: 'ovulatory',
    title: 'Waking temperature and cervical fluid',
    body: 'Before ovulation, estrogen makes cervical fluid clear and stretchy ("egg white"). After ovulation, progesterone lifts waking temperature by a few tenths of a degree until the next period. Tide reads a rise as confirmed when three days in a row sit above the previous six.',
    takeaway: 'Fluid tells you ovulation is near. Temperature only confirms it afterwards.',
  },
  {
    id: 'pill', cat: 'fertility', phase: 'luteal',
    title: 'Hormonal birth control and your cycle',
    body: 'Most hormonal methods suppress or change ovulation, and the bleed in the pill-free week is a withdrawal bleed rather than a natural period. The hormone curves, fertile window and temperature rise in Tide describe a cycle without them.',
    takeaway: 'Turn on Hormonal birth control in a profile and Tide stops predicting fertility and keeps tracking bleeding and symptoms.',
  },
  {
    id: 'estradiol', cat: 'brain', phase: 'follicular',
    title: 'Estradiol and progesterone: the two-part rhythm',
    body: 'Estradiol climbs through the follicular phase and peaks just before ovulation. Progesterone stays low until ovulation, then rises and holds until shortly before the period. Both fall if there is no pregnancy, and the lining sheds. Studies in animals and small imaging groups link estradiol to dopamine and serotonin activity and progesterone to calming effects, but how much this changes any one person\'s days varies widely.',
    takeaway: 'The curves in Tide are stylised averages scaled to your cycle length, not measurements.',
  },
  {
    id: 'sync', cat: 'brain', phase: 'follicular',
    title: 'How much does your cycle change you?',
    body: 'Hormones do shift across the cycle, but how people feel varies far more between individuals than between phases. Studies of mood, desire and energy find small average effects, and most are small and rarely confirm phase with hormone tests. A 2020 review of 78 exercise studies found almost no difference in performance between phases.',
    takeaway: 'Treat phase notes as a starting guess and your own log as the answer. After two or three cycles, History shows what is true for you.',
    source: 'McNulty et al., Sports Medicine, 2020',
  },
  {
    id: 'progesterone', cat: 'brain', phase: 'luteal',
    title: 'Premenstrual changes',
    body: 'Many people feel more sensitive, tired or low in the days before a period. For some it is severe enough to disrupt work and relationships (PMDD). It is thought to reflect sensitivity to normal hormone shifts, not abnormal hormone levels. A diagnosis needs symptoms rated daily for at least two cycles, and they should ease soon after bleeding starts.',
    takeaway: 'If the last week before your period is hard most cycles, keep logging mood and body. History shows whether it clusters before bleeding.',
  },
  {
    id: 'desire', cat: 'intimacy', phase: 'ovulatory',
    title: 'Spontaneous and responsive desire',
    body: 'Desire has two healthy pathways. Spontaneous desire arrives on its own and is more common around ovulation. Responsive desire builds after touch, warmth and feeling safe, and is common at any point in the cycle. Both are normal, and desire often changes with sleep, stress, relationships and medication more than with the calendar.',
    takeaway: 'Responsive desire is not low desire. Log desire for a few cycles to see your own pattern.',
  },
  {
    id: 'hunger', cat: 'clinical', phase: 'luteal',
    title: 'Hunger before a period',
    body: 'After ovulation the body uses slightly more energy, roughly 100 to 300 kcal a day. Appetite and cravings often rise in the days before a period, so more hunger then is normal.',
    takeaway: 'Regular meals with protein and slow carbohydrates steady energy. Less caffeine and alcohol late in the cycle can help sleep.',
  },
  {
    id: 'vital', cat: 'clinical', phase: 'menstrual',
    title: 'What your cycle tells a doctor',
    body: 'ACOG treats the menstrual cycle as a vital sign. Typical ranges: cycles of 24 to 38 days, varying by no more than about 9 days, with bleeding up to 8 days. Outside those ranges, or with a luteal phase under 10 days, it is worth a conversation. Causes include thyroid conditions, PCOS and perimenopause.',
    takeaway: 'History flags anything outside these ranges and copies a summary for your appointment.',
    source: 'ACOG Committee Opinion No. 651; FIGO 2018 normal menstrual parameters',
  },
  {
    id: 'pain', cat: 'clinical', phase: 'menstrual',
    title: 'When pain or bleeding deserves a call',
    body: 'Pain that keeps you from work or school, pain with sex, bleeding that soaks a pad or tampon in three hours or less, or clots larger than about 2.5 cm (1 inch) are not just a bad period. Endometriosis in particular often goes undiagnosed for years, and dated records of pain make it easier to be taken seriously.',
    takeaway: 'Log pain on the days it is moderate or severe. History turns it into a summary you can hand over.',
    source: 'FIGO 2018 normal menstrual parameters',
  },
];
