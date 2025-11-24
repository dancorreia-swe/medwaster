import { betterAuthMacro, ROLES } from "@/lib/auth";
import { success, successResponseSchema } from "@/lib/responses";
import Elysia, { t } from "elysia";
import {
	listUsersQuery,
	updateUserBody,
	userParams,
	userOverviewResponse,
	userAchievementDetailResponse,
	userTrailProgressResponse,
	userQuizAttemptResponse,
	type ListUsersQuery,
	type UpdateUserBody,
	type UserParams,
} from "./model";
import { UsersService } from "./service";
import { CertificateService } from "../certificates/certificates.service";

export const adminUsers = new Elysia({
	prefix: "/admin/users",
	tags: ["Admin - Users"],
	detail: {
		description: "Admin endpoints for managing users",
	},
})
	.use(betterAuthMacro)
	.guard(
		{
			auth: true,
			role: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
		},
		(app) =>
			app
				.get(
					"/",
					async ({ status, query }) => {
						const result = await UsersService.getAll(query);
						return status(200, success(result));
					},
					{
						query: listUsersQuery,
						detail: {
							summary: "List all users",
							description:
								"Get a paginated list of users with optional filtering by search term, role, or ban status",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/stats",
					async ({ status }) => {
						const stats = await UsersService.getStats();
						return status(200, success(stats));
					},
					{
						detail: {
							summary: "Get user statistics",
							description:
								"Get statistics about users including total, banned, verified, and unverified counts",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/:id/overview",
					async ({ status, params: { id } }) => {
						const overview = await UsersService.getOverview(id);
						return status(200, success(overview));
					},
					{
						params: userParams,
						response: successResponseSchema(userOverviewResponse),
						detail: {
							summary: "Get user overview",
							description:
								"Resumo do usuário com métricas gerais, estatísticas de conquistas, trilhas e quizzes.",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/:id/achievements",
					async ({ status, params: { id } }) => {
						const achievements = await UsersService.getUserAchievements(id);
						return status(200, success(achievements));
					},
					{
						params: userParams,
						response: successResponseSchema(
							t.Array(userAchievementDetailResponse),
						),
						detail: {
							summary: "List user achievements",
							description:
								"Lista de conquistas rastreadas pelo usuário com progresso e status de desbloqueio.",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/:id/trails",
					async ({ status, params: { id } }) => {
						const trails = await UsersService.getUserTrails(id);
						return status(200, success(trails));
					},
					{
						params: userParams,
						response: successResponseSchema(
							t.Array(userTrailProgressResponse),
						),
						detail: {
							summary: "List user trails progress",
							description:
								"Progresso do usuário em trilhas, incluindo percentual concluído e tempo gasto.",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/:id/quizzes",
					async ({ status, params: { id } }) => {
						const quizzes = await UsersService.getUserQuizzes(id);
						return status(200, success(quizzes));
					},
					{
						params: userParams,
						response: successResponseSchema(
							t.Array(userQuizAttemptResponse),
						),
						detail: {
							summary: "List user quiz attempts",
							description:
								"Histórico de tentativas de quizzes do usuário.",
							tags: ["Admin - Users"],
						},
					},
				)
				.get(
					"/:id",
					async ({ status, params: { id } }) => {
						const user = await UsersService.getById(id);
						return status(200, success(user));
					},
					{
						params: userParams,
						detail: {
							summary: "Get a specific user",
							description: "Get detailed information about a specific user by ID",
							tags: ["Admin - Users"],
						},
					},
				)
				.patch(
					"/:id",
					async ({ status, params: { id }, body }) => {
						const updatedUser = await UsersService.updateUser(id, body);
						return status(200, success(updatedUser));
					},
					{
						params: userParams,
						body: updateUserBody,
						detail: {
							summary: "Update a user",
							description:
								"Update user information including name, email, role, ban status, etc.",
							tags: ["Admin - Users"],
						},
					},
				)
				.post(
					"/:id/certificate/regenerate",
					async ({ status, params: { id }, user }) => {
						const certificate = await CertificateService.regenerateCertificateForUser(
							id,
							user.id,
						);

						return status(
							200,
							success({
								message: "Certificate regenerated successfully",
								certificate,
							}),
						);
					},
					{
						params: userParams,
						detail: {
							summary: "Regenerate user certificate",
							description:
								"Regenera o certificado aprovado do usuário e atualiza o PDF usando o template atual.",
							tags: ["Admin - Users"],
						},
					},
				)
				.delete(
					"/:id",
					async ({ status, params: { id } }) => {
						await UsersService.deleteUser(id);
						return status(204);
					},
					{
						params: userParams,
						detail: {
							summary: "Delete a user",
							description:
								"Soft delete a user by permanently banning them (actual deletion is prevented to maintain data integrity)",
							tags: ["Admin - Users"],
						},
					},
				),
	);

// ============================================================================
// User Profile Endpoints
// ============================================================================

export const userProfile = new Elysia({
	prefix: "/profile",
	tags: ["Profile"],
	detail: {
		description: "User endpoints for profile information and statistics",
	},
})
	.use(betterAuthMacro)
	.guard(
		{
			auth: true,
			detail: {
				description: "Authentication required",
			},
		},
		(app) =>
			app.get(
				"/stats",
				async ({ user, status }) => {
					const stats = await UsersService.getOverview(user!.id);
					return status(200, success(stats));
				},
				{
					response: successResponseSchema(userOverviewResponse),
					detail: {
						summary: "Get my profile statistics",
						description:
							"Get current user's statistics including achievements, trails, and quizzes",
						tags: ["Profile"],
					},
				},
			),
	);
