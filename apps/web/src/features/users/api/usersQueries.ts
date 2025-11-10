import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { usersApi } from "./usersApi";

export const usersQueryKeys = {
	all: ["users"] as const,
	lists: () => [...usersQueryKeys.all, "list"] as const,
	list: (params?: {
		page?: number;
		pageSize?: number;
		search?: string;
		role?: string;
		banned?: boolean;
	}) => [...usersQueryKeys.lists(), params] as const,
	details: () => [...usersQueryKeys.all, "detail"] as const,
	detail: (id: string) => [...usersQueryKeys.details(), id] as const,
	stats: () => [...usersQueryKeys.all, "stats"] as const,
	overview: (id: string) => [...usersQueryKeys.detail(id), "overview"] as const,
	achievements: (id: string) => [...usersQueryKeys.detail(id), "achievements"] as const,
	trails: (id: string) => [...usersQueryKeys.detail(id), "trails"] as const,
	quizzes: (id: string) => [...usersQueryKeys.detail(id), "quizzes"] as const,
};

export function listUsersQueryOptions(params?: {
	page?: number;
	pageSize?: number;
	search?: string;
	role?: string;
	banned?: boolean;
}) {
	return queryOptions({
		queryKey: usersQueryKeys.list(params),
		queryFn: async () => {
			const response = await usersApi.getUsers(params);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load users";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 30_000,
		gcTime: 5 * 60_000,
		placeholderData: keepPreviousData,
	});
}

export function userQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersQueryKeys.detail(id),
		queryFn: async () => {
			const response = await usersApi.getUserById(id);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 30_000,
		gcTime: 5 * 60_000,
	});
}

export function userStatsQueryOptions() {
	return queryOptions({
		queryKey: usersQueryKeys.stats(),
		queryFn: async () => {
			const response = await usersApi.getUserStats();
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user stats";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 60_000,
		gcTime: 5 * 60_000,
	});
}

export function userOverviewQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersQueryKeys.overview(id),
		queryFn: async () => {
			const response = await usersApi.getUserOverview(id);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user overview";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 60_000,
		gcTime: 5 * 60_000,
	});
}

export function userAchievementsQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersQueryKeys.achievements(id),
		queryFn: async () => {
			const response = await usersApi.getUserAchievements(id);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user achievements";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 60_000,
		gcTime: 5 * 60_000,
	});
}

export function userTrailsQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersQueryKeys.trails(id),
		queryFn: async () => {
			const response = await usersApi.getUserTrails(id);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user trails";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 60_000,
		gcTime: 5 * 60_000,
	});
}

export function userQuizzesQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersQueryKeys.quizzes(id),
		queryFn: async () => {
			const response = await usersApi.getUserQuizzes(id);
			if (!response?.success) {
				const message =
					response?.error?.message || "Failed to load user quizzes";
				throw new Error(message);
			}
			return response.data;
		},
		staleTime: 60_000,
		gcTime: 5 * 60_000,
	});
}
