// Client seam: POSTs opportunity + onboarding context to /api/evaluate.
// The OpenAI key lives only on the server (OPENAI_API_KEY). Never EXPO_PUBLIC_.

import { clampScore, labelForScore } from '@/services/score';
import type { StudentProfile } from '@/storage/profileStorage';
import type {
  EvaluateApiError,
  EvaluateApiSuccess,
  EvaluateProfilePayload,
  EvaluateRequestBody,
} from '@/types/evaluateApi';
import type { Evaluation, EvaluationInput } from '@/types/evaluation';

/** Relative path — works for local web/dev when EXPO_PUBLIC_API_URL is unset. */
const EVALUATE_PATH = '/api/evaluate';

/**
 * Native/APK builds need an absolute URL (phones cannot reach localhost).
 * Local web/dev can keep a relative path when EXPO_PUBLIC_API_URL is unset.
 * Never put secrets in EXPO_PUBLIC_* — URL only.
 */
function evaluateUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  return base ? `${base}${EVALUATE_PATH}` : EVALUATE_PATH;
}

/**
 * Evaluates an opportunity against the user's saved goal via the server.
 * Pass premium profile fields only when the user is premium; free callers
 * should pass null so only the goal is sent.
 */
export async function evaluateOpportunity(
  input: EvaluationInput,
  goal: string,
  profile: StudentProfile | null = null,
): Promise<Evaluation> {
  const text = typeof input?.text === 'string' ? input.text : '';
  const hasScreenshot = Boolean(input?.imageUri);

  if (!text.trim() && !hasScreenshot) {
    throw new Error('Paste an opportunity or upload a screenshot first.');
  }
  if (!goal.trim()) {
    throw new Error('Save a goal before analyzing an opportunity.');
  }

  const body: EvaluateRequestBody = {
    opportunityText: text.trim(),
    goal: goal.trim(),
    hasScreenshot,
    profile: profile ? toProfilePayload(profile) : null,
  };

  let response: Response;
  try {
    response = await fetch(evaluateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Could not reach the scoring service. Try again when the server is available.',
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = readErrorMessage(payload);
    throw new Error(
      message ??
        (response.status === 404
          ? 'Could not reach the scoring service. Try again when the server is available.'
          : 'Scoring failed. Please try again.'),
    );
  }

  const evaluation = (payload as EvaluateApiSuccess | null)?.evaluation;
  if (!evaluation || typeof evaluation !== 'object') {
    throw new Error('Scoring returned an unexpected response.');
  }

  return finish(evaluation);
}

function toProfilePayload(profile: StudentProfile): EvaluateProfilePayload {
  // Resume file bytes / local URI stay on device — never sent.
  return {
    gradeLevel: profile.gradeLevel,
    universities: profile.universities,
    dreamCareer: profile.dreamCareer,
    activities: profile.activities,
    situation: profile.situation,
  };
}

function readErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const error = (payload as EvaluateApiError).error;
  return typeof error === 'string' && error.trim().length > 0 ? error.trim() : null;
}

type Draft = Omit<Evaluation, 'id' | 'label' | 'createdAt'>;

function finish(draft: Draft): Evaluation {
  const score = clampScore(draft.score);
  const hasApplication = draft.hasApplication === true;
  return {
    title: typeof draft.title === 'string' ? draft.title : 'Untitled opportunity',
    source: typeof draft.source === 'string' ? draft.source : 'Pasted text',
    score,
    hasApplication,
    formHelp: hasApplication && Array.isArray(draft.formHelp) ? draft.formHelp : [],
    insights: Array.isArray(draft.insights) ? draft.insights : [],
    fills: Array.isArray(draft.fills) ? draft.fills : [],
    doesNotFill: Array.isArray(draft.doesNotFill) ? draft.doesNotFill : [],
    helps: Array.isArray(draft.helps) ? draft.helps : [],
    hurts: Array.isArray(draft.hurts) ? draft.hurts : [],
    guidance: typeof draft.guidance === 'string' ? draft.guidance : '',
    label: labelForScore(score),
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
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
