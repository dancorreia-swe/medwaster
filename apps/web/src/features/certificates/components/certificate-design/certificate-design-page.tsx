import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker } from "@tanstack/react-router";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  certificateDesignQueryOptions,
  CertificateDesignConflictError,
  certificatesApi,
  certificatesQueryKeys,
  type CertificateDesignCurrent,
  type CertificateDesignPayload,
  type CertificateDesignSavePayload,
  type CertificateDesignSettings,
} from "../../api";
import { CertificatePreviewPanel } from "./certificate-preview-panel";
import { LayoutThumbnail } from "./layout-thumbnail";
import { useCertificatePreview } from "./use-certificate-preview";

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 150;
const FORM_ID = "certificate-design-form";

type ElementKey = keyof CertificateDesignPayload["elements"];
type DesignOptions = CertificateDesignSettings["options"];
type LayoutOption = DesignOptions["layouts"][number];
type PaletteOption = DesignOptions["palettes"][number];
type ElementOption = DesignOptions["elements"][number];

function toDraft(
  title: string,
  design: CertificateDesignSettings["design"],
): CertificateDesignPayload {
  return {
    title,
    layout: design.layout,
    palette: design.palette,
    elements: { ...design.elements },
  };
}

function isSameDraft(a: CertificateDesignPayload, b: CertificateDesignPayload) {
  return (
    a.title.trim() === b.title.trim() &&
    a.layout === b.layout &&
    a.palette === b.palette &&
    (Object.keys(a.elements) as ElementKey[]).every(
      (key) => a.elements[key] === b.elements[key],
    )
  );
}

type EditorState = {
  draft: CertificateDesignPayload;
  baseline: CertificateDesignPayload;
  revision: number;
};

type ConflictState = {
  current: CertificateDesignCurrent | null;
  message: string;
};

export function CertificateDesignPage() {
  const query = useQuery(certificateDesignQueryOptions());

  if (query.isPending) {
    return <CertificateDesignSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar o design do certificado</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{query.error.message}</span>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <CertificateDesignEditor settings={query.data} />;
}

function CertificateDesignEditor({
  settings,
}: {
  settings: CertificateDesignSettings;
}) {
  const queryClient = useQueryClient();
  const { options, defaults } = settings;
  const initialDraft = useMemo(
    () => toDraft(settings.title, settings.design),
    [settings.title, settings.design],
  );
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    draft: initialDraft,
    baseline: initialDraft,
    revision: settings.revision,
  }));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const previousSettings = useRef(settings);

  // A clean editor follows a newer server response. Once the draft is dirty,
  // its original baseline (including revision) remains stable until save,
  // discard, or an explicit conflict action changes it.
  useEffect(() => {
    if (previousSettings.current === settings) return;
    previousSettings.current = settings;
    const nextDraft = toDraft(settings.title, settings.design);
    setEditorState((current) =>
      isSameDraft(current.draft, current.baseline)
        ? {
            draft: nextDraft,
            baseline: nextDraft,
            revision: settings.revision,
          }
        : current,
    );
  }, [settings]);

  const { draft, baseline, revision } = editorState;

  const trimmedTitle = draft.title.trim();
  const titleError =
    trimmedTitle.length < TITLE_MIN_LENGTH
      ? `Use pelo menos ${TITLE_MIN_LENGTH} caracteres.`
      : null;
  const isDirty = !isSameDraft(draft, baseline);
  const isDefault = isSameDraft(draft, toDraft(defaults.title, defaults.design));

  const previewDesign = useMemo(
    () => ({ ...draft, title: trimmedTitle }),
    [draft, trimmedTitle],
  );
  const preview = useCertificatePreview(previewDesign, !titleError);

  const saveMutation = useMutation({
    mutationFn: (payload: CertificateDesignSavePayload) =>
      certificatesApi.saveCertificateDesign(payload),
    onSuccess: (data, variables) => {
      const nextBaseline = toDraft(data.title, data.design);
      queryClient.setQueryData(certificatesQueryKeys.design(), data);
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.settings(),
      });
      setEditorState((current) => ({
        baseline: nextBaseline,
        revision: data.revision,
        // The form is disabled while saving, but keep this comparison as a
        // guard against edits made by another event source during the request.
        draft: isSameDraft(current.draft, variables)
          ? nextBaseline
          : current.draft,
      }));
      setConflict(null);
      toast.success("Design do certificado salvo");
    },
    onError: (error) => {
      if (error instanceof CertificateDesignConflictError) {
        setConflict({
          current: error.current,
          message: error.message,
        });
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o design do certificado",
      );
    },
  });

  const applyCurrent = (current: CertificateDesignCurrent) => {
    const nextDraft = toDraft(current.title ?? draft.title, current.design);
    setEditorState({
      draft: nextDraft,
      baseline: nextDraft,
      revision: current.revision,
    });
    setConflict(null);
  };

  const loadCurrent = async () => {
    if (!conflict) return;
    if (conflict.current && conflict.current.title !== null) {
      applyCurrent(conflict.current);
      return;
    }

    try {
      const current = await certificatesApi.getCertificateDesign();
      queryClient.setQueryData(certificatesQueryKeys.design(), current);
      applyCurrent({
        title: current.title,
        design: current.design,
        revision: current.revision,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o design atual",
      );
    }
  };

  const overwriteCurrent = () => {
    if (!conflict?.current || titleError || saveMutation.isPending) return;
    const submittedDraft = { ...draft, title: trimmedTitle };
    setConflict(null);
    saveMutation.mutate({
      ...submittedDraft,
      expectedRevision: conflict.current.revision,
    });
  };

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: isDirty,
    withResolver: true,
  });

  const selectedPalette =
    options.palettes.find(
      (palette: PaletteOption) => palette.id === draft.palette,
    ) ?? options.palettes[0];
  const selectedLayout = options.layouts.find(
    (layout: LayoutOption) => layout.id === draft.layout,
  );
  const canSave = isDirty && !titleError && !saveMutation.isPending;

  const updateDraft = (
    update: (current: CertificateDesignPayload) => CertificateDesignPayload,
  ) => {
    setConflict(null);
    setEditorState((current) => ({
      ...current,
      draft: update(current.draft),
    }));
  };

  const setElement = (key: ElementKey, checked: boolean) =>
    updateDraft((current) => ({
      ...current,
      elements: { ...current.elements, [key]: checked },
    }));

  const handleSave = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSave) return;
    setConflict(null);
    saveMutation.mutate({
      ...draft,
      title: trimmedTitle,
      expectedRevision: revision,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-3 text-muted-foreground"
          >
            <Link to="/certificates">
              <ArrowLeft />
              Certificados
            </Link>
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">
            Design do certificado
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Escolha o layout, a paleta e o que aparece no PDF. Alterações valem
            para certificados emitidos a partir de agora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <span
              role="status"
              className="mr-1 inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span
                aria-hidden
                className="size-2 rounded-full bg-amber-500"
              />
              Alterações não salvas
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditorState((current) => ({
                ...current,
                draft: current.baseline,
              }));
              setConflict(null);
            }}
            disabled={!isDirty || saveMutation.isPending}
          >
            Descartar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!canSave}>
            {saveMutation.isPending && <Loader2 className="animate-spin" />}
            Salvar design
          </Button>
        </div>
      </header>

      {conflict && (
        <Alert variant="destructive">
          <AlertTitle>O design foi alterado no servidor</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{conflict.message} Suas alterações foram preservadas.</span>
            <span className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={loadCurrent}>
                Carregar dados atuais
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={overwriteCurrent}
                disabled={
                  !conflict.current || Boolean(titleError) || saveMutation.isPending
                }
              >
                Substituir com minhas alterações
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start xl:gap-12">
        <form id={FORM_ID} onSubmit={handleSave} className="flex flex-col gap-8">
          <fieldset disabled={saveMutation.isPending} className="contents">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Layout</legend>
            <div className="grid grid-cols-3 gap-3">
              {options.layouts.map((layout: LayoutOption) => (
                <label key={layout.id} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    value={layout.id}
                    checked={draft.layout === layout.id}
                    onChange={() =>
                      updateDraft((current) => ({ ...current, layout: layout.id }))
                    }
                    className="peer sr-only"
                  />
                  <span className="block rounded-lg border bg-card p-1.5 transition-colors group-hover:border-foreground/30 peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/25 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50">
                    <LayoutThumbnail
                      layoutId={layout.id}
                      palette={selectedPalette}
                    />
                  </span>
                  <span className="mt-1.5 block text-center text-sm font-medium">
                    {layout.label}
                  </span>
                </label>
              ))}
            </div>
            {selectedLayout && (
              <p className="text-xs text-muted-foreground">
                {selectedLayout.description}
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Paleta</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {options.palettes.map((palette: PaletteOption) => {
                const checked = draft.palette === palette.id;
                return (
                  <label key={palette.id} className="group cursor-pointer">
                    <input
                      type="radio"
                      name="palette"
                      value={palette.id}
                      checked={checked}
                      onChange={() =>
                        updateDraft((current) => ({
                          ...current,
                          palette: palette.id,
                        }))
                      }
                      className="peer sr-only"
                    />
                    <span className="flex h-full items-center gap-2.5 rounded-lg border bg-card p-2 transition-colors group-hover:border-foreground/30 peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/25 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50">
                      <span
                        aria-hidden
                        className="flex h-8 w-10 shrink-0 overflow-hidden rounded-md border"
                        style={{ backgroundColor: palette.tint }}
                      >
                        <span
                          className="w-[38%]"
                          style={{ backgroundColor: palette.ink }}
                        />
                        <span
                          className="w-[24%]"
                          style={{ backgroundColor: palette.accent }}
                        />
                        {"detail" in palette && (
                          <span
                            className="w-[14%]"
                            style={{ backgroundColor: palette.detail }}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm leading-tight",
                          checked && "font-medium",
                        )}
                      >
                        {palette.label}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Elementos opcionais</legend>
            <p className="-mt-2 text-xs text-muted-foreground">
              Nome do aluno, título, frase de conclusão, data e código de
              verificação sempre aparecem.
            </p>
            <div className="space-y-4">
              {options.elements.map((element: ElementOption) => {
                const id = `certificate-element-${element.key}`;
                return (
                  <div
                    key={element.key}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <Label htmlFor={id}>{element.label}</Label>
                      <p
                        id={`${id}-description`}
                        className="text-xs text-muted-foreground"
                      >
                        {element.description}
                      </p>
                    </div>
                    <Switch
                      id={id}
                      aria-describedby={`${id}-description`}
                      checked={draft.elements[element.key]}
                      onCheckedChange={(checked) =>
                        setElement(element.key, checked)
                      }
                      className="mt-0.5"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="certificate-title" className="font-semibold">
              Título
            </Label>
            <Input
              id="certificate-title"
              value={draft.title}
              maxLength={TITLE_MAX_LENGTH}
              aria-invalid={titleError ? true : undefined}
              aria-describedby="certificate-title-help"
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ex: Conclusão de Trilhas"
            />
            <p
              id="certificate-title-help"
              className={cn(
                "text-xs",
                titleError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {titleError ?? "Aparece em destaque no certificado."}
            </p>
          </div>

          <div className="border-t pt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateDraft(() => toDraft(defaults.title, defaults.design))
              }
              disabled={isDefault || saveMutation.isPending}
            >
              <RotateCcw />
              Restaurar padrão
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Moderno, paleta EduConecta, todos os elementos e o título "
              {defaults.title}". Nada é salvo até você clicar em Salvar design.
            </p>
          </div>
          </fieldset>
        </form>

        <div className="lg:sticky lg:top-6">
          <CertificatePreviewPanel
            url={preview.url}
            status={preview.status}
            error={preview.error}
            paused={Boolean(titleError)}
            onRetry={preview.retry}
            onUrlRemoved={preview.releaseUrl}
          />
        </div>
      </div>

      <AlertDialog open={blocker.status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações no design do certificado ainda não foram salvas e
              serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CertificateDesignSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="aspect-[297/210]" />
            <Skeleton className="aspect-[297/210]" />
            <Skeleton className="aspect-[297/210]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
        </div>
        <Skeleton className="aspect-[297/210] w-full" />
      </div>
    </div>
  );
}
