// 4-point grid. Name by size, not by use — pick the nearest step instead of a literal.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  /** Card inner padding / comfortable inset (between lg and xl). */
  gutter: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
