import { client } from "@/lib/client";
import type { UpdateTagBody } from "@server/modules/tags/model";

export async function updateTag(id: number | string, data: UpdateTagBody) {
  const numericId = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numericId)) {
    throw new Error("Identificador de tag inválido.");
  }

  const response = await client.tags({ id: numericId }).patch(data);

  if (!response.data?.success) {
    throw new Error("Não foi possível atualizar a tag.");
  }

  return response.data.data;
}
