import { client } from "@/lib/eden";
import { useQuery, useMutation } from "@tanstack/react-query";

export interface Certificate {
  id: number;
  userId: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  verificationCode: string;
  averageScore: number;
  totalTrailsCompleted: number;
  totalTimeMinutes: number;
  allTrailsCompletedAt: Date;
  issuedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  revokedAt?: Date | null;
  certificateUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface GetCertificateResponse {
  certificate: Certificate | null;
}

/**
 * Get the authenticated user's certificate
 */
export async function getUserCertificate(): Promise<GetCertificateResponse> {
  const { data, error } = await client.certificates.get();
  
  if (error) {
    throw error;
  }
  
  return data as GetCertificateResponse;
}

/**
 * React Query hook to fetch user's certificate
 */
export const certificateKeys = {
  user: ["certificate"] as const,
};

export function useUserCertificate(enabled: boolean = true) {
  return useQuery({
    queryKey: certificateKeys.user,
    queryFn: getUserCertificate,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
}

/**
 * Get certificate download URL
 */
export async function getCertificateDownloadUrl(certificateId: number): Promise<string> {
  const { data, error } = await client.certificates.download[certificateId].get();
  
  if (error) {
    throw error;
  }
  
  return (data as any).certificateUrl;
}
