import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { authClient } from "./auth-client";

export const client = treaty<App>(process.env.EXPO_PUBLIC_SERVER_URL!, {
  fetch: {
    credentials: "omit",
  },
  headers: () => {
    // Dynamically fetch cookies on each request
    const cookies = authClient.getCookie();
    return {
      Cookie: cookies || "",
    };
  },
});
