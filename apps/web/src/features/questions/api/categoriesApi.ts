import { client } from "@/lib/client";

export const categoriesApi = {
  listCategories: async () => {
    const response = await client.admin.categories.get();
    return response.data;
  },

  getCategory: async (id: number) => {
    const response = await client.admin.categories({ id: id.toString() }).get();
    return response.data;
  },
};

export type CategoriesListResponse = Awaited<ReturnType<typeof categoriesApi.listCategories>>;
export type Category = CategoriesListResponse extends Array<infer T> ? T : never;
