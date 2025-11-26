import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { authClient } from "./auth-client";

const eden = treaty<App>(process.env.EXPO_PUBLIC_SERVER_URL!, {
  fetch: {
    credentials: "omit",
  },
  headers: () => {
    const cookies = authClient.getCookie();
    return {
      Cookie: cookies || "",
    };
  },
});

export const client = eden.api;
