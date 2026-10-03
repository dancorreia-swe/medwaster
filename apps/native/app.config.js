// Extends app.json. The Sentry Expo plugin wires source map / debug symbol
// upload into the native release builds. It is only added when
// SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are all set at prebuild
// time, so builds without them (local dev, forks, CI before the secret exists)
// skip the upload instead of failing.
module.exports = ({ config }) => {
  const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_URL } =
    process.env;
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
    return config;
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        "@sentry/react-native/expo",
        {
          url: SENTRY_URL || "https://sentry.io/",
          organization: SENTRY_ORG,
          project: SENTRY_PROJECT,
        },
      ],
    ],
  };
};
