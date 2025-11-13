import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { success } from "@/lib/responses";
import { TrailsService } from "./trails.service";
import { ProgressService } from "./progress.service";
import {
  createTrailBody,
  updateTrailBody,
  addContentBody,
  updateContentBody,
  reorderContentBody,
  addPrerequisiteBody,
  listTrailsQuery,
  submitQuestionAnswerBody,
  trackTimeBody,
} from "./model";
import {
  startQuizAttemptBody,
  submitQuizAttemptBody,
} from "../quizzes/model";

// ===================================
// Admin Routes
// ===================================

export const adminTrails = new Elysia({ prefix: "/admin/trails" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      // List all trails
      .get(
        "/",
        async ({ query, status }) => {
          const result = await TrailsService.getAllTrails(query);
          return status(200, success(result.data, result.meta));
        },
        {
          query: listTrailsQuery,
          detail: {
            summary: "Get all trails",
            description:
              "Retrieve all trails with optional filters and pagination",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Get trail by ID
      .get(
        "/:id",
        async ({ params: { id }, status }) => {
          const trail = await TrailsService.getTrailById(id);
          return status(200, success(trail));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Get trail by ID",
            description:
              "Retrieve a specific trail with all its content and prerequisites",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Create new trail
      .post(
        "/",
        async ({ body, user, status }) => {
          const trail = await TrailsService.createTrail(body, user!.id);
          return status(201, success(trail));
        },
        {
          body: createTrailBody,
          detail: {
            summary: "Create trail",
            description: "Create a new learning trail",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Update trail
      .put(
        "/:id",
        async ({ params: { id }, body, status }) => {
          const trail = await TrailsService.updateTrail(id, body);
          return status(200, success(trail));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          body: updateTrailBody,
          detail: {
            summary: "Update trail",
            description: "Update an existing trail's properties",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Delete trail
      .delete(
        "/:id",
        async ({ params: { id }, status }) => {
          await TrailsService.deleteTrail(id);
          return status(200, success("Trail deleted successfully"));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Delete trail",
            description: "Delete a trail (only if no dependencies)",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Publish trail
      .patch(
        "/:id/publish",
        async ({ params: { id }, status }) => {
          const trail = await TrailsService.publishTrail(id);
          return status(200, success(trail));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Publish trail",
            description: "Set trail status to published",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Archive trail
      .patch(
        "/:id/archive",
        async ({ params: { id }, status }) => {
          const trail = await TrailsService.archiveTrail(id);
          return status(200, success(trail));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Archive trail",
            description: "Set trail status to archived",
            tags: ["Trails - Admin"],
          },
        },
      )

      // ===================================
      // Content Management
      // ===================================

      // Add content to trail
      .post(
        "/:id/content",
        async ({ params: { id }, body, status }) => {
          const content = await TrailsService.addContent(id, body);
          return status(201, success(content));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          body: addContentBody,
          detail: {
            summary: "Add content to trail",
            description: "Add a question, quiz, or article to the trail",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Update content item
      .put(
        "/:id/content/:contentId",
        async ({ params: { id, contentId }, body, status }) => {
          const content = await TrailsService.updateContent(
            id,
            contentId,
            body,
          );
          return status(200, success(content));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          body: updateContentBody,
          detail: {
            summary: "Update content item",
            description: "Update a content item's sequence or required flag",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Remove content from trail
      .delete(
        "/:id/content/:contentId",
        async ({ params: { id, contentId }, status }) => {
          await TrailsService.removeContent(id, contentId);
          return status(200, success("Content removed successfully"));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          detail: {
            summary: "Remove content from trail",
            description: "Remove a content item from the trail",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Reorder content
      .post(
        "/:id/content/reorder",
        async ({ params: { id }, body, status }) => {
          const content = await TrailsService.reorderContent(id, body);
          return status(200, success(content));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          body: reorderContentBody,
          detail: {
            summary: "Reorder content",
            description:
              "Update the sequence of multiple content items at once",
            tags: ["Trails - Admin"],
          },
        },
      )

      // ===================================
      // Prerequisites Management
      // ===================================

      // Add prerequisite
      .post(
        "/:id/prerequisites",
        async ({ params: { id }, body, status }) => {
          await TrailsService.addPrerequisite(id, body.prerequisiteTrailId);
          return status(201, success("Prerequisite added successfully"));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          body: addPrerequisiteBody,
          detail: {
            summary: "Add prerequisite",
            description:
              "Add a prerequisite trail (checks for circular dependencies)",
            tags: ["Trails - Admin"],
          },
        },
      )

      // Remove prerequisite
      .delete(
        "/:id/prerequisites/:prerequisiteId",
        async ({ params: { id, prerequisiteId }, status }) => {
          await TrailsService.removePrerequisite(id, prerequisiteId);
          return status(200, success("Prerequisite removed successfully"));
        },
        {
          params: t.Object({
            id: t.Number(),
            prerequisiteId: t.Number(),
          }),
          detail: {
            summary: "Remove prerequisite",
            description: "Remove a prerequisite from a trail",
            tags: ["Trails - Admin"],
          },
        },
      ),
  );

// ===================================
// Student Routes
// ===================================

export const studentTrails = new Elysia({ prefix: "/trails" })
  .use(betterAuthMacro)
  .guard({ auth: true }, (app) =>
    app
      // Get available trails
      .get(
        "/",
        async ({ user, status }) => {
          const trails = await ProgressService.getAvailableTrails(user!.id);
          return status(200, success(trails));
        },
        {
          detail: {
            summary: "Get available trails",
            description:
              "Get all published trails with enrollment status and prerequisites check",
            tags: ["Trails - Student"],
          },
        },
      )

      // Get user's enrolled trails
      .get(
        "/my-trails",
        async ({ user, status }) => {
          // This could be optimized with a dedicated service method
          const trails = await ProgressService.getAvailableTrails(user!.id);
          const enrolled = trails.filter((t) => t.isEnrolled);
          return status(200, success(enrolled));
        },
        {
          detail: {
            summary: "Get my enrolled trails",
            description: "Get trails the user is currently enrolled in",
            tags: ["Trails - Student"],
          },
        },
      )

      // Get specific trail details
      .get(
        "/:id",
        async ({ params: { id }, status }) => {
          const trail = await TrailsService.getTrailById(id);
          return status(200, success(trail));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Get trail details",
            description: "Get details of a specific trail",
            tags: ["Trails - Student"],
          },
        },
      )

      // Enroll in trail
      .post(
        "/:id/enroll",
        async ({ params: { id }, user, status }) => {
          const progress = await ProgressService.enrollInTrail(user!.id, id);
          return status(201, success(progress));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Enroll in trail",
            description:
              "Enroll the current user in a trail (checks prerequisites)",
            tags: ["Trails - Student"],
          },
        },
      )

      // Get user's progress for a trail
      .get(
        "/:id/progress",
        async ({ params: { id }, user, status }) => {
          const progress = await ProgressService.getUserTrailProgress(
            user!.id,
            id,
          );
          return status(200, success(progress));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Get trail progress",
            description: "Get the current user's progress for a specific trail",
            tags: ["Trails - Student"],
          },
        },
      )

      // Get trail content with progress
      .get(
        "/:id/content",
        async ({ params: { id }, user, status }) => {
          const content = await ProgressService.getTrailContent(user!.id, id);
          return status(200, success(content));
        },
        {
          params: t.Object({
            id: t.Number(),
          }),
          detail: {
            summary: "Get trail content",
            description:
              "Get trail content with user's progress and accessibility",
            tags: ["Trails - Student"],
          },
        },
      )

      // Mark content as complete
      .post(
        "/:id/content/:contentId/complete",
        async ({ params: { id, contentId }, user, status }) => {
          const progress = await ProgressService.markContentComplete(
            user!.id,
            id,
            contentId,
          );
          return status(200, success(progress));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          detail: {
            summary: "Mark content complete",
            description: "Mark a content item as completed",
            tags: ["Trails - Student"],
          },
        },
      )

      // Track time spent on content
      .patch(
        "/:id/content/:contentId/time",
        async ({ params: { id, contentId }, body, user, status }) => {
          await ProgressService.trackTimeSpent(
            user!.id,
            id,
            contentId,
            body.timeSpentMinutes,
          );
          return status(200, success("Time tracked successfully"));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          body: trackTimeBody,
          detail: {
            summary: "Track time spent",
            description: "Track time spent on a content item",
            tags: ["Trails - Student"],
          },
        },
      )

      // Submit standalone question answer
      .post(
        "/:id/questions/:questionId/submit",
        async ({ params: { id, questionId }, body, user, status }) => {
          const result = await ProgressService.submitQuestionAnswer(
            user!.id,
            id,
            questionId,
            body,
          );
          return status(200, success(result));
        },
        {
          params: t.Object({
            id: t.Number(),
            questionId: t.Number(),
          }),
          body: submitQuestionAnswerBody,
          detail: {
            summary: "Submit question answer",
            description: "Submit answer for a standalone question in trail",
            tags: ["Trails - Student"],
          },
        },
      )

      // Start quiz attempt in trail
      .post(
        "/:id/content/:contentId/quiz/start",
        async ({ params: { id, contentId }, body, user, status }) => {
          const result = await ProgressService.startQuizInTrail(
            user!.id,
            id,
            contentId,
            body,
          );
          return status(200, success(result));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          body: startQuizAttemptBody,
          detail: {
            summary: "Start quiz in trail",
            description: "Start a quiz attempt for a quiz content item in trail",
            tags: ["Trails - Student"],
          },
        },
      )

      // Submit quiz attempt in trail
      .post(
        "/:id/content/:contentId/quiz/submit/:attemptId",
        async ({ params: { id, contentId, attemptId }, body, user, status }) => {
          const result = await ProgressService.submitQuizInTrail(
            user!.id,
            id,
            contentId,
            attemptId,
            body,
          );
          return status(200, success(result));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
            attemptId: t.Number(),
          }),
          body: submitQuizAttemptBody,
          detail: {
            summary: "Submit quiz in trail",
            description: "Submit answers for a quiz attempt in trail and update trail progress",
            tags: ["Trails - Student"],
          },
        },
      )

      // Mark article as read in trail
      .post(
        "/:id/content/:contentId/article/mark-read",
        async ({ params: { id, contentId }, user, status }) => {
          const result = await ProgressService.markArticleReadInTrail(
            user!.id,
            id,
            contentId,
          );
          return status(200, success(result));
        },
        {
          params: t.Object({
            id: t.Number(),
            contentId: t.Number(),
          }),
          detail: {
            summary: "Mark article as read in trail",
            description: "Mark an article content item as read and update trail progress",
            tags: ["Trails - Student"],
          },
        },
      ),
  );
