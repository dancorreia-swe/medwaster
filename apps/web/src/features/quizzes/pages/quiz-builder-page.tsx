import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuizCover } from "../components/quiz-cover";
import { QuizSettings } from "../components/quiz-settings";
import { QuestionBank } from "../components/question-bank";
import {
  QuizQuestionList,
  type QuizQuestion,
} from "../components/quiz-question-list";
import { QuizPreview } from "../components/quiz-preview";
import {
  Save,
  Eye,
  Globe,
  ArrowLeft,
  AlertTriangle,
  Check,
  Loader2,
  SlidersHorizontal,
  PanelLeft,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { QuestionListItem } from "@/features/questions/types";
import { quizQueryOptions } from "../api/quizzesQueries";
import { useCreateQuiz, useUpdateQuiz } from "../api/quizzesApi";
import {
  quizDifficultyOption,
  quizStatusOption,
  type QuizFormData,
} from "../types";

interface QuizBuilderPageProps {
  mode: "create" | "edit";
  quizId?: number;
}

const initialFormData: QuizFormData = {
  title: "",
  description: "",
  instructions: "",
  difficulty: "basic",
  status: "draft",
  showResults: true,
  showCorrectAnswers: true,
  passingScore: 70,
  imageKey: undefined,
  tagIds: [],
};

export function QuizBuilderPage({ mode, quizId }: QuizBuilderPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<QuizFormData>(initialFormData);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [isBankOpen, setIsBankOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // The rail and its small-screen sheet are alternatives, not a hide/show pair:
  // a Sheet portals its overlay, so `lg:hidden` on the content would still dim
  // and block the page at desktop widths.
  const hasRailRoom = useMediaQuery("(min-width: 1024px)");

  // Track initial load to prevent auto-save on mount
  const isInitialLoad = useRef(true);
  const autoSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz(quizId || 0); // Pass 0 as placeholder in create mode

  const {
    data: existingQuiz,
    isLoading: isLoadingQuiz,
    error: loadError,
  } = useQuery({
    ...quizQueryOptions(quizId!),
    enabled: mode === "edit" && !!quizId,
  });

  // Load existing quiz data when editing
  useEffect(() => {
    if (existingQuiz && mode === "edit") {
      setFormData({
        title: existingQuiz.title || "",
        description: existingQuiz.description || "",
        instructions: existingQuiz.instructions || "",
        difficulty: existingQuiz.difficulty,
        status: existingQuiz.status,
        categoryId: existingQuiz.categoryId || undefined,
        timeLimit: existingQuiz.timeLimit || undefined,
        showResults: existingQuiz.showResults ?? true,
        showCorrectAnswers: existingQuiz.showCorrectAnswers ?? true,
        passingScore: existingQuiz.passingScore || 70,
        imageUrl: existingQuiz.imageUrl || undefined,
        imageKey: (existingQuiz as any).imageKey || undefined,
        tagIds: (existingQuiz as any).tags?.map((t: any) => t.tag.id) || [],
      });

      const quizQuestions = (existingQuiz as any).questions;
      if (
        quizQuestions &&
        Array.isArray(quizQuestions) &&
        quizQuestions.length > 0
      ) {
        setQuestions(
          quizQuestions.map((q: any) => ({
            id: `existing-${q.id}`,
            questionId: q.questionId,
            order: q.order,
            points: q.points,
            required: q.required,
            question: q.question as QuestionListItem,
          })),
        );
        // An existing quiz already has its sequence; the bank is only in the
        // way until the author asks for it.
        setIsBankOpen(false);
      }

      setHasUnsavedChanges(false);
      isInitialLoad.current = false;
    }
  }, [existingQuiz, mode]);

  // Track unsaved changes
  useEffect(() => {
    if (!isInitialLoad.current) {
      setHasUnsavedChanges(true);
      setAutoSaveStatus("idle");
    }
  }, [formData, questions]);

  // Auto-save drafts (only in edit mode)
  useEffect(() => {
    if (
      isInitialLoad.current ||
      mode !== "edit" ||
      formData.status !== "draft" ||
      !formData.title.trim() ||
      !hasUnsavedChanges
    ) {
      return;
    }

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(() => {
      setAutoSaveStatus("saving");

      const { imageKey, ...formDataToSave } = formData;
      const dataToSave = {
        ...formDataToSave,
        questions: questions.map((q) => ({
          questionId: q.questionId,
          order: q.order,
          points: q.points,
          required: q.required,
        })),
      };

      updateQuiz.mutate(dataToSave, {
        onSuccess: () => {
          setAutoSaveStatus("saved");
          setHasUnsavedChanges(false);
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        },
        onError: (error) => {
          console.error("Auto-save failed:", error);
          setAutoSaveStatus("idle");
        },
      });
    }, 3000);

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges]);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const addedQuestionIds = new Set(questions.map((q) => q.questionId));
  const pointsToPass =
    totalPoints > 0
      ? Math.ceil((formData.passingScore / 100) * totalPoints)
      : null;

  const handleFormChange = useCallback((data: Partial<QuizFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleAddQuestion = useCallback(
    (questionId: number, questionData: QuestionListItem) => {
      // Auto-assign points based on difficulty; the author can override inline.
      const pointsByDifficulty = { basic: 1, intermediate: 2, advanced: 3 };

      setQuestions((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          questionId,
          order: prev.length + 1,
          points:
            pointsByDifficulty[
              questionData.difficulty as keyof typeof pointsByDifficulty
            ] || 1,
          required: true,
          question: questionData,
        },
      ]);
    },
    [],
  );

  const handleRemoveQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, order: index + 1 })),
    );
  }, []);

  const handleReorderQuestions = useCallback((newQuestions: QuizQuestion[]) => {
    setQuestions(newQuestions.map((q, index) => ({ ...q, order: index + 1 })));
  }, []);

  const handleUpdateQuestion = useCallback(
    (id: string, updates: Partial<QuizQuestion>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      );
    },
    [],
  );

  const handleSave = useCallback(
    async (publish = false) => {
      try {
        if (!formData.title.trim()) {
          toast.error("Dê um título ao quiz antes de salvar");
          return;
        }

        if (questions.length === 0 && publish) {
          toast.error("Adicione pelo menos uma pergunta antes de publicar");
          return;
        }

        const { imageKey, ...formDataToSave } = formData;
        const dataToSave = {
          ...formDataToSave,
          status: publish ? ("active" as const) : formData.status,
          questions: questions.map((q) => ({
            questionId: q.questionId,
            order: q.order,
            points: q.points,
            required: q.required,
          })),
        };

        if (mode === "create") {
          const result = await createQuiz.mutateAsync(dataToSave);
          toast.success("Quiz criado");

          if (result && !publish) {
            navigate({
              to: "/quizzes/$quizId/edit",
              params: { quizId: result.id.toString() },
            });
            return;
          }
        } else {
          await updateQuiz.mutateAsync(dataToSave);
          toast.success(publish ? "Quiz publicado" : "Quiz salvo");
        }

        setHasUnsavedChanges(false);

        if (publish) {
          navigate({ to: "/quizzes" });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao salvar quiz";
        toast.error(errorMessage);
        console.error("Failed to save quiz:", error);
      }
    },
    [formData, questions, mode, createQuiz, updateQuiz, navigate],
  );

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (mode === "edit" && isLoadingQuiz) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (mode === "edit" && loadError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar este quiz. Tente novamente ou volte para a
            lista.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/quizzes">Voltar aos quizzes</Link>
        </Button>
      </div>
    );
  }

  if (isPreviewMode) {
    return (
      <QuizPreview
        formData={formData}
        questions={questions}
        onClose={() => setIsPreviewMode(false)}
      />
    );
  }

  const difficulty = quizDifficultyOption(formData.difficulty);
  const status = quizStatusOption(formData.status);
  const isSaving = createQuiz.isPending || updateQuiz.isPending;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header: identity on the left, what the quiz currently amounts to in
          the middle, actions on the right. */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/quizzes"
            aria-label="Voltar aos quizzes"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {questions.length} pergunta{questions.length !== 1 ? "s" : ""}
              </span>
              {pointsToPass !== null && (
                <span>
                  aprova com {pointsToPass} de {totalPoints}
                </span>
              )}
              {mode === "edit" &&
                formData.status === "draft" &&
                autoSaveStatus === "saving" && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Salvando
                  </span>
                )}
              {mode === "edit" &&
                formData.status === "draft" &&
                autoSaveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-success">
                    <Check className="h-3 w-3" />
                    Salvo
                  </span>
                )}
            </p>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            {difficulty && (
              <Badge variant="secondary" className={difficulty.badgeClass}>
                {difficulty.label}
              </Badge>
            )}
            {status && (
              <Badge variant="secondary" className={status.badgeClass}>
                {status.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBankOpen((open) => !open)}
            aria-pressed={isBankOpen}
            className={cn("gap-2", isBankOpen && "bg-accent")}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Banco</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(true)}
            disabled={questions.length === 0}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving || !formData.title.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={
              isSaving || !formData.title.trim() || questions.length === 0
            }
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {formData.status === "active" ? "Atualizar" : "Publicar"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Source rail: where questions come from. Collapsible, because once
            the sequence is built it is dead weight. */}
        {isBankOpen && hasRailRoom && (
          <aside className="w-80 shrink-0 border-r py-3">
            <QuestionBank
              onAddQuestion={handleAddQuestion}
              addedQuestionIds={addedQuestionIds}
              onClose={() => setIsBankOpen(false)}
            />
          </aside>
        )}

        {/* The quiz itself, as a document: cover first, then the sequence. */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="mx-auto max-w-3xl px-6 py-8">
              <QuizCover formData={formData} onChange={handleFormChange} />

              <div className="mt-10">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-semibold">Perguntas</h2>
                  {questions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {totalPoints} ponto{totalPoints !== 1 ? "s" : ""} no total
                    </p>
                  )}
                </div>

                <QuizQuestionList
                  questions={questions}
                  onRemoveQuestion={handleRemoveQuestion}
                  onReorderQuestions={handleReorderQuestions}
                  onUpdateQuestion={handleUpdateQuestion}
                  onBrowseQuestions={() => setIsBankOpen(true)}
                  isBankOpen={isBankOpen}
                />

                {questions.length > 0 && !isBankOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBankOpen(true)}
                    className="mt-3 text-muted-foreground"
                  >
                    Adicionar mais perguntas
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>

      <Sheet
        open={isBankOpen && !hasRailRoom}
        onOpenChange={setIsBankOpen}
      >
        <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Banco de perguntas</SheetTitle>
            <SheetDescription>
              Escolha perguntas para adicionar ao quiz.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 pt-3">
            <QuestionBank
              onAddQuestion={handleAddQuestion}
              addedQuestionIds={addedQuestionIds}
              onClose={() => setIsBankOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Configurações do quiz</SheetTitle>
            <SheetDescription>
              Como este quiz é publicado e como o aluno é avaliado.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 pb-8">
              <QuizSettings
                formData={formData}
                onChange={handleFormChange}
                totalPoints={totalPoints}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
