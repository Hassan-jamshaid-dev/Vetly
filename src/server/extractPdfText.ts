/**
 * Best-effort PDF text extraction for edge runtimes (no Node fs).
 * Pulls PDF string literals from content streams. Works for many text PDFs;
 * scanned / image-only PDFs return empty.
 */
export function extractPdfTextFromBase64(base64: string): string {
  let binary: string;
  try {
    binary = atob(base64.replace(/\s/g, ''));
  } catch {
    return '';
  }

  const chunks: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(binary)) !== null) {
    const part = extractLiterals(match[1] ?? '');
    if (part) chunks.push(part);
  }

  if (chunks.join('').trim().length === 0) {
    const whole = extractLiterals(binary);
    if (whole) chunks.push(whole);
  }

  return chunks
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

function extractLiterals(content: string): string {
  const parts: string[] = [];

  const tjRe = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRe.exec(content)) !== null) {
    const raw = m[0].replace(/\s*Tj$/, '');
    const decoded = decodePdfString(raw);
    if (decoded) parts.push(decoded);
  }

  const tjArrayRe = /\[([\s\S]*?)\]\s*TJ/g;
  while ((m = tjArrayRe.exec(content)) !== null) {
    const inner = m[1] ?? '';
    const strRe = /\((?:\\.|[^\\)])*\)/g;
    let s: RegExpExecArray | null;
    while ((s = strRe.exec(inner)) !== null) {
      const decoded = decodePdfString(s[0]);
      if (decoded) parts.push(decoded);
    }
  }

  return parts.join(' ').trim();
}

function decodePdfString(literal: string): string {
  if (!literal.startsWith('(') || !literal.endsWith(')')) return '';
  const body = literal.slice(1, -1);
  return body
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) =>
      String.fromCharCode(parseInt(oct, 8)),
    );
}
