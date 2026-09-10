import * as SecureStore from "expo-secure-store";

/**
 * Storage backing the better-auth session cookie.
 *
 * `@better-auth/expo` only needs `{ getItem, setItem }`. On iOS/Android that is
 * the Keychain/Keystore via expo-secure-store. See ./auth-storage.web.ts for the
 * browser implementation — expo-secure-store has no web build, and calling it
 * there throws inside the client's `headers()` callback, which silently prevents
 * every API request from being sent.
 */
export const authStorage = {
  getItem: (key: string) => SecureStore.getItem(key),
  setItem: (key: string, value: string) => SecureStore.setItem(key, value),
};
