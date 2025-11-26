import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { getApiUrl } from "./env";

const eden = treaty<App>(getApiUrl(), {
  fetch: {
    credentials: "include",
  },
});

export const client = eden.api;
