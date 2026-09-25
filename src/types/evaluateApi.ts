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
  /** Present only for premium users with a saved profile. */
  profile?: EvaluateProfilePayload | null;
  /** True when the user attached a screenshot locally (bytes are not sent). */
  hasScreenshot?: boolean;
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
