import type {
  CertificateRenderData,
  CertificateUnlockRequirement,
} from "../pdf/shared";

/**
 * Fake student used by the Certificate Design preview. Never real data.
 * No photo URL, so the preview shows the initials avatar.
 */
export function buildPreviewCertificateData(input: {
  title: string;
  unlockRequirement: CertificateUnlockRequirement;
  now?: Date;
}): CertificateRenderData {
  const now = input.now ?? new Date();

  return {
    userName: "Maria Oliveira",
    averageScore: 92,
    totalTrailsCompleted: 12,
    totalTimeMinutes: 18 * 60 + 30,
    completionDate: now,
    verificationCode: `CERT-${now.getFullYear()}-7F3A9C21`,
    userImageUrl: null,
    title: input.title,
    unlockRequirement: input.unlockRequirement,
  };
}
