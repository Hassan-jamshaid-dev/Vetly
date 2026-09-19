export type LegalPageId = 'about' | 'privacy' | 'terms';

type LegalPage = {
  title: string;
  body: string;
};

export const LEGAL_PAGES: Record<LegalPageId, LegalPage> = {
  about: {
    title: 'About Vetly',
    body: `Vetly helps ambitious students decide whether an opportunity is worth their time.

Bring a society, competition, internship, MUN, or hackathon to Vetly. We evaluate it against the goals you wrote — not a generic list of “things students should do.”

Tagline: Know before you go.

Vetly is a hackathon demo built with React Native and Expo. Evaluations in this build are simulated and will later be powered by Claude.

Successful Analyze runs can sync to a Supabase table (evaluations) under an anonymous session. The synced payload may include AI text derived from your on-device profile (grade, career, situation, activities, universities, resume filename). Resume file bytes stay on this device. Your password is never saved.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Vetly keeps some data on this device and can sync evaluations to Supabase.

What we store on this device
• The goal description you write
• How many free evaluations you have used today
• If you sign in in this demo, a local name and email (the password is never saved)
• If you upgrade, a local Premium flag, evaluation history, and optional profile fields plus a resume filename
• Resume file bytes (they stay on this device)

What we sync
• An anonymous Supabase session identifies your rows (auth.uid / user_id)
• Every successful Analyze can upsert a row in the evaluations table
• Columns: user_id, id, title, score, payload, created_at
• payload may include AI-generated evaluation text derived from your on-device profile (grade, career, situation, activities, universities, and resume filename — not resume file bytes)

What we do not do
• We do not send your password anywhere (it never leaves the sign-up screen and is never saved)
• We do not sell data
• We do not upload resume file bytes or photos. A screenshot is read on this device so the evaluation can include it; it is not uploaded to Vetly.

This is a demo build. A production version that calls Claude would send your goal text and the opportunity you paste to that API. API keys never belong in a public git repo.

Last updated: September 2026`,
  },
  terms: {
    title: 'Terms of Service',
    body: `Vetly is provided as-is for a student hackathon demo.

Evaluations are guidance, not professional admissions, career, or legal advice. You decide what to apply to.

The free tier allows three evaluations per local calendar day. Premium is $4.99/month or $29.99/year via RevenueCat (vetly_pro). A development build uses RevenueCat Test Store (sandbox, no real money) or later App Store / Play. Expo Go cannot process IAP; a labeled demo unlock is local-only and is not a store purchase.

Do not rely on Vetly as the only input for university or job applications.

By using the app you agree that Hassan Jamshaid and contributors are not liable for decisions you make after reading an evaluation.

MIT-licensed source is on GitHub at Hassan-jamshaid-dev/Vetly.

Last updated: September 2026`,
  },
};
