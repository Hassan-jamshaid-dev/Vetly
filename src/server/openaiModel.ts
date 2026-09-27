/**
 * Scoring model for /api/evaluate.
 * Override with OPENAI_MODEL in .env (e.g. gpt-5.5 or gpt-4o) without hunting the app.
 */
export const OPENAI_MODEL =
  (typeof process !== 'undefined' && process.env.OPENAI_MODEL?.trim()) || 'gpt-5.5';
