import { betterAuthMacro } from "@/lib/auth";
import { wiki } from "@/modules/wiki";
import Elysia from "elysia";

export const student = new Elysia({
  detail: {
    description: "Student related routes",
    tags: ["Student", "Mobile"],
  },
})
  .use(betterAuthMacro)
  .use(wiki);
