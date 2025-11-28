import { Button } from "@/components/ui/button";
import { useCreateArticle } from "@/features/wiki/api/wikiQueries";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { DEFAULT_ARTICLE_TITLE } from "../constants";

export function NewArticleButton() {
  const navigate = useNavigate();
  const { mutateAsync: createArticle } = useCreateArticle();

  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const response = await createArticle({
        title: DEFAULT_ARTICLE_TITLE,
        excerpt: "",
        status: "draft",
      });

      const createdId = response?.data?.data.id;
      if (!createdId) {
        throw new Error(
          "Não foi possível obter o identificador do novo artigo.",
        );
      }

      // Navigate immediately without waiting for any state updates
      // Pass 'new' search param to trigger query invalidation after page loads
      await navigate({
        to: "/wiki/$articleId",
        params: { articleId: String(createdId) },
        search: { new: "true" },
      });
    } catch (error) {
      const fallback =
        error instanceof Error
          ? error.message
          : "Falha ao criar rascunho. Tente novamente.";
      setErrorMessage(fallback);
      setIsCreating(false);
    }
    // Don't set isCreating to false on success - let navigation handle unmounting
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleCreate} disabled={isCreating} variant={"default"}>
        {isCreating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        {isCreating ? "Criando..." : "Novo artigo"}
      </Button>
      {errorMessage && (
        <span className="text-xs text-destructive">{errorMessage}</span>
      )}
    </div>
  );
}
