import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { adminClient } from "better-auth/client/plugins";
import { Platform } from "react-native";
import { authStorage } from "./auth-storage";

/**
 * The expo client plugin exists because native has no cookie jar: it reads
 * `set-cookie` off each response and replays it as a `Cookie` header itself.
 *
 * A browser cannot do that — `set-cookie` is a forbidden response header, so the
 * plugin never captures the session and every request goes out unauthenticated.
 * The browser already has a cookie jar, so on web the plugin is left out and
 * better-auth's default credentialed fetch is used instead. `lib/eden.ts` makes
 * the matching split for API calls.
 */
const plugins = [
  ...(Platform.OS === "web"
    ? []
    : [expoClient({ storagePrefix: "medwaster", storage: authStorage })]),
  adminClient(),
];

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
  plugins,
});
