import { drizzle } from "drizzle-orm/node-postgres";
import * as auth from "./schema/auth";
import * as categories from "./schema/categories";
import * as questions from "./schema/questions";
import * as audit from "./schema/audit";
import * as wiki from "./schema/wiki";
import * as achievements from "./schema/achievements";
import * as quizzes from "./schema/quizzes";

import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

export const db = drizzle(process.env.DATABASE_URL || "", {
  schema: {
    ...auth,
    ...achievements,
    ...categories,
    ...questions,
    ...quizzes,
    ...audit,
    ...wiki,
  },
});

export function withPagination<T extends PgSelect>(
  qb: T,
  orderByColumn: PgColumn | SQL | SQL.Aliased,
  page = 1,
  pageSize = 3,
) {
  return qb
    .orderBy(orderByColumn)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
