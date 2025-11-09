import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { wikiArticles } from "./wiki";
import { questions } from "./questions";
import { quizzes } from "./quizzes";

export const contentCategories = pgTable(
  "content_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("content_categories_name_idx").on(table.name)],
);

export const contentCategoriesRelations = relations(
  contentCategories,
  ({ many }) => ({
    wikiArticles: many(wikiArticles),
    questions: many(questions),
    quizzes: many(quizzes),
  }),
);

export type ContentCategory = typeof contentCategories.$inferSelect;
export type NewContentCategory = typeof contentCategories.$inferInsert;
