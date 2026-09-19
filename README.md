# Vetly

**know before you go**

Paste an opportunity (internship, hackathon, MUN, society). Vetly scores it against *your* goals so you know if it is worth the time **before** you apply. Reverse discovery — not another feed of listings.

Built for students. **Shipaton 2026 Next Gen.** Solo project by a 16-year-old.

**Demo video:** you must record and add this on Devpost yourself. This repo does not include a video — do not submit without one.

**Try it**

| | URL |
|---|---|
| Web demo | https://vetly-f99d6523.netlify.app |
| Android APK (standalone, not a development client) | https://expo.dev/artifacts/eas/13J2iyD6VXc5LpyVcoyq9b5JS5C6SFWd7MLQ8SirqT0.apk |
| GitHub | https://github.com/Hassan-jamshaid-dev/Vetly |

Screenshots (1179×2556, no device frame): `assets/screenshots/home.png`, `evaluate.png`, `results.png`, `paywall.png`.

---

## Contents

1. [Product](#product)
2. [For judges](#for-judges)
3. [How the app works (user flows)](#how-the-app-works-user-flows)
4. [How the code works (architecture)](#how-the-code-works-architecture)
5. [Tech stack](#tech-stack)
6. [Folder map](#folder-map)
7. [Setup](#setup)
8. [RevenueCat dashboard](#revenuecat-dashboard)
9. [Submission notes](#submission-notes)
10. [License](#license)

---

## Product

Discovery apps keep showing more listings. Students already find internships, hackathons, MUNs, and societies — the expensive part is saying yes. Vetly is **reverse discovery**: you bring an opportunity you already found, and the app scores it against the goal you wrote.

The core loop is short:

1. Write who you are and what you want (at least 20 words).
2. Paste a link, description, or screenshot of something you are considering.
3. Read a 1–10 match score, insights, and (on Premium) preparation guidance.
4. Decide whether to spend the weekend — or skip it.

### Free vs Premium

| | Free | Premium (`vetly_pro`) |
|---|---|---|
| Login | Not required | Not required. Sign-in is a **demo identity**, not a paywall. |
| Evaluations | 3 per local calendar day | Unlimited |
| Goal length | Minimum 20 words, maximum **500 characters** | Minimum 20 words, maximum **2000 words** |
| Results | Title, source, score, label, key insights | Same, plus unlocked guidance |
| Form-fill help | Not available | Opens only when the opportunity looks like an **application / form** |
| History tab | Locked teaser → paywall | On-device list (newest first, capped at 50) plus a pattern card |
| Home “Recent evaluations” | Locked | Last three saved evaluations |
| Structured profile | Optional demo sign-in; guest sees the goal | Post-subscribe onboarding (grade, career, situation, optional universities and resume) |

Signing in does **not** unlock Premium. Premium is granted only when RevenueCat `CustomerInfo` has an active **`vetly_pro`** entitlement (or, in Expo Go `__DEV__` only, a labeled local demo unlock that is **not** a store purchase).

Evaluations in this build are an **on-device mock**. Claude is not live. `EXPO_PUBLIC_CLAUDE_API_KEY` must stay empty — a real key must never be bundled in the client.

---

## For judges

**Skip signup.** There is no production auth and no judge password.

### Guest path (recommended)

1. Open the app. After splash, tap **Get Started**. Do not tap demo sign-in / Google / Apple.
2. Write a goal (≥20 words) or paste the on-screen Grade 11 / Waterloo / MIT example → **Continue**.
3. Home → **Evaluate Opportunity**. Paste an opportunity *or* tap an example card (Hack Club, MUN, Youth Climate Summit) → **Analyze**.
4. Read the score vs your goal. That is the product: know before you go.

Onboarding copy says “No login required. Skip the demo sign-up.”

### Demo Google / Apple (optional)

Email / Google / Apple on **Sign up** are **simulated** (labeled demo in the UI). Passwords stay on that screen and are **never saved**. After Continue, you go to Goal (if none is saved) or Home. You still need RevenueCat for Premium.

### Expo Go vs standalone APK

| What to test | Where |
|---|---|
| Reverse discovery (free) | **Web**, **Expo Go**, or the standalone APK. No account. |
| Subscribe / `vetly_pro` | **Standalone or development APK** (native IAP). Expo Go and web cannot load store purchases. |

**Standalone Android APK (judges):** https://expo.dev/artifacts/eas/13J2iyD6VXc5LpyVcoyq9b5JS5C6SFWd7MLQ8SirqT0.apk

**Web:** https://vetly-f99d6523.netlify.app (guest reverse discovery; no IAP). If that URL asks for a Netlify login, set **Project configuration → General → Visitor access → Project visibility → Public**.

RevenueCat Test Store is a **real SDK purchase** (`Purchases.purchasePackage` or `RevenueCatUI.presentPaywall`). The sandbox modal charges **$0** — no real money. Do not treat the Expo Go control **Unlock demo (not billed · not a store purchase)** as the Shipaton purchase. That control is `__DEV__` and local-only.

There is no TestFlight yet.

**Bundle id / package:** `com.vetly.app`  
**EAS project id:** `84c1a658-cca3-4e5d-a4a1-ef58c21758ee`

---

## How the app works (user flows)

Expo Router file routes under `app/`. The root stack starts at splash (`app/index.tsx`). Tabs are Home, History, and Profile. Evaluate, Results, Paywall, Settings, and the rest sit on the stack above the tabs.

### Splash (`/`)

Shows the Vetly mark and tagline **Know before you go.** After a short brand beat (~900 ms):

- If a goal is already saved and `DEMO_FORCE_FIRST_RUN` is `false` (the product default in `src/config/demo.ts`) → **Home**.
- Otherwise → **Onboarding**.

If `DEMO_FORCE_FIRST_RUN` is flipped to `true` (recording only; do not commit `true`), splash resets the demo session (signed out, not Premium, 0/3 usage, empty history / goal / profile, Supabase sign-out). A development build then **restores Premium from RevenueCat** if `vetly_pro` is still active, so a real Test Store purchase still wins. Expo Go keeps the simulated flag cleared.

### Onboarding (`/onboarding`)

Value proposition: “Your goals. Your profile. Your next move.”

- **Get Started** → Goal. Guest path.
- **Demo sign-in (not real accounts)** → Sign up.

### Goal (`/goal`)

The user describes who they are and what they are aiming for. Every later evaluation is scored against this text.

- First run: **Continue** saves the goal and resets the stack to Home (back cannot return to splash / onboarding).
- From Settings: `/goal?mode=edit` → **Save** returns to Settings.

Free: 20+ words, 500-character cap. Premium: 20+ words, 2000-word cap.

### Sign up (`/signup`) — not Premium

Simulated account: name, email, password (never persisted). **Continue with Google (demo)** / **Continue with Apple (demo)** finish the same local sign-in. This never calls `setIsPremium`, never opens the paywall, and never starts premium onboarding.

### Home (`/(tabs)/home`)

Dashboard: greeting (and first name if demo-signed-in), **Evaluate Opportunity**, **Your Profile**, and Recent Evaluations.

- Free: recent list is locked; **Upgrade** opens the paywall.
- Premium: last three evaluations; tap one to open Results. If Supabase is configured, Home also merges remote rows into local history.

The gear opens **Settings**.

### Evaluate (`/evaluate`)

Paste a link or description (max 2000 characters) and/or **Upload Screenshot** (`expo-image-picker`). Three example cards fill the field with copy the mock engine recognizes.

**Analyze:**

- Free with 0 remaining today → paywall (the evaluation is not run).
- Otherwise the mock engine runs (~1.4–1.9 s delay), then:
  - Premium: append to local History.
  - Free: consume one of the three daily slots (resets at **local** midnight).
  - **Always** (best-effort): upsert to Supabase if configured. Cloud failure never blocks Analyze.
  - Put the result in the in-memory store and push **Results**.

Footer: remaining free evaluations, or “Unlimited evaluations” on Premium.

### Results (`/results`)

Score ring (1–10), label (**Excellent Match** 8–10, **Good Match** 5–7, **Low Match** 1–4), and key insights.

- Free: guidance is a **LockedCard** → paywall.
- Premium: **GuidanceCard**. If `hasApplication` is true, a **How to fill this form** button opens Application Help. If the opportunity is an event to attend rather than a form, that button is omitted — form-help is not extra homework on top of a go / no-go call.

**Evaluate another** returns to Evaluate.

### Form-help vs evaluation

| Evaluation (`/results`) | Form help (`/application-help`) |
|---|---|
| Should I spend time on this vs my goal? | How do I fill *this* application using my saved profile? |
| Always shown after Analyze | Premium only, and only when the pasted text looks like apply / form / deadline / essay / internship / etc. |
| Insights + score | Numbered steps, what to highlight, what to be careful of, copyable starter paragraph (the evaluation’s `guidance`) |

Deep-linking into form-help without Premium redirects to the paywall. Non-application evaluations redirect back to Results.

### Paywall (`/paywall`)

Plans match dashboard products: **Yearly $29.99** (best value) and **Monthly $4.99**.

On a development / store build with a public SDK key:

- **Subscribe** calls `purchaseSelectedPlan` → `Purchases.purchasePackage` for `$rc_annual` or `$rc_monthly` (matched by product id `vetly_pro_yearly` / `vetly_pro_monthly`).
- If the current offering has no packages, Subscribe falls back to **`RevenueCatUI.presentPaywall`**.
- **RevenueCat Paywall** presents the dashboard paywall directly.
- **Restore Purchases** calls `Purchases.restorePurchases`.
- Success is accepted **only** after `vetly_pro` is active on `CustomerInfo`. Test Store: sandbox, **$0**.

On Expo Go: primary CTA is **Install a development build**. Restore explains that Expo Go cannot restore a store purchase.

After a real unlock (or the labeled `__DEV__` demo unlock), if the structured premium profile is incomplete → **Premium onboarding**. If the user just analyzed something, that evaluation is saved to History.

### Premium onboarding (`/premium-onboarding`) and Resume (`/resume`)

After Upgrade, a structured profile: grade level, optional target universities, dream career, current activities, situation (≥20 characters). Continue writes `src/storage/profileStorage.ts`. If Analyze still has no goal text, the profile is turned into a goal string.

Then **Resume**: optional PDF or image. Only a **local URI + file name** are stored. Bytes are never uploaded, never parsed, never committed. Skip is allowed; Profile / Settings can add a file later. First-time setup then lands on Home, or Results if an evaluation is still in memory (so Unlock from Results still shows the guidance they paid for).

`/premium-onboarding?mode=edit` and `/resume?mode=edit` return to Profile instead of continuing the first-run chain.

### History (`/(tabs)/history`)

Free: locked. Premium: newest-first list plus a **pattern** card from `src/services/coherence.ts` (deterministic mock over titles + profile — not a live model). Tap a row → Results.

### Profile (`/(tabs)/profile`)

Guest: goal preview, **Edit your goal**, **Demo sign-in**.  
Signed-in or structured profile: person page (name, chips, goal, activities, resume row). Gear → Settings.

### Settings (`/settings`)

Edit goal, optional **Add resume**, About / Privacy / Terms (`/legal?page=…`), **Restore purchases**, and **Manage subscription** (RevenueCat Customer Center when the native UI SDK is present). Free users see **Upgrade to Premium**. Demo accounts can **Log out** (clears the simulated session; does not revoke `vetly_pro`). Footer: `Vetly 1.0.0 · know before you go`.

---

## How the code works (architecture)

```
app/                         Expo Router screens
src/services/evaluation.ts   Mock “brain” (evaluateOpportunity)
src/services/purchases.ts    RevenueCat SDK + UI
src/services/evaluationCloud.ts  Optional Supabase upsert / fetch
src/storage/*                AsyncStorage (and SecureStore for demo session)
src/lib/supabase.ts          Anon client + anonymous sign-in
src/config/demo.ts           First-run / recording switch
```

TypeScript path alias: `@/` → `src/` (`tsconfig.json`).

### Boot

`app/_layout.tsx` holds the native splash until Plus Jakarta Sans is ready, then hides it. On mount it calls `configurePurchases()` and, if native IAP is available, `refreshPremiumFromRevenueCat()`. `unstable_settings.initialRouteName` is `index` (splash).

`configurePurchases` is a no-op in Expo Go, on web, or when `EXPO_PUBLIC_REVENUECAT_API_KEY` is empty. It never uses a secret REST key.

### Analyze data flow

```
Evaluate.handleAnalyze
  → getIsPremium / getRemainingToday (free cap)
  → evaluateOpportunity(input, goal, profile)     // always mock today
  → Premium: appendHistory ; Free: consumeOne
  → saveEvaluationRemote(evaluation)              // fire-and-forget upsert
  → setCurrentEvaluation(evaluation)
  → router.push('/results')
```

`saveEvaluationRemote` (`src/services/evaluationCloud.ts`):

- No-op if Supabase env vars are missing.
- `requireUserId()` reuses or creates an **anonymous** session (`auth.uid()`).
- Upserts `evaluations` on conflict `(user_id, id)` with `title`, `score`, JSON `payload`, `created_at`.
- Skips payloads larger than 32,000 characters (matches `supabase/setup.sql`).
- Errors are logged; Analyze still succeeds.

Home and History then `fetchRemoteEvaluations` and `mergeRemoteHistory` (newest first, cap 50).

Local History (`vetly:history`) is **Premium-only**. Free Analyze still may upsert to Supabase; the History tab does not show those rows until `vetly_pro` is active.

### Evaluation engine (mock, not Claude)

`src/services/evaluation.ts` is the seam. Keep `evaluateOpportunity()`’s signature; only the body should change when a **server-side** model is wired. The file has a TODO for Claude; **the body never reads the env key today**. Filling `EXPO_PUBLIC_CLAUDE_API_KEY` does nothing and would leak the key in the bundle.

Behavior:

1. Curated results for the three Evaluate examples (Hack Club **9**, MUN **7**, Climate Summit **4**), with copy that references goal hints (focus, school, startup).
2. Generic fallback: deterministic hash of the paste → base score 5–8, nudged by high/low-signal phrases; insights drawn from pools.
3. `looksLikeApplication()` (`src/services/formHelp.ts`) sets `hasApplication` and `formHelp` steps from the structured profile when present.

`src/services/score.ts` maps the integer to label and color. `src/types/evaluation.ts` is the UI contract — a future Claude adapter should map into this shape inside `evaluation.ts`.

### RevenueCat

| Constant | Value |
|---|---|
| Entitlement | `vetly_pro` |
| Products | `vetly_pro_monthly` ($4.99), `vetly_pro_yearly` ($29.99) |
| Packages | `$rc_monthly`, `$rc_annual` |

`src/storage/premiumStorage.ts` is a **cache** (`vetly:isPremium`). Native builds treat RevenueCat as source of truth: `setPremiumFromCustomerInfo` writes `true` **only** when `entitlements.active.vetly_pro` exists. A failed refresh does not invent Premium. Expo Go does not overwrite a labeled demo unlock with a missing entitlement.

Customer Center (`RevenueCatUI.presentCustomerCenter`) is opened from Settings; on dismiss, Premium is refreshed again.

### Auth vs Premium vs cloud identity

Three separate things:

1. **Demo sign-in** — name + email in SecureStore / AsyncStorage. Password never written. Independent of Premium.
2. **Premium** — RevenueCat `vetly_pro` (or `__DEV__` Expo Go demo flag).
3. **Supabase anonymous user** — `auth.uid()` for RLS on `evaluations`. Not shown in the UI. Demo logout does not delete cloud rows; Settings copy says evaluations may remain under the anonymous user.

### Storage keys (on device)

| Module | Role |
|---|---|
| `goalStorage` | Goal text; splash uses this to skip onboarding |
| `usageStorage` | `{ date, count }` for the free daily cap of 3 |
| `premiumStorage` | Local Premium boolean |
| `historyStorage` | Premium evaluation log |
| `profileStorage` | Structured premium profile + resume URI/name |
| `authStorage` | Simulated account |
| `evaluationStore` | In-memory current evaluation (not persisted) |

---

## Tech stack

As used in `package.json` / `app.json` (not a wishlist):

- **Expo SDK 57** (`expo ~57.0.20`), **React Native 0.86**, **React 19**, New Architecture enabled
- **Expo Router** (`expo-router ~57.0.19`), typed routes, React Compiler experiment
- **Expo Dev Client** (`expo-dev-client`) for development / EAS builds
- **RevenueCat:** `react-native-purchases` + `react-native-purchases-ui` ^10.9.1 (Test Store sandbox now; Apple / Google public SDK keys later)
- **Supabase:** `@supabase/supabase-js`, anonymous sign-in, `evaluations` table with RLS (`supabase/setup.sql`)
- **AsyncStorage** for goal, usage, history, profile, Premium cache
- **expo-secure-store** for demo session and native Supabase auth storage (AsyncStorage fallback on web)
- **expo-image-picker**, **expo-document-picker**, **expo-clipboard**, **expo-haptics**, **expo-linear-gradient**, **expo-font**, **expo-splash-screen**, **expo-constants**
- **Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`)
- **Reanimated** 4, Gesture Handler, Screens, Safe Area, SVG, Masked View
- **TypeScript** (strict)

There are **no committed `ios/` or `android/` folders** (managed workflow; those directories are gitignored). Generate them with `npx expo run:android` / `run:ios` or EAS.

---

## Folder map

```
Vetly/
├── app/                          File-based routes (Expo Router)
│   ├── _layout.tsx               Root stack, fonts, RevenueCat configure
│   ├── index.tsx                 Splash
│   ├── onboarding.tsx            Get Started / demo sign-in
│   ├── goal.tsx                  Goal capture and edit
│   ├── signup.tsx                Simulated email / Google / Apple
│   ├── evaluate.tsx              Paste / screenshot / Analyze
│   ├── results.tsx               Score, insights, locked or full guidance
│   ├── application-help.tsx      Premium form-fill steps
│   ├── paywall.tsx               Yearly / monthly Subscribe
│   ├── premium-onboarding.tsx    Structured profile after Upgrade
│   ├── resume.tsx                Optional local resume file
│   ├── settings.tsx              Restore, Customer Center, legal
│   ├── legal.tsx                 About / Privacy / Terms
│   └── (tabs)/
│       ├── _layout.tsx           Home / History / Profile tab bar
│       ├── home.tsx              Dashboard
│       ├── history.tsx           Premium history + pattern card
│       └── profile.tsx           Person page or guest goal
├── src/
│   ├── services/
│   │   ├── evaluation.ts         Mock evaluateOpportunity
│   │   ├── formHelp.ts           Application detection + form steps
│   │   ├── score.ts              1–10 → label and color
│   │   ├── coherence.ts          Mock History pattern analysis
│   │   ├── purchases.ts          RevenueCat configure / buy / restore / paywall / Customer Center
│   │   └── evaluationCloud.ts    Supabase upsert and fetch
│   ├── storage/                  AsyncStorage helpers (goal, usage, premium, history, profile, auth)
│   ├── lib/supabase.ts           Client, SecureStore auth, anonymous requireUserId
│   ├── store/evaluationStore.ts  In-memory current evaluation
│   ├── config/demo.ts            DEMO_FORCE_FIRST_RUN
│   ├── demo/resetDemoSession.ts  Recording reset + RC restore
│   ├── types/evaluation.ts       Evaluation / Insight shapes
│   ├── content/legal.ts          About, privacy, terms copy
│   ├── navigation/               Reset-to-Home helpers, query-param helper
│   ├── theme/                    colors, typography, shadows
│   ├── components/               Buttons, cards, score ring, locked card, tab icons, decor
│   └── utils/                    dialog, relativeTime
├── supabase/setup.sql            evaluations table + RLS
├── assets/images/                App icon, paywall hero
├── assets/screenshots/           1179×2556 PNGs (home, evaluate, results, paywall)
├── app.json                      Name, scheme vetly, bundle id, EAS projectId
├── eas.json                      development / preview / production profiles
├── .env.example                  Placeholder env names only
└── package.json                  Scripts: start, run:android, eas:dev
```

---

## Setup

```bash
git clone https://github.com/Hassan-jamshaid-dev/Vetly.git
cd Vetly
npm install
cp .env.example .env
npx expo start
```

Copy `.env.example` → `.env`. Empty placeholders only. Never put `service_role`, a database password, or a RevenueCat **secret** REST key in the app. Restart Metro after changing `.env`. Different networks: `npx expo start --tunnel`.

| Variable | What it is |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL (`https://….supabase.co`). Optional. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key. Never `service_role`. |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Test Store **public** SDK key. Unused in Expo Go. Never the secret REST key. |
| `EXPO_PUBLIC_CLAUDE_API_KEY` | Leave empty. The client mock does not call Claude. |
| `REVENUECAT_SECRET` | Optional, **local catalog scripts only**. Never `EXPO_PUBLIC_`. Never commit a real value. |

- **Expo Go** (`npx expo start`): JS app, guest reverse discovery. No IAP.
- **IAP:** a binary that includes native purchases, then `npx expo start --dev-client`.

```bash
npx expo run:android
# macOS: npx expo run:ios
# or: npm run eas:dev   # EAS development profile (Android APK for judges)
```

**Bundle identifier / Android package:** `com.vetly.app`  
**EAS:** `extra.eas.projectId` is `84c1a658-cca3-4e5d-a4a1-ef58c21758ee` (`app.json`). Profiles in `eas.json`: `development` (dev client, internal), `preview` (internal), `production`.

Optional Supabase: enable **Anonymous sign-in** in the dashboard, run `supabase/setup.sql` (creates `public.evaluations`, forces RLS, grants `authenticated` only). Analyze still works if URL/anon key are unset.

---

## RevenueCat dashboard

Sandbox now; App Store / Play later. Do not ship a Test Store public key to production.

**Entitlement:** `vetly_pro`

**Test Store products**

| Product id | Price (copy in the app) |
|---|---|
| `vetly_pro_monthly` | $4.99 / month |
| `vetly_pro_yearly` | $29.99 / year |

**RevenueCat Project ID:** not stored in this repo. Copy the `proj…` value from the RevenueCat dashboard (Project settings) if Devpost asks for it.

**Current offering packages:** `$rc_monthly` and `$rc_annual`, attached to those products and to `vetly_pro`. Add a dashboard Paywall on the current offering if you want **RevenueCat Paywall** / the no-packages fallback.

**Demo Subscribe on a development build (not Expo Go):**

1. Put the Test Store **public** SDK key in `EXPO_PUBLIC_REVENUECAT_API_KEY`, restart Metro, reopen the dev client.
2. Open the paywall → **Subscribe** (`purchasePackage`) or **RevenueCat Paywall** (`presentPaywall`).
3. Confirm `vetly_pro` is active (unlimited evals / History). Settings → Restore purchases / Manage subscription.

Expo Go shows **Install a development build**. The `__DEV__` “Unlock demo (not billed)” control is local-only and is **not** the Shipaton purchase.

**Go live later:** keep bundle id `com.vetly.app`. Create the same product ids on App Store Connect and Google Play, attach them to the same `vetly_pro` entitlement, then swap `.env` to Apple / Google **public** SDK keys (still never the secret REST key).

---

## Submission notes

Paste into Devpost as needed.

### Idea & impact

Discovery apps keep showing more listings. Students already find internships, hackathons, MUNs, and societies — the expensive part is saying yes. Vetly is reverse discovery: paste what you found, get a score against your actual goals, then decide. Know before you go. Built solo by a 16-year-old, for students. **Shipaton 2026 Next Gen.**

### Challenges & learnings

Expo Go cannot run native IAP, so Subscribe only works on a development / EAS build. RevenueCat Test Store is a real SDK purchase (`purchasePackage` / `presentPaywall` → entitlement `vetly_pro`), not a fake local unlock. Keeping Google/Apple sign-in honest (demo, not production auth) and leaving Claude as an on-device mock until a key can live on a server mattered more than polishing another feed. Optional Supabase had to stay best-effort so Analyze never depends on the network.

### What’s next

Claude for live evaluations (**server-side** key, never `EXPO_PUBLIC_`). Same `vetly_pro` products on App Store / Play. Production auth can replace the simulated Google / Apple buttons without changing the guest path.

### Links for Devpost fields

- **GitHub:** https://github.com/Hassan-jamshaid-dev/Vetly
- **Website / web demo:** https://vetly-f99d6523.netlify.app
- **Android APK:** https://expo.dev/artifacts/eas/13J2iyD6VXc5LpyVcoyq9b5JS5C6SFWd7MLQ8SirqT0.apk
- **Screenshots:** `assets/screenshots/` (home, evaluate, results, paywall — 1179×2556, no device frame)
- **Video:** paste your Devpost video URL here after you upload it. **You must add the video on Devpost; this project does not include one.**
- **Claude:** on-device mock. Not live.

### Before you click Submit

1. Record and upload the Devpost demo video (required; not in this repo).
2. Confirm Netlify visitor access is **Public** so judges are not asked to log in.
3. If you are under 18, complete any guardian / parental-consent step Devpost shows.
4. Copy the RevenueCat `proj…` id from the dashboard only if a form field asks for it.

---

## License

MIT
