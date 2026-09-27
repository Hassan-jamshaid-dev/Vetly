const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Sets `debuggable true` on the Android *release* buildType so
 * ApplicationInfo.FLAG_DEBUGGABLE is set. Needed for RevenueCat Test Store
 * (`test_` keys) in standalone preview APKs (developmentClient: false).
 * Only applied when EAS_BUILD_PROFILE=preview (see app.config.js).
 */
function withAndroidDebuggableRelease(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;
    if (/buildTypes\s*\{[\s\S]*?release\s*\{[^}]*\bdebuggable\s+true\b/.test(contents)) {
      return config;
    }

    if (!/buildTypes\s*\{[\s\S]*?release\s*\{/.test(contents)) {
      console.warn(
        '[withAndroidDebuggableRelease] No buildTypes.release {} block found in app/build.gradle',
      );
      return config;
    }

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{)/,
      '$1\n            // Preview sandbox: allow RevenueCat Test Store (FLAG_DEBUGGABLE)\n            debuggable true',
    );
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidDebuggableRelease;
