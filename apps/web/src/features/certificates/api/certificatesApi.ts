import { client } from "@/lib/client";
import { getApiUrl } from "@/lib/env";

export const certificatesClient = client.admin.certificates;
const configClient = client.admin.config;
const certificateDesignClient = configClient["certificate-design"];

/** Saved Certificate Design + title, defaults, and the built-in options. */
type GeneratedCertificateDesignSettings = NonNullable<
	Awaited<ReturnType<typeof certificateDesignClient.get>>["data"]
>;
export type CertificateDesignSettings = GeneratedCertificateDesignSettings & {
	revision: number;
};
export type CertificateDesignOptions = CertificateDesignSettings["options"];

/** Draft body accepted by the preview endpoint. */
export type CertificateDesignPayload = {
	title: string;
	layout: CertificateDesignSettings["design"]["layout"];
	palette: CertificateDesignSettings["design"]["palette"];
	elements: CertificateDesignSettings["design"]["elements"];
};

/** Body accepted by the optimistic-concurrency-protected save endpoint. */
export type CertificateDesignSavePayload = CertificateDesignPayload & {
	expectedRevision: number;
};

export type CertificateDesignCurrent = {
	title: string | null;
	design: CertificateDesignSettings["design"];
	revision: number;
};

type EdenError = {
	message?: string;
	code?: string;
	status?: number;
	value?: unknown;
	[key: string]: unknown;
} | null;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
	return typeof value === "object" && value !== null
		? (value as UnknownRecord)
		: null;
}

function nestedErrorRecords(error: unknown): UnknownRecord[] {
	const root = asRecord(error);
	if (!root) return [];

	const records: UnknownRecord[] = [];
	const pending = [root];
	const seen = new Set<UnknownRecord>();
	while (pending.length > 0) {
		const record = pending.shift();
		if (!record || seen.has(record)) continue;
		seen.add(record);
		records.push(record);
		for (const key of [
			"value",
			"error",
			"data",
			"body",
			"details",
			"current",
		]) {
			const nested = asRecord(record[key]);
			if (nested) pending.push(nested);
		}
	}
	return records;
}

function errorMessage(error: unknown, fallbackMessage: string) {
	for (const record of nestedErrorRecords(error)) {
		if (typeof record.message === "string" && record.message) {
			return record.message;
		}
	}
	return fallbackMessage;
}

function isDesign(value: unknown): value is CertificateDesignSettings["design"] {
	const record = asRecord(value);
	return Boolean(
		record &&
		typeof record.layout === "string" &&
		typeof record.palette === "string" &&
		asRecord(record.elements),
	);
}

function readConflictCurrent(error: unknown): CertificateDesignCurrent | null {
	const records = nestedErrorRecords(error);

	for (const record of records) {
		const candidates = [
			record.current,
			record.currentDesign,
			record.design,
		];

		for (const candidate of candidates) {
			const current = asRecord(candidate);
			const revision =
				typeof current?.revision === "number"
					? current.revision
					: typeof record.currentRevision === "number"
						? record.currentRevision
						: typeof record.revision === "number"
							? record.revision
							: null;
			const currentDesign = current?.design;
			const design = isDesign(currentDesign)
				? currentDesign
				: isDesign(candidate)
					? candidate
					: null;

			if (design && revision !== null) {
				const title =
					typeof current?.title === "string"
						? current.title
						: typeof record.title === "string"
							? record.title
							: null;
				return { title, design, revision };
			}
		}
	}

	return null;
}

function isConflictError(error: unknown) {
	return nestedErrorRecords(error).some(
		(record) =>
			record.status === 409 ||
			record.statusCode === 409 ||
			record.code === "CONFLICT" ||
			record.code === "VERSION_CONFLICT" ||
			record.code === "CERTIFICATE_DESIGN_VERSION_CONFLICT",
	);
}

export class CertificateDesignConflictError extends Error {
	readonly current: CertificateDesignCurrent | null;

	constructor(current: CertificateDesignCurrent | null, message?: string) {
		super(message ?? "O design do certificado foi alterado por outra pessoa.");
		this.name = "CertificateDesignConflictError";
		this.current = current;
	}
}

function throwEdenError(error: EdenError, fallbackMessage: string): never {
	const err = new Error(errorMessage(error, fallbackMessage));
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

	saveCertificateDesign: async (payload: CertificateDesignSavePayload) => {
		const response = await certificateDesignClient.put(
			payload as Parameters<typeof certificateDesignClient.put>[0],
		);
		if (response.error) {
			if (isConflictError(response.error)) {
				throw new CertificateDesignConflictError(
					readConflictCurrent(response.error),
					errorMessage(
						response.error,
						"O design do certificado foi alterado por outra pessoa.",
					),
				);
			}
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
