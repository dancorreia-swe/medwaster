import {
  boolean,
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const contentCategoryTypeValues = [
  "wiki",
  "question",
  "track",
  "quiz",
  "general",
] as const;

export const contentCategoryTypeEnum = pgEnum(
  "content_category_type",
  contentCategoryTypeValues,
);

export const contentCategories = pgTable(
  "content_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    type: contentCategoryTypeEnum("type").notNull().default("wiki"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("content_categories_name_idx").on(table.name),
    index("content_categories_type_idx").on(table.type),
  ],
);

export type ContentCategory = typeof contentCategories.$inferSelect;
export type NewContentCategory = typeof contentCategories.$inferInsert;
export type ContentCategoryType = (typeof contentCategoryTypeValues)[number];
