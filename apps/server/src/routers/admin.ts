import { betterAuthMacro } from "@/lib/auth";
import { adminWiki } from "@/modules/wiki";
import Elysia from "elysia";

export const admin = new Elysia({
  prefix: "/admin",
  detail: {
    description: "Admin related routes",
    tags: ["Admin"],
  },
})
  .use(betterAuthMacro)
  .use(adminWiki);
