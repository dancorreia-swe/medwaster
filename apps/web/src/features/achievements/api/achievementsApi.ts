import { client } from "@/lib/client";

export const achievementsApi = {
  listAchievements: (params?: { page?: number; pageSize?: number }) =>
    client.admin.achievements.get(params ? { query: params } : undefined),

  getAchievement: (id: number) =>
    client.admin.achievements({ id: id.toString() }).get(),

  createAchievement: (body: {
    name: string;
    description: string;
    category: string;
    difficulty?: string;
    status?: string;
    triggerType: string;
    triggerConfig?: any;
    badgeImageUrl?: string;
    badgeSvg?: string;
    customMessage?: string;
    displayOrder?: number;
    isSecret?: boolean;
  }) => client.admin.achievements.post(body),

  updateAchievement: (
    id: number,
    body: {
      name?: string;
      description?: string;
      category?: string;
      difficulty?: string;
      status?: string;
      triggerType?: string;
      triggerConfig?: any;
      badgeImageUrl?: string;
      badgeSvg?: string;
      customMessage?: string;
      displayOrder?: number;
      isSecret?: boolean;
    },
  ) => client.admin.achievements({ id: id.toString() }).patch(body),

  deleteAchievement: (id: number) =>
    client.admin.achievements({ id: id.toString() }).delete(),
};
