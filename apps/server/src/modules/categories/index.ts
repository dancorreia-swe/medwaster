import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import { createCategoryBody, updateCategoryBody } from "./model";
import { CategoriesService } from "./categories.service";
import { NotFoundError } from "@/lib/errors";

export const categories = new Elysia({ prefix: "/categories" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .get("/", async ({ status }) => {
        const categories = await CategoriesService.getAllCategories();

        return status(200, categories);
      })
      .patch(
        "/:id",
        async ({ params: { id }, body, status }) => {
          const category = await CategoriesService.updateCategory(id, body);

          return status(200, category);
        },
        {
          params: t.Object({ id: t.Number() }),
          body: updateCategoryBody,
        },
      )
      .get("/:id", async ({ status, params: { id } }) => {
        const category = await CategoriesService.getCategoryById(id);
        if (!category) {
          throw new NotFoundError("Category not found");
        }

        return status(200, category);
      })
      .post(
        "/",
        async ({ body, status }) => {
          const category = await CategoriesService.createCategory(body);

          return status(201, category);
        },
        {
          body: createCategoryBody,
        },
      ),
  );
