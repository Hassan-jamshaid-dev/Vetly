/**
 * Dynamic Expo config. Keeps static fields in app.json and adds preview-only
 * native tweaks (debuggable release for RevenueCat Test Store).
 */
const appJson = require('./app.json');

module.exports = () => {
  const expo = { ...appJson.expo };
  const plugins = [...(expo.plugins ?? [])];

  // Preview standalone APK: release binary that is FLAG_DEBUGGABLE so RevenueCat
  // allows the Test Store `test_` key without killing the process. Not a
  // developmentClient / Metro shell — JS is still bundled by EAS.
  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    plugins.push('./plugins/withAndroidDebuggableRelease');
  }

  return {
    ...expo,
    plugins,
  };
};
