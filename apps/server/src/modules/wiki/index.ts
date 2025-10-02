import { betterAuthMacro } from "@/lib/auth";
import Elysia from "elysia";
import { wikiArticles } from "./articles";
import { wikiFiles } from "./files";

export const wiki = new Elysia({ prefix: "/wiki" })
  .use(wikiArticles)
  .use(wikiFiles)
