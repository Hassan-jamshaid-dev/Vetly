import type { Evaluation } from '@/types/evaluation';

// Tiny in-memory store for "the evaluation we just opened".
// Evaluate / History / Home write it before navigating to Results or
// Application help; those screens read it. Nothing here is persisted.

let currentEvaluation: Evaluation | null = null;
/** True when Results was opened from the Evaluate form (so "Evaluate another" can go back). */
let openedFromEvaluate = false;

export function setCurrentEvaluation(
  evaluation: Evaluation,
  options?: { fromEvaluate?: boolean },
): void {
  currentEvaluation = evaluation;
  openedFromEvaluate = options?.fromEvaluate === true;
}

export function getCurrentEvaluation(): Evaluation | null {
  return currentEvaluation;
}

export function wasOpenedFromEvaluate(): boolean {
  return openedFromEvaluate;
}

export function clearCurrentEvaluation(): void {
  currentEvaluation = null;
  openedFromEvaluate = false;
}
