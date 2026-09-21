import type { TextStyle } from 'react-native';

import { colors } from './colors';

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

const heading = {
  color: colors.textPrimary,
} as const;

// Named text styles (font + size + color + tracking). Headings sit slightly
// tight; body stays in the 1.45–1.55 line-height band.
export const type = {
  display: {
    ...heading,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  h1: {
    ...heading,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  h2: {
    ...heading,
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    ...heading,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.1,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  /** White label for GradientButton and other filled CTAs. */
  button: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.15,
    color: colors.white,
  },
  /** Field labels, section kicker, chrome copy. */
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
} as const satisfies Record<string, TextStyle>;
