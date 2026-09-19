import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Evaluation, Insight } from '@/types/evaluation';

// Premium-only log of evaluations. Free tier never writes here.
// Newest first. Capped so a long demo session cannot grow without bound.

const HISTORY_KEY = 'vetly:history';
const MAX_ITEMS = 50;

function isInsight(value: unknown): value is Insight {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Insight;
  return (
    typeof item.text === 'string' &&
    (item.sentiment === 'positive' || item.sentiment === 'negative' || item.sentiment === 'neutral')
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isEvaluation(value: unknown): value is Evaluation {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Evaluation;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.source === 'string' &&
    typeof item.score === 'number' &&
    Number.isFinite(item.score) &&
    typeof item.label === 'string' &&
    Array.isArray(item.insights) &&
    item.insights.every(isInsight) &&
    isStringArray(item.fills) &&
    isStringArray(item.doesNotFill) &&
    isStringArray(item.helps) &&
    isStringArray(item.hurts) &&
    typeof item.guidance === 'string' &&
    typeof item.createdAt === 'string'
  );
}

/** Older history rows predate hasApplication / formHelp — fill them in. */
function normalizeEvaluation(item: Evaluation): Evaluation {
  return {
    ...item,
    hasApplication: item.hasApplication === true,
    formHelp: Array.isArray(item.formHelp)
      ? item.formHelp.filter((line): line is string => typeof line === 'string')
      : [],
  };
}

/** Validate a cloud or local JSON blob as an Evaluation. */
export function parseEvaluation(value: unknown): Evaluation | null {
  return isEvaluation(value) ? normalizeEvaluation(value) : null;
}

/** Newest-first list. Corrupt or missing storage reads as empty. */
export async function getHistory(): Promise<Evaluation[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEvaluation).map(normalizeEvaluation).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Prepends one evaluation. No-op if storage fails. */
export async function appendHistory(evaluation: Evaluation): Promise<void> {
  const existing = await getHistory();
  const next = [evaluation, ...existing.filter((item) => item.id !== evaluation.id)].slice(
    0,
    MAX_ITEMS,
  );
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* History is a nicety; Analyze should still succeed. */
  }
}

let mergeInFlight: Promise<Evaluation[]> | null = null;

async function mergeRemoteHistoryNow(remote: Evaluation[]): Promise<Evaluation[]> {
  const local = await getHistory();
  const byId = new Map<string, Evaluation>();
  for (const item of [...local, ...remote]) {
    const prev = byId.get(item.id);
    if (!prev || Date.parse(item.createdAt) >= Date.parse(prev.createdAt)) {
      byId.set(item.id, item);
    }
  }
  const next = [...byId.values()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_ITEMS);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* Local cache is optional if the cloud copy loaded. */
  }
  return next;
}

/** Merge cloud rows into the on-device list (newest first). Overlapping calls share one in-flight promise. */
export function mergeRemoteHistory(remote: Evaluation[]): Promise<Evaluation[]> {
  if (mergeInFlight) return mergeInFlight;
  mergeInFlight = mergeRemoteHistoryNow(remote).finally(() => {
    mergeInFlight = null;
  });
  return mergeInFlight;
}

/** Drops the entire history log. Used by demo launch reset. */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    /* Demo reset is best-effort. */
  }
}
