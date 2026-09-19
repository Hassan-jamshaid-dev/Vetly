import AsyncStorage from '@react-native-async-storage/async-storage';

// Structured "full profile" collected after Upgrade (premium onboarding).
// Separate from the free-tier goal, and separate from the Premium flag.

const PROFILE_KEY = 'vetly:profile';

export type StudentProfile = {
  gradeLevel: string;
  universities: string[];
  dreamCareer: string;
  activities: string;
  situation: string;
  resumeUri: string | null;
  resumeName: string | null;
};

export const EMPTY_PROFILE: StudentProfile = {
  gradeLevel: '',
  universities: [],
  dreamCareer: '',
  activities: '',
  situation: '',
  resumeUri: null,
  resumeName: null,
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isProfile(value: unknown): value is StudentProfile {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as StudentProfile;
  return (
    typeof item.gradeLevel === 'string' &&
    isStringArray(item.universities) &&
    typeof item.dreamCareer === 'string' &&
    typeof item.activities === 'string' &&
    typeof item.situation === 'string' &&
    (item.resumeUri === null || typeof item.resumeUri === 'string') &&
    (item.resumeName === null || typeof item.resumeName === 'string')
  );
}

/** Returns the saved profile, or null if none / storage failed. */
export async function getProfile(): Promise<StudentProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes the full profile object. */
export async function setProfile(profile: StudentProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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

/** True when grade, career, and situation are filled — skip post-upgrade onboarding. */
export function isPremiumProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.gradeLevel.trim().length > 0 &&
    profile.dreamCareer.trim().length > 0 &&
    profile.situation.trim().length > 0
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
    profile.situation,
  ].join(' ');
}
