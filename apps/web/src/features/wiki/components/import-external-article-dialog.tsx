import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateArticle } from "@/features/wiki/api/wikiQueries";
import { ArticleTagsInput } from "./article-tags-input";
import { Download, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImportExternalArticleDialogProps {
  categories?: Array<{ id: number; name: string }>;
}

export function ImportExternalArticleDialog({
  categories = [],
}: ImportExternalArticleDialogProps) {
  const { mutateAsync: createArticle, isPending } = useCreateArticle();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState<string[]>([""]);
  const [externalUrl, setExternalUrl] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [publicationSource, setPublicationSource] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const handleAddAuthor = () => {
    setAuthors([...authors, ""]);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, value: string) => {
    const newAuthors = [...authors];
    newAuthors[index] = value;
    setAuthors(newAuthors);
  };

  const resetForm = () => {
    setTitle("");
    setAuthors([""]);
    setExternalUrl("");
    setPublicationDate("");
    setPublicationSource("");
    setExcerpt("");
    setCategoryId(undefined);
    setSelectedTags([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    const validAuthors = authors.filter((a) => a.trim());
    if (validAuthors.length === 0) {
      toast.error("Adicione pelo menos um autor");
      return;
    }

    if (!externalUrl.trim()) {
      toast.error("A URL externa é obrigatória");
      return;
    }

    // Validate URL format
    try {
      new URL(externalUrl);
    } catch {
      toast.error("URL inválida. Use um formato válido (ex: https://example.com)");
      return;
    }

    // Validate excerpt if provided
    if (excerpt.trim() && excerpt.trim().length < 50) {
      toast.error("O resumo, se fornecido, deve ter pelo menos 50 caracteres");
      return;
    }

    try {
      await createArticle({
        title: title.trim(),
        sourceType: "external",
        externalUrl: externalUrl.trim(),
        externalAuthors: validAuthors,
        publicationDate: publicationDate || undefined,
        publicationSource: publicationSource.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        categoryId,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        status: "draft",
      });

      toast.success("Artigo externo importado com sucesso!");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error importing external article:", error);
      // Extract the error message from the Error object
      const errorMessage = error instanceof Error
        ? error.message
        : "Erro ao importar artigo. Tente novamente.";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Importar Artigo Externo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Importar Artigo Externo</DialogTitle>
            <DialogDescription>
              Adicione uma referência a um artigo externo com metadados básicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Understanding CRISPR Gene Editing"
                required
              />
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <Label htmlFor="url">
                URL Externa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/article"
                required
              />
              <p className="text-xs text-muted-foreground">
                Link para o artigo original
              </p>
            </div>

            {/* Authors */}
            <div className="space-y-2">
              <Label>
                Autores <span className="text-destructive">*</span>
              </Label>
              {authors.map((author, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={author}
                    onChange={(e) => handleAuthorChange(index, e.target.value)}
                    placeholder="Nome do autor"
                  />
                  {authors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAuthor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAuthor}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Autor
              </Button>
            </div>

            {/* Publication Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Fonte de Publicação</Label>
              <Input
                id="source"
                value={publicationSource}
                onChange={(e) => setPublicationSource(e.target.value)}
                placeholder="Ex: Nature, NEJM, PubMed"
              />
            </div>

            {/* Publication Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Data de Publicação</Label>
              <Input
                id="date"
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumo do artigo (opcional, mínimo 50 caracteres se fornecido)"
                rows={4}
              />
              {excerpt.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {excerpt.length} caracteres
                  {excerpt.length < 50 && ` - mínimo 50 necessário`}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={categoryId ? String(categoryId) : undefined}
                onValueChange={(val) => setCategoryId(Number(val))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <ArticleTagsInput
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
              <p className="text-xs text-muted-foreground">
                Pesquise tags existentes ou crie novas pressionando Enter
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Importando..." : "Importar Artigo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
