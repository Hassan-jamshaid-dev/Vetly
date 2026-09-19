// TODO(claude): replace mock with a server-side model call. Never put a
// Claude key in EXPO_PUBLIC_* — it is bundled into the client. Never hardcode.
//
// This file is THE seam between the UI and "the brain". Keep the signature of
// evaluateOpportunity() exactly as it is; only the body should change when the
// real model is wired in. Everything below is a deterministic mock: the same
// input + the same goal + the same profile always produce the same output.

import { clampScore, labelForScore } from '@/services/score';
import { buildFormHelp, looksLikeApplication } from '@/services/formHelp';
import type { StudentProfile } from '@/storage/profileStorage';
import type { Evaluation, EvaluationInput, Insight } from '@/types/evaluation';

const MIN_LATENCY_MS = 1400;
const MAX_LATENCY_MS = 1900;

/**
 * Evaluates an opportunity against the user's saved goal.
 * Resolves after a short, believable delay with a fully populated Evaluation.
 */
export async function evaluateOpportunity(
  input: EvaluationInput,
  goal: string,
  profile: StudentProfile | null = null,
): Promise<Evaluation> {
  await sleep(MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS));

  const text = typeof input?.text === 'string' ? input.text : '';
  const hasImage = Boolean(input?.imageUri);
  const hints = readGoalHints(goal);
  const normalised = text.toLowerCase();

  // 1) Hand-written results for the three example opportunities on Evaluate.
  const curated = CURATED.find((c) => c.keys.some((k) => normalised.includes(k)));
  if (curated) {
    return finish(curated.build(hints, profile));
  }

  // 2) Generic fallback for anything else the user pastes.
  return finish(buildGeneric(text, hasImage, hints, profile));
}

// ---------------------------------------------------------------------------
// Goal hints: pull a couple of details out of the goal text so results can
// reference it lightly. Never throws, even on empty or odd input.
// ---------------------------------------------------------------------------

type GoalHints = {
  /** A short phrase describing what the user is aiming at, e.g. "computer engineering". */
  focus: string;
  /** A named school if the goal mentions one, e.g. "MIT". */
  school: string | null;
  /** Whether the goal mentions founding/startup ambitions. */
  startup: boolean;
};

const FOCUS_KEYWORDS: Array<[pattern: RegExp, label: string]> = [
  [/computer engineering/, 'computer engineering'],
  [/computer science|\bcs\b/, 'computer science'],
  [/software/, 'software engineering'],
  [/\bai\b|artificial intelligence|machine learning/, 'AI and machine learning'],
  [/data science/, 'data science'],
  [/engineering/, 'engineering'],
  [/medicine|medical|doctor|pre-?med/, 'medicine'],
  [/business|commerce|finance|economics/, 'business and economics'],
  [/\blaw\b|lawyer/, 'law'],
  [/design|architecture/, 'design'],
  [/biology|chemistry|physics|science/, 'science'],
  [/research/, 'research'],
];

const SCHOOL_KEYWORDS: Array<[pattern: RegExp, label: string]> = [
  [/\bmit\b/, 'MIT'],
  [/waterloo/, 'Waterloo'],
  [/stanford/, 'Stanford'],
  [/harvard/, 'Harvard'],
  [/oxford/, 'Oxford'],
  [/cambridge/, 'Cambridge'],
  [/berkeley/, 'Berkeley'],
  [/\buoft\b|university of toronto/, 'UofT'],
  [/caltech/, 'Caltech'],
  [/princeton/, 'Princeton'],
];

function readGoalHints(goal: unknown): GoalHints {
  const g = (typeof goal === 'string' ? goal : '').toLowerCase().trim();
  if (g.length === 0) {
    return { focus: 'your goals', school: null, startup: false };
  }
  const focus = FOCUS_KEYWORDS.find(([re]) => re.test(g))?.[1] ?? 'your goals';
  const school = SCHOOL_KEYWORDS.find(([re]) => re.test(g))?.[1] ?? null;
  const startup = /start-?up|found(er|ing)?\b|entrepreneur/.test(g);
  return { focus, school, startup };
}

/** "an MIT application" / "a top-university application". */
function applicationPhrase(h: GoalHints): string {
  return h.school ? `a ${h.school} application` : 'a top-university application';
}

// ---------------------------------------------------------------------------
// Curated results for the three example cards.
// ---------------------------------------------------------------------------

type Draft = Omit<Evaluation, 'id' | 'label' | 'createdAt'>;

type Curated = {
  /** Lower-case substrings that identify this opportunity in the input. */
  keys: string[];
  build: (h: GoalHints, profile: StudentProfile | null) => Draft;
};

const CURATED: Curated[] = [
  {
    keys: ['hack club hackathon', 'hackclub.com'],
    build: (h) => ({
      title: 'Hack Club Hackathon',
      source: 'hackclub.com',
      score: 9,
      hasApplication: false,
      formHelp: [],
      insights: [
        {
          sentiment: 'positive',
          text: `Directly matches your focus on ${h.focus}: you spend a weekend shipping a real project with other high-school builders, not sitting through talks.`,
        },
        {
          sentiment: 'positive',
          text: `Readers of ${applicationPhrase(h)} can tell a certificate from a demo. You walk out with something you can show, which is the evidence that actually moves a Grade 11 CS profile.`,
        },
        {
          sentiment: 'positive',
          text: 'Hack Club is a genuine student-maker community. The people you meet there are the ones who keep building after the event, and that network compounds.',
        },
        {
          sentiment: 'negative',
          text: 'One weekend is a spark, not a portfolio. If you never touch the project again, it reads as a fun activity rather than a technical trajectory.',
        },
      ],
      fills: [
        'A concrete project you designed, built, and demoed under time pressure',
        'Evidence you can collaborate with other technical students',
        'A community of builders you can keep shipping with after the event',
      ],
      doesNotFill: [
        'Sustained research or a long-horizon technical contribution',
        'Formal leadership with a measurable, semester-long outcome',
      ],
      helps: [
        `Puts a shipped artifact at the centre of your ${h.focus} story instead of a list of classes`,
        'Gives you teammates and a community that can become recommenders or co-founders',
        h.startup
          ? 'Weekend shipping is the founder skill; this is a cheap, honest rehearsal'
          : 'Signals you actually build, which is what technical readers look for',
      ],
      hurts: [
        'A single weekend does not replace a project you own for months',
        'Travel, overnight, or team-finding logistics can eat the week before exams',
      ],
      guidance:
        'Go in with a problem you already care about and a stack you have touched, even a little; the teams that get somewhere are the ones who scope small and ship. ' +
        'After the event, spend two more weekends turning the demo into something you can link from your résumé with one line on what you built and what you learned. ' +
        (h.startup
          ? 'If you are aiming at a startup, treat the teammates you meet as a hiring pipeline, not just a group-chat memory.'
          : 'Name the project on your activities list and keep whatever you shipped public and current.'),
    }),
  },
  {
    keys: ['model united nations conference', 'harvardmun.org', 'model united nations'],
    build: (h, profile) => ({
      title: 'Model United Nations Conference',
      source: 'harvardmun.org',
      score: 7,
      hasApplication: true,
      formHelp: buildFormHelp({
        title: 'Model United Nations',
        focus: h.focus,
        school: h.school,
        profile,
      }),
      insights: [
        {
          sentiment: 'positive',
          text: `Strong training in speaking, writing under pressure, and reading a room — skills ${applicationPhrase(h)} actually tests in interviews and essays.`,
        },
        {
          sentiment: 'positive',
          text: 'You leave with a named role (delegate, chair) and, if you prepare properly, a paper or award you can point to. That is more than a club attendance line.',
        },
        {
          sentiment: 'neutral',
          text: 'Prestige depends on the conference. A well-known circuit such as Harvard MUN is taken seriously; a pay-to-attend local event is not.',
        },
        {
          sentiment: 'negative',
          text: `Honest gap: weak direct alignment with ${h.focus}. It does not produce code, a research artifact, or evidence of engineering ability.`,
        },
      ],
      fills: [
        'Public speaking and structured argumentation',
        'Evidence you can prepare, collaborate, and perform in a high-pressure setting',
      ],
      doesNotFill: [
        `Technical depth or a portfolio piece in ${h.focus}`,
        'A shipped product or original research',
      ],
      helps: [
        'Gives you a communication and leadership anecdote that a purely technical profile usually lacks',
        `Shows the reader of ${applicationPhrase(h)} that you can think on your feet`,
        h.startup
          ? 'Founders pitch constantly; this is rehearsal for that, not a substitute for building'
          : 'Balances a CS-heavy résumé with evidence you can work with people, not just machines',
      ],
      hurts: [
        'Prep and travel eat weekends you could spend on a technical project',
        'Listed without a specific role or result, it reads as a club activity rather than an achievement',
      ],
      guidance:
        'Only worth the time if you take a real role: research the country properly, write the position paper yourself, and aim to speak, not just attend. ' +
        `In your application, be honest — this is the communication half of your story, not proof of ${h.focus}. Pair it with a technical project so the reader does not wonder where the engineering went.`,
    }),
  },
  {
    keys: ['youth climate summit', 'youthclimatesummit.org', 'climate summit'],
    build: (h, profile) => ({
      title: 'Youth Climate Summit',
      source: 'youthclimatesummit.org',
      score: 4,
      hasApplication: true,
      formHelp: buildFormHelp({
        title: 'Youth Climate Summit',
        focus: h.focus,
        school: h.school,
        profile,
      }),
      insights: [
        {
          sentiment: 'positive',
          text: 'The cause is real, and the room is a genuine chance to practise advocacy and public speaking in front of people you do not already know.',
        },
        {
          sentiment: 'negative',
          text: `Weak alignment with your stated focus on ${h.focus}. It does not build technical skill or produce evidence of engineering ability, and a Grade 11 CS reader will notice.`,
        },
        {
          sentiment: 'negative',
          text: 'Summits are short and attendance-based. Readers weigh sustained commitment far more than a certificate of participation, however worthy the topic.',
        },
        {
          sentiment: 'negative',
          text: `Travel and preparation time competes directly with the projects that move ${applicationPhrase(h)} forward.`,
        },
      ],
      fills: [
        'Exposure to policy and advocacy work',
        'A public-speaking opportunity outside your usual circle',
      ],
      doesNotFill: [
        `Technical depth or portfolio work in ${h.focus}`,
        'Sustained leadership of your own initiative',
        'Anything a recommender could describe in detail',
      ],
      helps: [
        'A small breadth signal if your profile is otherwise narrow',
        'Could seed a longer-term project if you leave with a concrete idea and follow through',
      ],
      hurts: [
        'Two or three days plus travel is time you will not get back this term',
        'Listed alone, it reads as résumé padding rather than commitment',
        'Costs (fees, travel) are often high relative to what you can show for it',
      ],
      guidance:
        `Respect the cause, but be honest about the opportunity cost: only attend if you can turn it into something that lasts, such as a climate-data or energy-efficiency project that uses ${h.focus} skills back at school. ` +
        'Otherwise, skip it and spend the same weekend finishing a project you can demo. If you do go, apply to speak or present rather than just attend; that is the only version readers notice.',
    }),
  },
];

// ---------------------------------------------------------------------------
// Generic fallback for free text, links, and screenshots.
// ---------------------------------------------------------------------------

// {Title} / {title} are replaced with the opportunity name (capitalised or not);
// long, sentence-like titles fall back to "This opportunity" so insights read cleanly.
const POSITIVE_POOL = [
  '{Title} lines up with your interest in {focus}, so the time you invest compounds toward your goal.',
  'Offers something concrete to show for it, such as a project, result, or ranking, which is what readers trust.',
  'Selective enough to signal ambition without being a long shot.',
  'Puts you around people who are further ahead than you, which is the fastest way to raise your ceiling.',
  'Fits naturally into a "why {focus}" narrative because you can point to what you actually did there.',
];

const NEUTRAL_POOL = [
  'Impact depends on what you do with it: a passive participant gains little, an organiser or top finisher gains a lot.',
  'Moderate prestige. Useful as a supporting line in your profile, not a headline.',
  'Worth it if it is the only thing of its kind on your profile; redundant if you already have something similar.',
];

const NEGATIVE_POOL = [
  'Loose selection criteria mean {title} says less about you than something with a real bar.',
  'The time cost is real. Make sure it does not crowd out work that speaks directly to {focus}.',
  'Little direct link to {focus}; it would sit in your profile as breadth rather than depth.',
  'Short duration limits how much a recommender could credibly say about you afterward.',
  'Hard to quantify. Without a result or artifact, it is difficult to prove you gained anything.',
];

const HIGH_SIGNAL = /research|internship|engineering|\bai\b|startup|leadership|olympiad|hackathon|fellowship|selective/;
const LOW_SIGNAL = /no experience required|open to all|\bfun\b|party|everyone welcome|no application/;

function buildGeneric(
  text: string,
  hasImage: boolean,
  h: GoalHints,
  profile: StudentProfile | null,
): Draft {
  const trimmed = text.trim();
  const imageOnly = trimmed.length === 0 && hasImage;

  const firstUrl = findFirstUrl(trimmed);
  const title = deriveTitle(trimmed, imageOnly);
  const source = imageOnly ? 'Screenshot' : firstUrl ? hostnameOf(firstUrl) : 'Pasted text';
  const hasApplication = !imageOnly && looksLikeApplication(trimmed);

  // Deterministic base score in 5-8, then small nudges based on wording.
  const seed = hashString(normaliseForHash(trimmed) + '|' + (imageOnly ? 'img' : ''));
  let score = 5 + (seed % 4);
  const lower = trimmed.toLowerCase();
  if (HIGH_SIGNAL.test(lower)) score += 1;
  if (LOW_SIGNAL.test(lower)) score -= 1;
  score = clampScore(score);

  // Short titles can be quoted inline; long ones would make sentences unreadable.
  const nameMid = title.length <= 40 && !title.endsWith('\u2026') ? title : 'this opportunity';
  const nameStart = nameMid === 'this opportunity' ? 'This opportunity' : nameMid;
  const fill = (s: string) =>
    s.replace(/\{Title\}/g, nameStart).replace(/\{title\}/g, nameMid).replace(/\{focus\}/g, h.focus);

  // Choose insight counts from the score band, then pick rotated entries so
  // different inputs get different sentences while staying deterministic.
  const counts =
    score >= 8
      ? { positive: 3, neutral: 0, negative: 1 }
      : score >= 5
        ? { positive: 2, neutral: 1, negative: 1 }
        : { positive: 1, neutral: 0, negative: 3 };

  const insights: Insight[] = [
    ...pickRotated(POSITIVE_POOL, counts.positive, seed).map((t) => ({ text: fill(t), sentiment: 'positive' as const })),
    ...pickRotated(NEUTRAL_POOL, counts.neutral, seed >> 3).map((t) => ({ text: fill(t), sentiment: 'neutral' as const })),
    ...pickRotated(NEGATIVE_POOL, counts.negative, seed >> 5).map((t) => ({ text: fill(t), sentiment: 'negative' as const })),
  ];

  const strong = score >= 8;
  const weak = score <= 4;

  return {
    title,
    source,
    score,
    hasApplication,
    formHelp: hasApplication
      ? buildFormHelp({ title: nameMid, focus: h.focus, school: h.school, profile })
      : [],
    insights,
    fills: strong
      ? [`Hands-on experience that relates to ${h.focus}`, 'A concrete outcome you can describe with specifics']
      : weak
        ? ['Some breadth outside your core focus', 'A low-stakes place to practise showing up and contributing']
        : ['A supporting activity that adds context to your profile', 'Contact with people who share your interests'],
    doesNotFill: strong
      ? ['Independent initiative you started yourself']
      : [`Deep, demonstrable skill in ${h.focus}`, 'Sustained leadership with a measurable result'],
    helps: [
      strong
        ? `Gives ${applicationPhrase(h)} a specific, credible story rather than a list of interests`
        : `Adds a supporting detail to ${applicationPhrase(h)} if you can describe what you actually did`,
      h.startup
        ? 'Any experience where you ship or organise something feeds the founder narrative'
        : 'Shows you act on your interests instead of only talking about them',
    ],
    hurts: [
      'Time spent here is time not spent on a project you fully control',
      weak
        ? 'Listed on its own it reads as filler rather than a deliberate choice'
        : 'Only pays off if you can name a result, a role, or an artifact afterward',
    ],
    guidance: hasApplication
      ? `Fill the form like a person with a ${h.focus} story, not a list of adjectives. ` +
        `Answer what they asked, then write one sentence connecting ${nameMid} to ${h.focus}. If you cannot write that sentence, do not submit.`
      : `This is not an application to complete — it is a go / no-go call. ` +
        `Decide in advance what you want to walk away with from ${nameMid}: a role, a result, or a relationship. ` +
        `If you cannot name that in one sentence tied to ${h.focus}, skip it.`,
  };
}

// ---------------------------------------------------------------------------
// Small pure helpers.
// ---------------------------------------------------------------------------

function finish(draft: Draft): Evaluation {
  const score = clampScore(draft.score);
  const hasApplication = draft.hasApplication === true;
  return {
    ...draft,
    score,
    hasApplication,
    formHelp: hasApplication && Array.isArray(draft.formHelp) ? draft.formHelp : [],
    label: labelForScore(score),
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const nibble = (Math.random() * 16) | 0;
    const value = ch === 'x' ? nibble : (nibble & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Stable, non-cryptographic string hash (djb2). Always returns a non-negative int31. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  }
  // Mask instead of Math.abs: abs(INT32_MIN) is 2^31, which `seed >> n` in the
  // callers would wrap negative and index pickRotated() out of range.
  return hash & 0x7fffffff;
}

function normaliseForHash(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Picks `count` items from `pool`, starting at an offset derived from `seed`. */
function pickRotated<T>(pool: T[], count: number, seed: number): T[] {
  if (count <= 0 || pool.length === 0) return [];
  const start = seed % pool.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    out.push(pool[(start + i) % pool.length]!);
  }
  return out;
}

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

function findFirstUrl(text: string): string | null {
  const match = URL_RE.exec(text);
  return match ? match[0] : null;
}

/** True when the whole (trimmed) string is a single URL and nothing else. */
function isBareUrl(text: string): boolean {
  return /^(https?:\/\/|www\.)\S+$/i.test(text);
}

/** "https://www.example.org/apply?x=1" -> "example.org". Regex-based to avoid relying on the URL global. */
function hostnameOf(url: string): string {
  const match = /^(?:https?:\/\/)?(?:www\.)?([^/\s?#:]+)/i.exec(url.trim());
  const host = match?.[1]?.toLowerCase() ?? '';
  return host.length > 0 ? host : 'Pasted text';
}

function deriveTitle(text: string, imageOnly: boolean): string {
  if (imageOnly) return 'Uploaded screenshot';
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? '';
  if (firstLine.length === 0) return 'Untitled opportunity';
  if (isBareUrl(firstLine)) return hostnameOf(firstLine);
  return firstLine.length > 60 ? `${firstLine.slice(0, 59).trimEnd()}\u2026` : firstLine;
}
