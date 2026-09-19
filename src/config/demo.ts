/**
 * Demo-video launch behaviour.
 *
 * DEMO_FORCE_FIRST_RUN = true
 *   Every cold start / reload:
 *   - Resets the demo session: signed out, not Premium, daily usage 0/3,
 *     empty history, empty goal, empty structured profile.
 *   - Then Splash → Get Started → 500-character goal → Home.
 *   Goal is still written on Continue so Analyze has context that session.
 *   If a development build has a live RevenueCat `vetly_pro` entitlement,
 *   Premium is restored after the reset so store purchases still win.
 *   Expo Go keeps the simulated flag cleared.
 *   Flip back to true only for a recording; do not commit true.
 *
 * DEMO_FORCE_FIRST_RUN = false  (current — product default)
 *   Splash skips to Home when a goal is already saved.
 *   Sign-in, Premium, usage, history, and goal persist across launches.
 */
export const DEMO_FORCE_FIRST_RUN = false;
