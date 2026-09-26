import type { Evaluation, Insight } from '@/types/evaluation';

/** Premium onboarding fields sent to the server. Never includes resume bytes/URI. */
export type EvaluateProfilePayload = {
  gradeLevel: string;
  universities: string[];
  dreamCareer: string;
  activities: string;
  situation: string;
};

/** Body the client POSTs to /api/evaluate. */
export type EvaluateRequestBody = {
  opportunityText: string;
  goal: string;
  /** Optional display name (free + premium). Older APKs may omit this. */
  displayName?: string | null;
  /** Present only for premium users with a saved profile. */
  profile?: EvaluateProfilePayload | null;
  /** True when a screenshot was attached (bytes may also be in screenshotBase64). */
  hasScreenshot?: boolean;
  /** Local screenshot as base64 (no data: prefix). OpenAI vision reads this server-side. */
  screenshotBase64?: string | null;
  /** MIME type for screenshotBase64, e.g. image/jpeg. */
  screenshotMimeType?: string | null;
  /** Evaluate PDF listing text extracted on the server from pdfBase64, or client-extracted. */
  pdfText?: string | null;
  /** Evaluate PDF bytes as base64 (no data: prefix). Server extracts text; never resume files. */
  pdfBase64?: string | null;
};

/** Model JSON before id / label / createdAt are attached. */
export type EvaluateModelDraft = {
  title: string;
  source: string;
  score: number;
  insights: Insight[];
  fills: string[];
  doesNotFill: string[];
  helps: string[];
  hurts: string[];
  guidance: string;
  hasApplication: boolean;
  formHelp: string[];
};

export type EvaluateApiSuccess = {
  evaluation: Omit<Evaluation, 'id' | 'label' | 'createdAt'> & {
    score: number;
    hasApplication: boolean;
    formHelp: string[];
  };
};

export type EvaluateApiError = {
  error: string;
};
