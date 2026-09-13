import { client } from "@/lib/client";
import { getErrorMessage } from "@/lib/api-error-handler";

export const profileClient = client.profile;

/** Standard backend envelope: `{ success: true, data, meta }`. */
interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface EdenResponse {
  data: unknown;
  error: unknown;
}

export interface ProfileSummary {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
}

export interface ConnectedAccount {
  provider: string;
  accountId: string;
  connectedAt: string | Date;
}

export interface AccountStats {
  accountCreatedAt: string | Date;
  firstLoginAt: string | Date | null;
  /** Server exposes the user record's `updatedAt` under this name. */
  lastActivityAt: string | Date | null;
  emailVerified: boolean;
  hasPassword: boolean;
  connectedAccounts: ConnectedAccount[];
}

async function unwrap<T>(
  request: Promise<EdenResponse>,
  fallbackMessage: string,
): Promise<T> {
  const response = await request;

  if (response.error) {
    throw new Error(getErrorMessage(response.error, fallbackMessage));
  }

  const envelope = response.data as ApiEnvelope<T> | null;

  if (!envelope?.data) {
    throw new Error(fallbackMessage);
  }

  return envelope.data;
}

export const profileApi = {
  /** PATCH /profile - persists the display name (and image, when provided). */
  updateProfile: (body: { name?: string; image?: string | null }) =>
    unwrap<ProfileSummary>(
      profileClient.patch(body),
      "Não foi possível atualizar o perfil.",
    ),

  /** GET /profile/stats/account - account metadata, no invented numbers. */
  getAccountStats: () =>
    unwrap<AccountStats>(
      profileClient.stats.account.get(),
      "Não foi possível carregar os dados da conta.",
    ),

  /** POST /profile/email/request-change - sends a code to the new address. */
  requestEmailChange: (body: { newEmail: string; password: string }) =>
    unwrap<{ success: boolean }>(
      profileClient.email["request-change"].post(body),
      "Não foi possível solicitar a alteração de email.",
    ),

  /** POST /profile/email/verify-change - completes the change with the code. */
  verifyEmailChange: (body: { token: string }) =>
    unwrap<{ success: boolean }>(
      profileClient.email["verify-change"].post(body),
      "Não foi possível confirmar a alteração de email.",
    ),
};
