import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import { createQuestionBody, updateQuestionBody } from "./model";
import { QuestionsService } from "./questions.service";
import { NotFoundError } from "@/lib/errors";
import { success } from "@/lib/responses";
import { questionImages } from "./images";

export const adminQuestions = new Elysia({ prefix: "/admin/questions" })
  .use(betterAuthMacro)
  .use(questionImages)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .get(
        "/",
        async ({ query, status }) => {
          const questions = await QuestionsService.getAllQuestions({
            page: query.page,
            pageSize: query.pageSize,
            type: query.type,
            difficulty: query.difficulty,
            status: query.status,
            categoryId: query.categoryId,
            search: query.search,
          });

          return status(200, questions);
        },
        {
          query: t.Object({
            page: t.Optional(t.Number({ minimum: 1 })),
            pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            type: t.Optional(t.String()),
            difficulty: t.Optional(t.String()),
            status: t.Optional(t.String()),
            categoryId: t.Optional(t.Number()),
            search: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get all questions",
            description:
              "Retrieve all questions with optional filters and pagination",
            tags: ["Questions"],
          },
        },
      )
      .get(
        "/:id",
        async ({ status, params: { id } }) => {
          const question = await QuestionsService.getQuestionById(id);

          return status(200, question);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Get question by ID",
            description:
              "Retrieve a single question with all related data (options, blanks, pairs, tags)",
            tags: ["Questions"],
          },
        },
      )
      .post(
        "/",
        async ({ body, user, status }) => {
          const question = await QuestionsService.createQuestion(
            body,
            user!.id,
          );

          return status(201, question);
        },
        {
          body: createQuestionBody,
          detail: {
            summary: "Create a new question",
            description:
              "Create a question with variations (options, fill-in-the-blanks, matching pairs) and tags",
            tags: ["Questions"],
          },
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, status }) => {
          const question = await QuestionsService.updateQuestion(id, body);

          return status(200, question);
        },
        {
          params: t.Object({ id: t.Number() }),
          body: updateQuestionBody,
          detail: {
            summary: "Update a question",
            description:
              "Update question data and variations. Variations are replaced completely if provided",
            tags: ["Questions"],
          },
        },
      )
      .patch(
        "/:id/archive",
        async ({ params: { id }, status }) => {
          const question = await QuestionsService.archiveQuestion(id);

          return status(200, question);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Archive a question",
            description: "Set question status to archived",
            tags: ["Questions"],
          },
        },
      )
      .delete(
        "/:id",
        async ({ status, params: { id } }) => {
          await QuestionsService.deleteQuestion(id);

          return status(200, success("Question deleted successfully"));
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Delete a question",
            description:
              "Permanently delete a question and all related data (cascading)",
            tags: ["Questions"],
          },
        },
      ),
  );
