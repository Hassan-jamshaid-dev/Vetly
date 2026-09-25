/**
 * True when the paste is only a link (no listing text).
 * Vetly never fetches or scores URLs as links.
 */
export function isUrlOnlySubmission(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // More than one non-empty line or token of real prose → not URL-only.
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length !== 1) return false;
  return looksLikeUrl(tokens[0]!);
}

function looksLikeUrl(value: string): boolean {
  if (/^https?:\/\/\S+$/i.test(value)) return true;
  if (/^www\.\S+$/i.test(value)) return true;
  // Bare domain / path, e.g. hackclub.com or example.org/apply
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/\S*)?$/i.test(
    value,
  );
}

export const URL_ONLY_MESSAGE =
  'Paste the listing text, a screenshot, or a PDF. Vetly does not open or score links.';
