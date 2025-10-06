import { client } from "@/lib/client";
import type { CreateTagBody } from "@server/modules/tags/model";

export async function createTag(data: CreateTagBody) {
  const response = await client.tags.post(data);

  if (!response.data) {
    throw new Error("Não foi possível criar a tag.");
  }

  return response.data;
}
