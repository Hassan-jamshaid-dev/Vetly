import { colors } from '@/theme/colors';
import type { ScoreLabel } from '@/types/evaluation';

// Small helpers that turn a 1-10 score into a label and a colour.
// Kept separate so both the engine and the UI can share the same rules.

/** Clamps any number into the 1-10 integer range the app expects. */
export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 5;
  return Math.min(10, Math.max(1, Math.round(score)));
}

/** 8-10 -> Excellent, 5-7 -> Good, 1-4 -> Low. */
export function labelForScore(score: number): ScoreLabel {
  const s = clampScore(score);
  if (s >= 8) return 'Excellent Match';
  if (s >= 5) return 'Good Match';
  return 'Low Match';
}

/** Green for Excellent, amber for Good, red for Low. */
export function colorForScore(score: number): string {
  const s = clampScore(score);
  if (s >= 8) return colors.success;
  if (s >= 5) return colors.warning;
  return colors.danger;
}
