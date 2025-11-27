import {
  index,
  pgTable,
  serial,
  text,
  integer,
  vector,
} from "drizzle-orm/pg-core";
import { wikiArticles } from "./wiki";

export const embeddings = pgTable(
  "embeddings",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => wikiArticles.id, {
        onDelete: "cascade",
      }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
  },
  (table) => [
    index("embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
