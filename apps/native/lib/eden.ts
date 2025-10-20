import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";

export const client = treaty<App>(process.env.EXPO_PUBLIC_SERVER_URL!, {
  fetch: {
    credentials: "include",
  },
});
