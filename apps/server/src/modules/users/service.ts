import { db } from "@/db";
import { user, type User as UserEntity } from "@/db/schema/auth";
import {
	achievements,
	userAchievements,
} from "@/db/schema/achievements";
import {
	trailContent,
	trails,
	userTrailProgress,
	userQuestionAttempts,
} from "@/db/schema/trails";
import { quizzes, quizAttempts } from "@/db/schema/quizzes";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import {
	and,
	count,
	eq,
	ilike,
	inArray,
	or,
	sql,
} from "drizzle-orm";
import type {
	ListUsersQuery,
	UpdateUserBody,
	UserResponse,
} from "./model";

function mapUserRecord(record: UserEntity): UserResponse {
	return {
		id: record.id,
		name: record.name,
		email: record.email,
		emailVerified: Boolean(record.emailVerified),
		image: record.image ?? null,
		role: record.role ?? null,
		banned: Boolean(record.banned),
		banReason: record.banReason ?? null,
		banExpires: record.banExpires ?? null,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

export abstract class UsersService {
	/**
	 * Get all users with optional filtering and pagination
	 */
	static async getAll(query?: ListUsersQuery) {
		const page = query?.page || 1;
		const pageSize = query?.pageSize || 20;
		const offset = (page - 1) * pageSize;

		// Build where conditions
		const whereConditions = [];

		if (query?.search) {
			whereConditions.push(
				or(
					ilike(user.name, `%${query.search}%`),
					ilike(user.email, `%${query.search}%`),
				),
			);
		}

		if (query?.role) {
			whereConditions.push(eq(user.role, query.role));
		}

		if (query?.banned !== undefined) {
			whereConditions.push(eq(user.banned, query.banned));
		}

		const whereClause =
			whereConditions.length > 0 ? and(...whereConditions) : undefined;

		// Get users
		const users = await db.query.user.findMany({
			where: whereClause,
			limit: pageSize,
			offset,
			orderBy: (user, { desc }) => [desc(user.createdAt)],
		});

		// Get total count
		const [{ total }] = await db
			.select({ total: count() })
			.from(user)
			.where(whereClause || sql`true`);

		return {
			users: users.map(mapUserRecord),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize),
			},
		};
	}

	/**
	 * Get a single user by ID
	 */
	static async getById(userId: string) {
		const foundUser = await db.query.user.findFirst({
			where: eq(user.id, userId),
		});

		if (!foundUser) {
			throw new NotFoundError("User not found");
		}

		return mapUserRecord(foundUser);
	}

	/**
	 * Update a user
	 */
	static async updateUser(userId: string, updates: UpdateUserBody) {
		// Check if user exists
		const existingUser = await this.getById(userId);

		// If email is being updated, check for uniqueness
		if (updates.email && updates.email !== existingUser.email) {
			const emailExists = await db.query.user.findFirst({
				where: and(eq(user.email, updates.email), sql`${user.id} != ${userId}`),
			});

			if (emailExists) {
				throw new ConflictError("Email already in use");
			}
		}

		// Build update data (only include provided fields)
		const updateData: Partial<UpdateUserBody> = {};

		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.email !== undefined) updateData.email = updates.email;
		if (updates.role !== undefined) updateData.role = updates.role;
		if (updates.banned !== undefined) updateData.banned = updates.banned;
		if (updates.banReason !== undefined)
			updateData.banReason = updates.banReason;
		if (updates.banExpires !== undefined)
			updateData.banExpires = updates.banExpires;
		if (updates.image !== undefined) updateData.image = updates.image;

		// Validate ban logic
		if (updates.banned === true && !updates.banReason && !existingUser.banReason) {
			throw new BadRequestError("Ban reason is required when banning a user");
		}

		// If unbanning, clear ban reason and expiry
		if (updates.banned === false) {
			updateData.banReason = null;
			updateData.banExpires = null;
		}

		const [updatedUser] = await db
			.update(user)
			.set(updateData)
			.where(eq(user.id, userId))
			.returning();

		return mapUserRecord(updatedUser);
	}

	/**
	 * Delete a user (soft delete by banning permanently)
	 */
	static async deleteUser(userId: string) {
		// Check if user exists
		await this.getById(userId);

		// Instead of hard delete, we permanently ban the user
		const [deletedUser] = await db
			.update(user)
			.set({
				banned: true,
				banReason: "Account deleted",
				banExpires: null, // null means permanent
			})
			.where(eq(user.id, userId))
			.returning();

		return mapUserRecord(deletedUser);
	}

	static async getOverview(userId: string) {
		const userRecord = await this.getById(userId);

		const [achievementSummary] = await db
			.select({
				tracked: sql<number>`count(*)`,
				unlocked: sql<number>`coalesce(sum(case when ${userAchievements.isUnlocked} then 1 else 0 end), 0)` ,
				avgProgress: sql<number>`coalesce(avg(${userAchievements.progressPercentage}), 0)`,
				lastActivityAt: sql<Date | null>`max(${userAchievements.updatedAt})`,
			})
			.from(userAchievements)
			.where(eq(userAchievements.userId, userId));

		const [trailSummary] = await db
			.select({
				enrolled: sql<number>`count(*)`,
				completed: sql<number>`coalesce(sum(case when ${userTrailProgress.isCompleted} then 1 else 0 end), 0)` ,
				timeSpentMinutes: sql<number>`coalesce(sum(${userTrailProgress.timeSpentMinutes}), 0)`,
				lastAccessedAt: sql<Date | null>`max(${userTrailProgress.lastAccessedAt})`,
			})
			.from(userTrailProgress)
			.where(eq(userTrailProgress.userId, userId));

		const [quizSummary] = await db
			.select({
				attempts: sql<number>`count(*)`,
				passed: sql<number>`coalesce(sum(case when ${quizAttempts.score} is not null and ${quizAttempts.score} >= ${quizzes.passingScore} then 1 else 0 end), 0)` ,
				averageScore: sql<number>`coalesce(avg(${quizAttempts.score}), 0)`,
				timeSpentSeconds: sql<number>`coalesce(sum(${quizAttempts.timeSpent}), 0)`,
				lastAttemptAt: sql<Date | null>`max(${quizAttempts.completedAt})`,
			})
			.from(quizAttempts)
			.innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
			.where(eq(quizAttempts.userId, userId));

		const [questionSummary] = await db
			.select({
				totalAttempts: sql<number>`count(*)`,
				uniqueQuestions: sql<number>`count(distinct ${userQuestionAttempts.questionId})`,
				correctAnswers: sql<number>`coalesce(sum(case when ${userQuestionAttempts.isCorrect} then 1 else 0 end), 0)`,
				lastAttemptAt: sql<Date | null>`max(${userQuestionAttempts.createdAt})`,
			})
			.from(userQuestionAttempts)
			.where(eq(userQuestionAttempts.userId, userId));

		const lastActivityCandidates = [
			achievementSummary?.lastActivityAt ?? null,
			trailSummary?.lastAccessedAt ?? null,
			quizSummary?.lastAttemptAt ?? null,
			questionSummary?.lastAttemptAt ?? null,
			userRecord.updatedAt ?? null,
		].filter((value): value is Date => value instanceof Date);

		const lastActivityAt =
			lastActivityCandidates.length > 0
				? new Date(
					Math.max(...lastActivityCandidates.map((date) => date.getTime())),
				  )
				: null;

		const tracked = Number(achievementSummary?.tracked ?? 0);
		const unlocked = Number(achievementSummary?.unlocked ?? 0);

		return {
			user: userRecord,
			stats: {
				achievements: {
					tracked,
					unlocked,
					inProgress: Math.max(tracked - unlocked, 0),
					averageProgress: Number(achievementSummary?.avgProgress ?? 0),
				},
				trails: {
					enrolled: Number(trailSummary?.enrolled ?? 0),
					completed: Number(trailSummary?.completed ?? 0),
					timeSpentMinutes: Number(trailSummary?.timeSpentMinutes ?? 0),
					lastAccessedAt: trailSummary?.lastAccessedAt ?? null,
				},
				quizzes: {
					attempts: Number(quizSummary?.attempts ?? 0),
					passed: Number(quizSummary?.passed ?? 0),
					averageScore: Number(quizSummary?.averageScore ?? 0),
					timeSpentSeconds: Number(quizSummary?.timeSpentSeconds ?? 0),
					lastAttemptAt: quizSummary?.lastAttemptAt ?? null,
				},
				questions: {
					totalAttempts: Number(questionSummary?.totalAttempts ?? 0),
					uniqueQuestions: Number(questionSummary?.uniqueQuestions ?? 0),
					correctAnswers: Number(questionSummary?.correctAnswers ?? 0),
					lastAttemptAt: questionSummary?.lastAttemptAt ?? null,
				},
				lastActivityAt,
			},
		};
	}

	static async getUserAchievements(userId: string) {
		const rows = await db
			.select({
				achievementId: achievements.id,
				name: achievements.name,
				slug: achievements.slug,
				category: achievements.category,
				difficulty: achievements.difficulty,
				type: achievements.type,
				visibility: achievements.visibility,
				status: achievements.status,
				displayOrder: achievements.displayOrder,
				isUnlocked: userAchievements.isUnlocked,
				unlockedAt: userAchievements.unlockedAt,
				progressPercentage: userAchievements.progressPercentage,
				currentValue: userAchievements.currentValue,
				targetValue: userAchievements.targetValue,
				updatedAt: userAchievements.updatedAt,
			})
			.from(userAchievements)
			.innerJoin(
				achievements,
				eq(achievements.id, userAchievements.achievementId),
			)
			.where(eq(userAchievements.userId, userId))
			.orderBy(
				sql`case when ${userAchievements.isUnlocked} then 0 else 1 end`,
				sql`coalesce(${userAchievements.unlockedAt}, ${userAchievements.updatedAt}) desc`,
				achievements.displayOrder,
			);

		return rows.map((row) => ({
			...row,
			progressPercentage: Number(row.progressPercentage ?? 0),
			currentValue: Number(row.currentValue ?? 0),
			targetValue: Number(row.targetValue ?? 0),
		}));
	}

	static async getUserTrails(userId: string) {
		const progressRows = await db
			.select({
				trailId: trails.id,
				name: trails.name,
				code: trails.trailId,
				difficulty: trails.difficulty,
				status: trails.status,
				isEnrolled: userTrailProgress.isEnrolled,
				isCompleted: userTrailProgress.isCompleted,
				isPassed: userTrailProgress.isPassed,
				bestScore: userTrailProgress.bestScore,
				timeSpentMinutes: userTrailProgress.timeSpentMinutes,
				enrolledAt: userTrailProgress.enrolledAt,
				lastAccessedAt: userTrailProgress.lastAccessedAt,
				completedContentIds: userTrailProgress.completedContentIds,
				updatedAt: userTrailProgress.updatedAt,
			})
			.from(userTrailProgress)
			.innerJoin(trails, eq(trails.id, userTrailProgress.trailId))
			.where(eq(userTrailProgress.userId, userId))
			.orderBy(sql`coalesce(${userTrailProgress.lastAccessedAt}, ${userTrailProgress.updatedAt}) desc`);

		if (progressRows.length === 0) {
			return [];
		}

		const trailIds = progressRows.map((row) => row.trailId);

		const contentCounts = await db
			.select({
				trailId: trailContent.trailId,
				total: sql<number>`count(*)`,
			})
			.from(trailContent)
			.where(inArray(trailContent.trailId, trailIds))
			.groupBy(trailContent.trailId);

		const countsMap = new Map(
			contentCounts.map((row) => [row.trailId, Number(row.total ?? 0)]),
		);

		return progressRows.map((row) => {
			let completedIds: string[] = [];
			try {
				completedIds = JSON.parse(row.completedContentIds || "[]");
				if (!Array.isArray(completedIds)) completedIds = [];
			} catch (error) {
				completedIds = [];
			}

			const totalContent = countsMap.get(row.trailId) ?? 0;
			const completedContent = completedIds.length;
			const progressPercentage =
				totalContent > 0
					? Math.min(100, Math.round((completedContent / totalContent) * 100))
					: row.isCompleted
						? 100
						: 0;

			return {
				trailId: row.trailId,
				name: row.name,
				code: row.code,
				difficulty: row.difficulty,
				status: row.status,
				isEnrolled: row.isEnrolled,
				isCompleted: row.isCompleted,
				isPassed: row.isPassed,
				bestScore: row.bestScore,
				timeSpentMinutes: Number(row.timeSpentMinutes ?? 0),
				enrolledAt: row.enrolledAt,
				lastAccessedAt: row.lastAccessedAt,
				completedContent,
				totalContent,
				progressPercentage,
			};
		});
	}

	static async getUserQuizzes(userId: string) {
		const attempts = await db
			.select({
				attemptId: quizAttempts.id,
				quizId: quizzes.id,
				title: quizzes.title,
				difficulty: quizzes.difficulty,
				status: quizAttempts.status,
				score: quizAttempts.score,
				passingScore: quizzes.passingScore,
				totalPoints: quizAttempts.totalPoints,
				earnedPoints: quizAttempts.earnedPoints,
				timeSpentSeconds: quizAttempts.timeSpent,
				completedAt: quizAttempts.completedAt,
			})
			.from(quizAttempts)
			.innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
			.where(eq(quizAttempts.userId, userId))
			.orderBy(sql`coalesce(${quizAttempts.completedAt}, ${quizAttempts.startedAt}) desc`);

		return attempts.map((attempt) => ({
			attemptId: attempt.attemptId,
			quizId: attempt.quizId,
			title: attempt.title,
			difficulty: attempt.difficulty,
			status: attempt.status,
			score: attempt.score !== null ? Number(attempt.score) : null,
			passingScore:
				attempt.passingScore !== null ? Number(attempt.passingScore) : null,
			totalPoints:
				attempt.totalPoints !== null ? Number(attempt.totalPoints) : null,
			earnedPoints:
				attempt.earnedPoints !== null ? Number(attempt.earnedPoints) : null,
			timeSpentSeconds:
				attempt.timeSpentSeconds !== null
					? Number(attempt.timeSpentSeconds)
					: null,
			completedAt: attempt.completedAt ?? null,
		}));
	}

	/**
	 * Get user statistics
	 */
	static async getStats() {
		const [totalUsers] = await db.select({ count: count() }).from(user);

		const [bannedUsers] = await db
			.select({ count: count() })
			.from(user)
			.where(eq(user.banned, true));

		const [verifiedUsers] = await db
			.select({ count: count() })
			.from(user)
			.where(eq(user.emailVerified, true));

		return {
			total: totalUsers.count,
			banned: bannedUsers.count,
			verified: verifiedUsers.count,
			unverified: totalUsers.count - verifiedUsers.count,
		};
	}
}
