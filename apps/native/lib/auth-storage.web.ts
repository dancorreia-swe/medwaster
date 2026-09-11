/**
 * Web implementation of the better-auth session storage (see ./auth-storage.ts).
 *
 * expo-secure-store is native-only, so the browser falls back to localStorage.
 * There is no secure-enclave equivalent on the web; this is the same trade-off
 * better-auth's own web client makes. Every access is guarded because storage
 * throws outright in private windows and when site data is blocked.
 */
export const authStorage = {
  getItem: (key: string): string | null => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Storage unavailable — the session simply will not persist across reloads.
    }
  },
};
