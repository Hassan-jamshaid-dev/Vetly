// Soft elevation. Prefer boxShadow over legacy shadow*/elevation so web and native match.
export const shadows = {
  card: '0 4px 14px rgba(26, 29, 41, 0.05)',
  /** Lifted CTAs (GradientButton). Alias of `raised`. */
  button: '0 8px 20px rgba(108, 92, 231, 0.26)',
  raised: '0 8px 20px rgba(108, 92, 231, 0.26)',
  overlay: '0 12px 28px rgba(26, 29, 41, 0.12)',
} as const;
