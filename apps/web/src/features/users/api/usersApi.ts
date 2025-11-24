import { client } from "@/lib/client";
import { authClient } from "@/lib/auth-client";

export const usersClient = client.admin.users;

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

export const usersApi = {
	getUsers: async (params?: {
		page?: number;
		pageSize?: number;
		search?: string;
		role?: string;
		banned?: boolean;
	}) => {
		const response = await usersClient.get(params ? { query: params } : undefined);
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load users");
		}
		return response.data;
	},

	getUserById: async (id: string) => {
		const response = await usersClient({ id }).get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user");
		}
		return response.data;
	},

	getUserOverview: async (id: string) => {
		const response = await usersClient({ id }).overview.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user overview");
		}
		return response.data;
	},

	getUserAchievements: async (id: string) => {
		const response = await usersClient({ id }).achievements.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user achievements");
		}
		return response.data;
	},

	getUserTrails: async (id: string) => {
		const response = await usersClient({ id }).trails.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user trails");
		}
		return response.data;
	},

	getUserQuizzes: async (id: string) => {
		const response = await usersClient({ id }).quizzes.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user quizzes");
		}
		return response.data;
	},

	getUserStats: async () => {
		const response = await usersClient.stats.get();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to load user stats");
		}
		return response.data;
	},

	updateUser: async (
		id: string,
		body: {
			name?: string;
			email?: string;
			role?: string;
			banned?: boolean;
			banReason?: string;
			banExpires?: Date;
			image?: string;
		},
	) => {
		const response = await usersClient({ id }).patch(body);
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to update user");
		}
		return response.data;
	},

	deleteUser: async (id: string) => {
		const response = await usersClient({ id }).delete();
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to delete user");
		}
		return response.data;
	},

	createUser: async (body: {
		name: string;
		email: string;
		password: string;
		role?: string | string[];
	}) => {
		const response = await authClient.admin.createUser(body);
		if (response.error) {
			throwEdenError(response.error as EdenError, "Failed to create user");
		}
		return response.data;
	},

	regenerateCertificate: async (id: string) => {
		const response = await usersClient({ id }).certificate.regenerate.post();
		if (response.error) {
			throwEdenError(
				response.error as EdenError,
				"Failed to regenerate certificate",
			);
		}
		return response.data;
	},
};
