import Elysia from "elysia";
import { adminArticles, userArticles } from "./articles";

export const adminWiki = new Elysia({
  prefix: "/wiki",
  tags: ["Admin - Wiki"],
  detail: {
    description:
      "Admin endpoints for managing wiki articles - full CRUD, publishing, and analytics",
  },
}).use(adminArticles);

export const wiki = new Elysia({
  prefix: "/wiki",
  tags: ["Wiki"],
  detail: {
    description:
      "Student endpoints for reading articles, managing bookmarks, and tracking progress",
  },
}).use(userArticles);
