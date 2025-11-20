import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderPage } from "@/features/quizzes/pages/quiz-builder-page";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Criar Quiz";

export const Route = createFileRoute("/_auth/quizzes/create")({
  component: () => <QuizBuilderPage mode="create" />,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
});
