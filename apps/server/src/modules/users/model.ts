import { t } from "elysia";

// Query parameters for listing users
export const listUsersQuery = t.Object({
	page: t.Optional(t.Number({ minimum: 1 })),
	pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
	search: t.Optional(t.String()),
	role: t.Optional(t.String()),
	banned: t.Optional(t.Boolean()),
});

export type ListUsersQuery = typeof listUsersQuery.static;

// User update body (only fields that can be updated by admin)
export const updateUserBody = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	email: t.Optional(
		t.String({
			format: "email",
			maxLength: 255,
		}),
	),
	role: t.Optional(t.String({ maxLength: 50 })),
	banned: t.Optional(t.Boolean()),
	banReason: t.Optional(t.String({ maxLength: 500 })),
	banExpires: t.Optional(t.Date()),
	image: t.Optional(t.String({ maxLength: 500 })),
});

export type UpdateUserBody = typeof updateUserBody.static;

// URL parameters
export const userParams = t.Object({
	id: t.String(),
});

export type UserParams = typeof userParams.static;

// User response type (what we send to frontend)
export const userResponse = t.Object({
	id: t.String(),
	name: t.String(),
	email: t.String(),
	emailVerified: t.Boolean(),
	image: t.Nullable(t.String()),
	role: t.Nullable(t.String()),
	banned: t.Boolean(),
	banReason: t.Nullable(t.String()),
	banExpires: t.Nullable(t.Date()),
	createdAt: t.Date(),
	updatedAt: t.Date(),
});

export type UserResponse = typeof userResponse.static;

// User overview response
export const userOverviewResponse = t.Object({
	user: userResponse,
	stats: t.Object({
		achievements: t.Object({
			tracked: t.Number(),
			unlocked: t.Number(),
			inProgress: t.Number(),
			averageProgress: t.Number(),
		}),
		trails: t.Object({
			enrolled: t.Number(),
			completed: t.Number(),
			timeSpentMinutes: t.Number(),
			lastAccessedAt: t.Nullable(t.Date()),
		}),
		quizzes: t.Object({
			attempts: t.Number(),
			passed: t.Number(),
			averageScore: t.Number(),
			timeSpentSeconds: t.Number(),
			lastAttemptAt: t.Nullable(t.Date()),
		}),
		lastActivityAt: t.Nullable(t.Date()),
	}),
});

export type UserOverviewResponse = typeof userOverviewResponse.static;

export const userAchievementDetailResponse = t.Object({
	achievementId: t.Number(),
	name: t.String(),
	slug: t.String(),
	category: t.String(),
	difficulty: t.String(),
	type: t.String(),
	visibility: t.String(),
	status: t.String(),
	displayOrder: t.Number(),
	isUnlocked: t.Boolean(),
	unlockedAt: t.Nullable(t.Date()),
	progressPercentage: t.Number(),
	currentValue: t.Number(),
	targetValue: t.Number(),
	updatedAt: t.Date(),
});

export type UserAchievementDetailResponse =
	typeof userAchievementDetailResponse.static;

export const userTrailProgressResponse = t.Object({
	trailId: t.Number(),
	name: t.String(),
	code: t.String(),
	difficulty: t.String(),
	status: t.String(),
	isEnrolled: t.Boolean(),
	isCompleted: t.Boolean(),
	isPassed: t.Boolean(),
	progressPercentage: t.Number(),
	completedContent: t.Number(),
	totalContent: t.Number(),
	bestScore: t.Nullable(t.Number()),
	timeSpentMinutes: t.Number(),
	enrolledAt: t.Nullable(t.Date()),
	lastAccessedAt: t.Nullable(t.Date()),
});

export type UserTrailProgressResponse = typeof userTrailProgressResponse.static;

export const userQuizAttemptResponse = t.Object({
	attemptId: t.Number(),
	quizId: t.Number(),
	title: t.String(),
	difficulty: t.String(),
	status: t.String(),
	score: t.Nullable(t.Number()),
	passingScore: t.Nullable(t.Number()),
	totalPoints: t.Nullable(t.Number()),
	earnedPoints: t.Nullable(t.Number()),
	timeSpentSeconds: t.Nullable(t.Number()),
	completedAt: t.Nullable(t.Date()),
});

export type UserQuizAttemptResponse = typeof userQuizAttemptResponse.static;
