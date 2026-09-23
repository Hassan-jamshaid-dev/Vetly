export type LegalPageId = 'about' | 'privacy' | 'terms';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalPage = {
  title: string;
  intro: string;
  sections: LegalSection[];
  updated: string;
};

export const LEGAL_PAGES: Record<LegalPageId, LegalPage> = {
  about: {
    title: 'About Vetly',
    intro:
      'Vetly helps ambitious students decide whether an opportunity is worth their time. Bring a society, competition, internship, MUN, or hackathon to Vetly. We score it against the goals you wrote, not a generic list of things students should do.',
    sections: [
      {
        heading: 'Know before you go',
        paragraphs: [
          'Vetly is a student-built demo app made with React Native and Expo. In this build, evaluations are simulated on your device. A future version may use an AI provider such as Claude.',
          'You can read the Privacy Policy and Terms and Conditions from Settings. Source code is on GitHub at Hassan-jamshaid-dev/Vetly.',
        ],
      },
    ],
    updated: 'September 2026',
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This Privacy Policy explains what Vetly stores on your device, what may be synced to the cloud, and what we do not collect. It is written for everyday readers. Vetly is a demo app built by a minor student, not a registered company.',
    sections: [
      {
        heading: 'Who provides Vetly',
        paragraphs: [
          'Vetly is an independent student project. The builder is about 16 years old. There is no company street address or support inbox in this app.',
          'For questions about this policy or the app, contact the project through the public GitHub repository Hassan-jamshaid-dev/Vetly.',
        ],
      },
      {
        heading: 'Information stored on your device',
        paragraphs: [
          'Most of your information stays on the phone, tablet, or browser where you use Vetly.',
          'We store the goal description you write, and how many free evaluations you have used on the current local calendar day.',
          'If you use the demo sign-in screen, we may store a local name and email so the app can show that you are signed in. The password you type on that screen is never saved and is never sent anywhere. It only exists while you are filling out the form.',
          'If you unlock Premium, we may store a local Premium flag, your evaluation history, and optional profile fields such as grade level, universities of interest, career goals, activities, and your situation. We may also store a resume file name and the resume file itself. Resume file bytes stay on your device.',
          'If you attach a screenshot while analyzing an opportunity, that image is read on your device so the evaluation can use it. Screenshot file bytes are not uploaded to Vetly.',
        ],
      },
      {
        heading: 'Information that may sync to the cloud',
        paragraphs: [
          'When cloud sync is configured, Vetly can create an anonymous session with Supabase. That session identifies your synced rows without using your demo sign-in password.',
          'After a successful Analyze, Vetly may save an evaluation record that includes a title, score, timestamp, and the evaluation text generated for that run. That text may reflect details from your on-device profile, such as grade, career goals, situation, activities, universities, and resume file name. Resume file bytes are not included.',
          'Cloud sync is best-effort. Analyze can still finish on your device if sync fails.',
        ],
      },
      {
        heading: 'Purchases',
        paragraphs: [
          'Subscriptions are handled by RevenueCat together with Apple or Google when you buy inside the iOS or Android app. Purchase and entitlement information may be processed by those providers so Premium can be unlocked and restored.',
          'The website version of Vetly cannot complete a real checkout. Website Premium unlocks, if any, are local demo behavior only and are not store purchases.',
        ],
      },
      {
        heading: 'Evaluations and AI',
        paragraphs: [
          'This demo may show mock evaluations. It does not promise live AI results in the current build.',
          'A future version may send the opportunity text, your goal, and premium profile fields to an AI provider such as Claude so it can write an evaluation. History and resume file bytes are not part of that intended payload today.',
          'This demo does not send API keys from the app. Secrets for AI or other backends should never be bundled into a public client build.',
        ],
      },
      {
        heading: 'What we do not do',
        paragraphs: [
          'We do not sell your personal data.',
          'We do not upload resume file bytes.',
          'We do not save or transmit the demo sign-in password.',
          'We do not invent a company identity or a private support email in this policy.',
        ],
      },
      {
        heading: 'Age',
        paragraphs: [
          'Vetly is aimed at students. If you are under 18, a parent or guardian should review this Privacy Policy with you and supervise your use of the app.',
          'Because this is a student demo with limited contact options, we do not knowingly operate a separate children-only service. If you believe data about a young person should be removed from synced evaluations, reach out through the GitHub repository named above.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'We may update this Privacy Policy as the app changes. The "Last updated" date at the bottom of this screen will change when we do. Continued use after an update means you accept the revised policy.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Contact is through the GitHub repository Hassan-jamshaid-dev/Vetly. Please do not expect a formal company privacy office or a dedicated email address for this demo.',
        ],
      },
    ],
    updated: 'September 2026',
  },
  terms: {
    title: 'Terms and Conditions',
    intro:
      'These Terms and Conditions govern your use of Vetly. By continuing to use the app or website, you agree to these terms. If you do not agree, do not use Vetly.',
    sections: [
      {
        heading: 'What Vetly is',
        paragraphs: [
          'Vetly is a demo app that helps students think about whether an opportunity fits their goals. It is a student project, not a commercial product from a registered company.',
          'Features may change, break, or be reset between demo builds. Content you see in this build may be simulated.',
        ],
      },
      {
        heading: 'Not professional advice',
        paragraphs: [
          'Vetly evaluations are informal guidance only. They are not admissions advice, career counseling, legal advice, or professional coaching.',
          'You alone decide what to apply to, attend, or skip. Do not treat Vetly as the only input for university, internship, or job decisions.',
        ],
      },
      {
        heading: 'Free and Premium',
        paragraphs: [
          'The free tier allows up to three evaluations per local calendar day on the device you are using.',
          'Premium unlocks additional features described in the app, such as more evaluations and deeper profile-based guidance. Premium status may be stored on your device and, on supported platforms, verified through the store purchase system.',
        ],
      },
      {
        heading: 'Subscriptions and billing',
        paragraphs: [
          'When purchased in the iOS or Android app, Premium is offered at $10.99 per month or $80.99 per year. Apple or Google bills those subscriptions according to their store rules. Manage, cancel, or request refunds through your Apple or Google account settings.',
          'Purchases use RevenueCat with the App Store or Google Play. The website cannot complete checkout. Any unlock offered on the website is a local demo control and is not a real store purchase.',
          'Sandbox or test purchases in a development build are not charged as real money unless you use a live store account that your platform provider bills.',
        ],
      },
      {
        heading: 'Evaluations can be wrong',
        paragraphs: [
          'Scores, insights, and guidance can be incomplete, outdated, biased, or simply wrong. In this demo they may be mock results rather than live model output.',
          'You accept that risk when you use Vetly.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'Use Vetly only for lawful, personal, student-oriented purposes. Do not try to disrupt the service, abuse sync systems, reverse-engineer other users\' data, or use the app to harm others.',
          'Do not upload content you do not have the right to use. Do not rely on Vetly to store irreplaceable records. Keep your own copies of important materials.',
        ],
      },
      {
        heading: 'As-is demo',
        paragraphs: [
          'Vetly is provided as is, without warranties of any kind, to the fullest extent allowed by law. That includes implied warranties of accuracy, fitness for a particular purpose, and non-infringement.',
          'To the fullest extent allowed by law, the builder and contributors are not liable for decisions you make after reading an evaluation, for lost data, for purchase disputes handled by Apple or Google, or for any damages arising from use of this demo.',
        ],
      },
      {
        heading: 'Age',
        paragraphs: [
          'If you are under 18, you should only use Vetly with a parent or guardian\'s permission and supervision. A parent or guardian who allows a minor to use Vetly is responsible for that use under these terms.',
        ],
      },
      {
        heading: 'Privacy',
        paragraphs: [
          'How we handle information is described in the Privacy Policy. Using Vetly also means you understand that policy.',
        ],
      },
      {
        heading: 'Agreement',
        paragraphs: [
          'Continuing to use Vetly means you agree to these Terms and Conditions. If you do not agree, stop using the app and uninstall or leave the website.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these terms can be raised through the GitHub repository Hassan-jamshaid-dev/Vetly. There is no separate company legal department or support email for this demo.',
        ],
      },
    ],
    updated: 'September 2026',
  },
};
