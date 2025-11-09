import { betterAuthMacro, ROLES } from "@/lib/auth";
import Elysia, { t } from "elysia";
import {
  createQuizBody,
  updateQuizBody,
  startQuizAttemptBody,
  submitQuizAttemptBody,
} from "./model";
import { QuizzesService } from "./quizzes.service";
import { NotFoundError } from "@/lib/errors";
import { success } from "@/lib/responses";

export const adminQuizzes = new Elysia({ prefix: "/admin/quizzes" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .get(
        "/",
        async ({ query, status }) => {
          // Parse array parameters from query string
          const parseArray = (value: string | string[] | undefined) => {
            if (!value) return undefined;
            if (Array.isArray(value)) return value;
            return value.includes(',') ? value.split(',') : [value];
          };

          const parseNumberArray = (value: string | string[] | number | number[] | undefined) => {
            if (!value) return undefined;
            if (typeof value === 'number') return [value];
            if (Array.isArray(value)) {
              return value.map(v => typeof v === 'number' ? v : Number(v));
            }
            const arr = parseArray(value as string);
            return arr?.map(Number);
          };

          const quizzes = await QuizzesService.getAllQuizzes({
            page: query.page,
            pageSize: query.pageSize,
            status: parseArray(query.status) as any,
            difficulty: parseArray(query.difficulty) as any,
            categoryId: parseNumberArray(query.categoryId),
            search: query.search,
          });

          return status(200, quizzes);
        },
        {
          query: t.Object({
            page: t.Optional(t.Number({ minimum: 1 })),
            pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            status: t.Optional(t.Union([t.String(), t.Array(t.String())])),
            difficulty: t.Optional(t.Union([t.String(), t.Array(t.String())])),
            categoryId: t.Optional(t.Union([t.Number(), t.Array(t.Number())])),
            search: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get all quizzes",
            description:
              "Retrieve all quizzes with optional filters and pagination",
            tags: ["Admin", "Quizzes"],
          },
        },
      )
      .get(
        "/:id",
        async ({ status, params: { id } }) => {
          const quiz = await QuizzesService.getQuizById(id);
          return status(200, quiz);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Get quiz by ID",
            description:
              "Retrieve a single quiz with all questions and metadata",
            tags: ["Admin", "Quizzes"],
          },
        },
      )
      .post(
        "/",
        async ({ body, user, status }) => {
          const quiz = await QuizzesService.createQuiz(body, user!.id);
          return status(201, quiz);
        },
        {
          body: createQuizBody,
          detail: {
            summary: "Create a new quiz",
            description: "Create a quiz with questions and configuration",
            tags: ["Admin", "Quizzes"],
          },
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, status }) => {
          const quiz = await QuizzesService.updateQuiz(id, body);
          return status(200, quiz);
        },
        {
          params: t.Object({ id: t.Number() }),
          body: updateQuizBody,
          detail: {
            summary: "Update a quiz",
            description:
              "Update quiz data and questions. Questions are replaced completely if provided",
            tags: ["Admin", "Quizzes"],
          },
        },
      )
      .patch(
        "/:id/archive",
        async ({ params: { id }, status }) => {
          const quiz = await QuizzesService.archiveQuiz(id);
          return status(200, quiz);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Archive a quiz",
            description: "Set quiz status to archived",
            tags: ["Admin", "Quizzes"],
          },
        },
      )
      .delete(
        "/:id",
        async ({ status, params: { id } }) => {
          await QuizzesService.deleteQuiz(id);
          return status(200, success("Quiz deleted successfully"));
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Delete a quiz",
            description:
              "Permanently delete a quiz and all related data (cascading)",
            tags: ["Admin", "Quizzes"],
          },
        },
      ),
  );

export const studentQuizzes = new Elysia({ prefix: "/quizzes" })
  .use(betterAuthMacro)
  .guard({ auth: true }, (app) =>
    app
      .get(
        "/",
        async ({ query, status }) => {
          const quizzes = await QuizzesService.getAvailableQuizzes({
            page: query.page,
            pageSize: query.pageSize,
            difficulty: query.difficulty as any,
            categoryId: query.categoryId,
            search: query.search,
          });

          return status(200, quizzes);
        },
        {
          query: t.Object({
            page: t.Optional(t.Number({ minimum: 1 })),
            pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            difficulty: t.Optional(t.String()),
            categoryId: t.Optional(t.Number()),
            search: t.Optional(t.String()),
          }),
          detail: {
            summary: "Get available quizzes",
            description: "Retrieve active quizzes for students",
            tags: ["Quizzes"],
          },
        },
      )
      .get(
        "/:id",
        async ({ status, params: { id } }) => {
          const quiz = await QuizzesService.getQuizById(id);

          if (quiz.status !== "active") {
            throw new NotFoundError("Quiz not available");
          }

          return status(200, quiz);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Get quiz for taking",
            description: "Retrieve a quiz with questions for student attempt",
            tags: ["Quizzes"],
          },
        },
      )
      .post(
        "/:id/start",
        async ({ params: { id }, body, user, headers, status }) => {
          const attempt = await QuizzesService.startQuizAttempt(id, user!.id, {
            ...body,
            ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
            userAgent: headers["user-agent"],
          });

          return status(201, attempt);
        },
        {
          params: t.Object({ id: t.Number() }),
          body: startQuizAttemptBody,
          detail: {
            summary: "Start quiz attempt",
            description: "Begin a new attempt for the specified quiz",
            tags: ["Quizzes"],
          },
        },
      )
      .post(
        "/attempts/:id/submit",
        async ({ params: { id }, body, user, status }) => {
          const attempt = await QuizzesService.submitQuizAttempt(
            id,
            user!.id,
            body,
          );

          return status(200, attempt);
        },
        {
          params: t.Object({ id: t.Number() }),
          body: submitQuizAttemptBody,
          detail: {
            summary: "Submit quiz attempt",
            description: "Submit answers and complete the quiz attempt",
            tags: ["Quizzes"],
          },
        },
      )
      .get(
        "/attempts/:id/results",
        async ({ params: { id }, user, status }) => {
          const results = await QuizzesService.getQuizAttemptResults(
            id,
            user!.id,
          );

          return status(200, results);
        },
        {
          params: t.Object({ id: t.Number() }),
          detail: {
            summary: "Get quiz attempt results",
            description: "Retrieve results and answers for a completed attempt",
            tags: ["Quizzes"],
          },
        },
      ),
  );
