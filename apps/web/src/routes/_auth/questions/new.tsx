import { createFileRoute } from "@tanstack/react-router";
import { QuestionForm } from "@/features/questions/components/question-form";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Questões";

export const Route = createFileRoute("/_auth/questions/new")({
  component: RouteComponent,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({
    getTitle: () => PAGE_TITLE,
  }),
});

function RouteComponent() {
  return (
    <div className="flex flex-col">
      <QuestionForm />
    </div>
  );
}
