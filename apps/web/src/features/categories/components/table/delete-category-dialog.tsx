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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria "{category.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {articleCount > 0 ? (
              <>
                Esta categoria possui {articleCount}{" "}
                {articleCount === 1 ? "artigo" : "artigos"} associado
                {articleCount === 1 ? "" : "s"}. Os artigos não serão excluídos,
                apenas terão a categoria removida.
              </>
            ) : (
              "Esta ação não pode ser desfeita."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
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
