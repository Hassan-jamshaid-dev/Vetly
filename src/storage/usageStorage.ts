import AsyncStorage from '@react-native-async-storage/async-storage';

// Tracks how many free evaluations the user has run today.
// Stored as JSON: { date: 'YYYY-MM-DD', count: number } under one key.
// The date is the device's LOCAL date so the counter resets at local midnight.

const USAGE_KEY = 'vetly:usage';

/** Free-tier allowance per calendar day. */
export const FREE_DAILY_LIMIT = 3;

type Usage = { date: string; count: number };

/** Local date as 'YYYY-MM-DD'. (toISOString would give UTC, which is wrong here.) */
function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Reads today's usage. Anything missing, corrupt, or from another day counts as fresh. */
async function readUsage(): Promise<Usage> {
  const fresh: Usage = { date: todayKey(), count: 0 };
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    if (!raw) return fresh;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Usage).date === 'string' &&
      typeof (parsed as Usage).count === 'number' &&
      Number.isFinite((parsed as Usage).count)
    ) {
      const usage = parsed as Usage;
      // A stored date that is not today means the counter has rolled over.
      if (usage.date !== fresh.date) return fresh;
      return { date: usage.date, count: Math.max(0, Math.floor(usage.count)) };
    }
    return fresh;
  } catch {
    return fresh;
  }
}

/** How many free evaluations are left today (0..FREE_DAILY_LIMIT). */
export async function getRemainingToday(): Promise<number> {
  const usage = await readUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage.count);
}

// Serialise consume writes so two in-flight Analyze calls cannot both read
// count N and both persist N+1 (which would skip a charge).
let consumeChain: Promise<void> = Promise.resolve();

/** Records one evaluation for today and returns how many remain. */
export async function consumeOne(): Promise<number> {
  const run = consumeChain.then(async () => {
    const usage = await readUsage();
    const next: Usage = { date: usage.date, count: usage.count + 1 };
    try {
      await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(next));
    } catch {
      // If storage fails we still report the in-memory value so the UI stays sensible.
    }
    return Math.max(0, FREE_DAILY_LIMIT - next.count);
  });
  consumeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Demo reset: today's count back to 0 so the free tier has 3 evals again. */
export async function resetUsage(): Promise<void> {
  const run = consumeChain.then(async () => {
    const fresh: Usage = { date: todayKey(), count: 0 };
    try {
      await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Demo reset is best-effort.
    }
  });
  consumeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
