import { client } from "@/lib/client";

export async function deleteTag(id: number | string) {
  const numericId = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numericId)) {
    throw new Error("Identificador de tag inválido.");
  }

  const response = await client.tags({ id: numericId }).delete();

  if (response.status !== 204) {
    throw new Error("Não foi possível deletar a tag.")
  }

  return true;
}
