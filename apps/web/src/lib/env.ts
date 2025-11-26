declare global {
  interface Window {
    __ENV__?: {
      VITE_SERVER_URL?: string;
    };
  }
}

export const getApiUrl = () => {
  if (typeof window !== "undefined" && window.__ENV__?.VITE_SERVER_URL) {
    return window.__ENV__.VITE_SERVER_URL;
  }
  return import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
};
