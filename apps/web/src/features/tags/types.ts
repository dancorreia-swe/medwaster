import { z } from "zod";

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "A busca pode ter no máximo 100 caracteres")
    .optional(),
});

export type TagsSearch = z.infer<typeof searchSchema>;
