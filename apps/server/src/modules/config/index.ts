import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { ConfigService, type AppConfig } from "./config.service";
import {
  CERTIFICATE_LAYOUT_IDS,
  CERTIFICATE_PALETTE_IDS,
  DEFAULT_CERTIFICATE_DESIGN,
  DEFAULT_CERTIFICATE_TITLE,
  OPTIONAL_ELEMENT_KEYS,
  getCertificateDesignOptions,
  type OptionalElementKey,
} from "../certificates/design/catalog";
import { buildPreviewCertificateData } from "../certificates/design/preview-sample";
import { renderCertificatePdf } from "../certificates/pdf-generator";

const certificateDesignBody = t.Object({
  title: t.String({ minLength: 3, maxLength: 150 }),
  layout: t.UnionEnum(CERTIFICATE_LAYOUT_IDS),
  palette: t.UnionEnum(CERTIFICATE_PALETTE_IDS),
  elements: t.Object(
    Object.fromEntries(
      OPTIONAL_ELEMENT_KEYS.map((key) => [key, t.Boolean()]),
    ) as Record<OptionalElementKey, ReturnType<typeof t.Boolean>>,
  ),
});

function toCertificateDesignResponse(config: AppConfig & { revision: number }) {
  return {
    title: config.certificateTitle,
    design: config.certificateDesign,
    revision: config.revision,
    defaults: {
      title: DEFAULT_CERTIFICATE_TITLE,
      design: DEFAULT_CERTIFICATE_DESIGN,
    },
    options: getCertificateDesignOptions(),
  };
}

export const adminConfig = new Elysia({ prefix: "/admin/config" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.SUPER_ADMIN] }, (app) =>
    app
      /**
       * GET /admin/config
       * Returns global configuration flags.
       */
      .get(
        "/",
        async () => {
          const config = await ConfigService.getConfig();
          return config;
        },
        {
          detail: {
            tags: ["Admin", "Config"],
            summary: "Get global configuration",
            description: "Returns global configuration flags.",
          },
        },
      )

      /**
       * PATCH /admin/config
       * Update global configuration flags.
       */
      .patch(
        "/",
        async ({ body }) => {
          const config = await ConfigService.updateConfig(body);
          return config;
        },
        {
          body: t.Object({
            autoApproveCertificates: t.Optional(t.Boolean()),
            certificateTitle: t.Optional(
              t.String({ minLength: 3, maxLength: 150 }),
            ),
            certificateUnlockRequirement: t.Optional(
              t.Union([
                t.Literal("trails"),
                t.Literal("articles"),
                t.Literal("trails_and_articles"),
              ]),
            ),
            certificateMinStudyHours: t.Optional(
              t.Number({
                minimum: 0,
                maximum: 10_000,
              }),
            ),
            certificateMaxStudyHours: t.Optional(
              t.Number({
                minimum: 0,
                maximum: 10_000,
              }),
            ),
          }),
          detail: {
            tags: ["Admin", "Config"],
            summary: "Update global configuration",
            description: "Update global configuration flags.",
          },
        },
      )

      /**
       * GET /admin/config/certificate-design
       * Saved Certificate Design, its title, defaults and the built-in
       * Layouts, Palettes and Optional Elements.
       */
      .get(
        "/certificate-design",
        async () => {
          const config = await ConfigService.getCertificateDesign();
          return toCertificateDesignResponse(config);
        },
        {
          detail: {
            tags: ["Admin", "Config", "Certificates"],
            summary: "Get the Certificate Design",
            description:
              "Returns the saved Certificate Design and the available Layouts, Palettes and Optional Elements.",
          },
        },
      )

      /**
       * PUT /admin/config/certificate-design
       * Save the Certificate Design. Applies to certificates issued from now on.
       */
      .put(
        "/certificate-design",
        async ({ body }) => {
          const config = await ConfigService.updateCertificateDesign({
            title: body.title,
            design: {
              layout: body.layout,
              palette: body.palette,
              elements: body.elements,
            },
            expectedRevision: body.expectedRevision,
          });
          return toCertificateDesignResponse(config);
        },
        {
          body: t.Object({
            title: t.String({ minLength: 3, maxLength: 150 }),
            layout: t.UnionEnum(CERTIFICATE_LAYOUT_IDS),
            palette: t.UnionEnum(CERTIFICATE_PALETTE_IDS),
            elements: t.Object(
              Object.fromEntries(
                OPTIONAL_ELEMENT_KEYS.map((key) => [key, t.Boolean()]),
              ) as Record<OptionalElementKey, ReturnType<typeof t.Boolean>>,
            ),
            expectedRevision: t.Integer({ minimum: 1 }),
          }),
          detail: {
            tags: ["Admin", "Config", "Certificates"],
            summary: "Save the Certificate Design",
            description:
              "Saves the Certificate Design and title. Already-issued certificates are not re-rendered.",
          },
        },
      )

      /**
       * POST /admin/config/certificate-design/preview
       * Render an unsaved Certificate Design with sample data. Uploads nothing.
       */
      .post(
        "/certificate-design/preview",
        async ({ body }) => {
          const config = await ConfigService.getConfig();
          const pdf = await renderCertificatePdf(
            buildPreviewCertificateData({
              title: body.title.trim() || DEFAULT_CERTIFICATE_TITLE,
              unlockRequirement: config.certificateUnlockRequirement,
            }),
            {
              layout: body.layout,
              palette: body.palette,
              elements: body.elements,
            },
          );

          return new Response(new Uint8Array(pdf), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'inline; filename="previa-certificado.pdf"',
              "Cache-Control": "no-store",
            },
          });
        },
        {
          body: certificateDesignBody,
          detail: {
            tags: ["Admin", "Config", "Certificates"],
            summary: "Preview a Certificate Design",
            description:
              "Returns a PDF of the given (unsaved) Certificate Design rendered with sample data.",
          },
        },
      ),
  );
