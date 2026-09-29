import AsyncStorage from '@react-native-async-storage/async-storage';

// Structured "full profile" collected after Upgrade (premium onboarding).
// Separate from the free-tier goal, and separate from the Premium flag.

const PROFILE_KEY = 'vetly:profile';

export type StudentProfile = {
  gradeLevel: string;
  universities: string[];
  dreamCareer: string;
  activities: string;
  /** Where the student is now (premium). */
  currentStanding: string;
  /** Where the student wants to go (premium). */
  futureAmbitions: string;
  /**
   * Combined standing + ambitions for Analyze goal sync and older readers.
   * Kept in sync on save from the two fields above.
   */
  situation: string;
  resumeUri: string | null;
  resumeName: string | null;
};

export const EMPTY_PROFILE: StudentProfile = {
  gradeLevel: '',
  universities: [],
  dreamCareer: '',
  activities: '',
  currentStanding: '',
  futureAmbitions: '',
  situation: '',
  resumeUri: null,
  resumeName: null,
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function combineSituation(standing: string, ambitions: string): string {
  return [standing.trim(), ambitions.trim()].filter(Boolean).join('\n\n');
}

/** Normalize older profiles that only had `situation`. */
function normalizeProfile(raw: Record<string, unknown>): StudentProfile | null {
  if (
    typeof raw.gradeLevel !== 'string' ||
    !isStringArray(raw.universities) ||
    typeof raw.dreamCareer !== 'string' ||
    typeof raw.activities !== 'string' ||
    (raw.resumeUri !== null && typeof raw.resumeUri !== 'string') ||
    (raw.resumeName !== null && typeof raw.resumeName !== 'string')
  ) {
    return null;
  }

  const legacySituation = typeof raw.situation === 'string' ? raw.situation : '';
  let currentStanding =
    typeof raw.currentStanding === 'string' ? raw.currentStanding : '';
  let futureAmbitions =
    typeof raw.futureAmbitions === 'string' ? raw.futureAmbitions : '';

  // Migrate: old single "situation" box → treat as current standing until they re-edit.
  if (!currentStanding.trim() && !futureAmbitions.trim() && legacySituation.trim()) {
    currentStanding = legacySituation;
  }

  const situation =
    combineSituation(currentStanding, futureAmbitions) || legacySituation;

  return {
    gradeLevel: raw.gradeLevel,
    universities: raw.universities,
    dreamCareer: raw.dreamCareer,
    activities: raw.activities,
    currentStanding,
    futureAmbitions,
    situation,
    resumeUri: (raw.resumeUri as string | null) ?? null,
    resumeName: (raw.resumeName as string | null) ?? null,
  };
}

/** Returns the saved profile, or null if none / storage failed. */
export async function getProfile(): Promise<StudentProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return normalizeProfile(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Writes the full profile object. */
export async function setProfile(profile: StudentProfile): Promise<void> {
  const next: StudentProfile = {
    ...profile,
    situation: combineSituation(profile.currentStanding, profile.futureAmbitions),
  };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
}

/** Drops the structured profile. Used by demo launch reset. */
export async function clearProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch {
    /* Demo reset is best-effort. */
  }
}

/** Merge a partial update into whatever is already saved. */
export async function updateProfile(patch: Partial<StudentProfile>): Promise<StudentProfile> {
  const current = (await getProfile()) ?? { ...EMPTY_PROFILE };
  const next: StudentProfile = { ...current, ...patch };
  await setProfile(next);
  return next;
}

/** True when grade, career, and both narrative fields are filled — skip post-upgrade onboarding. */
export function isPremiumProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.gradeLevel.trim().length > 0 &&
    profile.dreamCareer.trim().length > 0 &&
    profile.currentStanding.trim().length > 0 &&
    profile.futureAmbitions.trim().length > 0
  );
}

/** True when a local resume file name is saved (skip-for-now leaves this empty). */
export function hasResumeFile(profile: StudentProfile | null): boolean {
  return Boolean(profile?.resumeName?.trim());
}

/** True when any structured profile field is present (guest Premium still has a person page). */
export function hasProfileContent(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.gradeLevel.trim().length > 0 ||
    profile.universities.length > 0 ||
    profile.dreamCareer.trim().length > 0 ||
    profile.activities.trim().length > 0 ||
    (profile.resumeName != null && profile.resumeName.trim().length > 0) ||
    profile.currentStanding.trim().length > 0 ||
    profile.futureAmbitions.trim().length > 0 ||
    profile.situation.trim().length > 0
  );
}

/**
 * Turn the structured profile into the same kind of goal text Analyze already uses.
 * Used after premium onboarding when Analyze still has no saved goal.
 */
export function profileToGoalText(profile: StudentProfile): string {
  const uni =
    profile.universities.length > 0
      ? `aiming for ${profile.universities.join(', ')}`
      : 'exploring universities';
  return [
    `I am a ${profile.gradeLevel} student ${uni}.`,
    `I want to become a ${profile.dreamCareer}.`,
    `Current activities: ${profile.activities}.`,
    profile.currentStanding.trim() ? `Current standing: ${profile.currentStanding.trim()}` : null,
    profile.futureAmbitions.trim()
      ? `Future ambitions: ${profile.futureAmbitions.trim()}`
      : null,
    !profile.currentStanding.trim() && !profile.futureAmbitions.trim()
      ? profile.situation
      : null,
  ]
    .filter(Boolean)
    .join(' ');
}
