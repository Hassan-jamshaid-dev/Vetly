// Vetly colour palette. Import from here instead of hard-coding hex values.
export const colors = {
  // Brand
  purple: '#6C5CE7',
  blue: '#4A90E2',
  // Brand gradient, always top-left -> bottom-right
  gradient: ['#6C5CE7', '#4A90E2'] as const,

  // Surfaces
  background: '#FAFAFA',
  /** Very light lavender-white used behind Splash and Onboarding. */
  backgroundSoft: '#F5F6FB',
  /** Near-white tile behind the V mark (VMarkTile). */
  tileSurface: '#F5F6FA',
  white: '#FFFFFF',
  /** Translucent whites for glassy surfaces on top of the brand gradient. */
  whiteAlpha18: '#FFFFFF2E',
  whiteAlpha25: '#FFFFFF40',

  // Text
  textPrimary: '#1A1D29',
  textSecondary: '#6B7280',
  /** TextInput placeholder text. */
  placeholder: '#A0A4B8',

  // Lines and fills
  /** Hairline separators: tab bar top border, InsightRow dividers, ScoreRing track. */
  hairline: '#ECEEF5',
  /** Inactive tab icon/label tint, and the "neutral" insight dot. */
  tabInactive: '#9AA0B4',
  /** Small chevron / disclosure glyphs on list rows. */
  chevron: '#C0C4D6',
  /** Grey bars in the faded placeholder behind LockedCard. */
  skeleton: '#E4E6EF',

  // Purple accents (light)
  /** Pale purple fill behind purple icons (icon tiles, lock circles). */
  purpleTint: '#EEEBFF',
  /** Pale purple outline for pill buttons. */
  purpleBorder: '#DCD9FA',

  // Controls
  /** Splash progress-bar track. */
  progressTrack: '#E4E6F5',
  /** Flat fill for a disabled GradientButton. */
  buttonDisabled: '#C9CBE3',

  // Status colours (used by later screens, e.g. evaluation verdicts)
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Paywall (dark screen — the one place we break from the light surfaces)
  paywallTop: '#1B1240',
  paywallBottom: '#3D2A8A',
  paywallCard: '#FFFFFF14',
  paywallCardSelected: '#FFFFFF29',
  paywallMuted: '#FFFFFFB8',
  paywallLine: '#FFFFFF26',

  // Brand mark gradient (VMark): violet top-left -> brand blue -> sky blue top-right.
  mark: {
    violet: '#7C3AED',
    purple: '#6C5CE7',
    blue: '#4A90E2',
    sky: '#38BDF8',
  },

  // Decorative pastels for background shapes on Splash / Onboarding.
  decor: {
    periwinkle: '#DCE3FF',
    lavender: '#E4E1FF',
    ice: '#DDE6FF',
    mist: '#D9E2FF',
    ribbon: '#C9C4FF',
    ribbonLight: '#D6DBFF',
    /** Fully transparent versions of the ribbon colours, for clean fades
     *  (fading to plain 'transparent' tints towards grey on iOS). */
    ribbonClear: '#C9C4FF00',
    ribbonLightClear: '#D6DBFF00',
    glow: '#E9E7FF',
    line: '#C7CDF6',
    orbit: '#B9B4F5',
    sparkle: '#8B7CF6',
    dot: '#7C6CF0',
    sphereLight: '#A5B4FC',
  },
};
