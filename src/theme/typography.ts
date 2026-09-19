// Vetly typography. Plus Jakarta Sans is loaded once in app/_layout.tsx via
// @expo-google-fonts/plus-jakarta-sans. Always reference fonts through this
// object so a font swap is a one-file change.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  /** Same face as bold — ExtraBold is not loaded, to keep splash fonts smaller. */
  extrabold: 'PlusJakartaSans_700Bold',
} as const;

// Shared text sizes (px). Line heights are ~1.25x for headings, ~1.5x for body.
export const type = {
  display: { fontSize: 34, lineHeight: 42 },
  h1: { fontSize: 28, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
} as const;
