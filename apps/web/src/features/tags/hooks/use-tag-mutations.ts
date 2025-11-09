import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTag, deleteTag, updateTag, tagsQueryKeys } from "../api";
import type { TagFormValues } from "../components/tag-form-dialog";

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: number) => deleteTag(tagId),
    onSuccess: () => {
      toast.success("Tag excluída com sucesso.");
      // Invalidate both tags page queries and wiki/article page queries
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["wiki", "tags"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a tag.";
      toast.error(message);
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TagFormValues) => createTag(values),
    onSuccess: () => {
      toast.success("Tag criada com sucesso.");
      // Invalidate both tags page queries and wiki/article page queries
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["wiki", "tags"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar a tag.";
      toast.error(message);
    },
  });
}

export function useUpdateTag(tagId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TagFormValues) => {
      if (!tagId) {
        throw new Error("Tag ID is required for update");
      }

      return updateTag(tagId, values);
    },
    onSuccess: () => {
      toast.success("Tag atualizada com sucesso.");
      // Invalidate both tags page queries and wiki/article page queries
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["wiki", "tags"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a tag.";
      toast.error(message);
    },
  });
}
