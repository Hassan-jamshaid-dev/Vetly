// Soft elevation used by Card and GradientButton. Prefer boxShadow over
// legacy shadow*/elevation so web and native match.
export const shadows = {
  card: '0 6px 18px rgba(26, 29, 41, 0.06)',
  button: '0 8px 20px rgba(108, 92, 231, 0.28)',
} as const;
