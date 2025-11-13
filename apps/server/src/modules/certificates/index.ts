import { Elysia, t } from "elysia";
import { CertificateService } from "./certificates.service";
import { betterAuthMacro, ROLES } from "@/lib/auth";

// ===================================
// Admin Certificate Routes
// ===================================
export const adminCertificates = new Elysia({ prefix: "/admin/certificates" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      /**
       * GET /admin/certificates/pending
       * Get all pending certificates
       */
      .get(
        "/pending",
        async () => {
          const certificates = await CertificateService.getPendingCertificates();

          return {
            certificates,
            total: certificates.length,
          };
        },
        {
          detail: {
            tags: ["Admin", "Certificates"],
            summary: "Get pending certificates",
            description: "Get all certificates awaiting approval",
          },
        },
      )

      /**
       * GET /admin/certificates/stats
       * Get certificate statistics
       */
      .get(
        "/stats",
        async () => {
          const stats = await CertificateService.getCertificateStats();
          return stats;
        },
        {
          detail: {
            tags: ["Admin", "Certificates"],
            summary: "Get certificate statistics",
            description: "Get overview statistics for certificates",
          },
        },
      )

      /**
       * POST /admin/certificates/:id/approve
       * Approve a pending certificate
       */
      .post(
        "/:id/approve",
        async ({ user, params, body }) => {
          const certificate = await CertificateService.approveCertificate(
            Number(params.id),
            user.id,
            body.notes,
          );

          return {
            message: "Certificate approved successfully",
            certificate,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            notes: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Admin", "Certificates"],
            summary: "Approve certificate",
            description: "Approve a pending certificate",
          },
        },
      )

      /**
       * POST /admin/certificates/:id/reject
       * Reject a pending certificate
       */
      .post(
        "/:id/reject",
        async ({ user, params, body }) => {
          const certificate = await CertificateService.rejectCertificate(
            Number(params.id),
            user.id,
            body.reason,
          );

          return {
            message: "Certificate rejected",
            certificate,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            reason: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["Admin", "Certificates"],
            summary: "Reject certificate",
            description: "Reject a pending certificate with reason",
          },
        },
      )

      /**
       * POST /admin/certificates/:id/revoke
       * Revoke an approved certificate
       */
      .post(
        "/:id/revoke",
        async ({ user, params, body }) => {
          const certificate = await CertificateService.revokeCertificate(
            Number(params.id),
            user.id,
            body.reason,
          );

          return {
            message: "Certificate revoked",
            certificate,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            reason: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["Admin", "Certificates"],
            summary: "Revoke certificate",
            description: "Revoke an approved certificate",
          },
        },
      ),
  );

// ===================================
// Student Certificate Routes
// ===================================
export const studentCertificates = new Elysia({ prefix: "/certificates" })
  .use(betterAuthMacro)
  .guard({ auth: true }, (app) =>
    app
      /**
       * GET /certificates
       * Get current user's certificate
       */
      .get(
        "/",
        async ({ user }) => {
          const certificate = await CertificateService.getUserCertificate(
            user.id,
          );

          return {
            certificate,
          };
        },
        {
          detail: {
            tags: ["Certificates"],
            summary: "Get user certificate",
            description: "Get the authenticated user's certificate (if exists)",
          },
        },
      ),
  )

  /**
   * GET /certificates/verify/:code
   * Public endpoint to verify a certificate by verification code
   */
  .get(
    "/verify/:code",
    async ({ params }) => {
      const result = await CertificateService.verifyCertificate(params.code);

      if (!result) {
        return {
          isValid: false,
          message: "Certificate not found or not approved",
        };
      }

      return result;
    },
    {
      params: t.Object({
        code: t.String(),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Verify certificate",
        description:
          "Public endpoint to verify a certificate by verification code",
      },
    },
  );
