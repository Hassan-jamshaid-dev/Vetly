import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type HomeHeroArtProps = {
  /** Rendered width and height. Art is square in a 200 viewBox. */
  size?: number;
};

/**
 * Soft mountain, winding path, and flag used on Home. Decorative only —
 * sits to the right of the headline so the hero never leaves a blank gap.
 */
export function HomeHeroArt({ size = 148 }: HomeHeroArtProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const skyId = `home-sky-${rawId}`;
  const mountainId = `home-mtn-${rawId}`;
  const faceId = `home-face-${rawId}`;
  const flagId = `home-flag-${rawId}`;
  const pathId = `home-path-${rawId}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessible={false}
      importantForAccessibility="no"
    >
      <Defs>
        <LinearGradient id={skyId} x1="0.2" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#EDE9FE" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#DBEAFE" stopOpacity="0.35" />
        </LinearGradient>
        <LinearGradient id={mountainId} x1="0.15" y1="0.1" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#C4B5FD" />
          <Stop offset="0.45" stopColor="#A5B4FC" />
          <Stop offset="1" stopColor="#818CF8" />
        </LinearGradient>
        <LinearGradient id={faceId} x1="0" y1="0.2" x2="1" y2="0.9">
          <Stop offset="0" stopColor="#EEF2FF" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#C7D2FE" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={flagId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7C3AED" />
          <Stop offset="1" stopColor="#4A90E2" />
        </LinearGradient>
        <LinearGradient id={pathId} x1="0" y1="1" x2="0.4" y2="0">
          <Stop offset="0" stopColor="#F8FAFF" />
          <Stop offset="1" stopColor="#EEF2FF" />
        </LinearGradient>
      </Defs>

      <Circle cx="118" cy="108" r="78" fill={`url(#${skyId})`} />
      <Circle cx="118" cy="100" r="48" fill="#E0E7FF" opacity="0.55" />

      {/* Clouds */}
      <Ellipse cx="58" cy="78" rx="26" ry="13" fill="#F8FAFF" opacity="0.95" />
      <Ellipse cx="78" cy="72" rx="18" ry="11" fill="#FFFFFF" opacity="0.92" />
      <Ellipse cx="44" cy="82" rx="14" ry="9" fill="#EEF2FF" opacity="0.9" />
      <Ellipse cx="162" cy="70" rx="22" ry="12" fill="#FFFFFF" opacity="0.95" />
      <Ellipse cx="146" cy="66" rx="16" ry="10" fill="#EEF2FF" opacity="0.9" />

      {/* Distant right slope */}
      <Path
        d="M118 188 C132 148 148 128 168 118 C178 148 186 168 198 188 Z"
        fill="#C7D2FE"
        opacity="0.7"
      />

      {/* Main mountain */}
      <Path
        d="M22 190 C48 190 62 152 84 112 C98 84 108 58 122 28 C136 56 150 88 168 124 C184 156 190 178 198 190 Z"
        fill={`url(#${mountainId})`}
      />
      <Path
        d="M22 190 C48 190 62 152 84 112 C98 84 108 58 122 28 C118 58 96 96 78 130 C62 156 48 176 22 190 Z"
        fill={`url(#${faceId})`}
      />

      {/* Winding path */}
      <Path
        d="M58 190 C86 172 78 154 70 138 C60 118 92 112 98 94 C104 76 82 68 104 50 C114 40 118 34 122 30"
        fill="none"
        stroke={`url(#${pathId})`}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Flag */}
      <Path
        d="M122 28 V6"
        stroke="#6D28D9"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <Path d="M122 6 L150 16 L122 26 Z" fill={`url(#${flagId})`} />
    </Svg>
  );
}
