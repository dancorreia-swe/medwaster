import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { questionQueryOptions } from "@/features/questions/api/questionsQueries";
import { QuestionForm } from "@/features/questions/components/question-form";
import { buildPageHead } from "@/lib/page-title";

export const Route = createFileRoute("/_auth/questions/$questionId/edit")({
  head: ({ params }) =>
    buildPageHead(`Editar Questão #${params.questionId}`),
  loader: async ({ context: { queryClient }, params: { questionId } }) => {
    const numericQuestionId = Number(questionId);
    if (Number.isNaN(numericQuestionId)) {
      throw new Error("Invalid question ID");
    }

    await queryClient.ensureQueryData(questionQueryOptions(numericQuestionId));
  },
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `Editar Questão #${params.questionId}`,
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { questionId } = Route.useParams();

  const numericQuestionId = Number(questionId);

  if (Number.isNaN(numericQuestionId)) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center">
        <div className="text-sm text-destructive">ID da questão inválido.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <QuestionForm
        questionId={numericQuestionId}
        onSuccess={() => navigate({ to: "/questions/$questionId", params: { questionId: questionId } })}
        onCancel={() => navigate({ to: "/questions/$questionId", params: { questionId: questionId } })}
      />
    </div>
  );
}
