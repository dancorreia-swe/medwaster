import Elysia from "elysia";

export const wiki = new Elysia({ prefix: "/wiki" }).guard(
  { auth: true },
  (app) =>
    app
      .get("/private", () => "This is a private wiki page")
      .get("/not-public", () => "This is not public"),
);
