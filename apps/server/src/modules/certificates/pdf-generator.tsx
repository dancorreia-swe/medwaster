import type { ReactElement } from "react";
import { Document, pdf } from "@react-pdf/renderer";
import { CertificateStorageService } from "./storage.service";
import { BRAND_DISPLAY_NAME } from "../../emails/brand";
import {
  buildCertificateTheme,
  getCertificatePalette,
  normalizeCertificateDesign,
  type CertificateDesign,
  type CertificateLayoutId,
} from "./design/catalog";
import { registerCertificateFonts } from "./pdf/fonts";
import {
  buildCertificateContent,
  type CertificateLayoutProps,
  type CertificateRenderData,
} from "./pdf/shared";
import { ClassicoLayout } from "./pdf/layouts/classico";
import { MinimalistaLayout } from "./pdf/layouts/minimalista";
import { ModernoLayout } from "./pdf/layouts/moderno";

export type { CertificateRenderData } from "./pdf/shared";

export interface CertificateData extends CertificateRenderData {
  id: number;
}

const LAYOUTS: Record<
  CertificateLayoutId,
  (props: CertificateLayoutProps) => ReactElement
> = {
  moderno: ModernoLayout,
  classico: ClassicoLayout,
  minimalista: MinimalistaLayout,
};

/**
 * Render a certificate PDF with the given Certificate Design. Pure: no upload.
 * Both the admin preview and real issuance go through this function.
 */
export async function renderCertificatePdf(
  data: CertificateRenderData,
  design: CertificateDesign,
): Promise<Buffer> {
  registerCertificateFonts();

  const resolvedDesign = normalizeCertificateDesign(design);
  const theme = buildCertificateTheme(
    getCertificatePalette(resolvedDesign.palette),
  );
  const content = await buildCertificateContent(data, resolvedDesign, theme);
  const Layout = LAYOUTS[resolvedDesign.layout];

  const pdfInstance = pdf(
    <Document
      title={`Certificado - ${content.userName}`}
      author={BRAND_DISPLAY_NAME}
      creator={BRAND_DISPLAY_NAME}
      producer={BRAND_DISPLAY_NAME}
      language="pt-BR"
    >
      <Layout content={content} theme={theme} />
    </Document>,
  );

  return ensureBufferFromReactPdf(await pdfInstance.toBuffer());
}

/** Render a certificate PDF and upload it, returning its public URL. */
export async function generateCertificatePDF(
  data: CertificateData,
  design: CertificateDesign,
): Promise<string> {
  try {
    const pdfBuffer = await renderCertificatePdf(data, design);
    const key = `certificate-${data.id}-${data.verificationCode}.pdf`;
    return await CertificateStorageService.uploadPdf(key, pdfBuffer);
  } catch (error) {
    console.error("Failed to generate certificate PDF:", error);
    throw error;
  }
}

async function ensureBufferFromReactPdf(
  result: Buffer | Uint8Array | NodeJS.ReadableStream,
): Promise<Buffer> {
  if (Buffer.isBuffer(result)) {
    return result;
  }

  if (result instanceof Uint8Array) {
    return Buffer.from(result);
  }

  if (typeof (result as NodeJS.ReadableStream)?.on === "function") {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = result as NodeJS.ReadableStream;

      stream.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });
  }

  throw new Error("Unsupported output from react-pdf renderer");
}
