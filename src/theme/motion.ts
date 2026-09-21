// Durations in ms. Press/fade uses opacity (optional tiny scale) — no springs.
export const motion = {
  /** Press, toggle, opacity feedback. */
  fast: 150,
  /** Short enter/exit and chrome fades. */
  base: 250,
  easing: {
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;
