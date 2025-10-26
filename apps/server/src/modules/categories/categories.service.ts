import { db } from "@/db";
import type { CreateCategoryBody, UpdateCategoryBody } from "./model";
import { contentCategories } from "@/db/schema/categories";
import { asc, eq } from "drizzle-orm";
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "@/lib/errors";
import Color from "color";

export abstract class CategoriesService {
  static async isSlugTaken(slug: string) {
    const [category] = await db
      .select()
      .from(contentCategories)
      .where(eq(contentCategories.slug, slug))
      .limit(1);

    return !!category;
  }

  static async getCategoryById(categoryId: number) {
    const category = await db.query.contentCategories.findFirst({
      where: eq(contentCategories.id, categoryId),
      with: {
        wikiArticles: {
          columns: {
            id: true,
            title: true,
            excerpt: true,
            status: true,
            updatedAt: true,
          },
          with: {
            author: {
              columns: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    return category;
  }

  static async createCategory(newCategory: CreateCategoryBody) {
    if (await this.isSlugTaken(newCategory.slug)) {
      throw new ConflictError("Category slug is already taken");
    }

    const [category] = await db
      .insert(contentCategories)
      .values(newCategory)
      .returning();

    return category;
  }

  static async updateCategory(categoryId: number, data: UpdateCategoryBody) {
    const [existing] = await db
      .select()
      .from(contentCategories)
      .where(eq(contentCategories.id, categoryId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Category");
    }

    if (
      data.slug &&
      data.slug !== existing.slug &&
      (await this.isSlugTaken(data.slug))
    ) {
      throw new ConflictError("Category slug is already taken");
    }

    if (data.color) {
      try {
        Color(data.color);
      } catch {
        throw new UnprocessableEntityError("Invalid color format");
      }
    }

    const [category] = await db
      .update(contentCategories)
      .set(data)
      .where(eq(contentCategories.id, categoryId))
      .returning();

    return category;
  }

  static async getAllCategories({ page = 1, pageSize = 10 } = {}) {
    const categories = await db.query.contentCategories.findMany({
      with: {
        wikiArticles: {
          columns: {
            id: true,
            title: true,
            excerpt: true,
            status: true,
          },
          limit: 5,
        },
      },
      orderBy: (categories) => [asc(categories.id), asc(categories.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return categories;
  }

  static async deleteCategory(categoryId: number) {
    const [existing] = await db
      .select()
      .from(contentCategories)
      .where(eq(contentCategories.id, categoryId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Category");
    }

    await db.delete(contentCategories).where(eq(contentCategories.id, categoryId));

    return existing;
  }
}
