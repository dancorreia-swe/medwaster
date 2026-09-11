const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "with-android-release-signing";

// Keystore location and passwords are read from the environment when Gradle runs, so
// no secret is ever written into the generated project. Without ANDROID_KEYSTORE_PATH
// the release build keeps the template's debug signing, so local release builds work.
const RELEASE_SIGNING_CONFIG = `        // Added by ${MARKER}: CI provides the upload keystore through the environment.
        if (System.getenv("ANDROID_KEYSTORE_PATH")) {
            release {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
`;

const RELEASE_SIGNING_REFERENCE =
  'signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug';

function patchAppBuildGradle(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const debugSigningConfig = /signingConfigs \{\n {8}debug \{[\s\S]*?\n {8}\}\n/;
  if (!debugSigningConfig.test(contents)) {
    throw new Error(`${MARKER} could not find the debug signingConfig in app/build.gradle`);
  }

  const releaseBuildTypeSigning = /(buildTypes \{[\s\S]*?\n {8}release \{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!releaseBuildTypeSigning.test(contents)) {
    throw new Error(`${MARKER} could not find the release buildType signingConfig in app/build.gradle`);
  }

  return contents
    .replace(debugSigningConfig, (match) => `${match}${RELEASE_SIGNING_CONFIG}`)
    .replace(releaseBuildTypeSigning, (_match, prefix) => `${prefix}${RELEASE_SIGNING_REFERENCE}`);
}

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(`${MARKER} only supports a Groovy app/build.gradle`);
    }
    config.modResults.contents = patchAppBuildGradle(config.modResults.contents);
    return config;
  });
};

module.exports.patchAppBuildGradle = patchAppBuildGradle;
