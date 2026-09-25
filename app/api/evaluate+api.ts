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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
    const hasScreenshot = body.hasScreenshot === true;

    if (!opportunityText && !hasScreenshot) {
      return jsonError('Paste an opportunity or upload a screenshot first.', 400);
    }
    if (!goal) {
      return jsonError('Save a goal before analyzing an opportunity.', 400);
    }
    if (opportunityText.length > 4000) {
      return jsonError('Opportunity text is too long.', 400);
    }
    if (goal.length > 2000) {
      return jsonError('Goal text is too long.', 400);
    }

    const profile = sanitizeProfile(body.profile);
    const draft = await scoreWithOpenAI({
      apiKey,
      opportunityText,
      goal,
      profile,
      hasScreenshot,
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
    situation: typeof p.situation === 'string' ? p.situation.slice(0, 1500) : '',
  };
}

async function scoreWithOpenAI(options: {
  apiKey: string;
  opportunityText: string;
  goal: string;
  profile: EvaluateProfilePayload | null;
  hasScreenshot: boolean;
}): Promise<EvaluateModelDraft> {
  const { apiKey, opportunityText, goal, profile, hasScreenshot } = options;

  const profileBlock = profile
    ? [
        'Premium student profile (use these details to personalize the score):',
        `- Grade level: ${profile.gradeLevel || '(not provided)'}`,
        `- Target universities: ${profile.universities.length > 0 ? profile.universities.join(', ') : '(not provided)'}`,
        `- Dream career: ${profile.dreamCareer || '(not provided)'}`,
        `- Activities: ${profile.activities || '(not provided)'}`,
        `- Situation: ${profile.situation || '(not provided)'}`,
      ].join('\n')
    : 'No premium profile. Score using the goal text only.';

  const opportunityBlock =
    opportunityText.length > 0
      ? opportunityText
      : '(User uploaded a screenshot only; no pasted text. Infer cautiously and say so in guidance.)';

  const userContent = [
    'Student goal:',
    goal,
    '',
    profileBlock,
    '',
    hasScreenshot ? 'Screenshot attached on device: yes (image bytes were not sent).' : 'Screenshot attached: no',
    '',
    'Opportunity to score:',
    opportunityBlock,
  ].join('\n');

  const system = [
    'You are Vetly, a candid counselor for ambitious high-school and early college students.',
    'Score whether an opportunity is worth their limited time given THEIR goal (and profile when provided).',
    'Be specific, honest, and practical. Prefer concrete advice over fluff.',
    'Return ONLY valid JSON matching this schema:',
    '{',
    '  "title": string (short display name),',
    '  "source": string (domain, "Pasted text", or "Screenshot"),',
    '  "score": integer 1-10,',
    '  "insights": array of 3-4 { "text": string, "sentiment": "positive"|"negative"|"neutral" },',
    '  "fills": string[] (what gaps this fills),',
    '  "doesNotFill": string[] (what it does not address),',
    '  "helps": string[] (how it helps an application),',
    '  "hurts": string[] (risks / opportunity cost),',
    '  "guidance": string (preparation advice paragraph),',
    '  "hasApplication": boolean (true if this is a form/application to complete),',
    '  "formHelp": string[] (ordered form-filling tips when hasApplication; else [])',
    '}',
    'Score calibration: 8-10 excellent fit, 5-7 mixed/worth it with caveats, 1-4 weak fit or high opportunity cost.',
  ].join('\n');

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
        { role: 'system', content: system },
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
  const source =
    typeof obj.source === 'string' && obj.source.trim().length > 0
      ? obj.source.trim().slice(0, 80)
      : hasScreenshot && opportunityText.trim().length === 0
        ? 'Screenshot'
        : 'Pasted text';

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
