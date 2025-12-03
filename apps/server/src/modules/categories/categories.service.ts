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
            updatedAt: true,
          },
          where: (articles, { ne }) => ne(articles.status, "archived"),
          limit: 5,
        },
        questions: {
          columns: {
            id: true,
            prompt: true,
            explanation: true,
            type: true,
            difficulty: true,
            status: true,
            updatedAt: true,
          },
          where: (questions, { ne }) => ne(questions.status, "archived"),
          limit: 5,
        },
        quizzes: {
          columns: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            status: true,
            timeLimit: true,
            passingScore: true,
            updatedAt: true,
          },
          where: (quizzes, { ne }) => ne(quizzes.status, "archived"),
          limit: 5,
        },
        trails: {
          columns: {
            id: true,
            name: true,
            description: true,
            difficulty: true,
            status: true,
            updatedAt: true,
          },
          where: (trails, { ne }) => ne(trails.status, "archived"),
          limit: 5,
        },
      },
      orderBy: (categories) => [asc(categories.id), asc(categories.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    console.log(categories);

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

    // Check if category has published content
    const categoryWithContent = await db.query.contentCategories.findFirst({
      where: eq(contentCategories.id, categoryId),
      with: {
        wikiArticles: {
          columns: { id: true },
          where: (articles, { eq }) => eq(articles.status, "published"),
          limit: 1,
        },
        questions: {
          columns: { id: true },
          where: (questions, { eq }) => eq(questions.status, "active"),
          limit: 1,
        },
        quizzes: {
          columns: { id: true },
          where: (quizzes, { eq }) => eq(quizzes.status, "active"),
          limit: 1,
        },
        trails: {
          columns: { id: true },
          where: (trails, { eq }) => eq(trails.status, "published"),
          limit: 1,
        },
      },
    });

    const hasPublishedArticles = categoryWithContent?.wikiArticles.length ?? 0 > 0;
    const hasActiveQuestions = categoryWithContent?.questions.length ?? 0 > 0;
    const hasActiveQuizzes = categoryWithContent?.quizzes.length ?? 0 > 0;
    const hasPublishedTrails = categoryWithContent?.trails.length ?? 0 > 0;

    if (hasPublishedArticles || hasActiveQuestions || hasActiveQuizzes || hasPublishedTrails) {
      const contentTypes = [];
      if (hasPublishedArticles) contentTypes.push("artigos publicados");
      if (hasActiveQuestions) contentTypes.push("questões ativas");
      if (hasActiveQuizzes) contentTypes.push("quizzes ativos");
      if (hasPublishedTrails) contentTypes.push("trilhas publicadas");

      throw new ConflictError(
        `Não é possível excluir categoria com ${contentTypes.join(", ")}. Por favor, arquive ou remova o conteúdo primeiro.`
      );
    }

    await db
      .delete(contentCategories)
      .where(eq(contentCategories.id, categoryId));

    return existing;
  }
}
