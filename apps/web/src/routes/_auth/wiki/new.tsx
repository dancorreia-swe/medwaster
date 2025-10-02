import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCategories,
  useCreateArticle,
} from "@/features/wiki/api/wikiQueries";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";

import { wikiApi } from "@/features/wiki/api/wikiApi";

export const Route = createFileRoute("/_auth/wiki/new")({
  component: RouteComponent,
  beforeLoad() {
    return { getTitle: () => "Novo Artigo" };
  },
  head: () => ({
    meta: [
      { title: "Novo Artigo - Wiki | Medwaster" },
      {
        name: "description",
        content: "Criar novo artigo da base de conhecimento",
      },
    ],
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [metaDescription, setMetaDescription] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const { data: categoriesData, isPending: categoriesLoading } =
    useCategories();
  const { mutateAsync: createArticle, isPending: isSaving } =
    useCreateArticle();

  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      const res = await wikiApi.files.upload(file);
      return res.data.url as string;
    },
  });

  async function handleSave(publish = false) {
    const content = { type: "doc", content: editor.document } as any;
    const excerpt = extractExcerptFromContent(content);

    if (publish) {
      if (!categoryId) {
        alert("Artigos publicados precisam ter uma categoria.");
        return;
      }
      const plain =
        (content as any)?.content
          ?.map?.((b: any) => b?.content?.map?.((i: any) => i?.text).join(" "))
          .join(" ") || "";
      if (plain.length < 50) {
        alert(
          "Artigos publicados precisam ter ao menos 50 caracteres de conteúdo.",
        );
        return;
      }
    }

    const res = await createArticle({
      title,
      content,
      excerpt,
      categoryId,
      status: publish ? "published" : "draft",
      metaDescription: metaDescription || undefined,
    } as any);

    setLastSavedAt(new Date());
    if (publish) navigate({ to: "/wiki" });
    return res;
  }

  return (
    <div className="flex flex-col">
      {/* Top editor bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/wiki" })}
          >
            {/* back */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <span className="inline-flex items-center gap-2">
            <span className="rounded-md border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {status === "published" ? "Publicado" : "Rascunho"}
            </span>
          </span>
          <span className="ml-2 flex items-center gap-1 text-xs text-zinc-500">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {lastSavedAt
              ? `Salvo ${lastSavedAt.toLocaleTimeString()}`
              : "Nunca salvo"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || title.length < 5}
          >
            Salvar
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || title.length < 5}
          >
            Publicar
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="px-4">
        <div className="mx-auto w-full max-w-6xl">
          {/* Title input */}
          <div className="border-b py-6">
            <Input
              placeholder="Sem título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full border-0 bg-transparent px-0 text-[35px] leading-snug font-bold placeholder:text-zinc-400/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Main content two-column */}
          <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[2fr_1fr]">
            {/* Left: Editor */}
            <div className="min-h-[500px] rounded-md border">
              <BlockNoteView editor={editor} className="min-h-[500px]" />
            </div>

            {/* Right: Meta panel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={categoryId ? String(categoryId) : "none"}
                  onValueChange={(val) =>
                    setCategoryId(val === "none" ? undefined : Number(val))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categoriesLoading ? (
                      <div className="p-2 text-sm text-zinc-500">
                        Carregando...
                      </div>
                    ) : (
                      categoriesData?.data?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descrição breve para SEO (opcional)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractExcerptFromContent(content: any): string {
  try {
    const text =
      content?.content
        ?.flatMap((b: any) =>
          (b?.content || [])
            .filter((i: any) => i?.type === "text" && i?.text)
            .map((i: any) => i.text),
        )
        ?.join(" ") || "";
    return text.slice(0, 200);
  } catch {
    return "";
  }
}
