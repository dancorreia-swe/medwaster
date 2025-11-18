import { AchievementEngine } from "./engine";

/**
 * Helper functions to track achievement events from different parts of the app
 */

/**
 * Track when a user completes their first login
 */
export async function trackFirstLogin(userId: string) {
  return AchievementEngine.trackEvent(userId, "first_login", {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user completes onboarding
 */
export async function trackOnboardingComplete(userId: string) {
  return AchievementEngine.trackEvent(userId, "onboarding_complete", {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track login streak milestones
 */
export async function trackLoginStreak(userId: string, currentStreak: number) {
  return AchievementEngine.trackEvent(userId, "login_streak", {
    currentStreak,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user completes a trail
 */
export async function trackTrailCompleted(
  userId: string,
  trailId: string,
  score: number,
  perfectScore: boolean,
) {
  return AchievementEngine.trackEvent(userId, "trail_completed", {
    trailId,
    score,
    perfectScore,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user reads an article
 */
export async function trackArticleRead(
  userId: string,
  articleId: string,
  categoryId?: string,
) {
  return AchievementEngine.trackEvent(userId, "article_read", {
    articleId,
    categoryId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user answers a question
 */
export async function trackQuestionAnswered(
  userId: string,
  questionId: number,
  isCorrect: boolean,
) {
  return AchievementEngine.trackEvent(userId, "question_answered", {
    questionId,
    isCorrect,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user completes a quiz
 */
export async function trackQuizCompleted(
  userId: string,
  quizId: number,
  score: number,
  totalQuestions: number,
) {
  return AchievementEngine.trackEvent(userId, "quiz_completed", {
    quizId,
    score,
    totalQuestions,
    percentage: (score / totalQuestions) * 100,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user earns a certificate
 */
export async function trackCertificateEarned(
  userId: string,
  certificateId: number,
  score: number,
) {
  return AchievementEngine.trackEvent(userId, "certificate_earned", {
    certificateId,
    score,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when a user bookmarks an article
 */
export async function trackBookmarkCreated(userId: string, articleId: string) {
  return AchievementEngine.trackEvent(userId, "bookmark_created", {
    articleId,
    timestamp: new Date().toISOString(),
  });
}
