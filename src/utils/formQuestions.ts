/**
 * True when pasted material looks like application / form questions,
 * not a prose-only opportunity description.
 */
export function textContainsFormQuestions(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const questionMarks = (t.match(/\?/g) ?? []).length;
  const numbered = /^\s*\d+[\).\]]\s+\S+/m.test(t) || /^\s*Q\s*\d+/im.test(t);
  const formy =
    /\b(please (describe|explain|list|provide|attach)|why do you|why are you|tell us about|short answer|essay question|character limit|word limit|max(?:imum)?\s+\d+\s+(?:words|characters)|fill (?:out|in) (?:this |the )?form)\b/i.test(
      t,
    );
  return questionMarks >= 2 || numbered || formy;
}
