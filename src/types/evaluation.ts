// Shapes shared by the evaluation engine, the in-memory store and the Results screen.
// If the model returns something different, adapt it to THIS shape inside
// src/services/evaluation.ts (and the /api/evaluate route) so the UI never has to change.

/** Whether a single insight reads as good news, bad news, or neither. */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/** Human-readable verdict derived from the 1-10 score. */
export type ScoreLabel = 'Excellent Match' | 'Good Match' | 'Low Match';

export interface Insight {
  text: string;
  sentiment: Sentiment;
}

export interface Evaluation {
  /** uuid-ish, generated per evaluation. */
  id: string;
  /** Display title, e.g. "Hack Club Hackathon". */
  title: string;
  /** Where it came from: a domain, "Pasted text", or "Screenshot". */
  source: string;
  /** Integer 1-10. */
  score: number;
  /** Derived from score via labelForScore(). */
  label: ScoreLabel;
  /** 3-4 items shown on the Results screen. */
  insights: Insight[];
  /** Gaps in the user's profile this opportunity fills. */
  fills: string[];
  /** Gaps it does not address. */
  doesNotFill: string[];
  /** How it helps an application. */
  helps: string[];
  /** Risks / how it could hurt (time cost, low prestige, etc.). */
  hurts: string[];
  /** Premium-only preparation guidance (not rendered in the free tier). */
  guidance: string;
  /**
   * True when this is an application / form to complete.
   * False for events you mostly attend — Results then skips form-filling help.
   */
  hasApplication: boolean;
  /** Ordered “how to fill this form” steps from the user’s profile. Empty when !hasApplication. */
  formHelp: string[];
  /** ISO timestamp. */
  createdAt: string;
}

export interface EvaluationInput {
  /** What the user typed or pasted. May be empty when only an image/PDF is given. */
  text: string;
  /** Local URI of an uploaded screenshot, if any. */
  imageUri?: string | null;
  /** Local URI of an Evaluate-only PDF listing, if any. Never a resume file. */
  pdfUri?: string | null;
}
