import { contentCategories } from "@/db/schema/categories";
import { createInsertSchema, createUpdateSchema } from "drizzle-typebox";
import { t } from "elysia";

export const createCategoryBody = createInsertSchema(contentCategories);
export type CreateCategoryBody = typeof createCategoryBody.static;

export const updateCategoryBody = createUpdateSchema(contentCategories, {
  description: (schema) =>
    t.String({ ...schema, maxLength: 255, nullable: true }),
});
export type UpdateCategoryBody = typeof updateCategoryBody.static;
