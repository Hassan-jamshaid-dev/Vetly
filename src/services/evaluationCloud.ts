import { getSupabase, isSupabaseConfigured, requireUserId } from '@/lib/supabase';
import { parseEvaluation } from '@/storage/historyStorage';
import type { Evaluation } from '@/types/evaluation';

/** Client-side cap; matches octet_length(payload::text) in supabase/setup.sql. */
const MAX_PAYLOAD_CHARS = 32_000;

type EvaluationRow = {
  user_id: string;
  id: string;
  title: string;
  score: number;
  payload: Evaluation;
  created_at: string;
};

/** Best-effort insert/update of this user's row. Analyze still succeeds if this fails. */
export async function saveEvaluationRemote(evaluation: Evaluation): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const userId = await requireUserId();
    if (!userId) return;
    if (JSON.stringify(evaluation).length > MAX_PAYLOAD_CHARS) {
      console.warn('Supabase save skipped: payload too large');
      return;
    }
    const row: EvaluationRow = {
      user_id: userId,
      id: evaluation.id,
      title: evaluation.title,
      score: evaluation.score,
      payload: evaluation,
      created_at: evaluation.createdAt,
    };
    const { error } = await supabase.from('evaluations').upsert(row, { onConflict: 'user_id,id' });
    if (error) {
      console.warn('Supabase save skipped:', error.message);
    }
  } catch {
    /* Cloud must never block Analyze. */
  }
}

/** This user's newest evaluations, or null if unset / request failed. */
export async function fetchRemoteEvaluations(): Promise<Evaluation[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const userId = await requireUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('evaluations')
      .select('payload')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !Array.isArray(data)) {
      if (error) console.warn('Supabase fetch skipped:', error.message);
      return null;
    }
    return data
      .map((row) => parseEvaluation((row as { payload?: unknown }).payload))
      .filter((item): item is Evaluation => item !== null);
  } catch {
    return null;
  }
}
