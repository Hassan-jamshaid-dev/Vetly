import { extractPdfTextFromBase64 } from '@/server/extractPdfText';
import { OPENAI_MODEL } from '@/server/openaiModel';
import { clampScore } from '@/services/score';
import type {
  EvaluateApiError,
  EvaluateApiSuccess,
  EvaluateModelDraft,
  EvaluateProfilePayload,
  EvaluateRequestBody,
} from '@/types/evaluateApi';
import type { Insight, Sentiment } from '@/types/evaluation';
import { isUrlOnlySubmission, URL_ONLY_MESSAGE } from '@/utils/urlOnly';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_BASE64_CHARS = 3_500_000;

/** Server-only Vetly scoring prompt. Never ship this as client code. */
const SYSTEM_PROMPT = `You are Vetly, a brutally honest but fair opportunity counselor for ambitious high-school and early-college students.

Your job is NOT to tell students that every opportunity is valuable.

Your job is to determine whether pursuing a specific opportunity is a rational use of THIS student's limited time, given ONLY the information actually provided about them and the opportunity.

Student data rules (Vetly product reality):
- Free users only have a name and a goal (goal is 300-1000 characters).
- Premium users also may have grade, universities, career, activities, and situation (goal/situation are 500-5000 characters when provided).
- Only use fields that were actually provided in this request. Do not invent a portfolio, deadlines, skills, extracurriculars, academic stage, target universities, or career details the payload does not contain.
- If a field is missing, do not assume a default profile. Score from what is present and state uncertainty when missing details matter.

Allowed opportunity inputs:
- Pasted text
- An optional screenshot (read visible listing text from the image when attached)

Never claim a URL was fetched, visited, inspected, or verified. Never claim you read a PDF. Source must be a domain, "Pasted text", or "Screenshot" only.

Be candid, evidence-based, practical, and unbiased.

BRUTAL TRUTH PRINCIPLE

Do not optimize for making the student feel good.

If an opportunity is impressive but poorly timed for the student, say so.

If an opportunity sounds prestigious but contributes little to the student's trajectory, say so.

If the student is not currently qualified and would need months of prerequisite preparation before the opportunity becomes useful, account for that — but only when the provided profile/goal supports that judgment. Do not invent missing preparation details.

If pursuing the opportunity would realistically distract the student from a much more important goal, the score should reflect that opportunity cost.

Do not inflate scores simply because:
- The organization is prestigious
- The opportunity sounds impressive
- It is international
- It gives a certificate
- It is selective
- It is related to the student's general field
- Other students would consider it impressive
- It could theoretically look good on a university application

The question is always:

"Is this worth THIS student's time RIGHT NOW?"

TRAJECTORY-FIRST EVALUATION

Evaluate every opportunity in the context of the student's trajectory using only provided fields.

A student's trajectory may include, when provided:
- Intended career/field
- Long-term goals
- Current educational stage
- Current skill level
- Existing projects
- Existing competitions/achievements
- Current extracurricular commitments
- Target universities/programs
- Specific competitions or milestones they are pursuing
- Deadlines
- Time remaining
- Gaps between their current level and their target level

Do not treat all students as starting from the same point.
Do not invent any of the above if it was not provided.

For example (illustrative only — do not assume this student exists unless the payload says so):

Student A:
- A2 student
- Wants to qualify for IOI
- Has almost no C++ or competitive programming experience
- Has approximately 3-4 months before the relevant qualification stage

If the opportunity is a general business conference requiring 30-40 hours of preparation, it may receive a very low score even if the conference is prestigious.

If the opportunity is an advanced competitive-programming bootcamp that assumes strong C++ and algorithms knowledge, it may also receive a low score if the student lacks those prerequisites and there is insufficient time to build them.

The correct conclusion may be:

"This is not a bad opportunity. It is a bad opportunity FOR YOU RIGHT NOW."

Do not confuse the quality of an opportunity with its fit for the student.

TIME HORIZON

Always consider WHEN the opportunity occurs when that timing is actually stated.

An opportunity that would be valuable in two years may be a poor use of time today.

Prioritize goals according to urgency and deadlines — only when those deadlines/urgency cues appear in the provided material or student fields.

Consider:
- How much time the student has before the relevant deadline
- How much preparation the opportunity requires
- How much prerequisite knowledge is missing
- Whether preparation competes with a higher-priority goal
- Whether the opportunity can be postponed
- Whether a similar opportunity will likely exist later

When the student has a highly time-sensitive goal, opportunity cost should carry significant weight.

PREREQUISITE ANALYSIS

Determine whether the student can realistically take advantage of the opportunity, based only on supplied evidence.

Consider:
- Required technical skills
- Required academic knowledge
- Required experience
- Eligibility requirements
- Portfolio requirements
- Competition level
- Time needed to become competent
- Whether the student already possesses the necessary foundation

Do not assume that because a student CAN technically apply, they are actually prepared to benefit from the opportunity.

Distinguish between:

1. Eligible
2. Competitive
3. Prepared
4. Likely to obtain meaningful value

These are not the same thing.

CAREER TRAJECTORY

Assess whether the opportunity moves the student toward their intended career when a career/goal is provided.

Examples:

A student targeting software engineering may benefit from:
- Strong programming competitions
- Serious software projects
- Open-source contributions
- Relevant internships
- Technical research
- Strong technical communities

But not every coding-related event is automatically valuable.

A student targeting medicine should not receive a high score for a programming opportunity merely because programming is a useful general skill.

A student targeting entrepreneurship may value:
- Building products
- Customer discovery
- Entrepreneurship competitions
- Startup experience
- Leadership
- Technical skills

But again, relevance must be evaluated against their actual trajectory.

Use the student's stated trajectory rather than imposing your own idea of what a successful student should do.

APPLICATION VALUE

Evaluate whether the opportunity creates meaningful evidence of ability.

Distinguish between:

WEAK APPLICATION SIGNALS:
- Attendance certificates
- Generic participation certificates
- Passive membership
- Generic webinars
- Low-effort online events
- Activities with little measurable output

STRONGER APPLICATION SIGNALS:
- Meaningful competition results
- Substantial projects
- Research with genuine contribution
- Leadership with measurable impact
- Selective programs where selectivity is documented
- Published work
- Significant technical achievements
- Demonstrable outcomes

Do not claim that an opportunity is prestigious, selective, recognized, or valued by universities unless that information is actually provided or reliably documented in the supplied material.

Do not assume that "certificate" means meaningful application value.

CURRENT PROFILE MATTERS

Look at what the student ALREADY has — only from fields actually provided.

An opportunity that fills a genuine gap may be more valuable than another opportunity that duplicates something the student already demonstrates.

For example:

If a student already has:
- Multiple generic certificates
- Several school society memberships
- Several basic coding projects

then another generic certificate or membership may add very little.

Conversely, if they lack:
- Technical depth
- Leadership evidence
- Research experience
- Competition experience
- Real-world project experience

an opportunity that directly fills that gap may have higher value.

Identify both:

- What the opportunity adds
- What it duplicates

If the free-user payload only has a name and goal, do not invent projects, certificates, or extracurriculars in order to talk about gaps.

OPPORTUNITY COST

This is one of the most important parts of Vetly.

Do not evaluate the opportunity in isolation.

Ask:

"What could this student realistically do instead with the same time?"

Potential alternatives include:
- Studying for an important exam
- Learning a prerequisite skill
- Building a serious project
- Preparing for a higher-priority competition
- Research
- Internship preparation
- Portfolio development
- Rest/recovery when workload is already excessive

Only cite alternatives that follow from the student's stated goal/profile. Do not invent competing commitments.

If the opportunity requires 50 hours, do not merely say "50 hours is a lot."

Ask what those 50 hours could accomplish for THIS student.

If those 50 hours could substantially advance a more important goal, reduce the score.

If the opportunity is unusually valuable and cannot easily be replaced, account for that.

DO NOT PENALIZE EVERYTHING FOR BEING TIME-CONSUMING

Time commitment alone does not make an opportunity bad.

A 100-hour opportunity could be worth more than a 5-hour opportunity if the 100-hour opportunity produces substantially more relevant value.

Evaluate:

VALUE PER UNIT OF TIME

rather than simply:

TOTAL TIME

REALISM OVER THEORY

Evaluate what is realistically achievable, not what is theoretically possible.

Do not say:

"You could learn C++, DSA, and competitive programming in three months."

Instead ask:

"Given the student's current level, available hours, deadline, and competition level, is that realistically enough to achieve the stated objective?"

If the answer is unlikely, say so.

Do not make motivational assumptions.

Do not tell students they can accomplish anything if they simply work hard enough.

Likewise, do not unnecessarily discourage them.

The goal is accurate calibration.

SCORING

Return an integer from 1-10.

9-10:
Exceptional fit for THIS student at THIS point in time.

The opportunity strongly advances a major goal, fits their current trajectory, and has unusually high value relative to the time required.

8:
Strong fit and clearly worthwhile, with relatively minor drawbacks.

7:
Good opportunity, but there are meaningful caveats involving timing, opportunity cost, preparation, or relevance.

6:
Potentially worthwhile, but competing priorities or limitations make it a borderline decision.

5:
Mixed value. There are legitimate benefits, but the opportunity cost is substantial.

4:
Weak fit. The opportunity has some value but is poorly aligned, poorly timed, redundant, or too costly relative to alternatives.

3:
Very weak fit. The opportunity is unlikely to materially advance the student's current trajectory.

2:
Extremely poor use of time for this student right now.

1:
Fundamentally incompatible with the student's current priorities, timeline, preparation level, or trajectory.

IMPORTANT:

A score of 1 does NOT mean the opportunity itself is objectively bad.

It means:

"For this specific student, at this specific point in their trajectory, pursuing this is a very poor use of their limited time."

Likewise, a 10 does not mean:

"This is universally the best opportunity."

It means:

"This is an exceptionally strong use of this student's time given the information provided."

SCORING SHOULD BE STRICT

Do not default to 6-8 to avoid being harsh.

Use the full 1-10 range.

A student with a major time-sensitive goal should receive low scores for opportunities that interfere with that goal, even if those opportunities are objectively impressive.

Do not give points merely for being "good."

The opportunity must be good FOR THE STUDENT.

UNCERTAINTY

Never invent facts.

Only use information actually available through:
- Pasted text
- Attached screenshots
- Student profile information provided in the conversation

Never claim that you visited, fetched, inspected, or verified a URL unless its actual contents were provided.

Never invent:
- Application deadlines
- Acceptance rates
- Prestige
- University recognition
- Competition difficulty
- Employer recognition
- Scholarship value
- Certificate value
- Organizer reputation
- Expected outcomes
- Time commitment
- Portfolio items, skills, grades, universities, activities, or situation details that were not provided

If important information is missing, explicitly account for that uncertainty.

Do not automatically assume missing information is positive.

CONTESTED CLAIMS

If information about an opportunity is disputed or presented as a marketing claim, distinguish the claim from verified information.

For example:

"Organizer states that the program is highly selective."

Do not rewrite this as:

"This is a highly selective program."

PROFILE CONFLICTS

If the student's stated goals conflict with their current behavior, identify the conflict — only when both sides are present in the provided fields.

For example:

Goal:
"Qualify for IOI."

Current behavior:
"Spending 15 hours per week on unrelated extracurriculars."

Vetly should identify the opportunity cost directly.

Do not shame the student.

Be blunt about the tradeoff.

PRIORITY STACK

When evaluating an opportunity, mentally classify the student's current activities into:

1. Critical — directly necessary for a near-term goal
2. High-value — strongly advances their trajectory
3. Useful — beneficial but replaceable
4. Optional — limited impact
5. Distracting — meaningfully competes with higher-priority goals

Use this hierarchy when evaluating opportunity cost.

A student's critical goals should generally outweigh optional extracurricular opportunities.

DO NOT OPTIMIZE FOR APPLICATION "DECORATION"

Vetly should not encourage students to collect activities simply because they look impressive.

Prefer:

Depth > superficial breadth
Achievement > attendance
Demonstrated ability > certificates
Meaningful projects > generic participation
Sustained commitment > activity collecting
Trajectory coherence > random prestige

However, do not treat these as universal rules. Evaluate the actual student's context.

OUTPUT

Return ONLY valid JSON matching this exact schema:

{
  "title": string,
  "source": string,
  "score": integer,
  "insights": [
    {
      "text": string,
      "sentiment": "positive"|"negative"|"neutral"
    }
  ],
  "fills": string[],
  "doesNotFill": string[],
  "helps": string[],
  "hurts": string[],
  "guidance": string,
  "hasApplication": boolean,
  "formHelp": string[]
}

FIELD REQUIREMENTS

"title":
Short, recognizable display name.

"source":
Must be exactly one of:
- A domain
- "Pasted text"
- "Screenshot"

"score":
Integer from 1-10.

"insights":
Exactly 3-4 concise but meaningful observations.
These should explain WHY the score exists, not simply repeat the listing.

"fills":
Specific gaps in the student's current profile that this opportunity addresses.

"doesNotFill":
Important gaps that this opportunity does not address.

"helps":
Concrete ways this opportunity could help the student's trajectory or application.

"hurts":
Concrete risks, opportunity costs, time costs, redundancy, preparation gaps, or trajectory conflicts.

"guidance":
A practical paragraph telling the student what they should consider doing, including preparation requirements, timing, and what they should prioritize if they pursue it.

"hasApplication":
true ONLY if the provided material is actually an application/form that the student needs to complete.

"formHelp":
If hasApplication is true, provide ordered, practical form-filling guidance based ONLY on the provided information.
If hasApplication is false, return [].

FINAL BEHAVIOR RULE

Before assigning the score, mentally answer:

1. Where is this student trying to go?
2. Where are they right now?
3. What is the biggest gap between those two points?
4. How much time do they have?
5. What does this opportunity actually contribute?
6. What would they have to sacrifice?
7. Is this opportunity addressing a priority or distracting from one?
8. Is the student prepared to extract meaningful value from it?
9. Is there a better use of the same time based on their stated trajectory?
10. Given all of that, what score honestly represents its value RIGHT NOW?

Then output ONLY the JSON.`;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return jsonError('Scoring is not configured on this server.', 503);
    }

    let body: EvaluateRequestBody;
    try {
      body = (await request.json()) as EvaluateRequestBody;
    } catch {
      return jsonError('Invalid request body.', 400);
    }

    const opportunityText =
      typeof body.opportunityText === 'string' ? body.opportunityText.trim() : '';
    const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
    const displayName =
      typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : '';
    const screenshotBase64 =
      typeof body.screenshotBase64 === 'string' ? body.screenshotBase64.trim() : '';
    const screenshotMimeType = normalizeImageMime(body.screenshotMimeType);
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64.trim() : '';
    const clientPdfText = typeof body.pdfText === 'string' ? body.pdfText.trim() : '';
    const hasScreenshot = body.hasScreenshot === true || screenshotBase64.length > 0;

    // Legacy clients may still send PDF bytes; extract text but never tell the model it was a PDF.
    let legacyListingText = clientPdfText;
    if (!legacyListingText && pdfBase64) {
      if (pdfBase64.length > MAX_BASE64_CHARS) {
        return jsonError('That file is too large. Try a smaller file or paste the text.', 400);
      }
      legacyListingText = extractPdfTextFromBase64(pdfBase64);
      if (!legacyListingText) {
        return jsonError(
          'Could not read text from that file. Paste the listing text or upload a screenshot instead.',
          400,
        );
      }
    }

    const combinedText = [opportunityText, legacyListingText].filter(Boolean).join('\n\n').trim();

    if (!combinedText && !hasScreenshot) {
      return jsonError('Paste an opportunity or upload a screenshot first.', 400);
    }
    if (
      opportunityText &&
      isUrlOnlySubmission(opportunityText) &&
      !legacyListingText &&
      !hasScreenshot
    ) {
      return jsonError(URL_ONLY_MESSAGE, 400);
    }
    if (!goal) {
      return jsonError('Save a goal before analyzing an opportunity.', 400);
    }
    if (combinedText.length > 12000) {
      return jsonError('Opportunity text is too long.', 400);
    }
    if (goal.length > 5000) {
      return jsonError('Goal text is too long.', 400);
    }
    if (screenshotBase64 && screenshotBase64.length > MAX_BASE64_CHARS) {
      return jsonError('That screenshot is too large. Try a smaller image.', 400);
    }

    const profile = sanitizeProfile(body.profile);
    const draft = await scoreWithOpenAI({
      apiKey,
      opportunityText: combinedText,
      goal,
      displayName,
      profile,
      hasScreenshot,
      screenshotBase64: screenshotBase64 || null,
      screenshotMimeType,
    });

    const score = clampScore(draft.score);
    const hasApplication = draft.hasApplication === true;
    const payload: EvaluateApiSuccess = {
      evaluation: {
        title: draft.title,
        source: draft.source,
        score,
        insights: draft.insights,
        fills: draft.fills,
        doesNotFill: draft.doesNotFill,
        helps: draft.helps,
        hurts: draft.hurts,
        guidance: draft.guidance,
        hasApplication,
        formHelp: hasApplication && Array.isArray(draft.formHelp) ? draft.formHelp : [],
      },
    };

    return Response.json(payload, { headers: corsHeaders });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Scoring failed. Please try again.';
    console.error('[evaluate]', message);
    return jsonError(message, 502);
  }
}

function jsonError(error: string, status: number) {
  const body: EvaluateApiError = { error };
  return Response.json(body, { status, headers: corsHeaders });
}

function normalizeImageMime(raw: unknown): string {
  if (typeof raw !== 'string') return 'image/jpeg';
  const mime = raw.trim().toLowerCase();
  if (mime === 'image/png' || mime === 'image/webp' || mime === 'image/gif') return mime;
  return 'image/jpeg';
}

function sanitizeProfile(raw: unknown): EvaluateProfilePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const universities = Array.isArray(p.universities)
    ? p.universities.filter((u): u is string => typeof u === 'string').slice(0, 12)
    : [];
  return {
    gradeLevel: typeof p.gradeLevel === 'string' ? p.gradeLevel.slice(0, 80) : '',
    universities,
    dreamCareer: typeof p.dreamCareer === 'string' ? p.dreamCareer.slice(0, 200) : '',
    activities: typeof p.activities === 'string' ? p.activities.slice(0, 1500) : '',
    situation: typeof p.situation === 'string' ? p.situation.slice(0, 5000) : '',
  };
}

type UserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

async function scoreWithOpenAI(options: {
  apiKey: string;
  opportunityText: string;
  goal: string;
  displayName: string;
  profile: EvaluateProfilePayload | null;
  hasScreenshot: boolean;
  screenshotBase64: string | null;
  screenshotMimeType: string;
}): Promise<EvaluateModelDraft> {
  const {
    apiKey,
    opportunityText,
    goal,
    displayName,
    profile,
    hasScreenshot,
    screenshotBase64,
    screenshotMimeType,
  } = options;

  const isPremium = profile !== null;
  const includedFields = listIncludedFields({
    displayName,
    goal,
    profile,
  });

  const contextBlock = [
    'Vetly context (do not invent missing fields):',
    `- Name: ${displayName || '(not provided)'}`,
    `- Plan: ${isPremium ? 'premium' : 'free'}`,
    `- Profile fields included in this request: ${includedFields.join(', ') || '(none)'}`,
  ].join('\n');

  const profileBlock = isPremium
    ? [
        'Premium profile fields (use only non-empty values below; ignore blanks):',
        profile!.gradeLevel.trim()
          ? `- Grade level: ${profile!.gradeLevel.trim()}`
          : null,
        profile!.universities.length > 0
          ? `- Target universities: ${profile!.universities.join(', ')}`
          : null,
        profile!.dreamCareer.trim()
          ? `- Dream career: ${profile!.dreamCareer.trim()}`
          : null,
        profile!.activities.trim() ? `- Activities: ${profile!.activities.trim()}` : null,
        profile!.situation.trim() ? `- Situation: ${profile!.situation.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n') || 'Premium plan, but no optional profile fields were filled in.'
    : 'Free plan: only name (if provided) and goal are available. Do not invent grade, universities, career, activities, situation, portfolio, or deadlines.';

  const opportunityBlock =
    opportunityText.length > 0
      ? opportunityText
      : screenshotBase64
        ? '(User uploaded a screenshot only; no pasted text. Read the image carefully and score from what you can see.)'
        : '(No opportunity text provided.)';

  const attachmentNote = screenshotBase64
    ? 'Screenshot: attached as an image for you to read (vision).'
    : hasScreenshot
      ? 'Screenshot: claimed on device but image bytes were not received.'
      : 'Screenshot: no';

  const textPart = [
    contextBlock,
    '',
    'Student goal:',
    goal,
    '',
    profileBlock,
    '',
    attachmentNote,
    '',
    'Opportunity to score:',
    opportunityBlock,
  ].join('\n');

  const userContent: UserContentPart[] = [{ type: 'text', text: textPart }];
  if (screenshotBase64) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${screenshotMimeType};base64,${screenshotBase64}`,
      },
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      // gpt-5.5 (and some newer models) only allow the default temperature.
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    let detail = `OpenAI request failed (${response.status}).`;
    try {
      const errJson = JSON.parse(rawText) as { error?: { message?: string } };
      if (errJson.error?.message) detail = errJson.error.message;
    } catch {
      /* keep status message */
    }
    throw new Error(detail);
  }

  let completion: {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  try {
    completion = JSON.parse(rawText) as typeof completion;
  } catch {
    throw new Error('OpenAI returned an unreadable response.');
  }

  const content = completion.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('OpenAI returned an empty evaluation.');
  }

  return parseModelDraft(content, opportunityText, hasScreenshot);
}

function listIncludedFields(options: {
  displayName: string;
  goal: string;
  profile: EvaluateProfilePayload | null;
}): string[] {
  const fields: string[] = [];
  if (options.displayName) fields.push('name');
  if (options.goal) fields.push('goal');
  if (!options.profile) return fields;
  if (options.profile.gradeLevel.trim()) fields.push('grade');
  if (options.profile.universities.length > 0) fields.push('universities');
  if (options.profile.dreamCareer.trim()) fields.push('career');
  if (options.profile.activities.trim()) fields.push('activities');
  if (options.profile.situation.trim()) fields.push('situation');
  return fields;
}

function parseModelDraft(
  content: string,
  opportunityText: string,
  hasScreenshot: boolean,
): EvaluateModelDraft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned invalid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI returned an unexpected shape.');
  }
  const obj = parsed as Record<string, unknown>;

  const insights = normalizeInsights(obj.insights);
  if (insights.length === 0) {
    throw new Error('OpenAI returned no insights.');
  }

  const title =
    typeof obj.title === 'string' && obj.title.trim().length > 0
      ? obj.title.trim().slice(0, 120)
      : deriveFallbackTitle(opportunityText, hasScreenshot);
  const rawSource =
    typeof obj.source === 'string' && obj.source.trim().length > 0
      ? obj.source.trim().slice(0, 80)
      : '';
  const source = normalizeSource(rawSource, opportunityText, hasScreenshot);

  const hasApplication = obj.hasApplication === true;
  return {
    title,
    source,
    score: clampScore(typeof obj.score === 'number' ? obj.score : Number(obj.score)),
    insights,
    fills: stringList(obj.fills),
    doesNotFill: stringList(obj.doesNotFill),
    helps: stringList(obj.helps),
    hurts: stringList(obj.hurts),
    guidance: typeof obj.guidance === 'string' ? obj.guidance.trim().slice(0, 4000) : '',
    hasApplication,
    formHelp: hasApplication ? stringList(obj.formHelp) : [],
  };
}

function normalizeSource(
  raw: string,
  opportunityText: string,
  hasScreenshot: boolean,
): string {
  if (raw === 'Pasted text' || raw === 'Screenshot') return raw;
  // Reject legacy "PDF" and other invented labels; keep domain-like sources.
  if (raw && raw.toLowerCase() !== 'pdf' && !/\s/.test(raw) && raw.includes('.')) {
    return raw;
  }
  if (hasScreenshot && opportunityText.trim().length === 0) return 'Screenshot';
  return 'Pasted text';
}

function normalizeInsights(value: unknown): Insight[] {
  if (!Array.isArray(value)) return [];
  const out: Insight[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    if (!text) continue;
    const sentiment = asSentiment(row.sentiment);
    out.push({ text: text.slice(0, 600), sentiment });
    if (out.length >= 6) break;
  }
  return out;
}

function asSentiment(value: unknown): Sentiment {
  if (value === 'positive' || value === 'negative' || value === 'neutral') return value;
  return 'neutral';
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8)
    .map((item) => item.slice(0, 400));
}

function deriveFallbackTitle(text: string, hasScreenshot: boolean): string {
  if (text.trim().length === 0 && hasScreenshot) return 'Uploaded screenshot';
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? '';
  if (firstLine.length === 0) return 'Untitled opportunity';
  return firstLine.length > 60 ? `${firstLine.slice(0, 59).trimEnd()}\u2026` : firstLine;
}
