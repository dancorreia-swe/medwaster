import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { Platform } from "react-native";
import { authClient } from "./auth-client";

const isWeb = Platform.OS === "web";

/**
 * On native there is no cookie jar, so the session cookie is read back from the
 * expo client's storage and attached by hand (and browser credential handling is
 * switched off so it cannot interfere).
 *
 * On web the browser owns the cookie: `credentials: "include"` sends it, and a
 * `Cookie` header cannot be set from script anyway. The server must keep
 * echoing an explicit CORS origin with `credentials: true` for this to work — it
 * does; see `corsOrigin` in apps/server/src/index.ts.
 */
const eden = treaty<App>(process.env.EXPO_PUBLIC_SERVER_URL!, {
  fetch: {
    credentials: isWeb ? "include" : "omit",
  },
  headers: isWeb
    ? undefined
    : () => {
        const cookies = authClient.getCookie();
        return {
          Cookie: cookies || "",
        };
      },
});

export const client = eden.api;
