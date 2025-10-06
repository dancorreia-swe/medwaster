import { drizzle } from "drizzle-orm/node-postgres";
import * as auth from "./schema/auth";
import * as questions from "./schema/questions";
import * as audit from "./schema/audit";
import * as wiki from "./schema/wiki";

export const db = drizzle(process.env.DATABASE_URL || "", {
  schema: {
    ...auth,
    ...questions,
    ...audit,
    ...wiki,
  },
});
