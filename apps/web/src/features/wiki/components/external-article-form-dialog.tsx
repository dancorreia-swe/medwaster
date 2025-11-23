import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { ArticleTagsInput } from "./article-tags-input";
import { ExternalLink, Plus, X } from "lucide-react";

interface ExternalArticle {
  id?: number;
  title: string;
  externalUrl: string;
  externalAuthors: string[];
  publicationSource?: string | null;
  publicationDate?: string | null;
  excerpt?: string | null;
  categoryId?: number | null;
  icon?: string | null;
  tags?: Array<{ id: number; name: string }>;
}

interface Category {
  id: number;
  name: string;
}

interface ExternalArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: ExternalArticle | null;
  categories?: Category[];
  onSubmit: (values: ExternalArticleFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

const externalArticleFormSchema = z.object({
  title: z
    .string()
    .min(1, "O título é obrigatório")
    .max(500, "O título pode ter no máximo 500 caracteres"),
  externalUrl: z.string().url("URL inválida. Use um formato válido (ex: https://example.com)"),
  externalAuthors: z
    .array(z.string().min(1))
    .min(1, "Adicione pelo menos um autor"),
  publicationSource: z.string().max(200, "A fonte pode ter no máximo 200 caracteres").optional(),
  publicationDate: z.string().optional(),
  excerpt: z.string().max(10000, "O resumo pode ter no máximo 10000 caracteres").optional(),
  categoryId: z.number().optional(),
  tagIds: z.array(z.number()).optional(),
  icon: z.string().optional(),
});

export type ExternalArticleFormValues = z.infer<typeof externalArticleFormSchema>;

export function ExternalArticleFormDialog({
  open,
  onOpenChange,
  article,
  categories = [],
  onSubmit,
  isSubmitting = false,
}: ExternalArticleFormDialogProps) {
  const isEditing = !!article;

  const form = useForm({
    defaultValues: {
      title: article?.title ?? "",
      externalUrl: article?.externalUrl ?? "",
      externalAuthors: article?.externalAuthors ?? [""],
      publicationSource: article?.publicationSource ?? "",
      publicationDate: article?.publicationDate
        ? new Date(article.publicationDate).toISOString().split("T")[0]
        : "",
      excerpt: article?.excerpt ?? "",
      categoryId: article?.categoryId ?? undefined,
      tagIds: article?.tags?.map((t) => t.id) ?? [],
      icon: article?.icon ?? "",
    },
    onSubmit: async ({ value }) => {
      // Filter out empty authors
      const validAuthors = value.externalAuthors.filter((a) => a.trim());

      // Validate excerpt length if provided
      if (value.excerpt && value.excerpt.trim() && value.excerpt.trim().length < 50) {
        throw new Error("O resumo, se fornecido, deve ter pelo menos 50 caracteres");
      }

      await onSubmit({
        ...value,
        externalAuthors: validAuthors,
        publicationSource: value.publicationSource?.trim() || undefined,
        publicationDate: value.publicationDate || undefined,
        excerpt: value.excerpt?.trim() || undefined,
      });
      form.reset();
    },
    validators: {
      onSubmit: externalArticleFormSchema,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    } else if (article) {
      form.setFieldValue("title", article.title);
      form.setFieldValue("externalUrl", article.externalUrl);
      form.setFieldValue("externalAuthors", article.externalAuthors);
      form.setFieldValue("publicationSource", article.publicationSource ?? "");
      form.setFieldValue(
        "publicationDate",
        article.publicationDate
          ? new Date(article.publicationDate).toISOString().split("T")[0]
          : ""
      );
      form.setFieldValue("excerpt", article.excerpt ?? "");
      form.setFieldValue("categoryId", article.categoryId ?? undefined);
      form.setFieldValue("tagIds", article.tags?.map((t) => t.id) ?? []);
      form.setFieldValue("icon", article.icon ?? "");
    } else {
      form.reset();
    }
  }, [open, article, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Artigo Externo" : "Novo Artigo Externo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os metadados do artigo externo."
              : "Adicione uma referência a um artigo externo com metadados básicos."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Title */}
          <form.Field name="title">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ex: Understanding CRISPR Gene Editing"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* External URL */}
          <form.Field name="externalUrl">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  URL Externa <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    name={field.name}
                    type="url"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(field.state.value, "_blank")}
                    disabled={!field.state.value || isSubmitting}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Link para o artigo original
                </p>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Authors */}
          <form.Field name="externalAuthors">
            {(field) => (
              <div className="space-y-2">
                <Label>
                  Autores <span className="text-destructive">*</span>
                </Label>
                {field.state.value.map((author, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={author}
                      onChange={(e) => {
                        const newAuthors = [...field.state.value];
                        newAuthors[index] = e.target.value;
                        field.handleChange(newAuthors);
                      }}
                      placeholder="Nome do autor"
                      className="flex-1"
                      disabled={isSubmitting}
                    />
                    {field.state.value.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newAuthors = field.state.value.filter(
                            (_, i) => i !== index
                          );
                          field.handleChange(newAuthors);
                        }}
                        disabled={isSubmitting}
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
                  onClick={() => {
                    field.handleChange([...field.state.value, ""]);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Autor
                </Button>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Publication Source */}
          <form.Field name="publicationSource">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Fonte de Publicação</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ex: Nature, NEJM, PubMed"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Publication Date */}
          <form.Field name="publicationDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data de Publicação</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Excerpt */}
          <form.Field name="excerpt">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Resumo</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Breve resumo do artigo (opcional, mínimo 50 caracteres se fornecido)"
                  rows={4}
                  disabled={isSubmitting}
                />
                {field.state.value && field.state.value.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {field.state.value.length} caracteres
                    {field.state.value.length < 50 && ` - mínimo 50 necessário`}
                  </p>
                )}
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Category */}
          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Categoria</Label>
                <Select
                  value={field.state.value ? String(field.state.value) : undefined}
                  onValueChange={(val) => field.handleChange(Number(val))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id={field.name}>
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
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Tags */}
          <form.Field name="tagIds">
            {(field) => (
              <div className="space-y-2">
                <Label>Tags</Label>
                <ArticleTagsInput
                  selectedTags={field.state.value || []}
                  onTagsChange={(tags) => field.handleChange(tags)}
                />
                <p className="text-xs text-muted-foreground">
                  Pesquise tags existentes ou crie novas pressionando Enter
                </p>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isFormSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isFormSubmitting}
                >
                  {isSubmitting || isFormSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {isEditing ? "Salvando..." : "Criando..."}
                    </>
                  ) : (
                    <>{isEditing ? "Salvar Alterações" : "Criar Artigo"}</>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
