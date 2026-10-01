declare global {
  interface Window {
    __ENV__?: {
      VITE_SERVER_URL?: string;
      VITE_SENTRY_DSN?: string;
      VITE_SENTRY_ENVIRONMENT?: string;
      VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
    };
  }
}

export const getApiUrl = () => {
  if (typeof window !== "undefined" && window.__ENV__?.VITE_SERVER_URL) {
    return window.__ENV__.VITE_SERVER_URL;
  }
  return import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
};

type RuntimeEnvKey = keyof NonNullable<Window["__ENV__"]>;

/**
 * Read a value injected at container start (env-config.js), falling back to
 * the build-time `import.meta.env` value for local dev.
 */
export const getRuntimeEnv = (key: RuntimeEnvKey): string | undefined => {
  const runtime =
    typeof window !== "undefined" ? window.__ENV__?.[key] : undefined;
  return runtime || (import.meta.env[key] as string | undefined) || undefined;
};
