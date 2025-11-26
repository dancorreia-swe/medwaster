import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { getApiUrl } from "./env";

export const client = treaty<App>(getApiUrl(), {
  fetch: {
    credentials: "include",
  },
});
