import { client } from "@/lib/client";

export const certificatesClient = client.admin.certificates;

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
};
