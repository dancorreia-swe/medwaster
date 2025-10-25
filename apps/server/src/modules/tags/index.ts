import { betterAuthMacro } from "@/lib/auth";
import Elysia from "elysia";
import { TagsService } from "./service";
import { success } from "@/lib/responses";
import {
  createTagBody,
  listTagsQuery,
  tagParams,
  updateTagBody,
} from "./model";

export const adminTags = new Elysia({
  prefix: "/admin/tags",
  tags: ["Admin - Tags"],
  detail: {
    description: "Admin endpoints for managing tags - create, update, and delete",
  },
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      roles: ["admin", "super-admin"],
    },
    (app) =>
      app
        .post(
          "/",
          async ({ body, status }) => {
            const newTag = await TagsService.createTag(body);

            return status(201, success(newTag));
          },
          {
            body: createTagBody,
            detail: {
              summary: "Create a new tag",
              description:
                "Create a new tag for categorizing articles. If color is not provided, a random pleasant color will be assigned automatically.",
              tags: ["Admin - Tags"],
            },
          },
        )
        .patch(
          "/:id",
          async ({ params: { id }, body: tag, status }) => {
            const updatedTag = await TagsService.updateTag(id, tag);

            return status(200, success(updatedTag));
          },
          {
            params: tagParams,
            body: updateTagBody,
            detail: {
              summary: "Update a tag",
              description:
                "Update an existing tag's properties. Only provided fields will be updated.",
              tags: ["Admin - Tags"],
            },
          },
        )
        .delete(
          "/:id",
          async ({ params: { id }, status }) => {
            await TagsService.deleteTag(id);

            return status(204);
          },
          {
            params: tagParams,
            detail: {
              summary: "Delete a tag",
              description:
                "Permanently delete a tag. This action cannot be undone.",
              tags: ["Admin - Tags"],
            },
          },
        ),
  );

export const tags = new Elysia({
  prefix: "/tags",
  tags: ["Tags"],
  detail: {
    description: "Tag endpoints for browsing and filtering article tags",
  },
})
  .use(betterAuthMacro)
  .guard({ auth: true }, (app) =>
    app.get(
      "/",
      async ({ status, query }) => {
        const allTags = await TagsService.getAll(query);

        return status(200, success(allTags));
      },
      {
        query: listTagsQuery,
        detail: {
          summary: "List all tags",
          description:
            "Retrieve a list of all tags. Supports optional search filtering by name or slug.",
          tags: ["Tags"],
        },
      },
    ),
  );
