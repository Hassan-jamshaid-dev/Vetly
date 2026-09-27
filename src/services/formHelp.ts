import type { StudentProfile } from '@/storage/profileStorage';

/** True when the pasted opportunity looks like a form, application, or registration to complete. */
const APPLICATION_RE =
  /apply|application|\bforms?\b|deadline|submit|essay|cover letter|personal statement|admissions|internship|fellowship|scholarship|olympiad|position paper|registr(?:y|ation)|register (?:now|as|for)/i;

export function looksLikeApplication(text: string): boolean {
  return APPLICATION_RE.test(text);
}

/**
 * Concrete "how to fill this" steps from the saved profile and goal hints.
 * Empty when the opportunity is not an application.
 */
export function buildFormHelp(options: {
  title: string;
  focus: string;
  school: string | null;
  profile: StudentProfile | null;
}): string[] {
  const { title, focus, school, profile } = options;
  const grade = profile?.gradeLevel.trim() || 'your year';
  const career = profile?.dreamCareer.trim() || focus;
  const unis = profile?.universities ?? [];
  const activities = profile?.activities.trim();
  const situation = profile?.situation.trim();
  const resumeName = profile?.resumeName?.trim();
  const schoolBit = school ? ` (especially ${school})` : '';

  const steps = [
    `In the “about you” / year field, write ${grade} and that you are aiming at ${career}${schoolBit}.`,
    situation
      ? `In the why / motivation box, use this as the spine: ${situation}. Then add one sentence on why ${title} is the next step, not a side quest.`
      : `In the why / motivation box, connect ${title} to ${focus} in one sentence. If you cannot, that is your answer.`,
    activities
      ? `In experience / activities, pick one or two lines from what you already listed (${activities}) and make them specific: role, what you shipped, what changed.`
      : `In experience / activities, name one real project or role tied to ${focus}. Vague “interested in STEM” reads as empty.`,
  ];

  if (resumeName) {
    steps.push(`Attach ${resumeName} where they ask for a CV or resume. Do not paste the whole file into an essay box.`);
  } else {
    steps.push(
      'They will likely ask for a resume. Add one from Profile (you can skip it at first and upload later) so this form is not missing an attachment.',
    );
  }

  if (unis.length > 0) {
    steps.push(
      `If they ask where you are headed, name ${unis.slice(0, 3).join(', ')} — only if it is true. Do not invent a school list for the form.`,
    );
  }

  steps.push(
    `Do not treat this form as proof of ${focus} unless the prompt asks for it. Answer what they asked, in their word limit.`,
  );

  return steps;
}
