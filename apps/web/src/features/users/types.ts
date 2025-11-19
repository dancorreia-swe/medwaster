export interface UserSummary {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
  updatedAt: string;
  certificate?: {
    status: "pending" | "approved" | "rejected" | "revoked";
  } | null;
}

export interface UserOverviewStats {
  achievements: {
    tracked: number;
    unlocked: number;
    inProgress: number;
    averageProgress: number;
  };
  trails: {
    enrolled: number;
    completed: number;
    timeSpentMinutes: number;
    lastAccessedAt: string | null;
  };
  quizzes: {
    attempts: number;
    passed: number;
    averageScore: number;
    timeSpentSeconds: number;
    lastAttemptAt: string | null;
  };
  lastActivityAt: string | null;
}

export interface UserOverview {
  user: UserSummary;
  stats: UserOverviewStats;
  certificate?: {
    status: "pending" | "approved" | "rejected" | "revoked";
    verificationCode: string;
    certificateUrl?: string | null;
    issuedAt?: string | null;
  } | null;
}

export interface UserAchievementDetail {
  achievementId: number;
  name: string;
  slug: string;
  category: string;
  difficulty: string;
  type: string;
  visibility: string;
  status: string;
  displayOrder: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressPercentage: number;
  currentValue: number;
  targetValue: number;
  updatedAt: string;
}

export interface UserTrailProgressItem {
  trailId: number;
  name: string;
  code: string;
  difficulty: string;
  status: string;
  isEnrolled: boolean;
  isCompleted: boolean;
  isPassed: boolean;
  progressPercentage: number;
  completedContent: number;
  totalContent: number;
  bestScore: number | null;
  timeSpentMinutes: number;
  enrolledAt: string | null;
  lastAccessedAt: string | null;
}

export interface UserQuizAttemptItem {
  attemptId: number;
  quizId: number;
  title: string;
  difficulty: string;
  status: string;
  score: number | null;
  passingScore: number | null;
  totalPoints: number | null;
  earnedPoints: number | null;
  timeSpentSeconds: number | null;
  completedAt: string | null;
}
