import React from "react";
import { pdf, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { CertificateStorageService } from "./storage.service";

interface CertificateData {
  id: number;
  userName: string;
  averageScore: number;
  totalTrailsCompleted: number;
  totalTimeMinutes: number;
  completionDate: Date;
  verificationCode: string;
  userImageUrl?: string | null;
}

const VERIFY_BASE_URL =
  process.env.CERTIFICATE_VERIFY_URL ||
  process.env.PUBLIC_APP_URL ||
  process.env.APP_ORIGIN ||
  process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
  "https://medwaster.com";
const VERIFY_PATH = process.env.CERTIFICATE_VERIFY_PATH || "/verify/certificate";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0F172A",
    padding: 24,
  },
  card: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "3 solid #155DFC",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  badge: {
    fontSize: 12,
    letterSpacing: 4,
    color: "#6B7280",
  },
  title: {
    fontSize: 28,
    color: "#111827",
    fontWeight: 700,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    border: "3 solid #155DFC",
  },
  nameBlock: {
    flexGrow: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: "#155DFC",
  },
  achievement: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingVertical: 16,
    borderTop: "1 solid #E5E7EB",
    borderBottom: "1 solid #E5E7EB",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 22,
    color: "#111827",
    fontWeight: 700,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    marginBottom: 12,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 600,
  },
  qrBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 16,
  },
  qrImage: {
    width: 96,
    height: 96,
  },
  verificationUrl: {
    fontSize: 9,
    color: "#4B5563",
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
  },
  footerText: {
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 2,
  },
});

async function getImageDataUrl(imageUrl?: string | null, name?: string) {
  if (!imageUrl) {
    return generateInitialsAvatar(name || "");
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch user image");
    }
    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn("Falling back to initials avatar:", error);
    return generateInitialsAvatar(name || "");
  }
}

function generateInitialsAvatar(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="100" fill="#DBEAFE"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" font-family="Arial" fill="#1D4ED8">${initials ||
    "MW"}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (remaining > 0 || parts.length === 0) parts.push(`${remaining}min`);
  return parts.join(" ");
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

const CertificateDocument = ({
  userName,
  averageScore,
  totalTrailsCompleted,
  totalTimeMinutes,
  completionDate,
  verificationCode,
  verificationUrl,
  userImage,
  qrCode,
}: {
  userName: string;
  averageScore: number;
  totalTrailsCompleted: number;
  totalTimeMinutes: number;
  completionDate: Date;
  verificationCode: string;
  verificationUrl: string;
  userImage: string;
  qrCode: string;
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.card}>
        <View>
          <View style={styles.header}>
            <Text style={styles.badge}>CERTIFICADO</Text>
            <Text style={styles.title}>Conclusão de Trilhas</Text>
            <Text style={styles.subtitle}>Medwaster Plataforma Educacional</Text>
          </View>

          <View style={styles.profileRow}>
            <Image src={userImage} style={styles.avatar} />
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.achievement}>
                Concluiu todas as trilhas de aprendizado com excelência
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Média Geral</Text>
              <Text style={styles.statValue}>{Math.round(averageScore)}%</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Trilhas Concluídas</Text>
              <Text style={styles.statValue}>{totalTrailsCompleted}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tempo de Estudo</Text>
              <Text style={styles.statValue}>{formatMinutes(totalTimeMinutes)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Data de Conclusão</Text>
              <Text style={styles.infoValue}>{formatDate(completionDate)}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Código de Verificação</Text>
              <Text style={styles.infoValue}>{verificationCode}</Text>
            </View>
          </View>

          <View style={styles.qrBlock}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Verifique a autenticidade</Text>
              <Text style={styles.verificationUrl}>{verificationUrl}</Text>
            </View>
            <Image src={qrCode} style={styles.qrImage} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MEDWASTER • EDUCAÇÃO PARA PROFISSIONAIS DE SAÚDE</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function generateCertificatePDF(
  data: CertificateData,
): Promise<string> {
  try {
    const verificationUrl = `${VERIFY_BASE_URL.replace(/\/$/, "")}${VERIFY_PATH}/${data.verificationCode}`;
    const qrCode = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 1,
      color: { dark: "#111827", light: "#FFFFFF" },
    });
    const userImage = await getImageDataUrl(data.userImageUrl, data.userName);

    const pdfInstance = pdf(
      <CertificateDocument
        userName={data.userName}
        averageScore={data.averageScore}
        totalTrailsCompleted={data.totalTrailsCompleted}
        totalTimeMinutes={data.totalTimeMinutes}
        completionDate={new Date(data.completionDate)}
        verificationCode={data.verificationCode}
        verificationUrl={verificationUrl}
        userImage={userImage}
        qrCode={qrCode}
      />,
    );

    const pdfStreamOrBuffer = await pdfInstance.toBuffer();
    const pdfBuffer = await ensureBufferFromReactPdf(pdfStreamOrBuffer);

    const key = `certificate-${data.id}-${data.verificationCode}.pdf`;
    const url = await CertificateStorageService.uploadPdf(key, pdfBuffer);

    return url;
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
