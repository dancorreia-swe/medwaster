import { queryOptions } from "@tanstack/react-query";
import { certificatesApi } from "./certificatesApi";

export const certificatesQueryKeys = {
	all: ["certificates"] as const,
	pending: () => [...certificatesQueryKeys.all, "pending"] as const,
	stats: () => [...certificatesQueryKeys.all, "stats"] as const,
	settings: () => [...certificatesQueryKeys.all, "settings"] as const,
	verification: (code: string) => [...certificatesQueryKeys.all, "verification", code] as const,
};

export function pendingCertificatesQueryOptions() {
	return queryOptions({
		queryKey: certificatesQueryKeys.pending(),
		queryFn: async () => {
			return certificatesApi.getPending();
		},
		staleTime: 30_000,
		gcTime: 5 * 60_000,
	});
}

export function certificateStatsQueryOptions() {
	return queryOptions({
		queryKey: certificatesQueryKeys.stats(),
		queryFn: async () => {
			return certificatesApi.getStats();
		},
		staleTime: 60_000,
		gcTime: 10 * 60_000,
	});
}

export function certificateVerificationQueryOptions(code: string) {
	return queryOptions({
		queryKey: certificatesQueryKeys.verification(code),
		queryFn: async () => certificatesApi.verifyCertificate(code),
		staleTime: 5 * 60_000,
	});
}

export function certificateSettingsQueryOptions() {
	return queryOptions({
		queryKey: certificatesQueryKeys.settings(),
		queryFn: async () => certificatesApi.getSettings(),
		staleTime: 60_000,
	});
}
