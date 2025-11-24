import { db } from "@/db";
import { certificates } from "@/db/schema/certificates";
import { trails, userTrailProgress } from "@/db/schema/trails";
import {
  eq,
  and,
  count,
  avg,
  sum,
  desc,
  sql,
} from "drizzle-orm";
import {
  NotFoundError,
  BusinessLogicError,
  ForbiddenError,
} from "@/lib/errors";
import crypto from "crypto";
import { trackCertificateEarned } from "../achievements/trackers";
import { generateCertificatePDF } from "./pdf-generator";
import { ConfigService, type AppConfig } from "../config/config.service";
import { userArticleReads, wikiArticles } from "@/db/schema/wiki";

export abstract class CertificateService {
  /**
   * Generate a unique verification code for certificate
   */
  private static generateVerificationCode(): string {
    const year = new Date().getFullYear();
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `CERT-${year}-${randomPart}`;
  }

  /**
   * Check if user has completed ALL trails
   */
  static async hasCompletedAllTrails(userId: string): Promise<boolean> {
    // Get total published trails
    const totalTrailsResult = await db
      .select({ count: count() })
      .from(trails)
      .where(eq(trails.status, "published"));

    const totalTrails = totalTrailsResult[0]?.count || 0;

    console.log(`    📊 Total published trails: ${totalTrails}`);

    if (totalTrails === 0) {
      console.log(`    ⚠️  No published trails found`);
      return false;
    }

    // Get user's completed and passed trails (only published ones)
    const completedTrailsResult = await db
      .select({ count: count() })
      .from(userTrailProgress)
      .innerJoin(trails, eq(userTrailProgress.trailId, trails.id))
      .where(
        and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.isCompleted, true),
          eq(userTrailProgress.isPassed, true),
          eq(trails.status, "published"),
        ),
      );

    const completedTrails = completedTrailsResult[0]?.count || 0;

    console.log(`    📊 User completed & passed trails: ${completedTrails}`);
    console.log(`    ${completedTrails >= totalTrails ? '✅' : '❌'} Result: ${completedTrails} >= ${totalTrails} = ${completedTrails >= totalTrails}`);

    return completedTrails >= totalTrails;
  }

  /**
   * Check if user has completed ALL published articles
   */
  static async hasCompletedAllArticles(userId: string): Promise<boolean> {
    const totalArticlesResult = await db
      .select({ count: count() })
      .from(wikiArticles)
      .where(eq(wikiArticles.status, "published"));

    const totalArticles = totalArticlesResult[0]?.count || 0;

    console.log(`    📊 Total published articles: ${totalArticles}`);

    if (totalArticles === 0) {
      console.log(`    ⚠️  No published articles found`);
      return false;
    }

    const completedArticlesResult = await db
      .select({ count: count() })
      .from(userArticleReads)
      .innerJoin(wikiArticles, eq(userArticleReads.articleId, wikiArticles.id))
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.isRead, true),
          eq(wikiArticles.status, "published"),
        ),
      );

    const completedArticles = completedArticlesResult[0]?.count || 0;

    console.log(`    📊 User read articles: ${completedArticles}`);
    console.log(
      `    ${completedArticles >= totalArticles ? "✅" : "❌"} Result: ${completedArticles} >= ${totalArticles} = ${completedArticles >= totalArticles}`,
    );

    return completedArticles >= totalArticles;
  }

  /**
   * Get certificate statistics for a user
   */
  private static async getUserTrailsStats(userId: string) {
    const stats = await db
      .select({
        totalCompleted: count(),
        averageScore: avg(userTrailProgress.bestScore),
        totalTimeMinutes: sum(userTrailProgress.timeSpentMinutes),
      })
      .from(userTrailProgress)
      .innerJoin(trails, eq(userTrailProgress.trailId, trails.id))
      .where(
        and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.isCompleted, true),
          eq(userTrailProgress.isPassed, true),
          eq(trails.status, "published"),
        ),
      );

    return {
      totalCompleted: stats[0]?.totalCompleted || 0,
      averageScore: stats[0]?.averageScore || 0,
      totalTimeMinutes: stats[0]?.totalTimeMinutes || 0,
    };
  }

  /**
   * Get article statistics for a user
   */
  private static async getUserArticlesStats(userId: string) {
    const stats = await db
      .select({
        totalCompleted: sql<number>`COUNT(DISTINCT ${userArticleReads.articleId})`,
        averageCompletion: avg(userArticleReads.readPercentage),
        totalTimeSeconds: sum(userArticleReads.timeSpentSeconds),
      })
      .from(userArticleReads)
      .innerJoin(wikiArticles, eq(userArticleReads.articleId, wikiArticles.id))
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.isRead, true),
          eq(wikiArticles.status, "published"),
        ),
      );

    return {
      totalCompleted: stats[0]?.totalCompleted || 0,
      averageCompletion: stats[0]?.averageCompletion || 0,
      totalTimeMinutes: Math.round(
        Number(stats[0]?.totalTimeSeconds || 0) / 60,
      ),
    };
  }

  private static async getLastTrailCompletionDate(userId: string) {
    const lastCompletedTrail = await db
      .select({ completedAt: userTrailProgress.completedAt })
      .from(userTrailProgress)
      .innerJoin(trails, eq(userTrailProgress.trailId, trails.id))
      .where(
        and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.isCompleted, true),
          eq(trails.status, "published"),
        ),
      )
      .orderBy(desc(userTrailProgress.completedAt))
      .limit(1);

    return lastCompletedTrail[0]?.completedAt || new Date();
  }

  private static async getLastArticleCompletionDate(userId: string) {
    const lastCompletedArticle = await db
      .select({
        markedReadAt: userArticleReads.markedReadAt,
        lastReadAt: userArticleReads.lastReadAt,
      })
      .from(userArticleReads)
      .innerJoin(wikiArticles, eq(userArticleReads.articleId, wikiArticles.id))
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.isRead, true),
          eq(wikiArticles.status, "published"),
        ),
      )
      .orderBy(
        desc(userArticleReads.markedReadAt),
        desc(userArticleReads.lastReadAt),
      )
      .limit(1);

    const record = lastCompletedArticle[0];

    return record?.markedReadAt || record?.lastReadAt || new Date();
  }

  private static async getCertificateProgress(
    userId: string,
    config: AppConfig,
  ) {
    if (config.certificateUnlockRequirement === "articles") {
      const hasCompletedAll = await this.hasCompletedAllArticles(userId);

      if (!hasCompletedAll) {
        throw new BusinessLogicError(
          "Cannot generate certificate: not all articles completed",
        );
      }

      const stats = await this.getUserArticlesStats(userId);
      const completionDate = await this.getLastArticleCompletionDate(userId);

      return {
        unlockRequirement: "articles" as const,
        averageScore: stats.averageCompletion || 100,
        totalCompleted: stats.totalCompleted,
        totalTimeMinutes: stats.totalTimeMinutes,
        completionDate,
      };
    }

    if (config.certificateUnlockRequirement === "trails_and_articles") {
      const [trailsDone, articlesDone] = await Promise.all([
        this.hasCompletedAllTrails(userId),
        this.hasCompletedAllArticles(userId),
      ]);

      if (!trailsDone || !articlesDone) {
        throw new BusinessLogicError(
          "Cannot generate certificate: complete all trails and all articles",
        );
      }

      const [trailStats, articleStats] = await Promise.all([
        this.getUserTrailsStats(userId),
        this.getUserArticlesStats(userId),
      ]);
      const [lastTrailCompletion, lastArticleCompletion] = await Promise.all([
        this.getLastTrailCompletionDate(userId),
        this.getLastArticleCompletionDate(userId),
      ]);

      const totalCompleted =
        Number(trailStats.totalCompleted) + Number(articleStats.totalCompleted);

      return {
        unlockRequirement: "trails_and_articles" as const,
        averageScore: Number(trailStats.averageScore) || 0,
        totalCompleted,
        totalTimeMinutes:
          Number(trailStats.totalTimeMinutes) +
          Number(articleStats.totalTimeMinutes),
        completionDate:
          lastTrailCompletion > lastArticleCompletion
            ? lastTrailCompletion
            : lastArticleCompletion,
      };
    }

    const hasCompletedAll = await this.hasCompletedAllTrails(userId);

    if (!hasCompletedAll) {
      throw new BusinessLogicError(
        "Cannot generate certificate: not all trails completed",
      );
    }

    const stats = await this.getUserTrailsStats(userId);
    const completionDate = await this.getLastTrailCompletionDate(userId);

    return {
      unlockRequirement: "trails" as const,
      averageScore: Number(stats.averageScore) || 0,
      totalCompleted: Number(stats.totalCompleted),
      totalTimeMinutes: Number(stats.totalTimeMinutes),
      completionDate,
    };
  }

  /**
   * Generate certificate after user completes ALL trails
   * This should be called automatically when a trail is completed
   */
  static async generateCertificate(userId: string) {
    console.log(`  🎓 [generateCertificate] Starting certificate generation for user ${userId}`);
    
    const config = await ConfigService.getConfig();
    const progress = await this.getCertificateProgress(userId, config);

    if (
      config.certificateMinStudyHours > 0 &&
      progress.totalTimeMinutes < config.certificateMinStudyHours * 60
    ) {
      console.log(
        `  ❌ User has not reached required study hours (${progress.totalTimeMinutes}m < ${config.certificateMinStudyHours}h)`,
      );
      throw new BusinessLogicError(
        `Cannot generate certificate: requires at least ${config.certificateMinStudyHours} hours of study`,
      );
    }

    if (
      config.certificateMaxStudyHours > 0 &&
      progress.totalTimeMinutes > config.certificateMaxStudyHours * 60
    ) {
      console.log(
        `  ❌ User exceeded max study hours (${progress.totalTimeMinutes}m > ${config.certificateMaxStudyHours}h)`,
      );
      throw new BusinessLogicError(
        `Cannot generate certificate: maximum of ${config.certificateMaxStudyHours} hours exceeded`,
      );
    }

    // Check if certificate already exists
    console.log(`  🔍 Checking for existing certificate...`);
    const existing = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ℹ️  Certificate already exists (ID: ${existing[0].id})`);
      return existing[0];
    }

    console.log(`  📊 Certificate progress snapshot:`, progress);
    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    console.log(`  🔑 Generated verification code: ${verificationCode}`);

    // Create certificate with pending status
    console.log(`  💾 Inserting certificate into database...`);
    const [certificate] = await db
      .insert(certificates)
      .values({
        userId,
        status: "pending",
        averageScore: Number(progress.averageScore),
        totalTrailsCompleted: Number(progress.totalCompleted),
        totalTimeMinutes: Number(progress.totalTimeMinutes),
        allTrailsCompletedAt: progress.completionDate,
        verificationCode,
      })
      .returning();

    console.log(`  ✅ Certificate created successfully (ID: ${certificate.id})`);

    // Track achievement immediately so user sees it after last trail
    try {
      await trackCertificateEarned(
        userId,
        certificate.id,
        Number(progress.averageScore) || 0,
      );
      console.log(`  🏆 Tracked certificate achievement for user ${userId}`);
    } catch (error) {
      console.error("  ✗ Failed to track certificate achievement:", error);
    }

    // Auto-approve if global setting is enabled
    try {
      if (config.autoApproveCertificates) {
        console.log("  🤖 Auto-approving certificate (config enabled)...");
        await this.autoApproveCertificate(certificate.id, config);
      }
    } catch (error) {
      console.error("  ✗ Failed to auto-approve certificate:", error);
    }

    return certificate;
  }

  /**
   * Get user's certificate (if exists)
   */
  static async getUserCertificate(userId: string) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.userId, userId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return certificate || null;
  }

  /**
   * Get pending certificates (for admin approval)
   */
  static async getPendingCertificates() {
    return db.query.certificates.findMany({
      where: eq(certificates.status, "pending"),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: desc(certificates.createdAt),
    });
  }

  /**
   * Approve a certificate (admin only)
   */
  static async approveCertificate(
    certificateId: number,
    reviewerId: string,
    notes?: string,
  ) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
      with: {
        user: true,
      },
    });

    if (!certificate) {
      throw new NotFoundError("Certificate not found");
    }

    if (certificate.status !== "pending") {
      throw new BusinessLogicError(
        "Certificate is not pending approval",
      );
    }

    const config = await ConfigService.getConfig();

    // Generate PDF certificate
    const certificateUrl = await generateCertificatePDF({
      id: certificate.id,
      userName: certificate.user.name,
      averageScore: certificate.averageScore,
      totalTrailsCompleted: certificate.totalTrailsCompleted,
      totalTimeMinutes: certificate.totalTimeMinutes,
      completionDate: certificate.allTrailsCompletedAt,
      verificationCode: certificate.verificationCode,
      userImageUrl: certificate.user.image,
      title: config.certificateTitle,
      unlockRequirement: config.certificateUnlockRequirement,
    });

    // Update certificate status
    const [updated] = await db
      .update(certificates)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        issuedAt: new Date(),
        certificateUrl,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, certificateId))
      .returning();

    // TODO: Send notification to user
    // await notificationService.send(certificate.userId, {
    //   type: "certificate_approved",
    //   title: "Certificado Aprovado!",
    //   message: "Seu certificado foi aprovado e está disponível para download.",
    //   data: { certificateId: certificate.id }
    // });

    return updated;
  }

  /**
   * Auto-approve certificate without human reviewer (system action)
   */
  private static async autoApproveCertificate(
    certificateId: number,
    config?: AppConfig,
  ) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
      with: {
        user: true,
      },
    });

    if (!certificate) {
      throw new NotFoundError("Certificate not found");
    }

    if (certificate.status !== "pending") {
      return certificate;
    }

    const currentConfig = config ?? (await ConfigService.getConfig());

    const certificateUrl = await generateCertificatePDF({
      id: certificate.id,
      userName: certificate.user.name,
      averageScore: certificate.averageScore,
      totalTrailsCompleted: certificate.totalTrailsCompleted,
      totalTimeMinutes: certificate.totalTimeMinutes,
      completionDate: certificate.allTrailsCompletedAt,
      verificationCode: certificate.verificationCode,
      userImageUrl: certificate.user.image,
      title: currentConfig.certificateTitle,
      unlockRequirement: currentConfig.certificateUnlockRequirement,
    });

    const [updated] = await db
      .update(certificates)
      .set({
        status: "approved",
        reviewedBy: null,
        reviewedAt: new Date(),
        reviewNotes: "Auto-approved",
        issuedAt: new Date(),
        certificateUrl,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, certificateId))
      .returning();

    return updated;
  }

  /**
   * Reject a certificate (admin only)
   */
  static async rejectCertificate(
    certificateId: number,
    reviewerId: string,
    reason: string,
  ) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });

    if (!certificate) {
      throw new NotFoundError("Certificate not found");
    }

    if (certificate.status !== "pending") {
      throw new BusinessLogicError(
        "Certificate is not pending approval",
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new BusinessLogicError("Rejection reason is required");
    }

    const [updated] = await db
      .update(certificates)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reason,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, certificateId))
      .returning();

    // TODO: Send notification to user
    // await notificationService.send(certificate.userId, {
    //   type: "certificate_rejected",
    //   title: "Certificado Rejeitado",
    //   message: `Seu certificado foi rejeitado. Motivo: ${reason}`,
    //   data: { certificateId }
    // });

    return updated;
  }

  /**
   * Revoke an approved certificate (admin only)
   */
  static async revokeCertificate(
    certificateId: number,
    reviewerId: string,
    reason: string,
  ) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });

    if (!certificate) {
      throw new NotFoundError("Certificate not found");
    }

    if (certificate.status !== "approved") {
      throw new BusinessLogicError(
        "Only approved certificates can be revoked",
      );
    }

    const [updated] = await db
      .update(certificates)
      .set({
        status: "revoked",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reason,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, certificateId))
      .returning();

    return updated;
  }

  /**
   * Verify a certificate by verification code (public)
   */
  static async verifyCertificate(verificationCode: string) {
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.verificationCode, verificationCode),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!certificate) {
      return null;
    }

    // Only return approved certificates for public verification
    if (certificate.status !== "approved") {
      return null;
    }

    return {
      isValid: true,
      userName: certificate.user.name,
      issuedAt: certificate.issuedAt,
      averageScore: certificate.averageScore,
      totalTrailsCompleted: certificate.totalTrailsCompleted,
    };
  }

  /**
   * Get certificate statistics (for admin dashboard)
   */
  static async getCertificateStats() {
    const stats = await db
      .select({
        status: certificates.status,
        count: count(),
      })
      .from(certificates)
      .groupBy(certificates.status);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const pending = stats.find((s) => s.status === "pending")?.count || 0;
    const approved = stats.find((s) => s.status === "approved")?.count || 0;
    const rejected = stats.find((s) => s.status === "rejected")?.count || 0;
    const revoked = stats.find((s) => s.status === "revoked")?.count || 0;

    return {
      total,
      pending,
      approved,
      rejected,
      revoked,
      approvalRate:
        total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }
}
