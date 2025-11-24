import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizForm } from "../components/quiz-form";
import { QuestionSelector } from "../components/question-selector";
import { QuizQuestionBuilder } from "../components/quiz-question-builder";
import { QuizPreview } from "../components/quiz-preview";
import { Save, Eye, Globe, X, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { QuestionListItem } from "@/features/questions/types";
import { quizQueryOptions } from "../api/quizzesQueries";
import { useCreateQuiz, useUpdateQuiz } from "../api/quizzesApi";

interface QuizBuilderPageProps {
  mode: "create" | "edit";
  quizId?: number;
}

interface QuizQuestion {
  id: string; // temporary ID for new questions
  questionId: number;
  order: number;
  points: number;
  required: boolean;
  question: QuestionListItem;
}

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number;
  imageUrl?: string;
  imageKey?: string;
}

const initialFormData: QuizFormData = {
  title: "",
  description: "",
  instructions: "",
  difficulty: "basic",
  status: "draft",
  showResults: true,
  showCorrectAnswers: true,
  randomizeQuestions: false,
  randomizeOptions: false,
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Track initial load to prevent auto-save on mount
  const isInitialLoad = useRef(true);
  const autoSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Mutations
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz(quizId || 0); // Pass 0 as placeholder in create mode

  // Fetch existing quiz data for edit mode
  const {
    data: existingQuiz,
    isLoading: isLoadingQuiz,
    error: loadError
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
        randomizeQuestions: existingQuiz.randomizeQuestions ?? false,
        randomizeOptions: existingQuiz.randomizeOptions ?? false,
        passingScore: existingQuiz.passingScore || 70,
        imageUrl: existingQuiz.imageUrl || undefined,
        imageKey: (existingQuiz as any).imageKey || undefined,
        tagIds: (existingQuiz as any).tags?.map((t: any) => t.tag.id) || [],
      });

      // Map quiz questions to builder format
      const quizQuestions = (existingQuiz as any).questions;
      if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
        const mappedQuestions: QuizQuestion[] = quizQuestions.map((q: any) => ({
          id: `existing-${q.id}`,
          questionId: q.questionId,
          order: q.order,
          points: q.points,
          required: q.required,
          question: q.question as QuestionListItem,
        }));
        setQuestions(mappedQuestions);
      }

      // Reset unsaved changes flag after loading
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
    // Skip auto-save if:
    // - Initial load
    // - Create mode (no quiz ID yet)
    // - Not a draft
    // - No title
    // - No unsaved changes
    if (
      isInitialLoad.current ||
      mode !== "edit" ||
      formData.status !== "draft" ||
      !formData.title.trim() ||
      !hasUnsavedChanges
    ) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    // Set up auto-save after 3 seconds of inactivity
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

          // Reset to idle after 2 seconds
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        },
        onError: (error) => {
          console.error("Auto-save failed:", error);
          setAutoSaveStatus("idle");
        },
      });
    }, 3000);

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges]);

  const handleFormChange = useCallback((data: Partial<QuizFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleAddQuestion = useCallback(
    (questionId: number, questionData: QuestionListItem) => {
      // Auto-assign points based on difficulty
      const pointsByDifficulty = {
        basic: 1,
        intermediate: 2,
        advanced: 3,
      };
      
      const newQuestion: QuizQuestion = {
        id: `temp-${Date.now()}`,
        questionId,
        order: questions.length + 1,
        points: pointsByDifficulty[questionData.difficulty] || 1,
        required: true,
        question: questionData,
      };
      setQuestions((prev) => [...prev, newQuestion]);
    },
    [questions.length],
  );

  const handleRemoveQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      // Reorder remaining questions
      return filtered.map((q, index) => ({ ...q, order: index + 1 }));
    });
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
        // Basic validation
        if (!formData.title.trim()) {
          toast.error("Título é obrigatório");
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
          toast.success("Quiz criado com sucesso!");

          // After creating, navigate to edit page to continue working
          if (result && !publish) {
            navigate({
              to: "/quizzes/$quizId/edit",
              params: { quizId: result.id.toString() }
            });
            return;
          }
        } else {
          await updateQuiz.mutateAsync(dataToSave);
          toast.success("Quiz atualizado com sucesso!");
        }

        setHasUnsavedChanges(false);

        // Only navigate back to list when publishing
        if (publish) {
          navigate({ to: "/quizzes" });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao salvar quiz";
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

  // Loading state for edit mode
  if (mode === "edit" && isLoadingQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96 lg:col-span-2" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (mode === "edit" && loadError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar quiz. Tente novamente ou volte para a lista.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/quizzes">Voltar aos Quizzes</Link>
            </Button>
          </div>
        </div>
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

  return (
      <div className="flex flex-col h-full">
        <div className="shrink-0">
          <div className="px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/quizzes"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar aos Quizzes</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <h1 className="text-lg font-semibold">
                  {mode === "create" ? "Criar Quiz" : "Editar Quiz"}
                </h1>
                {formData.title && (
                  <span className="text-sm text-muted-foreground">
                    {formData.title}
                  </span>
                )}

                {mode === "edit" && formData.status === "draft" && (
                  <>
                    {autoSaveStatus === "saving" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        • Auto-salvando...
                      </span>
                    )}
                    {autoSaveStatus === "saved" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        • Salvo
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(true)}
                  disabled={questions.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={(createQuiz.isPending || updateQuiz.isPending) || !formData.title.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {(createQuiz.isPending || updateQuiz.isPending) ? "Salvando..." : "Salvar"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={
                    (createQuiz.isPending || updateQuiz.isPending) || !formData.title.trim() || questions.length === 0
                  }
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {formData.status === "active" ? "Atualizar" : "Publicar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex flex-col p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_2fr_minmax(280px,1fr)] gap-4 flex-1 min-h-0">
            {/* Questions Selector Panel */}
            <div className="min-w-0">
              <QuestionSelector
                onAddQuestion={handleAddQuestion}
                addedQuestionIds={new Set(questions.map(q => q.questionId))}
              />
            </div>

            {/* Quiz Builder Panel */}
            <div className="min-w-0">
              <QuizQuestionBuilder
                questions={questions}
                onRemoveQuestion={handleRemoveQuestion}
                onReorderQuestions={handleReorderQuestions}
                onUpdateQuestion={handleUpdateQuestion}
                onAddQuestion={handleAddQuestion}
              />
            </div>

            {/* Quiz Form Panel */}
            <div className="min-w-0">
              <QuizForm
                formData={formData}
                onChange={handleFormChange}
                questionCount={questions.length}
              />
            </div>
          </div>
        </div>
      </div>
  );
}
