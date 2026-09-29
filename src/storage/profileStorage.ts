import AsyncStorage from '@react-native-async-storage/async-storage';

// Structured "full profile" collected after Upgrade (premium onboarding).
// Separate from the free-tier goal, and separate from the Premium flag.

const PROFILE_KEY = 'vetly:profile';
const ACTIVITIES_MAX = 5000;
const AMBITIONS_MAX = 5000;

export type StudentProfile = {
  gradeLevel: string;
  universities: string[];
  dreamCareer: string;
  /** Clubs, projects, standing — up to 5000 characters. */
  activities: string;
  /**
   * Legacy field. No longer collected in the UI.
   * On load, folded into activities when activities is empty.
   */
  currentStanding: string;
  /** Where the student wants to go (premium). */
  futureAmbitions: string;
  /**
   * Combined activities + ambitions for Analyze goal sync and older readers.
   * Kept in sync on save from the fields above.
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

function combineSituation(activities: string, ambitions: string): string {
  return [activities.trim(), ambitions.trim()].filter(Boolean).join('\n\n');
}

/** Normalize older profiles that had currentStanding or only `situation`. */
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
  const legacyStanding =
    typeof raw.currentStanding === 'string' ? raw.currentStanding : '';
  let futureAmbitions =
    typeof raw.futureAmbitions === 'string' ? raw.futureAmbitions : '';
  let activities = raw.activities;

  // Fold old standing into activities only when activities is empty.
  if (!activities.trim() && legacyStanding.trim()) {
    activities = legacyStanding;
  }

  // Migrate: old single "situation" box → activities when nothing else is set.
  if (
    !activities.trim() &&
    !futureAmbitions.trim() &&
    legacySituation.trim()
  ) {
    activities = legacySituation;
  }

  activities = activities.slice(0, ACTIVITIES_MAX);
  futureAmbitions = futureAmbitions.slice(0, AMBITIONS_MAX);

  const situation =
    combineSituation(activities, futureAmbitions) || legacySituation;

  return {
    gradeLevel: raw.gradeLevel,
    universities: raw.universities,
    dreamCareer: raw.dreamCareer,
    activities,
    currentStanding: '',
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
    activities: profile.activities.slice(0, ACTIVITIES_MAX),
    currentStanding: '',
    futureAmbitions: profile.futureAmbitions.slice(0, AMBITIONS_MAX),
    situation: combineSituation(profile.activities, profile.futureAmbitions),
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

/** True when grade, career, activities, and future ambitions are filled — skip post-upgrade onboarding. */
export function isPremiumProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.gradeLevel.trim().length > 0 &&
    profile.dreamCareer.trim().length > 0 &&
    profile.activities.trim().length > 0 &&
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
    profile.activities.trim()
      ? `Current activities: ${profile.activities.trim()}`
      : null,
    profile.futureAmbitions.trim()
      ? `Future ambitions: ${profile.futureAmbitions.trim()}`
      : null,
    !profile.activities.trim() && !profile.futureAmbitions.trim()
      ? profile.situation
      : null,
  ]
    .filter(Boolean)
    .join(' ');
}
