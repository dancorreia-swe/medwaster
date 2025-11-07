import { createFileRoute } from "@tanstack/react-router";
import { QuestionForm } from "@/features/questions/components/question-form";

export const Route = createFileRoute("/_auth/questions/new")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Questões",
  }),
});

function RouteComponent() {
  return (
    <div className="flex flex-col">
      <QuestionForm />
    </div>
  );
}
