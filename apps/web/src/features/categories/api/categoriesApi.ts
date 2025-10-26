import { client } from "@/lib/client";

export const categoriesApi = {
  listCategories: (params?: { page?: number; pageSize?: number }) =>
    client.categories.get(params ? { query: params } : undefined),

  getCategory: (id: number) => client.categories({ id: id.toString() }).get(),

  createCategory: (body: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
  }) => client.categories.post(body),

  updateCategory: (
    id: number,
    body: {
      name?: string;
      slug?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    }
  ) => client.categories({ id: id.toString() }).patch(body),
};

export type Category = Awaited<
  ReturnType<typeof categoriesApi.listCategories>
>["data"][number];
