/**
 * Demo-video launch behaviour.
 *
 * DEMO_ALWAYS_SHOW_ONBOARDING = true  (TEMPORARY — demo / recording)
 *   Every cold start / reload: Splash → Get Started → free goal onboarding.
 *   Does NOT wipe a saved goal, Premium, or history. Flip back to false to
 *   restore skip-to-Home when a goal is already saved.
 *
 * DEMO_FORCE_FIRST_RUN = true
 *   Every cold start / reload:
 *   - Resets the demo session: signed out, not Premium, daily usage 0/3,
 *     empty history, empty goal, empty structured profile.
 *   - Then Splash → Get Started → 300–1000-character goal → Home.
 *   Goal is still written on Continue so Analyze has context that session.
 *   If a development build has a live RevenueCat `vetly_pro` entitlement,
 *   Premium is restored after the reset so store purchases still win.
 *   Expo Go keeps the simulated flag cleared.
 *   Flip back to true only for a recording; do not commit true.
 *
 * DEMO_FORCE_FIRST_RUN = false  (product default)
 *   Splash skips to Home when a goal is already saved — unless
 *   DEMO_ALWAYS_SHOW_ONBOARDING is on.
 *   Sign-in, Premium, usage, history, and goal persist across launches.
 */
/** Product default: persist the session and skip onboarding when a goal exists. */
export const DEMO_FORCE_FIRST_RUN = false;

/** Product default: skip onboarding when a goal is already saved. */
export const DEMO_ALWAYS_SHOW_ONBOARDING = false;
