import { db } from "@/db";
import { user, session } from "@/db/schema/auth";
import { questions } from "@/db/schema/questions";
import { quizzes } from "@/db/schema/quizzes";
import { trails } from "@/db/schema/trails";
import { contentCategories } from "@/db/schema/categories";
import { wikiArticles } from "@/db/schema/wiki";
import { count, gte, sql } from "drizzle-orm";

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    // Calculate date for active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel for better performance
    const [
      totalUsersResult,
      activeUsersResult,
      totalQuestionsResult,
      activeQuestionsResult,
      totalQuizzesResult,
      activeQuizzesResult,
      totalTrailsResult,
      totalCategoriesResult,
      totalWikiArticlesResult,
      recentQuestionsResult,
      recentQuizzesResult,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(user),

      // Active users (logged in within last 30 days)
      db
        .select({ count: count() })
        .from(session)
        .where(gte(session.createdAt, thirtyDaysAgo)),

      // Total questions
      db.select({ count: count() }).from(questions),

      // Active questions
      db
        .select({ count: count() })
        .from(questions)
        .where(sql`${questions.status} = 'active'`),

      // Total quizzes
      db.select({ count: count() }).from(quizzes),

      // Active quizzes
      db
        .select({ count: count() })
        .from(quizzes)
        .where(sql`${quizzes.status} = 'active'`),

      // Total trails
      db.select({ count: count() }).from(trails),

      // Total categories
      db.select({ count: count() }).from(contentCategories),

      // Total wiki articles
      db.select({ count: count() }).from(wikiArticles),

      // Recent questions (last 7 days)
      db
        .select({ count: count() })
        .from(questions)
        .where(gte(questions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),

      // Recent quizzes (last 7 days)
      db
        .select({ count: count() })
        .from(quizzes)
        .where(gte(quizzes.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
    ]);

    return {
      users: {
        total: totalUsersResult[0].count,
        active: activeUsersResult[0].count,
      },
      questions: {
        total: totalQuestionsResult[0].count,
        active: activeQuestionsResult[0].count,
        recentlyCreated: recentQuestionsResult[0].count,
      },
      quizzes: {
        total: totalQuizzesResult[0].count,
        active: activeQuizzesResult[0].count,
        recentlyCreated: recentQuizzesResult[0].count,
      },
      trails: {
        total: totalTrailsResult[0].count,
      },
      categories: {
        total: totalCategoriesResult[0].count,
      },
      wiki: {
        total: totalWikiArticlesResult[0].count,
      },
    };
  }
}
