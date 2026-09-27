import type { StudentProfile } from '@/storage/profileStorage';
import type { Evaluation } from '@/types/evaluation';

// Mock pattern analysis for Premium History. Deterministic, no API —
// same history + profile always produce the same headline.

export type CoherenceStatus = 'coherent' | 'mixed' | 'drifting';

export type CoherenceResult = {
  status: CoherenceStatus;
  headline: string;
  detail: string;
};

type Theme =
  | 'builder'
  | 'debate'
  | 'climate'
  | 'internship'
  | 'research'
  | 'leadership'
  | 'other';

const THEME_RULES: Array<{ theme: Theme; pattern: RegExp }> = [
  { theme: 'builder', pattern: /hackathon|hack club|coding|software|\bcs\b|engineer|builder|startup/i },
  { theme: 'debate', pattern: /\bmun\b|model united nations|debate|speech|forensic/i },
  { theme: 'climate', pattern: /climate|environment|sustainab|\bgreen\b/i },
  { theme: 'internship', pattern: /intern(ship)?|placement/i },
  { theme: 'research', pattern: /research|\blab\b|olympiad|paper|fellowship/i },
  { theme: 'leadership', pattern: /leader|president|captain|found/i },
];

function themeOf(title: string): Theme {
  return THEME_RULES.find((rule) => rule.pattern.test(title))?.theme ?? 'other';
}

function countThemes(items: Evaluation[]): Map<Theme, number> {
  const counts = new Map<Theme, number>();
  for (const item of items) {
    const theme = themeOf(item.title);
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  return counts;
}

function dominantTheme(counts: Map<Theme, number>): Theme {
  let best: Theme = 'other';
  let bestCount = -1;
  for (const [theme, count] of counts) {
    if (count > bestCount) {
      best = theme;
      bestCount = count;
    }
  }
  return best;
}

function namedThemes(counts: Map<Theme, number>): Theme[] {
  return [...counts.keys()].filter((theme) => theme !== 'other' && (counts.get(theme) ?? 0) > 0);
}

function careerLooksTechnical(profile: StudentProfile | null): boolean {
  const career = (profile?.dreamCareer ?? '').toLowerCase();
  return /engineer|software|computer|\bcs\b|\bai\b|founder|startup|data/.test(career);
}

function coherentHeadline(theme: Theme, profile: StudentProfile | null): string {
  if (theme === 'builder' || (theme === 'other' && careerLooksTechnical(profile))) {
    return 'You’re building a coherent CS/builder profile';
  }
  if (theme === 'debate') return 'You’re building a coherent communication profile';
  if (theme === 'climate') return 'You’re building a coherent climate and advocacy profile';
  if (theme === 'internship') return 'You’re stacking internships in a clear direction';
  if (theme === 'research') return 'You’re building a coherent research profile';
  if (theme === 'leadership') return 'You’re building a coherent leadership profile';
  return 'Your evaluations point in a consistent direction';
}

/**
 * Looks at score mix and title keywords (hackathon, MUN, climate, internship, …)
 * and returns a short pattern read for History.
 */
export function analyzeProfileCoherence(
  history: Evaluation[],
  profile: StudentProfile | null,
): CoherenceResult {
  if (history.length <= 1) {
    return {
      status: 'mixed',
      headline: 'Need a few more evaluations to see a pattern.',
      detail: 'Analyze a couple more opportunities and Vetly will show how they fit together.',
    };
  }

  const counts = countThemes(history);
  const distinct = namedThemes(counts);
  const dominant = dominantTheme(counts);
  const avg =
    history.reduce((sum, item) => sum + item.score, 0) / Math.max(history.length, 1);

  // Newest-first: if the latest picks belong to a different named theme than
  // the earlier cluster, call it drifting rather than mixed.
  const splitAt = Math.min(2, history.length - 1);
  const recent = history.slice(0, splitAt);
  const earlier = history.slice(splitAt);
  if (earlier.length > 0) {
    const recentTheme = dominantTheme(countThemes(recent));
    const earlierTheme = dominantTheme(countThemes(earlier));
    if (
      recentTheme !== 'other' &&
      earlierTheme !== 'other' &&
      recentTheme !== earlierTheme
    ) {
      return {
        status: 'drifting',
        headline: 'Your recent picks are drifting from an earlier story.',
        detail:
          'The latest opportunities sit in a different lane than the ones you already scored well. Worth asking whether that is a deliberate pivot.',
      };
    }
  }

  const twoStrongLanes = distinct.filter((theme) => (counts.get(theme) ?? 0) >= 2).length >= 2;
  if (distinct.length >= 3 || twoStrongLanes) {
    return {
      status: 'mixed',
      headline: 'These picks are pulling in different directions.',
      detail:
        avg >= 7
          ? 'Individually strong, but together they tell more than one story. A reader may not know which thread is yours.'
          : 'The mix is broad. Doubling down on the opportunities that match your goal will read more clearly than collecting more variety.',
    };
  }

  return {
    status: 'coherent',
    headline: coherentHeadline(dominant, profile),
    detail:
      avg >= 7
        ? 'High-match picks are reinforcing the same thread, which is what a focused application reads as intentional.'
        : 'The direction is consistent. Next evaluations will tell you whether the fit is getting stronger.',
  };
}
