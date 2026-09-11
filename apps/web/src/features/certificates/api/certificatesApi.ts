import { client } from "@/lib/client";
import { getApiUrl } from "@/lib/env";

export const certificatesClient = client.admin.certificates;
const configClient = client.admin.config;
const certificateDesignClient = configClient["certificate-design"];

/** Saved Certificate Design + title, defaults, and the built-in options. */
export type CertificateDesignSettings = NonNullable<
	Awaited<ReturnType<typeof certificateDesignClient.get>>["data"]
>;
export type CertificateDesignOptions = CertificateDesignSettings["options"];
/** Body accepted by the save and preview endpoints. */
export type CertificateDesignPayload = Parameters<
	typeof certificateDesignClient.put
>[0];

type EdenError = {
	message?: string;
	code?: string;
	[key: string]: unknown;
} | null;

function throwEdenError(error: EdenError, fallbackMessage: string): never {
	const errorMessage =
		(typeof error === "object" && error?.message) || fallbackMessage;
	const err = new Error(errorMessage);
	if (error && typeof error === "object") {
		(err as any).cause = error;
	}
	throw err;
}

export type CertificateVerificationResult =
  | {
      isValid: true;
      userName: string;
      issuedAt: string | null;
      averageScore: number;
      totalTrailsCompleted: number;
    }
  | {
      isValid: false;
      message?: string;
    };

export type CertificateSettings = {
	autoApproveCertificates: boolean;
	certificateTitle: string;
	certificateUnlockRequirement: "trails" | "articles" | "trails_and_articles";
	certificateMinStudyHours: number;
	certificateMaxStudyHours: number;
};

export const certificatesApi = {
	getPending: async () => {
		const response = await certificatesClient.pending.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load pending certificates");
		}
		return response.data;
	},

	getStats: async () => {
		const response = await certificatesClient.stats.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load certificate stats");
		}
		return response.data;
	},

	approveCertificate: async (id: number, notes?: string) => {
		const response = await certificatesClient({ id: id.toString() }).approve.post({
			notes,
		});
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to approve certificate");
		}
		return response.data;
	},

	rejectCertificate: async (id: number, reason: string) => {
		const response = await certificatesClient({ id: id.toString() }).reject.post({
			reason,
		});
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to reject certificate");
		}
		return response.data;
	},

	revokeCertificate: async (id: number, reason: string) => {
		const response = await certificatesClient({ id: id.toString() }).revoke.post({
			reason,
		});
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to revoke certificate");
		}
		return response.data;
	},

	verifyCertificate: async (code: string) => {
		const response = await client.certificates.verify({ code }).get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Falha ao verificar certificado");
		}
		return response.data as CertificateVerificationResult;
	},

	getSettings: async () => {
		const response = await configClient.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load certificate settings");
		}
		return response.data as CertificateSettings;
	},

	updateSettings: async (payload: Partial<CertificateSettings>) => {
		const response = await configClient.patch(payload);
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to update settings");
		}
		return response.data as CertificateSettings;
	},

	getCertificateDesign: async () => {
		const response = await certificateDesignClient.get();
		if (response.error) {
			throwEdenError(
				response.error as EdenError,
				"Não foi possível carregar o design do certificado",
			);
		}
		return response.data as CertificateDesignSettings;
	},

	saveCertificateDesign: async (payload: CertificateDesignPayload) => {
		const response = await certificateDesignClient.put(payload);
		if (response.error) {
			throwEdenError(
				response.error as EdenError,
				"Não foi possível salvar o design do certificado",
			);
		}
		return response.data as CertificateDesignSettings;
	},

	/**
	 * Renders an unsaved design as a PDF. Plain fetch because the endpoint
	 * returns binary, which Eden does not type well.
	 */
	renderCertificateDesignPreview: async (
		payload: CertificateDesignPayload,
		signal?: AbortSignal,
	) => {
		const response = await fetch(
			`${getApiUrl()}/api/admin/config/certificate-design/preview`,
			{
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				signal,
			},
		);

		if (!response.ok) {
			let message = "Não foi possível gerar a prévia do certificado";
			try {
				const body = await response.json();
				message = body?.error?.message || body?.message || message;
			} catch {
				// Non-JSON error body: keep the default message.
			}
			throw new Error(message);
		}

		return response.blob();
	},
};
