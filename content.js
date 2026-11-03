// All user-facing copy and option lists. Edit here, not in app.js.

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

export const INTIMACY = [
  { id: 'protected', label: 'Protected sex' },
  { id: 'unprotected', label: 'Unprotected sex' },
  { id: 'solo', label: 'Solo' },
  { id: 'sensual', label: 'Sensual' },
  { id: 'fantasy', label: 'High desire' },
];

export const INTIMACY_NOTES = [
  'Orgasm', 'Deep connection', 'High lubrication', 'Receptive desire', 'Spontaneous drive', 'Pelvic pain',
];

export const MOODS = [
  'Calm', 'Focused', 'Social', 'Grounded', 'Creative', 'Affectionate',
  'Sensitive', 'Introverted', 'Irritable', 'Anxious', 'Brain fog', 'Low drive',
];

export const SYMPTOMS = [
  'High stamina', 'Deep sleep', 'Cramps', 'Lower back ache', 'Headache', 'Bloating',
  'Breast tenderness', 'Vivid dreams', 'Restless sleep', 'Cravings', 'Clear skin', 'Joint stiffness', 'Night sweats',
];

export const DESIRE_LABELS = ['Dormant', 'Quiet', 'Receptive', 'Spontaneous', 'Peak'];
export const VITALITY_LABELS = ['Drained', 'Low', 'Steady', 'Good', 'Vibrant'];

export const COLORS = [
  { hex: '#C25949', name: 'Terracotta' },
  { hex: '#3E7A6E', name: 'Celadon' },
  { hex: '#C4862D', name: 'Marigold' },
  { hex: '#7C5879', name: 'Fig' },
  { hex: '#C95B78', name: 'Rosehip' },
  { hex: '#4A6B82', name: 'Slate' },
];

export const RELATIONS = ['Self', 'Partner', 'Family', 'Friend', 'Client'];

// ---------- Phase guidance ----------
// phase -> variant -> copy. Missing variants fall back to 'base'.
// mood / focus / body / partner are { t: title, b: body }; care is { eat, move, evening }.

export const PHASE_COPY = {
  menstrual: {
    early: {
      headline: 'Low energy and a pull toward rest.',
      summary: 'Estradiol and progesterone are at their lowest. Iron, warmth and slow days help.',
      mood: { t: 'Reflective', b: 'Many people prefer quiet and fewer demands while hormones sit at baseline.' },
      focus: { t: 'Protect your margin', b: 'Leave room between commitments. Good days for reading, reflection and low-effort tasks.' },
      body: { t: 'Rest and warmth', b: 'Cramps are common early on. Heat, gentle movement and sleep tend to help.' },
      partner: { t: 'Quiet presence', b: 'Take meals and errands off their plate without asking them to plan. Warmth, no pressure.' },
      care: {
        eat: 'Pair iron (lentils, leafy greens, red meat) with vitamin C. Ginger tea can ease cramps.',
        move: 'Walking, stretching or yin yoga. No performance goals.',
        evening: 'A warm bath or a heating pad on the lower abdomen helps sleep.',
      },
    },
    late: {
      headline: 'Energy starts to return.',
      summary: 'Cramps usually ease as FSH recruits new follicles and estradiol begins to rise.',
      mood: { t: 'Clearing', b: 'Mood often evens out as the lowest-hormone days pass.' },
      focus: { t: 'Ease back in', b: 'Start organizing what is coming up without forcing long sessions.' },
      body: { t: 'Recovering stamina', b: 'Light strength or mobility work often feels smoother now.' },
      partner: { t: 'Unhurried momentum', b: 'Energy is returning. Check their social battery before booking busy plans.' },
      care: {
        eat: 'Keep up iron and vitamin C while flow continues.',
        move: 'Light strength or mobility work is a good fit.',
        evening: 'A warm bath or a heating pad on the lower abdomen helps sleep.',
      },
    },
  },
  follicular: {
    base: {
      headline: 'Rising energy and curiosity.',
      summary: 'Estradiol climbs while progesterone stays low. Many people notice better mood, sleep and motivation.',
      mood: { t: 'Optimistic', b: 'Rising estradiol tends to lift mood and make stress easier to absorb.' },
      focus: { t: 'Good for starting things', b: 'Learning, planning and new projects often feel easier now.' },
      body: { t: 'Desire building', b: 'Interest in sex often rises with estradiol. Recovery from exercise is typically quick.' },
      partner: { t: 'Novelty and play', b: 'Appetite for new plans and spontaneous time together is often higher.' },
      care: {
        eat: 'Fresh protein, fermented foods and seeds are easy to build meals around.',
        move: 'A good time for progressive strength training and harder cardio.',
        evening: 'A short screen-free wind-down turns high energy into sleep.',
      },
    },
  },
  ovulatory: {
    window: {
      headline: 'Often the highest energy and desire of the cycle.',
      summary: 'Estradiol is near its peak and fertile cervical fluid is common. Ovulation follows an LH surge.',
      mood: { t: 'Confident and outgoing', b: 'Peak estradiol and a small rise in testosterone are linked with sociability and confidence.' },
      focus: { t: 'Good for talking', b: 'Many people feel articulate and at ease in conversation. Useful for presentations or hosting.' },
      body: { t: 'Desire and fertile fluid', b: 'Spontaneous desire and natural lubrication tend to peak. Some people feel a one-sided twinge at ovulation.' },
      partner: { t: 'High connection', b: 'A good window for dates, attention and open conversation.' },
      care: {
        eat: 'Cruciferous vegetables, berries and plenty of water.',
        move: 'Strength and stamina are often high. Warm up well.',
        evening: 'Desire and sensory warmth tend to peak. Make time for connection or creative outlets.',
      },
    },
    peak: {
      summary: 'Estradiol peaks and an LH surge triggers egg release within a day or two.',
    },
  },
  luteal: {
    early: {
      headline: 'Calm, steady focus.',
      summary: 'Progesterone rises, warming resting temperature by about 0.4–0.8°F and raising calorie burn slightly.',
      mood: { t: 'Settled', b: 'Progesterone has a calming effect on the brain, so mood is often steadier and more inward.' },
      focus: { t: 'Finish and refine', b: 'Good for editing, organizing and follow-through rather than launching new things.' },
      body: { t: 'Responsive desire', b: 'Desire often builds after closeness, touch and feeling at ease, rather than arriving on its own.' },
      partner: { t: 'Cozy routines', b: 'Affection without an agenda and calm evenings usually land well.' },
      care: {
        eat: 'Energy needs rise a little. Oats, sweet potato and protein help keep energy steady.',
        move: 'Steady strength work, pilates or incline walks suit a higher resting heart rate better than all-out intervals.',
        evening: 'A slightly cooler bedroom helps with the temperature rise.',
      },
    },
    late: {
      headline: 'Less buffer for noise and stress.',
      summary: 'Progesterone and estradiol fall before your period, which can bring sensitivity, breast tenderness and lighter sleep.',
      mood: { t: 'More sensitive', b: 'Premenstrual symptoms come from sensitivity to normal hormone shifts. Clear boundaries help.' },
      focus: { t: 'Close loops, say no', b: 'Use the sharper eye for what is not working to finish tasks and decline extras.' },
      body: { t: 'Settle the nervous system', b: 'Less caffeine and alcohol in the last few days often eases tenderness and sleep disruption.' },
      partner: { t: 'Space and practical help', b: 'Decision fatigue hits faster. Offer practical help and warm food without pressure.' },
      care: {
        eat: 'Complex carbs, protein and regular meals help keep blood sugar and mood steady.',
        move: 'Walks, yoga or lighter lifting. Keep hard sessions optional.',
        evening: 'Protect sleep: earlier lights-out, less screen time, no late caffeine.',
      },
    },
  },
};

export function phaseCopy(phase, variant) {
  const group = PHASE_COPY[phase];
  const base = group.base || group.early || group.window;
  return { ...base, ...(group[variant] || {}) };
}

// ---------- Guide ----------

export const GUIDE = [
  {
    title: 'Estradiol and mood',
    body: 'Rising estradiol in the follicular phase increases dopamine and serotonin signalling. Many people notice better verbal fluency, motivation and reward sensitivity as it climbs toward its mid-cycle peak.',
    takeaway: 'Energy and drive tend to build through the first half of the cycle.',
  },
  {
    title: 'Progesterone and late-luteal sensitivity',
    body: 'After ovulation, progesterone is converted in the brain to allopregnanolone, which calms GABA-A receptors. When hormones fall before a period, some people become sensitive to noise, stress and poor sleep. PMDD is thought to reflect sensitivity to normal hormone shifts, not excess hormones.',
    takeaway: 'If symptoms disrupt daily life most cycles, track them and talk to a clinician.',
  },
  {
    title: 'Spontaneous and responsive desire',
    body: 'Desire can start as an internal spark (spontaneous), most common around ovulation, or build after touch and feeling at ease (responsive), which is more common in the luteal phase. Both are normal.',
    takeaway: 'Responsive desire is not low desire.',
  },
  {
    title: 'Temperature and cervical fluid',
    body: 'Before ovulation, estrogen makes cervical fluid clear and stretchy, which helps sperm survive for up to five days. After ovulation, progesterone raises waking temperature by roughly 0.4–0.8°F until the next period.',
    takeaway: 'Fertile fluid means ovulation is near. A rise that holds for three days suggests it has passed.',
  },
  {
    title: 'Your cycle as a vital sign',
    body: 'ACOG recognizes the menstrual cycle as a vital sign. Cycles shorter than 21 or longer than 35 days, bleeding beyond seven days, pain during sex, or a luteal phase under 10 days are worth raising with a clinician.',
    takeaway: 'History has a summary you can copy for an appointment.',
    source: 'ACOG Committee Opinion No. 651',
  },
  {
    title: 'Luteal hunger',
    body: 'Progesterone raises resting energy use, often by 100–300 kcal a day, and falling estrogen can change blood-sugar sensitivity. Hunger in the luteal phase is biology, not willpower.',
    takeaway: 'Eating a little more in the second half of the cycle is normal.',
  },
];
