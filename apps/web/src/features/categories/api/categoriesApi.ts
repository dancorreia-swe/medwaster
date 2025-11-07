import { client } from "@/lib/client";

export const categoriesApi = {
  listCategories: (params?: { page?: number; pageSize?: number }) =>
    client.admin.categories.get(params ? { query: params } : undefined),

  getCategory: (id: number) =>
    client.admin.categories({ id: id.toString() }).get(),

  createCategory: (body: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
  }) => client.admin.categories.post(body),

  updateCategory: (
    id: number,
    body: {
      name?: string;
      slug?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    },
  ) => client.admin.categories({ id: id.toString() }).patch(body),

  deleteCategory: (id: number) =>
    client.admin.categories({ id: id.toString() }).delete(),
};

export type CategoriesResponse = Awaited<
  ReturnType<typeof categoriesApi.listCategories>
>;

export type Category = CategoriesResponse["data"] extends (infer U)[]
  ? U
  : never;

export type CategoryWikiArticle = Category["wikiArticles"][number];
