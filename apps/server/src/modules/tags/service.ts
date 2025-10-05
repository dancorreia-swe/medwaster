import { eq, ilike, or, type SQL } from 'drizzle-orm';
import { db } from "@/db";
import { tagsInsertSchema, tags as tagsSchema } from "@/db/schema/questions";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { CreateTagBody, ListTagsQuery, UpdateTagBody } from './model';
import Color from 'color';

export abstract class TagsService {
  static async getAll(query?: ListTagsQuery) {
    const baseQuery = db.select().from(tagsSchema);

    const searchTerm = query?.search?.trim();
    const allowedKeys = query?.keys?.length ? query.keys : undefined;
    let whereCondition: SQL<unknown> | undefined;

    if (searchTerm) {
      const sanitizedTerm = `%${searchTerm.replace(/%/g, "")}%`;
      const keysToUse = allowedKeys ?? ["name", "slug"];

      const filters = keysToUse
        .map((key) => {
          if (key === "name") {
            return ilike(tagsSchema.name, sanitizedTerm);
          }

          if (key === "slug") {
            return ilike(tagsSchema.slug, sanitizedTerm);
          }

          return null;
        })
        .filter((condition): condition is SQL<unknown> => Boolean(condition));

      if (filters.length === 1) {
        whereCondition = filters[0]!;
      } else if (filters.length > 1) {
        whereCondition = or(...filters);
      }
    }

    const tags = await (whereCondition
      ? baseQuery.where(whereCondition)
      : baseQuery);

    return tags;
  }

  static async getByName(name: string) {
    const tag = await db
      .select()
      .from(tagsSchema)
      .where(eq(tagsSchema.name, name))
      .execute();

    return tag;
  }


  static async createTag(newTag: CreateTagBody) {
    if (!newTag.color) {
      newTag.color = TagsService.randomColor().hex();
    }

    const createdTag = await db
      .insert(tagsSchema)
      .values(tagsInsertSchema.parse(newTag))
      .returning();

    return createdTag;
  }

  static async updateTag(id: number, updates: UpdateTagBody) {
    const updateData: Partial<typeof tagsSchema.$inferInsert> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.slug !== undefined) {
      updateData.slug = updates.slug;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }

    if (!Object.keys(updateData).length) {
      throw new BadRequestError("No fields provided to update the tag");
    }

    updateData.updatedAt = new Date();

    const [updatedTag] = await db
      .update(tagsSchema)
      .set(updateData)
      .where(eq(tagsSchema.id, id))
      .returning();

    if (!updatedTag) {
      throw new NotFoundError("Tag");
    }

    return updatedTag;
  }

  static async deleteTag(id: number) {
    const [deletedTag] = await db
      .delete(tagsSchema)
      .where(eq(tagsSchema.id, id))
      .returning();

    if (!deletedTag) {
      throw new NotFoundError("Tag");
    }

    return deletedTag;
  }

  private static randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 30; 
    const lightness = 40 + Math.random() * 20;

    return Color.hsl(hue, saturation, lightness);
  }
}
