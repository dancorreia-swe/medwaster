import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Category } from "../../api";

interface DeleteCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteCategoryDialogProps) {
  const articleCount = category.wikiArticles?.length ?? 0;
  const questionCount = category.questions?.length ?? 0;
  const quizCount = category.quizzes?.length ?? 0;
  const trailCount = (category as any).trails?.length ?? 0;
  const totalContents = articleCount + questionCount + quizCount + trailCount;

  const getContentMessage = () => {
    if (totalContents === 0) {
      return "Esta ação não pode ser desfeita.";
    }

    const parts = [];
    if (articleCount > 0) {
      parts.push(`${articleCount} ${articleCount === 1 ? "artigo" : "artigos"}`);
    }
    if (questionCount > 0) {
      parts.push(`${questionCount} ${questionCount === 1 ? "questão" : "questões"}`);
    }
    if (quizCount > 0) {
      parts.push(`${quizCount} ${quizCount === 1 ? "quiz" : "quizzes"}`);
    }
    if (trailCount > 0) {
      parts.push(`${trailCount} ${trailCount === 1 ? "trilha" : "trilhas"}`);
    }

    const contentList = parts.join(", ");
    return (
      <>
        <p className="mb-2">
          Esta categoria possui {contentList} associado{totalContents === 1 ? "" : "s"}.
        </p>
        <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
          ⚠️ Categorias com conteúdo publicado ou ativo não podem ser excluídas.
          Arquive ou remova o conteúdo primeiro.
        </p>
      </>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria "{category.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {getContentMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
