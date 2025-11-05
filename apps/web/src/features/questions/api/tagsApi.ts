import { client } from "@/lib/client";

export const tagsApi = {
  listTags: async (query?: { search?: string; keys?: string[] }) => {
    const response = await client.admin.tags.get({ query });
    return response.data;
  },

  createTag: async (body: { name: string; slug: string; description?: string; color?: string }) => {
    const response = await client.admin.tags.post(body);
    return response.data;
  },
};

export type TagsListResponse = Awaited<ReturnType<typeof tagsApi.listTags>>;
export type Tag = TagsListResponse extends { data: infer D }
  ? D extends Array<infer T>
    ? T
    : never
  : never;
