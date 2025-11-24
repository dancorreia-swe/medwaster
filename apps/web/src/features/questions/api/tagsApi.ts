import { client } from "@/lib/client";

export const tagsApi = {
  listTags: async (query?: { search?: string; keys?: string[] }) => {
    const response = await client.admin.tags.get({ query });
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  createTag: async (body: { name: string; slug: string; description?: string; color?: string }) => {
    const response = await client.admin.tags.post(body);
    return response.data?.data || response.data;
  },
};

export type TagsListResponse = Awaited<ReturnType<typeof tagsApi.listTags>>;
export type Tag = TagsListResponse extends Array<infer T> ? T : never;
