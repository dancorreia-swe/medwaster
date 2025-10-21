import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { authClient } from "./auth-client";

const cookies = authClient.getCookie();

const headers = {
  Cookie: cookies,
};

export const client = treaty<App>(process.env.EXPO_PUBLIC_SERVER_URL!, {
  headers,
  fetch: {
    credentials: "omit",
  },
});
