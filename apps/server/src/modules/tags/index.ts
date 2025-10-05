import { betterAuthMacro } from "@/lib/auth";
import Elysia from "elysia";
import { TagsService } from "./service";
import { success } from "@/lib/responses";
import { createTagBody, listTagsQuery, tagParams, updateTagBody } from "./model";

export const tags = new Elysia({ prefix: "/tags" }).use(betterAuthMacro).guard(
  {
    auth: true,
    roles: ["admin", "super-admin"],
  },
  (app) =>
    app
      .get(
        "/",
        async ({ status, query }) => {
          const allTags = await TagsService.getAll(query);

          return status(200, success(allTags));
        },
        {
          query: listTagsQuery,
        },
      )
      .post(
        "/",
        async ({ body, status }) => {
          const newTag = await TagsService.createTag(body);

          return status(201, success(newTag));
        },
        {
          body: createTagBody,
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
        },
      )
      .delete(
        "/:id",
        async ({ params: { id }, status }) => {
          const deletedTag = await TagsService.deleteTag(id);

          return status(204, success(deletedTag));
        },
        {
          params: tagParams,
        },
      ),
);
