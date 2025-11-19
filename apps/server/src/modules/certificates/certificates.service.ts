import { db } from "@/db";
import { certificates } from "@/db/schema/certificates";
import { trails, userTrailProgress } from "@/db/schema/trails";
import { eq, and, count, avg, sum, desc } from "drizzle-orm";
import {
  NotFoundError,
  BusinessLogicError,
  ForbiddenError,
} from "@/lib/errors";
import crypto from "crypto";
import { trackCertificateEarned } from "../achievements/trackers";
import { generateCertificatePDF } from "./pdf-generator";

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
   * Get certificate statistics for a user
   */
  private static async getUserTrailsStats(userId: string) {
    const stats = await db
      .select({
        totalCompleted: count(),
        averageScore: avg(userTrailProgress.bestScore),
        totalTime: sum(userTrailProgress.timeSpentMinutes),
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
      totalTime: stats[0]?.totalTime || 0,
    };
  }

  /**
   * Generate certificate after user completes ALL trails
   * This should be called automatically when a trail is completed
   */
  static async generateCertificate(userId: string) {
    console.log(`  🎓 [generateCertificate] Starting certificate generation for user ${userId}`);
    
    // Check if all trails are completed
    const hasCompletedAll = await this.hasCompletedAllTrails(userId);

    if (!hasCompletedAll) {
      console.log(`  ❌ User has not completed all trails`);
      throw new BusinessLogicError(
        "Cannot generate certificate: not all trails completed",
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

    // Get user's trail statistics
    console.log(`  📊 Calculating trail statistics...`);
    const stats = await this.getUserTrailsStats(userId);
    console.log(`    Stats:`, stats);

    // Get the completion date of the last published trail
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

    const allTrailsCompletedAt =
      lastCompletedTrail[0]?.completedAt || new Date();

    console.log(`    Completion date: ${allTrailsCompletedAt}`);

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
        averageScore: Number(stats.averageScore),
        totalTrailsCompleted: Number(stats.totalCompleted),
        totalTimeMinutes: Number(stats.totalTime),
        allTrailsCompletedAt,
        verificationCode,
      })
      .returning();

    console.log(`  ✅ Certificate created successfully (ID: ${certificate.id})`);
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

    // Generate PDF certificate
    const certificateUrl = await generateCertificatePDF({
      id: certificate.id,
      userName: certificate.user.name,
      averageScore: certificate.averageScore,
      totalTrailsCompleted: certificate.totalTrailsCompleted,
      totalTimeMinutes: certificate.totalTimeMinutes,
      completionDate: certificate.allTrailsCompletedAt,
      verificationCode: certificate.verificationCode,
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

    // Track achievement for certificate earned
    try {
      await trackCertificateEarned(
        certificate.userId,
        certificateId,
        certificate.averageScore,
      );
      console.log(`🏆 Tracked certificate achievement for user ${certificate.userId}`);
    } catch (error) {
      console.error("Failed to track certificate achievement:", error);
    }

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
