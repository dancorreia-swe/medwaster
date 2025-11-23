import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, X } from "lucide-react";

interface ExternalArticleMetadataEditorProps {
  externalUrl: string;
  externalAuthors: string[];
  publicationSource?: string;
  publicationDate?: string;
  excerpt?: string;
  onExternalUrlChange: (url: string) => void;
  onExternalAuthorsChange: (authors: string[]) => void;
  onPublicationSourceChange: (source: string) => void;
  onPublicationDateChange: (date: string) => void;
  onExcerptChange: (excerpt: string) => void;
}

export function ExternalArticleMetadataEditor({
  externalUrl,
  externalAuthors,
  publicationSource,
  publicationDate,
  excerpt,
  onExternalUrlChange,
  onExternalAuthorsChange,
  onPublicationSourceChange,
  onPublicationDateChange,
  onExcerptChange,
}: ExternalArticleMetadataEditorProps) {
  const handleAddAuthor = () => {
    onExternalAuthorsChange([...externalAuthors, ""]);
  };

  const handleRemoveAuthor = (index: number) => {
    onExternalAuthorsChange(externalAuthors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, value: string) => {
    const newAuthors = [...externalAuthors];
    newAuthors[index] = value;
    onExternalAuthorsChange(newAuthors);
  };

  return (
    <div className="w-full max-w-3xl space-y-6 py-8">
      <div className="space-y-4 rounded-lg border bg-muted/50 p-6">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Artigo Externo</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Este é um artigo externo. Edite os metadados abaixo. O conteúdo está
          disponível no link externo.
        </p>
      </div>

      {/* External URL */}
      <div className="space-y-2">
        <Label htmlFor="external-url">
          URL Externa <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="external-url"
            type="url"
            value={externalUrl}
            onChange={(e) => onExternalUrlChange(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(externalUrl, "_blank")}
            disabled={!externalUrl}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir
          </Button>
        </div>
      </div>

      {/* Authors */}
      <div className="space-y-2">
        <Label>
          Autores <span className="text-destructive">*</span>
        </Label>
        {externalAuthors.map((author, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={author}
              onChange={(e) => handleAuthorChange(index, e.target.value)}
              placeholder="Nome do autor"
              className="flex-1"
            />
            {externalAuthors.length > 1 && (
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
        <Label htmlFor="publication-source">Fonte de Publicação</Label>
        <Input
          id="publication-source"
          value={publicationSource || ""}
          onChange={(e) => onPublicationSourceChange(e.target.value)}
          placeholder="Ex: Nature, NEJM, PubMed"
        />
      </div>

      {/* Publication Date */}
      <div className="space-y-2">
        <Label htmlFor="publication-date">Data de Publicação</Label>
        <Input
          id="publication-date"
          type="date"
          value={publicationDate || ""}
          onChange={(e) => onPublicationDateChange(e.target.value)}
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Resumo</Label>
        <Textarea
          id="excerpt"
          value={excerpt || ""}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="Breve resumo do artigo (opcional, mínimo 50 caracteres se fornecido)"
          rows={6}
        />
        {excerpt && excerpt.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {excerpt.length} caracteres
            {excerpt.length < 50 && ` - mínimo 50 necessário`}
          </p>
        )}
      </div>
    </div>
  );
}
